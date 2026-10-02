import pytest
import joblib
from pathlib import Path
import sys
from fastapi import HTTPException

# Ensure ml directory is on sys.path
ML_DIR = Path(__file__).parent.parent
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

import service

def test_model_artifact_and_metadata():
    model_path = ML_DIR / "models" / "model.joblib"
    meta_path = ML_DIR / "models" / "metadata.json"

    assert model_path.exists(), "model.joblib must exist"
    assert meta_path.exists(), "metadata.json must exist"

    data = joblib.load(model_path)
    assert "vectorizer" in data
    assert "classifier" in data
    assert "scam_type_clf" in data

    # Check model file size (< 25MB constraint)
    size_mb = model_path.stat().st_size / (1024 * 1024)
    assert size_mb < 25.0, f"Model size is {size_mb:.2f} MB, must be < 25 MB"

def test_service_health_endpoint():
    service.load_model()
    res = service.health()
    assert res.status == "active"
    assert res.loaded is True
    assert res.threshold == 0.50
    assert res.model_version.startswith("v")

def test_service_predict_contract():
    service.load_model()
    req = service.PredictRequest(text="URGENT: Your account has been suspended. Send OTP immediately to verify.")
    res = service.predict_v1(req)

    assert res.status == "active"
    assert 0.0 <= res.probability <= 1.0
    assert res.label_at_threshold in [0, 1]
    assert isinstance(res.scam_type, str)
    assert isinstance(res.reason_codes, list)
    assert res.threshold == 0.50

def test_service_predict_alias():
    service.load_model()
    req = service.PredictRequest(text="Hello friend, see you at university tomorrow.")
    res = service.predict_alias(req)
    assert res.status == "active"
    assert 0.0 <= res.probability <= 1.0

def test_service_unavailable_mode_when_model_missing():
    """Ensure service returns unavailable status and 503 when model is not loaded."""
    orig_loaded = service.state["loaded"]
    try:
        service.state["loaded"] = False
        service.state["load_error"] = "Simulated missing model artifact"

        h = service.health()
        assert h.loaded is False
        assert h.status == "unavailable"

        with pytest.raises(HTTPException) as exc:
            service.predict_v1(service.PredictRequest(text="test"))
        assert exc.value.status_code == 503
    finally:
        service.load_model()
