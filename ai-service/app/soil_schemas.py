from pydantic import BaseModel, Field


class SoilPredictionItem(BaseModel):
    soilCategory: str
    confidence: float = Field(ge=0, le=1)


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
