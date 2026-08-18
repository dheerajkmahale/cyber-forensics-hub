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

Verified evaluation output (run on the `Fraud Ring` scenario with default heuristic parameters: Aggregator Fan-In=5, Min Transaction Amount=0, Min Volume=0, Cycle Detection=off):

```
Precision: 0.7734
Recall: 1.0000
F1 Score: 0.8722
```

**Key Improvements and Features:**
- **Dynamic Scenario Generation**: The app can generate synthetic datasets tailored to specific threat scenarios (e.g., Fraud Ring, Smurfing, Normal Traffic), ensuring realistic and varied testing environments.
- **Real-Time Heuristic Tuning**: Interactive sliders allow real-time adjustment of detection parameters (Aggregator Fan-In, Min Transaction Amount, Min Volume Threshold, Cycle Detection), with immediate feedback on Precision, Recall, and F1-Score.
- **Interactive Network Graph**: Visualizes transaction networks with dynamic node coloring for flagged accounts.
- **Geo-Spatial Map**: Displays geo-locations of transactions and highlights cross-border flows.
- **AI Sentinel Co-pilot (State-Aware Stub)**: An interactive, Python-based AI assistant that provides contextual insights and advice by analyzing the current application state and detection results.
- **Investigation Watchlist & Reporting**: Comprehensive tools for tracking flagged accounts, adding investigator notes, and generating JSON/PDF compliance reports.
- **Python-Dominant Repository**: The project has been fully refactored to be Python-centric, removing all old TypeScript/React frontend code.

Notes:
- The `sample_transactions.csv` includes `is_fraud` and `is_mule` columns as synthetic ground truth labels, used for accurate metric calculation.
- The AI Co-pilot is a stub that provides state-aware responses based on current app data; it does not make external LLM API calls.
- No deployment scaffolding (Dockerfile, docker-compose, deploy scripts) is required to run locally.

