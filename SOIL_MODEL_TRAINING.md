# FARM-SATHI Soil Model Training Guide

This guide documents the model architecture, training methodology, and evaluation workflow for the **Soil Vision Classifier** in FARM-SATHI.

---

## 1. Overview & Architecture

The Soil Analyzer uses transfer learning based on the **MobileNetV2** convolutional architecture pre-trained on ImageNet. It has been trained and evaluated on a real, documented soil image dataset to classify visual soil appearances into 7 distinct categories.

### Model Specifications

- **Base Architecture**: MobileNetV2 (`include_top=False`, ImageNet weights)
- **Input Resolution**: 224 × 224 pixels, 3 channels (RGB)
- **Input Range**: Float32 values in `[0, 255]`
- **Internal Preprocessing**: Embedded `tf.keras.applications.mobilenet_v2.preprocess_input` (scales pixel values to `[-1, 1]`)
- **Data Augmentation**:
  - `RandomFlip("horizontal")`
  - `RandomRotation(0.08)`
  - `RandomZoom(0.10)`
  - `RandomContrast(0.08)`
- **Classification Head**:
  - `GlobalAveragePooling2D(name="global_pooling")`
  - `Dropout(0.25, name="dropout")`
  - `Dense(7, activation="softmax", name="soil_probabilities")`
- **Total Parameters**: 2,266,951 (8.65 MB)
- **Trainable Parameters**: 8,967 (35.03 KB)
- **Non-trainable Backbone Parameters**: 2,257,984 (8.61 MB)

---

## 2. Supported Soil Classes

The model classifies images into the 7 categories present in the training dataset:

1. **Alluvial Soil**
2. **Arid Soil** (Sandy/Desert)
3. **Black Soil** (Regur)
4. **Laterite Soil**
5. **Mountain Soil** (Forest Soil)
6. **Red Soil**
7. **Yellow Soil**

*No unsupported or unverified classes are predicted.*

---

## 3. Google Colab Training Notebook (`soil_model_training.ipynb`)

A complete, self-contained Google Colab notebook is provided in the repository root:

```text
soil_model_training.ipynb
```

### Steps Included in the Notebook:

1. **Environment Setup**: Installs and verifies TensorFlow, Keras, scikit-learn, PIL, matplotlib, and seaborn.
2. **Dataset Download**: Automatically clones the verified dataset from `https://github.com/Phantom-fs/Soil-Classification-Dataset.git`.
3. **Directory Verification**: Verifies the existence of all 7 class directories.
4. **Image Count per Class**: Prints per-class image counts.
5. **Dataset Visualization**: Generates bar charts showing class distributions.
6. **Sample Soil Image Display**: Renders sample photographs from all 7 classes.
7. **Invalid Image Detection**: Inspects file headers to detect corrupted or unreadable images.
8. **Duplicate Detection**: Computes MD5 checksums across all images to flag exact binary duplicates.
9. **Train / Validation / Test Splitting**: Stratified 70% Train, 15% Validation, and 15% Held-Out Test split using `random_state=42` to prevent data leakage.
10. **Image Resizing and Normalization**: Builds `tf.data.Dataset` pipelines with 224×224 antialiased resizing.
11. **Data Augmentation**: Sets up realistic field variations (rotation, flip, zoom, contrast).
12. **Transfer Learning Model Creation**: Builds the MobileNetV2 architecture with embedded preprocessing.
13. **Model Training**: Trains with Adam optimizer (`lr=1e-3`) and sparse categorical cross-entropy.
14. **Validation**: Evaluates loss and accuracy on the validation split.
15. **Accuracy and Loss Graphs**: Plots training vs. validation learning curves.
16. **Confusion Matrix**: Generates a heatmap showing true vs. predicted classifications.
17. **Classification Report**: Outputs precision, recall, and F1-score per class.
18. **Macro Metrics**: Reports overall macro-averaged precision, recall, and F1-score.
19. **Test Sample Predictions**: Displays visual predictions on unseen test images with confidence scores.
20. **Model Export**: Exports `soil_visual_model.keras`.
21. **Label JSON Generation**: Exports `soil_labels.json`.
22. **Model Metadata Generation**: Exports `model_metadata.json` documenting the dataset and metrics.
23. **Download Trained Files**: Creates a ZIP bundle for easy download from Google Colab.

---

## 4. Local Training Pipeline (`train_soil_model.py`)

You can also train and evaluate the model locally using the Python environment:

```powershell
# From the repository root
$env:PYTHONPATH="ai-service"
& "ai-service\.venv\Scripts\python.exe" "ai-service\train_soil_model.py" --epochs 6
```

### Actual Evaluation Results on Held-Out Test Set:

- **Held-Out Test Samples**: 179 unseen images
- **Test Accuracy**: **79.33%**
- **Macro Precision**: **81.83%**
- **Macro Recall**: **71.56%**
- **Macro F1-Score**: **74.50%**

---

## 5. Exported Model Artifacts

Training exports the following files to `ai-service/models/soil/`:

- `soil_visual_model.keras` — Saved Keras model with architecture and weights
- `soil_labels.json` — Exact class label list in alphabetical index order
- `model_metadata.json` — Model metadata, dataset citation, and test metrics
- `soil_training_metrics.json` — Complete confusion matrix and per-class metrics

