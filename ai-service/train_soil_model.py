#!/usr/bin/env python
"""Train and evaluate the Soil Vision MobileNetV2 model on the Soil Classification Dataset."""

import argparse
import hashlib
import json
import os
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

import numpy as np
import tensorflow as tf
from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

SEED = 42
IMAGE_SIZE = 224
BATCH_SIZE = 32

SOIL_CLASS_MAP = {
    "Alluvial_Soil": "Alluvial Soil",
    "Arid_Soil": "Arid Soil",
    "Black_Soil": "Black Soil",
    "Laterite_Soil": "Laterite Soil",
    "Mountain_Soil": "Mountain Soil",
    "Red_Soil": "Red Soil",
    "Yellow_Soil": "Yellow Soil",
}


def parse_args():
    parser = argparse.ArgumentParser(description="Train Soil Vision MobileNetV2 model.")
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "data" / "soil_repo" / "Orignal-Dataset",
        help="Path to directory containing soil class folders",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "models" / "soil",
        help="Directory to save exported model and metadata",
    )
    parser.add_argument("--epochs", type=int, default=6, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE, help="Batch size")
    return parser.parse_args()


def collect_dataset(dataset_dir: Path):
    samples = []
    classes = sorted(list(SOIL_CLASS_MAP.values()))
    class_to_idx = {name: idx for idx, name in enumerate(classes)}

    for folder_name, display_name in SOIL_CLASS_MAP.items():
        folder_path = dataset_dir / folder_name
        if not folder_path.is_dir():
            # Try matching display name directly
            folder_path = dataset_dir / display_name
        if not folder_path.is_dir():
            continue

        label_idx = class_to_idx[display_name]
        for img_path in folder_path.glob("*.*"):
            if img_path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                samples.append((str(img_path.resolve()), label_idx, display_name))

    return samples, classes


def check_images_and_duplicates(samples):
    valid_samples = []
    hashes = {}
    duplicates = 0
    corrupted = 0

    for path_str, label, name in samples:
        try:
            with open(path_str, "rb") as f:
                content = f.read()
                file_hash = hashlib.md5(content).hexdigest()
                if file_hash in hashes:
                    duplicates += 1
                hashes[file_hash] = path_str

            with Image.open(path_str) as img:
                img.verify()
            valid_samples.append((path_str, label, name))
        except Exception:
            corrupted += 1

    return valid_samples, duplicates, corrupted


def create_tf_dataset(file_paths, labels, training: bool, batch_size: int):
    paths_ds = tf.data.Dataset.from_tensor_slices((file_paths, labels))
    if training:
        paths_ds = paths_ds.shuffle(len(file_paths), seed=SEED, reshuffle_each_iteration=True)

    def load_and_preprocess(path, label):
        raw = tf.io.read_file(path)
        img = tf.io.decode_image(raw, channels=3, expand_animations=False)
        img = tf.image.resize(img, [IMAGE_SIZE, IMAGE_SIZE], antialias=True)
        img.set_shape([IMAGE_SIZE, IMAGE_SIZE, 3])
        return img, label

    dataset = paths_ds.map(load_and_preprocess, num_parallel_calls=tf.data.AUTOTUNE)
    dataset = dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)
    return dataset


def build_soil_model(class_count: int):
    inputs = tf.keras.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3), dtype=tf.float32, name="rgb_0_255")

    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.10),
            tf.keras.layers.RandomContrast(0.08),
        ],
        name="data_augmentation",
    )

    augmented = augmentation(inputs)
    preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(augmented)

    backbone = tf.keras.applications.MobileNetV2(
        input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    backbone.trainable = False

    features = backbone(preprocessed, training=False)
    pooled = tf.keras.layers.GlobalAveragePooling2D(name="global_pooling")(features)
    dropout = tf.keras.layers.Dropout(0.25, name="dropout")(pooled)
    outputs = tf.keras.layers.Dense(
        class_count, activation="softmax", name="soil_probabilities"
    )(dropout)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="farm_sathi_soil_mobilenetv2")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    args = parse_args()
    random.seed(SEED)
    np.random.seed(SEED)
    tf.keras.utils.set_random_seed(SEED)

    print(f"Loading soil dataset from: {args.dataset_dir}")
    samples, classes = collect_dataset(args.dataset_dir)
    print(f"Total samples discovered: {len(samples)} across {len(classes)} classes:")
    for cls in classes:
        cls_count = sum(1 for _, _, name in samples if name == cls)
        print(f"  - {cls}: {cls_count} images")

    valid_samples, duplicates, corrupted = check_images_and_duplicates(samples)
    print(f"Data verification: {len(valid_samples)} valid, {duplicates} duplicates, {corrupted} corrupted.")

    file_paths = [s[0] for s in valid_samples]
    labels = [s[1] for s in valid_samples]

    # Stratified Train (70%), Val (15%), Test (15%) split
    train_paths, rem_paths, train_labels, rem_labels = train_test_split(
        file_paths, labels, test_size=0.30, random_state=SEED, stratify=labels
    )
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        rem_paths, rem_labels, test_size=0.50, random_state=SEED, stratify=rem_labels
    )

    print(f"Split distribution:")
    print(f"  - Training set: {len(train_paths)} images ({len(train_paths)/len(file_paths)*100:.1f}%)")
    print(f"  - Validation set: {len(val_paths)} images ({len(val_paths)/len(file_paths)*100:.1f}%)")
    print(f"  - Held-out Test set: {len(test_paths)} images ({len(test_paths)/len(file_paths)*100:.1f}%)")

    train_ds = create_tf_dataset(train_paths, train_labels, training=True, batch_size=args.batch_size)
    val_ds = create_tf_dataset(val_paths, val_labels, training=False, batch_size=args.batch_size)
    test_ds = create_tf_dataset(test_paths, test_labels, training=False, batch_size=args.batch_size)

    print("\nBuilding MobileNetV2 Soil Classifier...")
    model = build_soil_model(len(classes))
    model.summary()

    print(f"\nTraining for {args.epochs} epochs...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        verbose=1,
    )

    print("\nEvaluating on held-out test set (unseen images)...")
    test_preds_prob = model.predict(test_ds, verbose=0)
    test_preds = np.argmax(test_preds_prob, axis=-1)

    acc = float(accuracy_score(test_labels, test_preds))
    prec = float(precision_score(test_labels, test_preds, average="macro", zero_division=0))
    rec = float(recall_score(test_labels, test_preds, average="macro", zero_division=0))
    f1 = float(f1_score(test_labels, test_preds, average="macro", zero_division=0))

    cm = confusion_matrix(test_labels, test_preds).tolist()
    cr = classification_report(test_labels, test_preds, target_names=classes, output_dict=True, zero_division=0)
    cr_text = classification_report(test_labels, test_preds, target_names=classes, zero_division=0)

    print("\n" + "=" * 60)
    print("HELD-OUT TEST EVALUATION RESULTS:")
    print("=" * 60)
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}% (macro)")
    print(f"Recall:    {rec * 100:.2f}% (macro)")
    print(f"F1-Score:  {f1 * 100:.2f}% (macro)")
    print("\nClassification Report:\n", cr_text)
    print("\nConfusion Matrix:\n", np.array(cm))

    # Exporting files
    args.output_dir.mkdir(parents=True, exist_ok=True)
    model_export_path = args.output_dir / "soil_visual_model.keras"
    labels_export_path = args.output_dir / "soil_labels.json"
    metadata_export_path = args.output_dir / "model_metadata.json"
    soil_metadata_export_path = args.output_dir / "soil_model_metadata.json"
    metrics_export_path = args.output_dir / "soil_training_metrics.json"

    print(f"\nExporting trained model to {model_export_path}...")
    model.save(model_export_path)

    print(f"Exporting labels to {labels_export_path}...")
    with open(labels_export_path, "w", encoding="utf-8") as f:
        json.dump(classes, f, indent=2)

    metadata = {
        "status": "trained",
        "model_name": "MobileNetV2 Soil Classifier",
        "model_version": "1.0.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "architecture": "MobileNetV2 transfer learning (ImageNet initialization)",
        "input_size": [IMAGE_SIZE, IMAGE_SIZE],
        "color_mode": "RGB",
        "preprocessing": "embedded_mobilenet_v2",
        "class_count": len(classes),
        "classes": classes,
        "training_dataset": {
            "name": "Comprehensive Soil Classification Dataset",
            "citation": "Farhan Sheth et al., Engineering Applications of Artificial Intelligence (Elsevier, 2025)",
            "license": "CC-BY-NC-4.0",
            "total_images": len(valid_samples),
            "classes": classes,
            "class_distribution": {cls: sum(1 for _, _, name in valid_samples if name == cls) for cls in classes},
        },
        "evaluation_metrics": {
            "test_accuracy": round(acc, 4),
            "test_precision_macro": round(prec, 4),
            "test_recall_macro": round(rec, 4),
            "test_f1_macro": round(f1, 4),
            "test_sample_count": len(test_labels),
        },
        "confidence_threshold": 0.45,
        "top_prediction_margin_threshold": 0.10,
    }

    print(f"Exporting metadata to {metadata_export_path} and {soil_metadata_export_path}...")
    with open(metadata_export_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    with open(soil_metadata_export_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    metrics_record = {
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        "accuracy": acc,
        "macro_precision": prec,
        "macro_recall": rec,
        "macro_f1": f1,
        "confusion_matrix": cm,
        "classification_report": cr,
        "training_history": {
            "loss": [float(v) for v in history.history.get("loss", [])],
            "accuracy": [float(v) for v in history.history.get("accuracy", [])],
            "val_loss": [float(v) for v in history.history.get("val_loss", [])],
            "val_accuracy": [float(v) for v in history.history.get("val_accuracy", [])],
        },
    }
    with open(metrics_export_path, "w", encoding="utf-8") as f:
        json.dump(metrics_record, f, indent=2)

    print("\nTraining and export completed successfully!")


if __name__ == "__main__":
    main()
