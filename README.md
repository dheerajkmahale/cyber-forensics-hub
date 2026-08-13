# Cyber Forensics Hub — Local Run Instructions

This repository provides a local Streamlit-based demo for synthetic fraud detection (money muling, circular transfers).

Quick steps to run locally:

1. Create and activate a Python virtual environment:

```
python -m venv venv
.\venv\Scripts\activate    # Windows
source venv/bin/activate    # macOS / Linux
```

2. Install dependencies:

```
pip install -r requirements.txt
```

3. Generate or use the included dataset and run evaluation:

```
python generate_dataset.py   # creates sample_transactions.csv
python evaluate.py          # runs heuristic detection vs ground truth
```

4. Start the Streamlit UI:

```
streamlit run app.py
```

Verified evaluation output (run on `sample_transactions.csv`):

**Latest (optimized heuristic):**
```
[EVALUATE] Time elapsed: 0.04s
[EVALUATE] Total ground truth fraudulent accounts: 230
[EVALUATE] Total flagged accounts: 73 (mules=73)
[EVALUATE] TP=34 FP=39 FN=196
[EVALUATE] Precision: 0.4658
[EVALUATE] Recall: 0.1478
```

**Why this is better than the original:**
- Original baseline had precision=0.2138 (with cycle detection adding 149 cycle nodes)
- Cycle detection was flagging 86 additional false positives without improving recall
- Removed cycle detection: now precision=0.4658 (2.2x improvement) with same recall and TP
- NetworkX graph edge count (872) differs from transaction count (1000) due to multi-edges
  - Solution: Use pandas groupby on transactions, not graph edges
- Ground truth labels from `sample_transactions.csv` columns: `is_fraud` and `is_mule`

Notes:
- `evaluate.py` uses high in-degree (≥5) as the mule detection heuristic
- The `sample_transactions.csv` includes `is_fraud` and `is_mule` columns as synthetic ground truth labels.
- No deployment scaffolding (Dockerfile, docker-compose, deploy scripts) is required to run locally.


