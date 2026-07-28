# Cyber Forensics Hub v2.0: AI-Powered Fraud Detection (Streamlit) 

## Overview
This is an advanced Streamlit application for detecting and investigating complex financial fraud patterns, including money muling, circular transfers, and structured layering. It leverages network graph analysis, machine learning risk scoring, and interactive visualizations to provide a comprehensive forensic platform.

## Features
- **Interactive Dashboards**: Powered by Streamlit for intuitive data exploration and analysis.
- **ML Risk Scoring**: Integrates a RandomForest classifier trained on graph-based features to identify suspicious accounts with precision, recall, and F1 metrics.
- **Heuristic Detection**: Detects money mule (high fan-in) accounts and circular transfer rings (fraud rings).
- **Advanced Visualizations**:
  - **Network Graph**: Dynamic, interactive graph of transaction flows with node highlighting for flagged accounts.
  - **Transaction Velocity**: Time-series charts to observe transaction volume over time.
  - **Timeline Scrubber (Phase C)**: Replay fraud pattern formation by filtering transactions over date ranges.
  - **Geo-Spatial Map (Phase C)**: Visualize transaction routes across simulated geographic locations.
- **Investigation Workflow**:
  - **Trusted Accounts Whitelist**: Manage accounts to exclude from flagging.
  - **Investigation Notes**: Add and track notes and status for specific accounts.
  - **Comprehensive Reporting**: Generate detailed PDF and CSV reports for individual accounts or all flagged accounts.
- **AI Assistant & Terminal (Phase C)**: Interact with data using natural language queries (English/Hindi) or command-line interface.
- **Audit Log**: Tracks all major user actions and configuration changes.
- **Responsive UI**: Custom dark theme optimized for a Security Operations Center (SOC) aesthetic.

## Dataset
Synthetic transaction data (`sample_transactions.csv`) simulating normal financial traffic alongside sophisticated money laundering activities.

## How to Run Locally
1.  **Clone the repository:**
    `git clone https://github.com/dheerajkmahale/cyber-forensics-hub.git`
    `cd cyber-forensics-hub`
2.  **Create and activate a Python virtual environment:**
    `python -m venv venv`
    `.\venv\Scripts\activate` (Windows)
    `source venv/bin/activate` (macOS/Linux)
3.  **Install dependencies:**
    `pip install -r requirements.txt`
4.  **Run the Streamlit application:**
    `streamlit run app.py`
    The application will open in your browser at `http://localhost:8501`.

## Tech Stack
- Python 3.10+
- Streamlit
- Pandas (Data manipulation)
- NetworkX (Graph analysis)
- Plotly (Interactive visualizations)
- Scikit-learn (Machine Learning)
- SQLite3 (Local persistence)
- fpdf2 (PDF generation)

## Project Structure
- `app.py`: Main Streamlit application, UI layout, and integration of all features.
- `analyze.py`: Core graph analysis logic, feature engineering, and heuristic detection.
- `ml_model.py`: Machine learning model loading, training, prediction, and metric calculation.
- `export_reports.py`: Functions for generating PDF and CSV investigation reports.
- `assistant.py`: Logic for the AI data assistant and terminal command parser.
- `generate_dataset.py`: Script to generate synthetic transaction data (for development/testing).
- `generate_geo_data.py`: Script to add synthetic geo-location data to transactions.
- `requirements.txt`: Python package dependencies.
- `.streamlit/config.toml`: Streamlit application configuration (e.g., theme).
- `forensics_hub.db`: SQLite database for local persistence (config, trusted accounts, notes, audit log).
- `sample_transactions.csv`: Default synthetic transaction dataset.

---
*Developed for portfolio demonstration and educational purposes.*
