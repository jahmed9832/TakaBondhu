"""
ml/service.py
ML Microservice for TakaBondhu (টাকাবন্ধু)
Event: AI Hackathon 2026 (DIU CPC x upay) - Track 01: Trust & Risk Intelligence

FastAPI application running on 127.0.0.1:8001 providing:
1. Message Intelligence: TF-IDF char_wb n-grams + calibrated Logistic Regression
2. Transaction Risk Intelligence: Calibrated HistGradientBoosting classifier
3. Behavioral Anomaly Detection: IsolationForest customer anomaly scoring
4. Mule Network Discovery: NetworkX ego-subgraph and flow-velocity analysis
5. Agent Risk Benchmarking: Structuring ratios and peer comparison z-scores
6. Pre-Send Fusion: Multi-signal risk blending and 3-part Case Cards
"""

import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"

import sys
import json
import logging
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import joblib
import numpy as np
import pandas as pd
import sklearn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure UTF-8 console output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("takabondhu_ml")

MODELS_DIR = os.path.join(BASE_DIR, "models")
DOCS_DIR = os.path.join(BASE_DIR, "..", "docs")
os.makedirs(DOCS_DIR, exist_ok=True)

# Pydantic Request / Response Models
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

class TransactionScreenRequest(BaseModel):
    transaction: Dict[str, Any] = Field(..., description="Transaction payload containing amount, sender, receiver, etc.")
    message: Optional[str] = Field(None, description="Optional associated SMS or chat message")
    session_context: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    loaded: bool
    model_version: str = "v1.0.0-char-wb-lr"
    threshold: float = 0.50
    models: Dict[str, Any] = {}
    sklearn_version: str = ""
    message: Optional[str] = None


# State singleton
from ml.fusion import FusionEngine
from ml.transactions.graph_analyzer import MuleGraphAnalyzer
from ml.transactions.agent_benchmarker import AgentBenchmarker

state = {
    "loaded": False,
    "fusion_engine": None,
    "graph_analyzer": None,
    "agent_benchmarker": None,
    "vectorizer": None,
    "classifier": None,
    "scam_type_clf": None,
    "scam_types": [],
    "threshold": 0.50,
    "model_version": "v1.0.0-char-wb-lr",
    "feature_names": None,
    "base_coefs": None,
    "load_error": None
}


def load_model(force: bool = False):
    if state["loaded"] and not force:
        return

    try:
        logger.info("Initializing TakaBondhu ML engines...")
        # 1. Message Model
        msg_model_path = os.path.join(MODELS_DIR, "model.joblib")
        if os.path.exists(msg_model_path):
            artifact = joblib.load(msg_model_path)
            state["vectorizer"] = artifact["vectorizer"]
            state["classifier"] = artifact["classifier"]
            state["scam_type_clf"] = artifact.get("scam_type_clf")
            state["scam_types"] = artifact.get("scam_types", [])
            state["threshold"] = round(float(artifact.get("threshold", 0.50)), 4)
            state["feature_names"] = state["vectorizer"].get_feature_names_out()
            try:
                base_estimator = state["classifier"].calibrated_classifiers_[0].estimator
                state["base_coefs"] = base_estimator.coef_[0]
            except Exception:
                state["base_coefs"] = None

        # 2. Multi-Signal Fusion Engine
        state["fusion_engine"] = FusionEngine()

        # 3. Mule Graph Analyzer (load pre-computed cache for instant, low-memory startup)
        state["graph_analyzer"] = MuleGraphAnalyzer()
        graph_cache_path = os.path.join(MODELS_DIR, "graph_cache.json")
        if os.path.exists(graph_cache_path):
            state["graph_analyzer"].load_cache(graph_cache_path)
        else:
            tx_csv = os.path.join(BASE_DIR, "data", "transactions", "transactions.csv")
            if os.path.exists(tx_csv):
                tx_sample = pd.read_csv(tx_csv).head(1000)
                state["graph_analyzer"].build_graph(tx_sample)

        # 4. Agent Benchmarker
        state["agent_benchmarker"] = AgentBenchmarker()
        agent_bench_path = os.path.join(MODELS_DIR, "agent_benchmarks.json")
        if os.path.exists(agent_bench_path):
            with open(agent_bench_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                state["agent_benchmarker"].peer_metrics = data.get("peer_metrics", {})
                state["agent_benchmarker"].agent_profiles = data.get("profiles_sample", {})

        state["loaded"] = True
        logger.info("✓ All TakaBondhu ML models and engines loaded successfully.")
    except Exception as e:
        state["loaded"] = False
        state["load_error"] = str(e)
        logger.error(f"Error loading ML models: {e}")


def compute_prediction(text: str) -> dict:
    vec = state["vectorizer"]
    clf = state["classifier"]
    threshold = state["threshold"]

    X = vec.transform([text])
    prob = float(clf.predict_proba(X)[0, 1])
    label_at_threshold = 1 if prob >= threshold else 0

    scam_type = "unknown"
    if state["scam_type_clf"] is not None and len(state["scam_types"]) > 0:
        try:
            st_pred = state["scam_type_clf"].predict(X)[0]
            scam_type = state["scam_types"][st_pred] if isinstance(st_pred, (int, np.integer)) else str(st_pred)
        except Exception:
            scam_type = "unknown"

    reason_codes = []
    if state["base_coefs"] is not None and state["feature_names"] is not None:
        cx = X.tocoo()
        contributions = []
        for col, val in zip(cx.col, cx.data):
            coef = state["base_coefs"][col]
            contrib = val * coef
            contributions.append((state["feature_names"][col], contrib))

        contributions.sort(key=lambda x: x[1], reverse=True)
        for ngram, c in contributions[:5]:
            if c > 0.05:
                reason_codes.append(ReasonCode(ngram=ngram, contribution=round(float(c), 4)))

    return {
        "status": "active",
        "probability": round(prob, 4),
        "label_at_threshold": label_at_threshold,
        "scam_type": scam_type,
        "reason_codes": reason_codes,
        "model_version": state["model_version"],
        "threshold": round(state["threshold"], 4)
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
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
    title="TakaBondhu ML Service",
    description="Upay AI Financial-Safety Microservice: Real-time transaction scoring, message intelligence, behavioral anomaly detection, mule network discovery, and agent risk benchmarking.",
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
            models={},
            sklearn_version=sklearn.__version__,
            message=state["load_error"] or "Model unavailable. Run 'npm run train'."
        )

    return HealthResponse(
        status="active",
        loaded=True,
        model_version=state["model_version"],
        threshold=state["threshold"],
        models={
            "message_classifier": {"loaded": state["vectorizer"] is not None, "version": state["model_version"], "threshold": state["threshold"]},
            "transaction_classifier": {"loaded": state["fusion_engine"] is not None and state["fusion_engine"].txn_model is not None, "version": "v1.0.0-lgbm-calibrated"},
            "anomaly_detector": {"loaded": state["fusion_engine"] is not None and state["fusion_engine"].anomaly_detector is not None, "version": "v1.0.0-isoforest"},
            "graph_analyzer": {"loaded": state["graph_analyzer"] is not None, "version": "v1.0.0-networkx-mule"},
            "agent_benchmarker": {"loaded": state["agent_benchmarker"] is not None, "version": "v1.0.0-peer-zscore"}
        },
        sklearn_version=sklearn.__version__,
        message="All models loaded and ready for predictions."
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
    return predict_v1(req)


@app.post("/v1/analyze-message", response_model=PredictResponse)
def analyze_message_alias(req: PredictRequest):
    return predict_v1(req)


@app.post("/v1/score-transaction")
def score_transaction_endpoint(payload: Dict[str, Any]):
    if not state["loaded"] or not state["fusion_engine"]:
        raise HTTPException(status_code=503, detail="ML service unavailable.")
    try:
        tx = payload.get("transaction", payload)
        score, attrs = state["fusion_engine"].score_transaction(tx)
        anom_score, anom_reasons = state["fusion_engine"].score_anomaly(tx)
        return {
            "status": "ok",
            "transaction_risk_score": round(score, 1),
            "anomaly_score": round(anom_score, 1),
            "attributions": attrs,
            "anomaly_reasons": anom_reasons,
            "model_version": "v1.0.0-lgbm-calibrated"
        }
    except Exception as e:
        logger.error(f"Error scoring transaction: {e}")
        raise HTTPException(status_code=500, detail="Transaction scoring failed.")


@app.post("/v1/screen")
def screen_endpoint(req: TransactionScreenRequest):
    if not state["loaded"] or not state["fusion_engine"]:
        raise HTTPException(status_code=503, detail="ML service unavailable.")
    try:
        fusion = state["fusion_engine"]
        result = fusion.fuse(tx_dict=req.transaction, message_text=req.message or "")
        return {
            "status": "ok",
            **result
        }
    except Exception as e:
        logger.error(f"Error screening transaction: {e}")
        raise HTTPException(status_code=500, detail="Pre-send screening failed.")


@app.get("/v1/mule-network/{wallet}")
def mule_network_endpoint(wallet: str):
    if not state["loaded"] or not state["graph_analyzer"]:
        raise HTTPException(status_code=503, detail="Graph service unavailable.")
    try:
        subgraph = state["graph_analyzer"].get_wallet_subgraph(wallet)
        return {
            "status": "ok",
            **subgraph
        }
    except Exception as e:
        logger.error(f"Error fetching mule network for {wallet}: {e}")
        raise HTTPException(status_code=500, detail="Mule network lookup failed.")


@app.get("/v1/agents/{agent_id}/risk")
def agent_risk_endpoint(agent_id: str):
    if not state["loaded"] or not state["agent_benchmarker"]:
        raise HTTPException(status_code=503, detail="Agent benchmarker service unavailable.")
    try:
        res = state["agent_benchmarker"].evaluate_agent(agent_id)
        return {
            "status": "ok",
            **res
        }
    except Exception as e:
        logger.error(f"Error evaluating agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail="Agent risk evaluation failed.")


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

    uvicorn.run("ml.service:app", host="127.0.0.1", port=8001, reload=False)
