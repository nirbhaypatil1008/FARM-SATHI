# Soil model files

Place the trained model and its exact class labels here:

- `soil_visual_model.keras`
- `soil_labels.json`
- optional `soil_model_metadata.json`

The `.keras` file is ignored by Git. Do not copy the PlantVillage disease model or rename generic soil labels. The application reports the soil classifier unavailable until a valid model and matching label file are installed.

Preprocessing must match the model used during training. Set `SOIL_PREPROCESSING` in `ai-service/.env` to:

- `embedded_mobilenet_v2` if the saved Keras model includes its MobileNetV2 normalization internally (default).
- `mobilenet_v2` if training applied `tf.keras.applications.mobilenet_v2.preprocess_input` before calling the model.

If `soil_model_metadata.json` declares `preprocessing`, that value is used and must match one of these options. Do not guess if the model's training pipeline is unknown.
