# Cyber Forensics Hub - Improvement Summary

## Problem
The baseline heuristic was flagging 159 accounts (precision=0.2138) but the precision could be improved.

## Root Cause Analysis
- **Original baseline**: 159 flagged accounts (42 mules + 149 cycle nodes)
  - Precision: 0.2138, Recall: 0.1478, TP: 34
  - Cycle detection was adding 86 false positives without improving recall

- **Key discovery**: NetworkX DiGraph edge count (872) != transaction count (1000)
  - Multiple transactions between the same sender-receiver pair = multi-edges
  - NetworkX DiGraph treats multi-edges as a single edge (doesn't count)
  - Solution: Use pandas groupby() on transaction counts instead of graph edges

## Solution
**Removed ineffective cycle detection** from the heuristic. Only use high in-degree (≥5) to identify mules.

### New Baseline (Verified)
```
[EVALUATE] Time elapsed: 0.04s
[EVALUATE] Total ground truth fraudulent accounts: 230
[EVALUATE] Total flagged accounts: 73 (mules=73)
[EVALUATE] TP=34 FP=39 FN=196
[EVALUATE] Precision: 0.4658
[EVALUATE] Recall: 0.1478
```

### Results
- **Precision improvement**: 0.2138 → 0.4658 (2.18x better)
- **Same recall**: 0.1478 (unchanged)
- **Same TP**: 34 (unchanged)
- **FP reduction**: 125 → 39 (68% fewer false positives)

## Changes Made

### 1. evaluate.py
- Removed cycle detection logic
- Changed to transaction-based mule detection using pandas groupby()
- Removed networkx dependency from mule detection

### 2. README.md
- Updated verified output with new metrics
- Explained why the improvement was possible
- Documented the multi-edge issue and solution

### 3. app.py
- Removed `find_cycles_limited()` function
- Removed cycle detection from Fraud Table tab
- Updated notes explaining the improvement
- Changed Summary tab notes to reflect new heuristic

## Verification Commands

**Direct evaluation:**
```powershell
python evaluate.py
```
Output: Precision=0.4658, Recall=0.1478

**Dataset generation:**
```powershell
python generate_dataset.py   # creates sample_transactions.csv
```

**Streamlit app:**
```powershell
streamlit run app.py
```
Access at: http://localhost:8501 → Summary tab shows Precision=0.4658, Recall=0.1478

## Technical Details

### Why cycles were bad
- Each cycle detection added nodes to the flagged set
- Many detected cycles were in benign high-volume accounts (ACC_CYC_*, ACC_AMB_*)
- No corresponding TP increase (same 34 TP with or without cycles)
- Net result: 86 extra false positives

### Why transaction-based counts matter
- Graph edges don't preserve multi-edges: A→B (10 transactions) = 1 edge
- Mule accounts need transaction count, not unique receiver edges
- pandas groupby('receiver_id').size() counts all transactions correctly
- This gives 73 accounts with in-degree ≥ 5, not 42

## Next Steps (Optional)
1. Test threshold variations (t=3,4,5,6,7) to find recall improvement with acceptable FP
2. ML model comparison: RandomForest on graph features vs. heuristic
3. Chain detection: Detect sequential high-value transfers (layering)
4. Velocity analysis: Flag accounts with unusual activity spikes
