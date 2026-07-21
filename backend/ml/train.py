"""
SoilMate ML Module
------------------
1. Soil Health Index Classifier (Optimal | Nutrient Deficient | Acidic | Dry Stress)
2. Soil Crop Recommendation Engine (Trained on Kaggle Dataset:
   manikantasanjayv/crop-recommender-dataset-with-soil-nutrients + agronomic profiles)
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

MODEL_DIR = os.path.dirname(__file__)
HEALTH_MODEL_PATH = os.path.join(MODEL_DIR, "model_health.joblib")
CROP_MODEL_PATH = os.path.join(MODEL_DIR, "model_crop.joblib")

HEALTH_LABELS = ["Optimal", "Nutrient Deficient", "Acidic", "Dry Stress"]


# ===========================================================================
# 1. SOIL HEALTH MODEL
# ===========================================================================

def _generate_synthetic_health_data(n_samples: int = 2400) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(42)
    per_class = n_samples // 4
    X_parts, y_parts = [], []

    def add(n, p, k, ph, moist, temp, hum, label):
        rows = rng.uniform(
            [n[0], p[0], k[0], ph[0], moist[0], temp[0], hum[0]],
            [n[1], p[1], k[1], ph[1], moist[1], temp[1], hum[1]],
            size=(per_class, 7),
        )
        X_parts.append(rows)
        y_parts.extend([label] * per_class)

    # Optimal
    add(n=(40, 80), p=(20, 40), k=(100, 200), ph=(6.0, 7.5),
        moist=(35, 65), temp=(18, 30), hum=(50, 78), label="Optimal")

    # Nutrient Deficient
    add(n=(4, 22), p=(2, 11), k=(18, 58), ph=(6.0, 7.2),
        moist=(32, 62), temp=(18, 30), hum=(48, 75), label="Nutrient Deficient")

    # Acidic
    add(n=(18, 65), p=(8, 30), k=(55, 155), ph=(3.2, 5.4),
        moist=(28, 65), temp=(18, 30), hum=(45, 75), label="Acidic")

    # Dry Stress
    add(n=(18, 72), p=(8, 36), k=(55, 185), ph=(5.8, 7.5),
        moist=(4, 21), temp=(30, 44), hum=(18, 42), label="Dry Stress")

    X = np.vstack(X_parts)
    y = np.array(y_parts)
    idx = rng.permutation(len(X))
    return X[idx], y[idx]


def train_health_model() -> Pipeline:
    print("[ML] Training Soil Health Random Forest model...")
    X, y = _generate_synthetic_health_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )),
    ])
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    print(f"[ML] Health Model Accuracy: {acc:.4f}")

    joblib.dump(model, HEALTH_MODEL_PATH)
    print(f"[ML] Health Model saved -> {HEALTH_MODEL_PATH}")
    return model


def load_health_model() -> Pipeline:
    if os.path.exists(HEALTH_MODEL_PATH):
        print(f"[ML] Loading cached Health Model from {HEALTH_MODEL_PATH}")
        return joblib.load(HEALTH_MODEL_PATH)
    return train_health_model()


def predict_health(model: Pipeline, features: dict) -> tuple[str, float]:
    X = np.array([[
        features["nitrogen"],
        features["phosphorus"],
        features["potassium"],
        features["ph"],
        features["moisture"],
        features["temperature"],
        features["humidity"],
    ]])
    label: str = model.predict(X)[0]
    proba: np.ndarray = model.predict_proba(X)[0]
    confidence = float(np.max(proba))
    return label, confidence


# ===========================================================================
# 2. CROP RECOMMENDATION MODEL (Kaggle Dataset + Regional Profiles)
# ===========================================================================

def _load_crop_dataset() -> pd.DataFrame:
    print("[ML] Loading Kaggle Crop Dataset...")
    try:
        import kagglehub
        kaggle_dir = kagglehub.dataset_download("manikantasanjayv/crop-recommender-dataset-with-soil-nutrients")
        csv_path = os.path.join(kaggle_dir, "dataset.csv")
        df_kaggle = pd.read_csv(csv_path)
    except Exception as e:
        print(f"[ML] Notice: Kaggle hub fallback: {e}")
        # Build dataset if Kaggle hub is offline
        df_kaggle = pd.DataFrame()

    rng = np.random.default_rng(42)

    # 1. Prepare Kaggle data if loaded
    kaggle_rows = []
    if not df_kaggle.empty:
        env_map = {
            "pomegranate": (24, 38, 55),
            "mango": (27, 45, 60),
            "grapes": (22, 35, 65),
            "mulberry": (26, 50, 70),
            "ragi": (25, 40, 50),
            "potato": (18, 55, 75),
        }
        for _, row in df_kaggle.iterrows():
            crop_name = str(row["label"]).capitalize()
            t_base, m_base, h_base = env_map.get(crop_name.lower(), (25, 45, 60))
            kaggle_rows.append({
                "N": float(row["N"]),
                "P": float(row["P"]),
                "K": float(row["K"]),
                "ph": float(row["ph"]),
                "temperature": t_base + rng.uniform(-4, 4),
                "moisture": m_base + rng.uniform(-8, 8),
                "humidity": h_base + rng.uniform(-10, 10),
                "label": crop_name,
            })

    # 2. Regional crop profiles (Rice, Maize, Chickpea, Cotton, Coffee, Banana, Apple, Watermelon, etc.)
    extra_crops = [
        ("Rice", (80, 40, 40, 6.5, 25, 80, 82)),
        ("Maize", (90, 48, 40, 6.2, 24, 60, 65)),
        ("Chickpea", (40, 60, 80, 7.2, 20, 35, 45)),
        ("Cotton", (120, 46, 20, 6.8, 28, 40, 50)),
        ("Coffee", (100, 30, 30, 6.0, 23, 65, 75)),
        ("Banana", (110, 80, 200, 6.5, 27, 70, 80)),
        ("Apple", (30, 130, 200, 5.8, 16, 50, 60)),
        ("Watermelon", (100, 20, 50, 6.4, 26, 45, 50)),
        ("Pomegranate", (140, 65, 215, 6.2, 24, 38, 55)),
        ("Potato", (130, 60, 140, 5.9, 18, 55, 75)),
        ("Ragi", (120, 40, 80, 6.5, 25, 40, 50)),
    ]

    extra_rows = []
    for crop, (n, p, k, ph, temp, moist, hum) in extra_crops:
        for _ in range(120):
            extra_rows.append({
                "N": max(0, n + rng.uniform(-12, 12)),
                "P": max(0, p + rng.uniform(-8, 8)),
                "K": max(0, k + rng.uniform(-15, 15)),
                "ph": max(3.5, min(9.0, ph + rng.uniform(-0.35, 0.35))),
                "temperature": temp + rng.uniform(-3, 3),
                "moisture": max(5, min(95, moist + rng.uniform(-5, 5))),
                "humidity": max(10, min(95, hum + rng.uniform(-7, 7))),
                "label": crop,
            })

    all_data = kaggle_rows + extra_rows
    return pd.DataFrame(all_data)


def train_crop_model() -> Pipeline:
    print("[ML] Training Crop Recommendation Random Forest model...")
    df = _load_crop_dataset()

    X = df[["N", "P", "K", "ph", "temperature", "moisture", "humidity"]].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=250,
            max_depth=None,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=-1,
        )),
    ])
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    print(f"[ML] Crop Recommendation Accuracy: {acc:.4f}")

    joblib.dump(model, CROP_MODEL_PATH)
    print(f"[ML] Crop Model saved -> {CROP_MODEL_PATH}")
    return model


def load_crop_model() -> Pipeline:
    if os.path.exists(CROP_MODEL_PATH):
        print(f"[ML] Loading cached Crop Model from {CROP_MODEL_PATH}")
        return joblib.load(CROP_MODEL_PATH)
    return train_crop_model()


def predict_crop(model: Pipeline, features: dict) -> tuple[str, float, list[dict]]:
    """
    Returns (recommended_crop, confidence_score, top_3_crops_list)
    """
    X = np.array([[
        features["nitrogen"],
        features["phosphorus"],
        features["potassium"],
        features["ph"],
        features["temperature"],
        features["moisture"],
        features["humidity"],
    ]])
    probas: np.ndarray = model.predict_proba(X)[0]
    classes: np.ndarray = model.classes_

    top_indices = np.argsort(probas)[::-1][:3]
    top_crops = [
        {"crop": str(classes[i]), "score": round(float(probas[i]), 4)}
        for i in top_indices
    ]

    best_crop = top_crops[0]["crop"]
    best_score = top_crops[0]["score"]

    return best_crop, best_score, top_crops


# Backward compatibility aliases
load_model = load_health_model
predict = predict_health
