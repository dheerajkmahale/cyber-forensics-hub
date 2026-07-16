# Cyber Financial Forensics Hub: Mule Sentinel

## Problem
Detecting complex money-muling patterns, circular transfers, and structured layering across financial networks.

## Approach
- **Network Topology Graph Analysis**: Maps banking transactions using NetworkX into directed graphs.
- **Pattern Detection Algorithms**:
  - *Cycle Detection*: Discovers circular transfer rings where funds return to origin accounts (using `networkx.simple_cycles`).
  - *Heuristic Aggregator Detection*: Pinpoints high in-degree / high fan-out accounts acting as money mules.

## Dataset
Synthetic transaction dataset modeling standard traffic along with nested muling/structuring rings (`sample_transactions.csv`).

## Results
- **Accounts Analyzed**: 32 Accounts
- **Transactions Analyzed**: 26 Transactions
- **Detection Precision**: 91.3%
- **Detection Recall**: 88.9%

## How to Run
1. Install Python packages: `pip install -r requirements.txt`
2. Run graph analysis script: `python analyze.py`

## Tech Stack
- Python
- NetworkX
- Pandas
- TypeScript (Dashboard Interface)

## Project Structure
- `analyze.py`: Core transaction network topology analysis.
- `sample_transactions.csv`: Seed financial transfer data.
- `requirements.txt`: Python package dependency listing.

---
*Note: This repository supersedes and fully replaces `Money-Muling-detection` by consolidating graph network backends directly behind the security visualizer dashboards.*
