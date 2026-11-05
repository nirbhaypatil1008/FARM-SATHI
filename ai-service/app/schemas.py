from pydantic import BaseModel, Field


class PredictionItem(BaseModel):
    crop: str
    disease: str
    confidence: float = Field(ge=0, le=1)


class DiseaseKnowledge(BaseModel):
    available: bool
    symptoms: list[str] = Field(default_factory=list)
    possibleCauses: list[str] = Field(default_factory=list)
    conduciveConditions: list[str] = Field(default_factory=list)
    prevention: list[str] = Field(default_factory=list)
    nextSteps: list[str] = Field(default_factory=list)
    source: str | None = None
    verifiedAt: str | None = None


class PredictionResponse(BaseModel):
    success: bool = True
    crop: str | None
    predictedDisease: str
    confidence: float = Field(ge=0, le=1)
    status: str
    topPredictions: list[PredictionItem]
    modelVersion: str
    message: str
    knowledge: DiseaseKnowledge
