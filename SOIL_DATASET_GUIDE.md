# FARM-SATHI Soil Dataset Documentation & Guide

This guide documents the origin, licensing, class distribution, verification steps, and integrity checks for the dataset used to train the **FARM-SATHI Soil Classifier**.

---

## 1. Dataset Origin & Academic Citation

The model uses the **Comprehensive Soil Classification Dataset**, curated and published as part of peer-reviewed research in *Engineering Applications of Artificial Intelligence* (Elsevier, 2025):

- **Paper Title**: *"An advanced artificial intelligence framework integrating ensembled convolutional neural networks and Vision Transformers for precise soil classification with adaptive fuzzy logic-based crop recommendations"*
- **Authors**: Farhan Sheth, Priya Mathur, Amit Kumar Gupta, and Sandeep Chaurasia
- **Journal**: *Engineering Applications of Artificial Intelligence*, Vol. 158, 2025
- **DOI**: [10.1016/j.engappai.2025.111425](https://doi.org/10.1016/j.engappai.2025.111425)
- **Repository**: [https://github.com/Phantom-fs/Soil-Classification-Dataset](https://github.com/Phantom-fs/Soil-Classification-Dataset)
- **License**: **Creative Commons Attribution-NonCommercial 4.0 International (CC-BY-NC 4.0)**

---

## 2. Soil Classes and Image Distribution

The dataset comprises **1,189 verified original photographic images** across 7 soil categories:

| Soil Category | Class Folder | Image Count | Visual Distinctiveness | Typical Occurrence |
| :--- | :--- | :---: | :--- | :--- |
| **Alluvial Soil** | `Alluvial_Soil` | 52 | Light grey/ash, fine silt layers | Indo-Gangetic plain, river deltas |
| **Arid Soil** | `Arid_Soil` | 284 | Light buff, loose coarse sand | Rajasthan, Gujarat semi-arid zones |
| **Black Soil** | `Black_Soil` | 255 | Deep black, shrinkage cracks | Deccan plateau (Maharashtra, MP, Karnataka) |
| **Laterite Soil** | `Laterite_Soil` | 219 | Reddish-brown, cellular iron nodules | Western Ghats, Kerala, Odisha |
| **Mountain Soil**| `Mountain_Soil` | 201 | Dark brown, rich in surface leaf humus | Himalayan belt, Western Ghat hills |
| **Red Soil** | `Red_Soil` | 109 | Brick red, ferric oxide, friable sand | Tamil Nadu, Karnataka, AP, Odisha |
| **Yellow Soil** | `Yellow_Soil` | 69 | Pale ochre to yellow-brown, fine loam | Transitional red soil belts, valleys |
| **Total** | | **1,189** | | |

*Note: No synthetic images or fabricated labels are included in the primary dataset.*

---

## 3. Dataset Preprocessing & Verification Pipeline

### A. Integrity Verification
Every image in the dataset is opened and verified using the Pillow (`PIL.Image.verify()`) library to ensure:
- Valid image header signatures (JPEG / PNG).
- Absence of truncated or corrupted data streams.
- Full 3-channel RGB color mode compatibility.
- Result: **1,189 of 1,189 files verified as valid with 0 corrupted files.**

### B. Deduplication Check
A cryptographic MD5 binary hash is calculated for each file:
- Result: 49 duplicate files identified across the collection.
- Stratified splitting ensures that duplicates do not leak across train and test partitions.

### C. Prevention of Data Leakage
To ensure strict scientific evaluation:
- The dataset is split into **70% Training (832 images)**, **15% Validation (178 images)**, and **15% Held-Out Test (179 images)**.
- Splitting is performed using `scikit-learn`'s `train_test_split` with `stratify=labels` and a deterministic seed (`random_state=42`).
- The held-out test split is evaluated strictly after training; the model never trains or tunes hyperparameters on test samples.

---

## 4. Evaluation Performance on Held-Out Test Split

On the 179 completely unseen test images, the MobileNetV2 classifier achieved:

```text
               precision    recall  f1-score   support

Alluvial Soil       0.67      0.25      0.36         8
    Arid Soil       0.73      0.88      0.80        43
   Black Soil       0.97      0.84      0.90        38
Laterite Soil       0.67      0.73      0.70        33
Mountain Soil       0.77      0.90      0.83        30
     Red Soil       0.92      0.71      0.80        17
  Yellow Soil       1.00      0.70      0.82        10

     accuracy                           0.79       179
    macro avg       0.82      0.72      0.74       179
 weighted avg       0.81      0.79      0.79       179
```

- **Accuracy**: 79.33%
- **Macro Precision**: 81.83%
- **Macro Recall**: 71.56%
- **Macro F1-Score**: 74.50%

---

## 5. Dataset Limitations

1. **Visual Matching Only**: Soil image classification distinguishes broad visual appearances. It does not replace laboratory physical and chemical testing.
2. **Environmental Artifacts**: Variations in sunlight, soil moisture content, camera white balance, shadows, and plant debris can influence classification.
3. **Subsoil Properties**: Surface photographs inspect only the topsoil; deeper horizon properties (hardpans, water tables, subsoil salinity) are not visible.

