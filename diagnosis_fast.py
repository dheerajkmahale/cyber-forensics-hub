#!/usr/bin/env python3
"""Ultra-fast heuristic evaluation without networkx cycle detection."""
import pandas as pd

# Load data
df = pd.read_csv('sample_transactions.csv')

# Extract truth
truth = set(df.loc[df['is_fraud'] == 1, 'sender_id']).union(set(df.loc[df['is_fraud'] == 1, 'receiver_id']))

# Build simple in-degree
in_deg = df.groupby('receiver_id').size().to_dict()
out_deg = df.groupby('sender_id').size().to_dict()

# Metrics function
def metrics(flagged, truth):
    tp = len(flagged & truth)
    fp = len(flagged - truth)
    fn = len(truth - flagged)
    p = tp / (tp + fp) if (tp + fp) else 0.0
    r = tp / (tp + fn) if (tp + fn) else 0.0
    return tp, fp, fn, p, r

# All accounts
all_accs = set(df['sender_id']).union(set(df['receiver_id']))

# Baseline: in_degree >= 5
print('=== BASELINE ===')
baseline_flagged = {acc for acc in all_accs if in_deg.get(acc, 0) >= 5}
tp, fp, fn, p, r = metrics(baseline_flagged, truth)
print(f'BASELINE flagged={len(baseline_flagged)} tp={tp} fp={fp} fn={fn} precision={p:.4f} recall={r:.4f}')

# Threshold sweep
print('\n=== THRESHOLD SWEEP ===')
for t in [3, 4, 5, 6, 7, 8, 10]:
    flagged = {acc for acc in all_accs if in_deg.get(acc, 0) >= t}
    tp, fp, fn, p, r = metrics(flagged, truth)
    print(f'THRESHOLD t={t} flagged={len(flagged)} tp={tp} fp={fp} fn={fn} precision={p:.4f} recall={r:.4f}')

print('\n=== Analysis complete ===')
