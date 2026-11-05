# PlantVillage model training

The repository does not contain trained model weights. Crop Doctor is intentionally unavailable until the Colab training workflow has produced and installed them; it does not fall back to Gemini or invent predictions.

## Train in Google Colab

1. Review the [PlantVillage dataset card](https://huggingface.co/datasets/mohanty/PlantVillage), its declared CC-BY-SA-3.0 license, the ImageNet weight terms, and the controlled-image limitations before using or redistributing outputs.
2. Open [MODEL_TRAINING.ipynb](./MODEL_TRAINING.ipynb) in Colab. Select a GPU runtime if available.
3. Run the notebook cells in order. The first download is about 2 GB. Training can take a while and may need a high-memory/GPU runtime.
4. Review the printed held-out dataset metrics and keep the downloaded export archive private until its attribution and license obligations are satisfied.

The script loads the `color` configuration from `mohanty/PlantVillage`. It uses the publisher's leaf-grouped test split, and creates a separate training/validation split grouped by `leaf_id` to avoid images of the same leaf leaking between those subsets. It trains MobileNetV2 with ImageNet initialization, augmentation, and fine tuning; reports accuracy, macro precision/recall/F1, a classification report, and confusion matrix; and exports the trained model, class order, and metadata together. These scores describe the dataset split only—not field accuracy, not a clinical/agronomic guarantee, and not a calibrated probability.

## Install the exported files

Extract these three files from the downloaded archive directly into `ai-service/models/`:

- `plant_disease_model.keras`
- `class_labels.json`
- `model_metadata.json`

The `.keras` file is ignored by Git because it is a large model artifact. Keep all three files from the same training run together. Do not copy just the labels from another model. The checked-in `model_metadata.json` marks the model as training-required and contains no measured accuracy.

Restart FastAPI from the `ai-service` directory, then check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Confirm `modelLoaded` is `true` and `modelVersion` is the exported version. The authenticated Crop Doctor page should then enable image analysis and list supported crops. If loading fails, inspect the health response and AI-service console output.

## Train locally from the FARM SAATHI notebook

The notebook at `C:\Users\<you>\Downloads\FARM_SATHI_Dataset_Training_Evaluation.ipynb` trains PlantVillage only. Its soil section intentionally creates an empty folder; it does not train a soil classifier. The repository script `ai-service\train_from_notebook.py` uses TFDS PlantVillage's 38 class names and extracted class-folder images, then makes deterministic, per-class 70/15/15 splits. This avoids the TFDS example-generator issue observed on Windows while following the notebook's five-epoch MobileNetV2 baseline. It evaluates the held-out split and exports the model using the filenames and preprocessing expected by the local backend.

On Windows, install the training dependencies into the AI-service Python 3.13 environment and run:

```powershell
ai-service\.venv\Scripts\python.exe -m pip install -r ai-service\requirements-training.txt
ai-service\.venv\Scripts\python.exe ai-service\train_from_notebook.py --epochs 5
```

The first run downloads PlantVillage and ImageNet weights. Training on CPU can take a long time; a GPU-enabled Colab runtime is preferable. The model and matching `class_labels.json`, `model_metadata.json`, and measured `training_metrics.json` are exported to `ai-service\models\`. Restart FastAPI after training and confirm disease readiness at `http://127.0.0.1:8000/health`. These results measure the notebook's held-out PlantVillage split, not field accuracy.

Soil Vision remains unavailable until a separate, properly labeled soil-image dataset has been supplied and trained. Do not use the plant-disease model for soil photographs.

## Dataset and model limitations

PlantVillage has 38 crop/disease classes across 14 crops. The data consists primarily of controlled-condition leaf images. Real fields include different lighting, backgrounds, varieties, growth stages, mixed symptoms, pests, nutrient stress, and diseases absent from the training labels. A high softmax score cannot rule out these conditions. Low confidence, close top classes, blurred images, unsupported crops, or crop-selection mismatch are reported as inconclusive. The model does not use farmer notes as classifier input.

No verified local treatment knowledge base is included. Do not add pesticide doses or disease-specific treatment claims without authoritative, crop/region-appropriate sources, review, and a verification date. Seek local agricultural extension advice before treatment.

For Python service installation, supported runtime versions, start commands, APIs, and tests, see [API_SETUP.md](./API_SETUP.md) and [ai-service/README.md](./ai-service/README.md).
