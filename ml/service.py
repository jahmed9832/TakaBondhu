"""
ML Microservice for TakaBachao / ScamShield (AI Hackathon 2026, Track 01).
FastAPI application running on 127.0.0.1:8001.
Endpoints:
- GET /health
- POST /v1/predict
- POST /predict (alias)
- GET /openapi.json (and exported to docs/openapi.json)
"""

import os
import sys
import json
import logging
from typing import List, Optional
from contextlib import asynccontextmanager
import joblib
import numpy as np

import sklearn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure UTF-8 console output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ml_service")

BASE_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "model.joblib")
META_PATH = os.path.join(MODELS_DIR, "metadata.json")
DOCS_DIR = os.path.join(BASE_DIR, "..", "docs")
os.makedirs(DOCS_DIR, exist_ok=True)

class ReasonCode(BaseModel):
    ngram: str
    contribution: float

class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Message text in Bengali, Banglish, or English")

class PredictResponse(BaseModel):
    status: str = "active"
    probability: float
    label_at_threshold: int
    scam_type: str
    reason_codes: List[ReasonCode]
    model_version: str
    threshold: float

class HealthResponse(BaseModel):
    status: str
    loaded: bool
    model_version: str
    threshold: float
    sklearn_version: str
    feature_count: Optional[int] = None
    message: Optional[str] = None

# Global model state
state = {
    "loaded": False,
    "vectorizer": None,
    "classifier": None,
    "scam_type_clf": None,
    "scam_types": [],
    "threshold": 0.50,
    "model_version": "none",
    "feature_names": None,
    "base_coefs": None,
    "load_error": None
}

def load_model():
    if not os.path.exists(MODEL_PATH):
        state["loaded"] = False
        state["load_error"] = f"Model artifact not found at {MODEL_PATH}. Please run 'npm run train'."
        logger.warning(state["load_error"])
        return

    try:
        logger.info(f"Loading ML model artifact from {MODEL_PATH}...")
        artifact = joblib.load(MODEL_PATH)
        state["vectorizer"] = artifact["vectorizer"]
        state["classifier"] = artifact["classifier"]
        state["scam_type_clf"] = artifact.get("scam_type_clf")
        state["scam_types"] = artifact.get("scam_types", [])
        state["threshold"] = float(artifact.get("threshold", 0.50))

        # Extract vocabulary and base estimator coefficients for attribution
        state["feature_names"] = state["vectorizer"].get_feature_names_out()
        try:
            base_estimator = state["classifier"].calibrated_classifiers_[0].estimator
            state["base_coefs"] = base_estimator.coef_[0]
        except Exception as e:
            logger.warning(f"Could not extract base coefs for feature attribution: {e}")
            state["base_coefs"] = None

        if os.path.exists(META_PATH):
            with open(META_PATH, "r", encoding="utf-8") as f:
                meta = json.load(f)
                state["model_version"] = meta.get("model_version", "v1.0.0-char-wb-lr")
        else:
            state["model_version"] = "v1.0.0-char-wb-lr"

        state["loaded"] = True
        state["load_error"] = None
        logger.info(f"✓ Model successfully loaded! Version: {state['model_version']}, Threshold: {state['threshold']:.4f}")

        # Warm-up prediction
        warmup_text = "Your bKash account will be blocked within 2 hours. Send OTP immediately."
        _ = compute_prediction(warmup_text)
        logger.info("✓ Warm-up prediction successful.")

    except Exception as err:
        state["loaded"] = False
        state["load_error"] = f"Failed to load model: {err}. Please run 'npm run train'."
        logger.error(state["load_error"])

def compute_prediction(text: str):
    if not state["loaded"]:
        raise RuntimeError(state["load_error"] or "Model not loaded.")

    vec = state["vectorizer"].transform([text])
    prob = float(state["classifier"].predict_proba(vec)[0, 1])
    label_at_threshold = 1 if prob >= state["threshold"] else 0

    # Predict scam type
    scam_type = "unknown"
    if state["scam_type_clf"]:
        try:
            scam_type = str(state["scam_type_clf"].predict(vec)[0])
        except Exception as e:
            logger.warning(f"Scam type prediction error: {e}")

    # Compute top contributing n-grams (attributions)
    reason_codes = []
    if state["base_coefs"] is not None and state["feature_names"] is not None:
        cx = vec.tocoo()
        contributions = []
        for col, val in zip(cx.col, cx.data):
            coef = state["base_coefs"][col]
            contrib = val * coef
            contributions.append((state["feature_names"][col], contrib))

        # Sort by positive contribution (evidence for fraud)
        contributions.sort(key=lambda x: x[1], reverse=True)
        for ngram, c in contributions[:5]:
            if c > 0.05: # Only report meaningful positive signals
                reason_codes.append(ReasonCode(ngram=ngram, contribution=round(float(c), 4)))

    return {
        "status": "active",
        "probability": round(prob, 4),
        "label_at_threshold": label_at_threshold,
        "scam_type": scam_type,
        "reason_codes": reason_codes,
        "model_version": state["model_version"],
        "threshold": state["threshold"]
    }

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    # Export OpenAPI documentation to docs/openapi.json
    try:
        openapi_schema = app.openapi()
        openapi_path = os.path.join(DOCS_DIR, "openapi.json")
        with open(openapi_path, "w", encoding="utf-8") as f:
            json.dump(openapi_schema, f, indent=2)
        logger.info(f"✓ Exported OpenAPI schema to {openapi_path}")
    except Exception as e:
        logger.warning(f"Could not export OpenAPI schema: {e}")
    yield

app = FastAPI(
    title="TakaBachao ScamShield ML Service",
    description="Inference API providing TF-IDF char n-gram classification, probability calibration, scam type prediction, and n-gram attribution reason codes.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health():
    if not state["loaded"]:
        return HealthResponse(
            status="unavailable",
            loaded=False,
            model_version="none",
            threshold=0.50,
            sklearn_version=sklearn.__version__,
            message=state["load_error"] or "Model unavailable. Run 'npm run train'."
        )

    return HealthResponse(
        status="active",
        loaded=True,
        model_version=state["model_version"],
        threshold=state["threshold"],
        sklearn_version=sklearn.__version__,
        feature_count=len(state["feature_names"]) if state["feature_names"] is not None else None,
        message="Model is loaded and ready for predictions."
    )

@app.post("/v1/predict", response_model=PredictResponse)
def predict_v1(req: PredictRequest):
    if not state["loaded"]:
        raise HTTPException(
            status_code=503,
            detail=state["load_error"] or "Model is not loaded. Please run 'npm run train'."
        )
    try:
        res = compute_prediction(req.text)
        return PredictResponse(**res)
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail="Inference processing failed.")

@app.post("/predict", response_model=PredictResponse)
def predict_alias(req: PredictRequest):
    """Alias for /v1/predict"""
    return predict_v1(req)

if __name__ == "__main__":
    import uvicorn
    if "--export-openapi" in sys.argv:
        load_model()
        schema = app.openapi()
        out_p = os.path.join(DOCS_DIR, "openapi.json")
        with open(out_p, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2)
        print(f"Exported OpenAPI schema to {out_p}")
        sys.exit(0)

    port = int(os.environ.get("ML_PORT", 8001))
    uvicorn.run("service:app", host="127.0.0.1", port=port, log_level="info", app_dir=BASE_DIR)
