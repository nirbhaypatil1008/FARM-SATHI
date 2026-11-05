# FARM-SATHI Soil Analyzer API Reference

This document provides complete documentation for the REST API endpoints supporting the **Soil Vision Analyzer** in FARM-SATHI.

---

## 1. Architecture & Service Topology

```text
[ Browser / React App ]
          │
          │ Multipart / JSON
          ▼
[ Express API Gateway :5000 ]
  ├── Auth Verification (Bearer JWT)
  ├── Rate Limiting
  ├── Multer Validation (5 MB limit, Magic Bytes check)
  ├── SQLite Persistence (`soil_analyses`)
  └── Image Storage (`server/soil-analyses/`)
          │
          │ Proxied Multipart
          ▼
[ Python AI Service :8000 ]
  ├── Image Normalization (224x224 RGB)
  ├── MobileNetV2 Keras Inference
  ├── Soil Knowledge Base Enrichment
  └── JSON Response Formulation
```

---

## 2. API Endpoints

### 1. Check Soil Model Status

- **Method**: `GET`
- **Paths**:
  - Express API: `/api/soil/status`
  - AI Service: `/api/soil/status`
- **Authentication**: None (Public)
- **Response**: `200 OK`
```json
{
  "model_loaded": true,
  "model_name": "MobileNetV2 Soil Classifier",
  "model_version": "1.0.0",
  "class_count": 7,
  "preprocessing": "embedded_mobilenet_v2",
  "message": ""
}
```

---

### 2. Analyze Soil Image (Authenticated Farmer)

Submits a photograph of soil for genuine AI visual classification and saves the result in the farmer's history.

- **Method**: `POST`
- **Path**: `/api/soil/analyze`
- **Authentication**: Required (`Authorization: Bearer <token>`)
- **Content-Type**: `multipart/form-data`
- **Request Parameters**:
  - `image` *(Required, File)*: Soil photograph (JPG, JPEG, PNG, WEBP, max 5 MB).
  - `cropName` *(Optional, String)*: Name of target crop (e.g. "Cotton").
  - `location` *(Optional, String)*: Location or district name (e.g. "Mandya, Karnataka").
  - `ph` *(Optional, String)*: Soil pH measurement (e.g. "7.2").
  - `nitrogen` *(Optional, String)*: Available Nitrogen in kg/ha (e.g. "250").
  - `phosphorus` *(Optional, String)*: Available Phosphorus in kg/ha (e.g. "18").
  - `potassium` *(Optional, String)*: Available Potassium in kg/ha (e.g. "290").
  - `electricalConductivity` *(Optional, String)*: EC in dS/m (e.g. "0.5").
  - `organicCarbon` *(Optional, String)*: Organic Carbon percentage (e.g. "0.6").
  - `soilMoisture` *(Optional, String)*: Soil moisture percentage (e.g. "24").
  - `soilTemperature` *(Optional, String)*: Soil temperature in °C (e.g. "28").
  - `measurementSource` *(Optional, String)*: `farmer_entered` | `sensor` | `laboratory_report`.

- **Response**: `201 Created`
```json
{
  "analysis": {
    "id": "c1f7a0b2-3e4b-4f9e-9988-5c4d1e2f3a4b",
    "cropName": "Cotton",
    "location": "Mandya, Karnataka",
    "imageUrl": "/api/soil/history/c1f7a0b2-3e4b-4f9e-9988-5c4d1e2f3a4b/image",
    "createdAt": "2026-11-05T18:01:02.338Z",
    "success": true,
    "predicted_class": "Black Soil",
    "confidence": 0.911723,
    "status": "possible_detection",
    "probabilities": {
      "Black Soil": 0.911723,
      "Mountain Soil": 0.028776,
      "Laterite Soil": 0.01871,
      "Arid Soil": 0.01811,
      "Red Soil": 0.010247,
      "Yellow Soil": 0.009232,
      "Alluvial Soil": 0.003202
    },
    "model_name": "MobileNetV2 Soil Classifier",
    "model_version": "1.0.0",
    "visual_characteristics": [
      "Texture: Heavy clay to clayey loam; sticky and plastic when wet, hard when dry.",
      "Color tone: Deep black to dark brown or chestnut black.",
      "Surface features: Prominent surface shrinkage cracks when dry; swells significantly when wet.",
      "Drainage: Slow internal drainage; highly prone to surface waterlogging during prolonged rainfall."
    ],
    "soil_characteristics": {
      "texture": "Heavy clay to clayey loam; sticky and plastic when wet, hard when dry.",
      "color": "Deep black to dark brown or chestnut black.",
      "visible_indicators": "Prominent surface shrinkage cracks when dry; swells significantly when wet.",
      "stones_gravel": "Rarely stony; may contain scattered calcium carbonate nodules (kankar).",
      "moisture_appearance": "Retains moisture for extended periods; surface may appear self-ploughed due to shrink-swell cycles.",
      "drainage": "Slow internal drainage; highly prone to surface waterlogging during prolonged rainfall."
    },
    "soil_health": {
      "strengths": [
        "Exceptionally high water-holding capacity, sustaining crops through dry spells.",
        "Rich in calcium carbonate, magnesium carbonate, iron, aluminum, and potash.",
        "High Cation Exchange Capacity (CEC), retaining applied plant nutrients."
      ],
      "limitations": [
        "Poor internal aeration and drainage during waterlogged periods.",
        "Extremely deficient in nitrogen, phosphorus, and organic matter.",
        "Difficult to till when either overly wet (sticky) or excessively dry (hard)."
      ],
      "concerns": [
        "Root asphyxiation and collar rot during heavy monsoons.",
        "High draft requirement for tillage machinery."
      ],
      "recommended_tests": [
        "Soil pH (typically slightly alkaline, 7.5 to 8.5)",
        "Available Phosphorus (deficiency is very common)",
        "Available Nitrogen",
        "Soil Organic Carbon"
      ]
    },
    "recommendations": [
      "Adopt Broad Bed and Furrow (BBF) or ridge-and-furrow planting systems to facilitate surface drainage.",
      "Incorporate well-decomposed FYM or vermicompost to improve soil aeration and aggregate stability.",
      "Carry out timely summer tillage (off-season ploughing) before heavy rains set in."
    ],
    "crop_suitability": {
      "primary_crops": ["Cotton", "Soybean", "Sorghum (Jowar)", "Chickpea (Gram)", "Wheat"],
      "pulses_oilseeds": ["Pigeon pea (Tur)", "Safflower", "Sunflower", "Linseed", "Green gram"],
      "prerequisites": "Adequate surface drainage management, timely sowing to avoid soil stickiness, and phosphorus supplementation."
    },
    "measurements": {
      "ph": "7.8",
      "nitrogen": "220",
      "phosphorus": "14",
      "potassium": "310",
      "measurementSource": "laboratory_report"
    }
  }
}
```

---

### 3. Analyze Soil Image Preview (Guest Mode)

Allows unauthenticated visitors to test the soil classifier without creating an account or saving history in SQLite.

- **Method**: `POST`
- **Path**: `/api/soil/preview`
- **Authentication**: None
- **Content-Type**: `multipart/form-data`
- **Response**: `200 OK` (returns analysis object without database record)

---

### 4. Get Farmer's Soil Analysis History

Returns saved soil reports for the authenticated farmer.

- **Method**: `GET`
- **Path**: `/api/soil/history`
- **Authentication**: Required (`Authorization: Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "analyses": [
    {
      "id": "c1f7a0b2-3e4b-4f9e-9988-5c4d1e2f3a4b",
      "cropName": "Cotton",
      "location": "Mandya, Karnataka",
      "imageUrl": "/api/soil/history/c1f7a0b2-3e4b-4f9e-9988-5c4d1e2f3a4b/image",
      "predicted_class": "Black Soil",
      "confidence": 0.911723,
      "createdAt": "2026-11-05T18:01:02.338Z"
    }
  ]
}
```

---

### 5. Fetch Saved Soil Image

Streams the private, authenticated image file stored on disk.

- **Method**: `GET`
- **Path**: `/api/soil/history/:id/image`
- **Authentication**: Required (`Authorization: Bearer <token>`)
- **Security**: Only the user who created the analysis can download or view this image.
- **Response**: `200 OK` (image stream with `Content-Type: image/jpeg` or `image/png`, and `Cache-Control: private, no-store`).

---

### 6. Delete Saved Soil Analysis

Deletes the database record and removes the saved image from disk.

- **Method**: `DELETE`
- **Path**: `/api/soil/history/:id`
- **Authentication**: Required (`Authorization: Bearer <token>`)
- **Response**: `204 No Content`

---

## 3. HTTP Error Codes & Handling

| Status Code | Description | Typical Cause |
| :--- | :--- | :--- |
| **400 Bad Request** | Invalid input | Missing image file or corrupted image stream |
| **401 Unauthorized** | Missing authentication | Bearer token omitted on protected endpoints |
| **404 Not Found** | Resource missing | Analysis ID does not exist or belongs to another user |
| **413 Payload Too Large** | File size exceeded | Image exceeds 5 MB limit |
| **415 Unsupported Media Type** | Invalid MIME type | File is not JPG, PNG, or WEBP |
| **422 Unprocessable Content** | Invalid dimensions | Image has zero dimensions or is unreadable by PIL |
| **429 Too Many Requests** | Rate limit exceeded | Exceeded 6 soil analyses per minute per IP |
| **502 Bad Gateway** | Invalid AI response | Python AI service returned invalid schema |
| **503 Service Unavailable** | Service offline / Model missing | AI service is not running or model is not loaded |

