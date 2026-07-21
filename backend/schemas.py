import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class SensorPayload(BaseModel):
    device_id: str = "rover_01"
    ph: float = Field(..., ge=0.0, le=14.0, description="Soil pH (0–14)")
    nitrogen: float = Field(..., ge=0.0, description="Nitrogen mg/kg")
    phosphorus: float = Field(..., ge=0.0, description="Phosphorus mg/kg")
    potassium: float = Field(..., ge=0.0, description="Potassium mg/kg")
    temperature: float = Field(..., description="Soil temperature °C")
    moisture: float = Field(..., ge=0.0, le=100.0, description="Volumetric moisture %")
    humidity: float = Field(..., ge=0.0, le=100.0, description="Ambient humidity %")


class CropScore(BaseModel):
    crop: str
    score: float


class ReadingResponse(BaseModel):
    id: int
    device_id: str
    ph: float
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    moisture: float
    humidity: float
    timestamp: datetime.datetime
    health_label: Optional[str] = None
    confidence_score: Optional[float] = None
    recommended_crop: Optional[str] = None
    crop_confidence: Optional[float] = None
    top_crops: Optional[List[CropScore]] = None

    model_config = {"from_attributes": True}


class HistoryPoint(BaseModel):
    timestamp: str
    ph: float
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    moisture: float
    humidity: float
    health_label: Optional[str] = None
    recommended_crop: Optional[str] = None
    crop_confidence: Optional[float] = None
