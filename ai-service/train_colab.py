#!/usr/bin/env python
"""Train/export PlantVillage MobileNetV2 in Google Colab."""

import argparse
import json
import random
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import numpy as np
import tensorflow as tf
from datasets import load_dataset
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score, f1_score
from sklearn.model_selection import GroupShuffleSplit


SEED = 42
IMAGE_SIZE = 224
BATCH_SIZE = 32
DATASET_ID = "mohanty/PlantVillage"
DATASET_CONFIG = "color"


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("/content/farm-saathi-model-export"))
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--fine-tune-epochs", type=int, default=8)
    return parser.parse_args()


def make_dataset(split, indices, training):
    def generate():
        for index in indices:
            row = split[int(index)]
            image = row["image"].convert("RGB")
            buffer = BytesIO()
            image.save(buffer, format="JPEG", quality=95)
            yield buffer.getvalue(), np.int32(row["label"])

    signature = (
        tf.TensorSpec(shape=(), dtype=tf.string),
        tf.TensorSpec(shape=(), dtype=tf.int32),
    )
    dataset = tf.data.Dataset.from_generator(generate, output_signature=signature)
    if training:
        dataset = dataset.shuffle(min(len(indices), 8192), seed=SEED, reshuffle_each_iteration=True)

    def decode(encoded, label):
        image = tf.io.decode_jpeg(encoded, channels=3)
        image = tf.image.resize(image, [IMAGE_SIZE, IMAGE_SIZE], antialias=True)
        return image, label

    return dataset.map(decode, num_parallel_calls=tf.data.AUTOTUNE).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


def build_model(class_count):
    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.12),
            tf.keras.layers.RandomContrast(0.1),
        ],
        name="training_augmentation",
    )
    backbone = tf.keras.applications.MobileNetV2(
        input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    backbone.trainable = False

    inputs = tf.keras.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3), dtype=tf.float32, name="rgb_0_255")
    values = augmentation(inputs)
    values = tf.keras.applications.mobilenet_v2.preprocess_input(values)
    values = backbone(values, training=False)
    values = tf.keras.layers.GlobalAveragePooling2D()(values)
    values = tf.keras.layers.Dropout(0.25)(values)
    outputs = tf.keras.layers.Dense(class_count, activation="softmax", name="class_probabilities")(values)
    model = tf.keras.Model(inputs, outputs, name="farm_saathi_mobilenetv2")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model, backbone


def main():
    args = parse_args()
    random.seed(SEED)
    np.random.seed(SEED)
    tf.keras.utils.set_random_seed(SEED)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading {DATASET_ID} ({DATASET_CONFIG}); first download is about 2 GB.")
    dataset = load_dataset(DATASET_ID, DATASET_CONFIG)
    train_split = dataset["train"]
    test_split = dataset["test"]
    class_names = train_split.features["label"].names
    print(f"Loaded {len(class_names)} disease classes: {class_names}")

    test_leaf_ids = set(test_split["leaf_id"])
    train_leaf_ids = set(train_split["leaf_id"])
    overlap = test_leaf_ids.intersection(train_leaf_ids)
    if overlap:
        raise RuntimeError(f"Dataset leakage: {len(overlap)} leaf IDs are present in train and official test.")

    indices = np.arange(len(train_split))
    labels = np.asarray(train_split["label"], dtype=np.int32)
    groups = np.asarray(train_split["leaf_id"])
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=SEED)
    fit_indices, validation_indices = next(splitter.split(indices, labels, groups))
    fit_leaf_ids = set(groups[fit_indices])
    validation_leaf_ids = set(groups[validation_indices])
    if fit_leaf_ids.intersection(validation_leaf_ids):
        raise RuntimeError("Dataset leakage: a leaf ID appears in both fit and validation.")
    if set(labels[fit_indices]) != set(range(len(class_names))):
        raise RuntimeError("At least one class is missing from the training split.")

    print(
        f"Split by leaf_id: train={len(fit_indices)}, validation={len(validation_indices)}, "
        f"test={len(test_split)}"
    )
    train_data = make_dataset(train_split, fit_indices, training=True)
    validation_data = make_dataset(train_split, validation_indices, training=False)
    test_data = make_dataset(test_split, np.arange(len(test_split)), training=False)

    model, backbone = build_model(len(class_names))
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint(
            args.output_dir / "best_checkpoint.keras",
            monitor="val_loss",
            save_best_only=True,
        ),
    ]
    model.fit(
        train_data,
        validation_data=validation_data,
        epochs=args.epochs,
        callbacks=callbacks,
    )

    backbone.trainable = True
    for layer in backbone.layers[:-30]:
        layer.trainable = False
    for layer in backbone.layers:
        if isinstance(layer, tf.keras.layers.BatchNormalization):
            layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(
        train_data,
        validation_data=validation_data,
        epochs=args.fine_tune_epochs,
        callbacks=callbacks,
    )
    model = tf.keras.models.load_model(args.output_dir / "best_checkpoint.keras", compile=False)

    true_labels = np.concatenate([labels.numpy() for _, labels in test_data], axis=0)
    probabilities = model.predict(test_data, verbose=1)
    predicted_labels = np.argmax(probabilities, axis=1)
    metrics = {
        "accuracy": float(accuracy_score(true_labels, predicted_labels)),
        "precision_macro": float(precision_score(true_labels, predicted_labels, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(true_labels, predicted_labels, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(true_labels, predicted_labels, average="macro", zero_division=0)),
        "test_examples": int(len(true_labels)),
        "classification_report": classification_report(
            true_labels,
            predicted_labels,
            labels=np.arange(len(class_names)),
            target_names=class_names,
            output_dict=True,
            zero_division=0,
        ),
        "confusion_matrix": confusion_matrix(true_labels, predicted_labels).tolist(),
    }
    print(json.dumps({key: value for key, value in metrics.items() if key not in {"classification_report", "confusion_matrix"}}, indent=2))

    mapping = {str(index): name for index, name in enumerate(class_names)}
    (args.output_dir / "class_labels.json").write_text(json.dumps(mapping, indent=2), encoding="utf-8")
    model.save(args.output_dir / "plant_disease_model.keras")
    supported_crops = sorted({name.partition("___")[0] for name in class_names})
    metadata = {
        "architecture": "MobileNetV2 transfer learning",
        "input_size": [IMAGE_SIZE, IMAGE_SIZE],
        "color_mode": "RGB",
        "preprocessing": "Input float32 RGB pixels in [0,255]; model applies tf.keras.applications.mobilenet_v2.preprocess_input internally.",
        "supported_crops": supported_crops,
        "class_count": len(class_names),
        "classes": class_names,
        "training_dataset": {
            "name": DATASET_ID,
            "configuration": DATASET_CONFIG,
            "url": "https://huggingface.co/datasets/mohanty/PlantVillage",
            "license": "CC-BY-SA-3.0; verify attribution and share-alike obligations before redistribution.",
            "test_split": "Publisher-provided leaf_id-grouped test split.",
            "limitations": "PlantVillage photos were collected mainly in controlled conditions. Test-set metrics are not field accuracy.",
        },
        "model_version": "1.0.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "seed": SEED,
        "evaluation_metrics": metrics,
        "confidence_threshold": 0.65,
        "top_prediction_margin_threshold": 0.12,
    }
    (args.output_dir / "model_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Exported trained model, class labels and metadata to {args.output_dir.resolve()}")


if __name__ == "__main__":
    main()
