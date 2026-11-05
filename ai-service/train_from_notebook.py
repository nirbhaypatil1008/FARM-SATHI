#!/usr/bin/env python
"""Train the PlantVillage baseline from the FARM SAATHI training notebook."""

import argparse
import json
import os
import random
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import tensorflow as tf
import tensorflow_datasets as tfds
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


SERVICE_DIRECTORY = Path(__file__).resolve().parent
DEFAULT_MODEL_DIRECTORY = SERVICE_DIRECTORY / "models"
IMAGE_SIZE = (224, 224)
SEED = 42


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_MODEL_DIRECTORY)
    args = parser.parse_args()
    if args.epochs < 1:
        parser.error("--epochs must be at least 1")
    if args.batch_size < 1:
        parser.error("--batch-size must be at least 1")
    return args


def prepare_datasets(batch_size: int):
    builder = tfds.builder("plant_village")
    info = builder.info
    class_names = info.features["label"].names
    if len(class_names) != 38:
        raise ValueError(f"Expected 38 PlantVillage classes, found {len(class_names)}.")

    cache_directory = Path.home() / "tensorflow_datasets" / "downloads"
    extracted_directory = cache_directory / "extracted"
    dataset_root = next(
        extracted_directory.glob("*/Plant_leave_diseases_dataset_without_augmentation"),
        None,
    )
    if dataset_root is None:
        download_manager = tfds.download.DownloadManager(
            download_dir=cache_directory,
            extract_dir=extracted_directory,
            dataset_name=builder.name,
        )
        split_generators = builder._split_generators(download_manager)
        if not split_generators:
            raise RuntimeError("TFDS did not provide the PlantVillage training archive.")
        dataset_root = (
            Path(split_generators[0].gen_kwargs["datapath"])
            / "Plant_leave_diseases_dataset_without_augmentation"
        )
    if not dataset_root.is_dir():
        raise FileNotFoundError(f"PlantVillage image folder was not found at {dataset_root}.")

    random_generator = random.Random(SEED)
    train_samples: list[tuple[str, int]] = []
    validation_samples: list[tuple[str, int]] = []
    test_samples: list[tuple[str, int]] = []
    class_split_counts = {}
    for label_id, class_name in enumerate(class_names):
        class_directory = dataset_root / class_name
        if not class_directory.is_dir():
            raise FileNotFoundError(f"PlantVillage class folder is missing: {class_name}.")
        image_paths = sorted(
            path
            for path in class_directory.iterdir()
            if path.is_file() and path.suffix.casefold() in {".jpg", ".jpeg", ".png"}
        )
        random_generator.shuffle(image_paths)
        train_end = int(len(image_paths) * 0.70)
        validation_end = train_end + int(len(image_paths) * 0.15)
        class_train = image_paths[:train_end]
        class_validation = image_paths[train_end:validation_end]
        class_test = image_paths[validation_end:]
        if not class_train or not class_validation or not class_test:
            raise ValueError(f"PlantVillage class {class_name} has too few images to split.")
        train_samples.extend((str(path), label_id) for path in class_train)
        validation_samples.extend((str(path), label_id) for path in class_validation)
        test_samples.extend((str(path), label_id) for path in class_test)
        class_split_counts[class_name] = {
            "train": len(class_train),
            "validation": len(class_validation),
            "test": len(class_test),
        }

    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.10),
        ],
        name="training_augmentation",
    )

    autotune = tf.data.AUTOTUNE

    def make_split(samples, training):
        paths = [path for path, _ in samples]
        labels = [label for _, label in samples]
        dataset = tf.data.Dataset.from_tensor_slices((paths, labels))
        if training:
            dataset = dataset.shuffle(len(samples), seed=SEED, reshuffle_each_iteration=True)

        def decode(path, label):
            image = tf.io.decode_image(
                tf.io.read_file(path),
                channels=3,
                expand_animations=False,
            )
            image.set_shape((None, None, 3))
            image = tf.image.resize(image, IMAGE_SIZE)
            image = tf.cast(image, tf.float32)
            if training:
                image = augmentation(image, training=True)
            return image, tf.cast(label, tf.int32)

        return (
            dataset.map(decode, num_parallel_calls=autotune)
            .batch(batch_size)
            .prefetch(autotune)
        )

    split_counts = {
        "train": len(train_samples),
        "validation": len(validation_samples),
        "test": len(test_samples),
    }
    return (
        make_split(train_samples, training=True),
        make_split(validation_samples, training=False),
        make_split(test_samples, training=False),
        class_names,
        split_counts,
        class_split_counts,
        info,
    )


def build_model(class_count: int) -> tf.keras.Model:
    backbone = tf.keras.applications.MobileNetV2(
        input_shape=(*IMAGE_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    backbone.trainable = False

    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3), dtype=tf.float32, name="rgb_0_255")
    values = tf.keras.layers.Rescaling(
        scale=1 / 127.5,
        offset=-1,
        name="mobilenet_v2_preprocessing",
    )(inputs)
    values = backbone(values, training=False)
    values = tf.keras.layers.GlobalAveragePooling2D()(values)
    values = tf.keras.layers.Dropout(0.25)(values)
    outputs = tf.keras.layers.Dense(class_count, activation="softmax", name="class_probabilities")(values)
    model = tf.keras.Model(inputs, outputs, name="farm_sathi_plantvillage_mobilenetv2")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def evaluate(model: tf.keras.Model, test_data, class_names: list[str]) -> dict:
    true_labels = np.concatenate([labels.numpy() for _, labels in test_data], axis=0)
    probabilities = model.predict(test_data, verbose=1)
    predicted_labels = np.argmax(probabilities, axis=1)
    return {
        "accuracy": float(accuracy_score(true_labels, predicted_labels)),
        "test_examples": int(len(true_labels)),
        "classification_report": classification_report(
            true_labels,
            predicted_labels,
            labels=np.arange(len(class_names)),
            target_names=class_names,
            output_dict=True,
            zero_division=0,
        ),
        "confusion_matrix": confusion_matrix(
            true_labels,
            predicted_labels,
            labels=np.arange(len(class_names)),
        ).tolist(),
    }


def export_model(
    model: tf.keras.Model,
    class_names: list[str],
    metrics: dict,
    split_counts: dict[str, int],
    class_split_counts: dict[str, dict[str, int]],
    dataset_version: str,
    epochs: int,
    output_directory: Path,
) -> None:
    output_directory.mkdir(parents=True, exist_ok=True)
    staging_directory = Path(tempfile.mkdtemp(prefix=".plant-model-", dir=output_directory))
    try:
        staged_model = staging_directory / "plant_disease_model.keras"
        model.save(staged_model)
        labels_path = staging_directory / "class_labels.json"
        labels_path.write_text(json.dumps(class_names, indent=2), encoding="utf-8")
        metadata = {
            "model_name": model.name,
            "architecture": "MobileNetV2 transfer learning",
            "dataset": "plant_village",
            "dataset_version": dataset_version,
            "input_size": list(IMAGE_SIZE),
            "color_mode": "RGB",
            "preprocessing": "RGB float32 pixels in [0,255]; MobileNetV2 [-1,1] normalization is embedded in the model.",
            "class_count": len(class_names),
            "classes": class_names,
            "split_counts": split_counts,
            "class_split_counts": class_split_counts,
            "evaluation_metrics": metrics,
            "epochs_requested": epochs,
            "model_version": datetime.now(timezone.utc).strftime("plantvillage-%Y%m%dT%H%M%SZ"),
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "seed": SEED,
            "training_dataset": {
                "name": "TensorFlow Datasets plant_village",
                "split": (
                    "38 class folders split per class into 70% train, 15% validation, "
                    "15% test with a fixed seed; the background folder is excluded."
                ),
                "test_accuracy_is_field_accuracy": False,
            },
        }
        metadata_path = staging_directory / "model_metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

        loaded_model = tf.keras.models.load_model(staged_model, compile=False)
        if tuple(loaded_model.input_shape[1:]) != (*IMAGE_SIZE, 3):
            raise ValueError("Exported model does not accept 224 x 224 RGB images.")
        if loaded_model.output_shape[-1] != len(class_names):
            raise ValueError("Exported model output count does not match the class-label count.")

        for filename in ("plant_disease_model.keras", "class_labels.json", "model_metadata.json"):
            os.replace(staging_directory / filename, output_directory / filename)
        (output_directory / "training_metrics.json").write_text(
            json.dumps(metrics, indent=2),
            encoding="utf-8",
        )
    finally:
        shutil.rmtree(staging_directory, ignore_errors=True)


def main() -> None:
    args = parse_args()
    random.seed(SEED)
    np.random.seed(SEED)
    tf.keras.utils.set_random_seed(SEED)

    print(f"Python: {os.sys.version.split()[0]}", flush=True)
    print(f"TensorFlow: {tf.__version__}", flush=True)
    print(f"TensorFlow Datasets: {tfds.__version__}", flush=True)
    print(f"Training device(s): {tf.config.list_physical_devices()}", flush=True)
    print("Preparing stratified PlantVillage train/validation/test splits.", flush=True)
    (
        train_data,
        validation_data,
        test_data,
        class_names,
        split_counts,
        class_split_counts,
        info,
    ) = prepare_datasets(args.batch_size)
    print(f"Dataset version: {info.version}", flush=True)
    print(f"Classes ({len(class_names)}): {class_names}", flush=True)
    print(f"Split sizes: {split_counts}", flush=True)

    model = build_model(len(class_names))
    model.summary()
    history = model.fit(
        train_data,
        validation_data=validation_data,
        epochs=args.epochs,
    )
    print(f"Epochs completed: {len(history.history['loss'])}", flush=True)
    metrics = evaluate(model, test_data, class_names)
    print(
        json.dumps(
            {
                "test_accuracy": metrics["accuracy"],
                "test_examples": metrics["test_examples"],
            },
            indent=2,
        ),
        flush=True,
    )
    export_model(
        model,
        class_names,
        metrics,
        split_counts,
        class_split_counts,
        str(info.version),
        args.epochs,
        args.output_dir.resolve(),
    )
    print(f"Exported trained model and measured metrics to {args.output_dir.resolve()}", flush=True)


if __name__ == "__main__":
    main()
