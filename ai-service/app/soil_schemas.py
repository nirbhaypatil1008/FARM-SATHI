from pydantic import BaseModel, Field


class SoilPredictionItem(BaseModel):
    soilCategory: str
    confidence: float = Field(ge=0, le=1)


class SoilCharacteristics(BaseModel):
    texture: str
    color: str
    visible_indicators: str
    stones_gravel: str
    moisture_appearance: str
    drainage: str


class SoilHealthAssessment(BaseModel):
    strengths: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    recommended_tests: list[str] = Field(default_factory=list)


class CropSuitability(BaseModel):
    primary_crops: list[str] = Field(default_factory=list)
    pulses_oilseeds: list[str] = Field(default_factory=list)
    vegetables_fruits: list[str] = Field(default_factory=list)
    prerequisites: str = ""


class SoilPredictionResponse(BaseModel):
    success: bool = True
    predicted_class: str | None
    confidence: float = Field(ge=0, le=1)
    status: str
    probabilities: dict[str, float]
    model_ready: bool
    analysis_type: str
    model_name: str
    model_version: str | None
    message: str
    limitations: list[str] = Field(default_factory=list)
    top_predictions: list[SoilPredictionItem] = Field(default_factory=list)
    visual_characteristics: list[str] = Field(default_factory=list)
    soil_characteristics: SoilCharacteristics | None = None
    soil_health: SoilHealthAssessment | None = None
    recommendations: list[str] = Field(default_factory=list)
    crop_suitability: CropSuitability | None = None
    fertilizer_guidance: list[str] = Field(default_factory=list)
    scientific_testing_note: str = ""
