#!/usr/bin/env python3
"""Test heuristic variants - fast version."""
import pandas as pd

df = pd.read_csv('sample_transactions.csv')

truth = set(df.loc[df['is_fraud'] == 1, 'sender_id']).union(set(df.loc[df['is_fraud'] == 1, 'receiver_id']))

def metrics(flagged):
    tp = len(flagged & truth)
    fp = len(flagged - truth)
    fn = len(truth - flagged)
    p = tp / (tp + fp) if (tp + fp) else 0.0
    r = tp / (tp + fn) if (tp + fn) else 0.0
    return tp, fp, fn, p, r

# Test variants
print('=== VARIANTS ===')

# Just high in-degree
in_deg = df.groupby('receiver_id').size().to_dict()
all_accs = set(df['sender_id']).union(set(df['receiver_id']))
high_indeg = {acc for acc in all_accs if in_deg.get(acc, 0) >= 5}
tp, fp, fn, p, r = metrics(high_indeg)
print(f'HIGH_INDEG(>=5) flagged={len(high_indeg)} tp={tp} fp={fp} fn={fn} precision={p:.4f} recall={r:.4f}')

# Lower thresholds
for t in [3, 4]:
    flagged = {acc for acc in all_accs if in_deg.get(acc, 0) >= t}
    tp, fp, fn, p, r = metrics(flagged)
    print(f'HIGH_INDEG(>={t}) flagged={len(flagged)} tp={tp} fp={fp} fn={fn} precision={p:.4f} recall={r:.4f}')

print('\n=== Analysis complete ===')

