import pandas as pd
import networkx as nx


def build_graph(df):
    G = nx.DiGraph()
    for _, r in df.iterrows():
        G.add_edge(r['sender_id'], r['receiver_id'], amount=r['amount'], tx_id=r['transaction_id'], ts=r['timestamp'])
    return G


def eval_flagged(flagged, truth):
    tp = len(flagged & truth)
    fp = len(flagged - truth)
    fn = len(truth - flagged)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    return tp, fp, fn, precision, recall, f1


def maybe_flag(stats, threshold, chain_threshold, round_threshold, volume_threshold):
    flagged = set()
    for acc, s in stats.items():
        if s['cycle_member'] or s['in_degree'] >= threshold:
            flagged.add(acc)
        elif (
            s['in_degree'] <= 2 and s['out_degree'] <= 2 and s['tx_count'] >= 3 and
            s['chain_like'] >= chain_threshold and s['round_ratio'] >= round_threshold and
            s['total_vol'] >= volume_threshold
        ):
            flagged.add(acc)
    return flagged


df = pd.read_csv('sample_transactions.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'].str.replace('Z', ''))
G = build_graph(df)
truth = set(df.loc[df['is_fraud'] == 1, 'sender_id']).union(set(df.loc[df['is_fraud'] == 1, 'receiver_id']))
cycle_nodes = set(n for c in nx.simple_cycles(G) if len(c) <= 5 for n in c)

stats = {}
for acc in sorted(set(df['sender_id']).union(set(df['receiver_id']))):
    incoming = df[df['receiver_id'] == acc].sort_values('timestamp')
    outgoing = df[df['sender_id'] == acc].sort_values('timestamp')
    tx = pd.concat([incoming, outgoing], ignore_index=True).sort_values('timestamp')
    round_ratio = 0.0 if tx.empty else float((tx['amount'] % 1000 == 0).mean())
    total_vol = float(incoming['amount'].sum() + outgoing['amount'].sum())
    chain_like = 0
    if len(tx) >= 2:
        seq = tx['amount'].reset_index(drop=True)
        for i in range(1, min(8, len(seq))):
            prev = seq.iloc[i-1]
            curr = seq.iloc[i]
            if prev > 10000 and curr > 10000 and 0.6 <= (curr / prev) <= 1.0:
                chain_like += 1
    stats[acc] = {
        'in_degree': int(G.in_degree(acc)),
        'out_degree': int(G.out_degree(acc)),
        'tx_count': len(tx),
        'total_vol': total_vol,
        'round_ratio': round_ratio,
        'chain_like': chain_like,
        'cycle_member': int(acc in cycle_nodes),
    }

# Baseline sweep from original logic
print('BASELINE_TUNING')
for t in [3, 4, 5, 6, 7, 8, 10]:
    flagged = {acc for acc, s in stats.items() if s['cycle_member'] or s['in_degree'] >= t}
    tp, fp, fn, precision, recall, f1 = eval_flagged(flagged, truth)
    print(f't={t}: flagged={len(flagged)} tp={tp} fp={fp} fn={fn} precision={precision:.4f} recall={recall:.4f} f1={f1:.4f}')

print('\nCHAIN_AUGMENTED_TRIALS')
results = []
for t in [4, 5, 6, 7, 8, 9, 10]:
    for chain_threshold in [1, 2, 3]:
        for round_threshold in [0.2, 0.3, 0.4, 0.5, 0.6, 0.7]:
            for vol in [15000, 20000, 25000, 30000, 40000]:
                flagged = maybe_flag(stats, t, chain_threshold, round_threshold, vol)
                tp, fp, fn, precision, recall, f1 = eval_flagged(flagged, truth)
                results.append((f1, precision, recall, len(flagged), tp, fp, fn, t, chain_threshold, round_threshold, vol))

for item in sorted(results, reverse=True)[:12]:
    f1, precision, recall, flagged, tp, fp, fn, t, chain_threshold, round_threshold, vol = item
    print(f'f1={f1:.4f} precision={precision:.4f} recall={recall:.4f} flagged={flagged} tp={tp} fp={fp} fn={fn} threshold={t} chain={chain_threshold} round={round_threshold} vol={vol}')

print('\nBEST_RULE_BY_F1')
best = max(results, key=lambda x: x[0])
f1, precision, recall, flagged, tp, fp, fn, t, chain_threshold, round_threshold, vol = best
print(f'best=f1={f1:.4f} precision={precision:.4f} recall={recall:.4f} flagged={flagged} tp={tp} fp={fp} fn={fn} threshold={t} chain={chain_threshold} round={round_threshold} vol={vol}')
