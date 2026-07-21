import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, default="rover_01")
    ph = Column(Float, nullable=False)
    nitrogen = Column(Float, nullable=False)
    phosphorus = Column(Float, nullable=False)
    potassium = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    moisture = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    prediction = relationship(
        "HealthPrediction",
        back_populates="reading",
        uselist=False,
        cascade="all, delete-orphan",
    )


class HealthPrediction(Base):
    __tablename__ = "health_predictions"

    id = Column(Integer, primary_key=True, index=True)
    reading_id = Column(Integer, ForeignKey("sensor_readings.id", ondelete="CASCADE"), unique=True, nullable=False)
    health_label = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)

    # Crop Recommendation fields
    recommended_crop = Column(String, nullable=True)
    crop_confidence = Column(Float, nullable=True)
    top_crops_json = Column(Text, nullable=True)

    reading = relationship("SensorReading", back_populates="prediction")
