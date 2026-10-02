import time
import json
import numpy as np
import joblib
from pathlib import Path

def main():
    models_dir = Path(__file__).parent / "models"
    model_path = models_dir / "model.joblib"
    
    if not model_path.exists():
        print(json.dumps({"error": "Model artifact not found"}))
        return

    data = joblib.load(model_path)
    vectorizer = data['vectorizer']
    clf = data['classifier']
    
    test_texts = [
        "জরুরি নোটিশ: আপনার একাউন্ট স্থগিত করা হয়েছে। অবিলম্বে পিন পাঠান।",
        "Apnar bKash account block hoye jabe. Ekhon-i 500 taka pathan.",
        "Your account has been locked due to suspicious activity. Verify OTP now.",
        "Mama, ajke bashay ashte late hobe. Chachi ki ranna korche?",
        "Taka pathiyechi 1500 taka bKash e, received text ta check koro.",
        "Free cash prize 50000 BDT won! Click here to claim your reward immediately."
    ]

    # Warmup
    for text in test_texts:
        X = vectorizer.transform([text])
        _ = clf.predict_proba(X)

    # 100 runs
    latencies = []
    for i in range(100):
        text = test_texts[i % len(test_texts)]
        t0 = time.perf_counter()
        X = vectorizer.transform([text])
        _ = clf.predict_proba(X)
        lat = (time.perf_counter() - t0) * 1000.0
        latencies.append(lat)

    latencies = np.array(latencies)
    p50 = float(np.percentile(latencies, 50))
    p95 = float(np.percentile(latencies, 95))
    mean = float(np.mean(latencies))
    min_lat = float(np.min(latencies))
    max_lat = float(np.max(latencies))

    result = {
        "runs": 100,
        "p50_ms": round(p50, 3),
        "p95_ms": round(p95, 3),
        "mean_ms": round(mean, 3),
        "min_ms": round(min_lat, 3),
        "max_ms": round(max_lat, 3)
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main()
