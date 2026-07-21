"""
SoilMate Backend — FastAPI Application
=======================================
Routes:
  POST /api/sensors/ingest        — Receive ESP32 payload, run ML, persist
  GET  /api/dashboard/current     — Latest reading + health & crop predictions
  GET  /api/dashboard/history     — Time-series for charts (last N hours)
  POST /api/simulate              — Generate a synthetic reading (demo / dev)
  GET  /api/health                — Liveness probe
"""

import datetime
import json
import random
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import Base, engine, get_db
from ml.train import load_health_model, load_crop_model, predict_health, predict_crop
from models import HealthPrediction, SensorReading
from schemas import ReadingResponse, SensorPayload

# ---------------------------------------------------------------------------
# Global ML model instances
# ---------------------------------------------------------------------------
_health_model = None
_crop_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _health_model, _crop_model
    # 1. Ensure DB tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # 2. Load ML models
    _health_model = load_health_model()
    _crop_model = load_crop_model()
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SoilMate API",
    description="Agricultural rover sensor ingestion, soil health & crop recommendation API",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helper: build ReadingResponse from ORM objects
# ---------------------------------------------------------------------------
def _to_response(reading: SensorReading) -> dict:
    pred = reading.prediction
    top_crops = None
    if pred and pred.top_crops_json:
        try:
            top_crops = json.loads(pred.top_crops_json)
        except Exception:
            top_crops = None

    return {
        "id": reading.id,
        "device_id": reading.device_id,
        "ph": reading.ph,
        "nitrogen": reading.nitrogen,
        "phosphorus": reading.phosphorus,
        "potassium": reading.potassium,
        "temperature": reading.temperature,
        "moisture": reading.moisture,
        "humidity": reading.humidity,
        "timestamp": reading.timestamp.isoformat(),
        "health_label": pred.health_label if pred else None,
        "confidence_score": round(pred.confidence_score, 4) if pred else None,
        "recommended_crop": pred.recommended_crop if pred else None,
        "crop_confidence": round(pred.crop_confidence, 4) if (pred and pred.crop_confidence) else None,
        "top_crops": top_crops,
    }


# ---------------------------------------------------------------------------
# Core ingest logic (shared between /ingest and /simulate)
# ---------------------------------------------------------------------------
async def _ingest(payload: SensorPayload, db: AsyncSession) -> dict:
    if _health_model is None or _crop_model is None:
        raise HTTPException(status_code=503, detail="ML models not yet loaded. Try again in a moment.")

    reading = SensorReading(
        device_id=payload.device_id,
        ph=payload.ph,
        nitrogen=payload.nitrogen,
        phosphorus=payload.phosphorus,
        potassium=payload.potassium,
        temperature=payload.temperature,
        moisture=payload.moisture,
        humidity=payload.humidity,
        timestamp=datetime.datetime.utcnow(),
    )
    db.add(reading)
    await db.flush()  # populate reading.id

    features = {
        "nitrogen": payload.nitrogen,
        "phosphorus": payload.phosphorus,
        "potassium": payload.potassium,
        "ph": payload.ph,
        "moisture": payload.moisture,
        "temperature": payload.temperature,
        "humidity": payload.humidity,
    }

    # 1. Predict soil health index
    health_label, health_conf = predict_health(_health_model, features)

    # 2. Predict crop recommendation
    crop_label, crop_conf, top_crops = predict_crop(_crop_model, features)

    health = HealthPrediction(
        reading_id=reading.id,
        health_label=health_label,
        confidence_score=health_conf,
        recommended_crop=crop_label,
        crop_confidence=crop_conf,
        top_crops_json=json.dumps(top_crops),
    )
    db.add(health)
    await db.commit()

    await db.refresh(reading)
    reading.prediction = health
    return _to_response(reading)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", summary="Root info")
async def root():
    return {
        "message": "SoilMate REST API Server is running",
        "web_dashboard_url": "http://localhost:3000",
        "api_docs_url": "http://127.0.0.1:8000/docs",
        "endpoints": {
            "ingest_sensor_payload": "POST /api/sensors/ingest",
            "current_reading": "GET /api/dashboard/current",
            "history": "GET /api/dashboard/history",
            "simulate": "POST /api/simulate",
            "health": "GET /api/health",
        },
    }


@app.post("/api/sensors/ingest", summary="Ingest ESP32 sensor payload")
async def ingest_sensor_data(
    payload: SensorPayload,
    db: AsyncSession = Depends(get_db),
):
    return await _ingest(payload, db)


@app.get("/api/dashboard/current", summary="Latest reading for a device")
async def get_current_dashboard(
    device_id: str = Query(default="rover_01"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SensorReading)
        .options(selectinload(SensorReading.prediction))
        .where(SensorReading.device_id == device_id)
        .order_by(desc(SensorReading.timestamp))
        .limit(1)
    )
    reading = result.scalar_one_or_none()

    if not reading:
        return {"status": "no_data", "device_id": device_id}

    return _to_response(reading)


@app.get("/api/dashboard/history", summary="Time-series sensor history")
async def get_history(
    device_id: str = Query(default="rover_01"),
    hours: int = Query(default=24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
    result = await db.execute(
        select(SensorReading)
        .options(selectinload(SensorReading.prediction))
        .where(SensorReading.device_id == device_id)
        .where(SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp)
    )
    readings = result.scalars().all()
    return {
        "device_id": device_id,
        "hours": hours,
        "count": len(readings),
        "data": [_to_response(r) for r in readings],
    }


_SCENARIOS = [
    # Optimal
    {"ph": 6.8, "nitrogen": 57.3, "phosphorus": 28.6, "potassium": 142.7, "temperature": 23.4, "moisture": 48.2, "humidity": 63.5},
    {"ph": 7.1, "nitrogen": 63.1, "phosphorus": 31.2, "potassium": 167.4, "temperature": 21.8, "moisture": 52.7, "humidity": 67.1},
    # Pomegranate / Fruit Soil
    {"ph": 6.2, "nitrogen": 138.0, "phosphorus": 64.0, "potassium": 212.0, "temperature": 24.5, "moisture": 38.0, "humidity": 55.0},
    # Rice / Wet Soil
    {"ph": 6.5, "nitrogen": 82.0, "phosphorus": 42.0, "potassium": 41.0, "temperature": 25.2, "moisture": 81.0, "humidity": 83.0},
    # Maize / Balanced Soil
    {"ph": 6.2, "nitrogen": 91.0, "phosphorus": 47.0, "potassium": 42.0, "temperature": 24.1, "moisture": 61.0, "humidity": 66.0},
]


@app.post("/api/simulate", summary="Inject a simulated ESP32 reading (demo)")
async def simulate_reading(
    device_id: str = Query(default="rover_01"),
    db: AsyncSession = Depends(get_db),
):
    base = random.choice(_SCENARIOS)
    rng = random.uniform

    def noisy(v: float, pct: float = 0.05) -> float:
        return round(v * (1 + rng(-pct, pct)), 1)

    payload = SensorPayload(
        device_id=device_id,
        ph=round(noisy(base["ph"], 0.03), 2),
        nitrogen=noisy(base["nitrogen"]),
        phosphorus=noisy(base["phosphorus"]),
        potassium=noisy(base["potassium"]),
        temperature=noisy(base["temperature"]),
        moisture=noisy(base["moisture"]),
        humidity=noisy(base["humidity"]),
    )
    return await _ingest(payload, db)


@app.get("/api/health", summary="Liveness probe")
async def health_check():
    return {
        "status": "ok",
        "health_model_loaded": _health_model is not None,
        "crop_model_loaded": _crop_model is not None,
    }
