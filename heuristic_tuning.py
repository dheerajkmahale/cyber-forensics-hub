import pandas as pd
import networkx as nx


def build_graph(df):
    G = nx.DiGraph()
    for _, r in df.iterrows():
        G.add_edge(r['sender_id'], r['receiver_id'], amount=r['amount'], tx_id=r['transaction_id'], ts=r['timestamp'])
    return G


def evaluate_flag_set(flagged, truth):
    tp = len(flagged & truth)
    fp = len(flagged - truth)
    fn = len(truth - flagged)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    return tp, fp, fn, precision, recall


df = pd.read_csv('sample_transactions.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'].str.replace('Z', ''))
G = build_graph(df)
truth = set(df.loc[df['is_fraud'] == 1, 'sender_id']).union(set(df.loc[df['is_fraud'] == 1, 'receiver_id']))
cycle_nodes = set(n for c in nx.simple_cycles(G) if len(c) <= 5 for n in c)

account_stats = {}
for acc in sorted(set(df['sender_id']).union(set(df['receiver_id']))):
    incoming = df[df['receiver_id'] == acc].sort_values('timestamp')
    outgoing = df[df['sender_id'] == acc].sort_values('timestamp')
    tx = pd.concat([incoming, outgoing], ignore_index=True).sort_values('timestamp')
    round_ratio = 0.0 if tx.empty else float((tx['amount'] % 1000 == 0).mean())
    total_vol = float(incoming['amount'].sum() + outgoing['amount'].sum())
    velocity = 0
    if not tx.empty:
        times = tx['timestamp'].tolist()
        for t in times:
            win = ((tx['timestamp'] - t).abs().dt.total_seconds() <= 900).sum()
            velocity = max(velocity, int(win))
    chain_like = 0
    if len(tx) >= 2:
        seq = tx['amount'].reset_index(drop=True)
        for i in range(1, min(8, len(seq))):
            prev = seq.iloc[i - 1]
            curr = seq.iloc[i]
            if prev > 10000 and curr > 10000 and 0.6 <= (curr / prev) <= 1.0:
                chain_like += 1

    account_stats[acc] = {
        'in_degree': int(G.in_degree(acc)),
        'out_degree': int(G.out_degree(acc)),
        'cycle_member': int(acc in cycle_nodes),
        'total_vol': total_vol,
        'round_ratio': round_ratio,
        'velocity': velocity,
        'chain_like': chain_like,
        'tx_count': len(tx),
        'is_truth': int(acc in truth),
    }

print('BASELINE_HEURISTIC')
for t in [3, 4, 5, 6, 7, 8, 10]:
    flagged = {acc for acc, s in account_stats.items() if s['cycle_member'] or s['in_degree'] >= t}
    tp, fp, fn, precision, recall = evaluate_flag_set(flagged, truth)
    print(f't={t}: flagged={len(flagged)} tp={tp} fp={fp} fn={fn} precision={precision:.4f} recall={recall:.4f}')

print('\nCHAIN_SIGNAL_TRIALS')
for t in [4, 5, 6, 7, 8, 9, 10]:
    for rr in [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
        flagged = {
            acc for acc, s in account_stats.items()
            if s['cycle_member']
            or s['in_degree'] >= t
            or (s['chain_like'] >= 2 and (s['total_vol'] >= 25000 or s['velocity'] >= 3) and s['round_ratio'] >= rr)
        }
        tp, fp, fn, precision, recall = evaluate_flag_set(flagged, truth)
        print(f't={t} rr={rr:.1f}: flagged={len(flagged)} tp={tp} fp={fp} fn={fn} precision={precision:.4f} recall={recall:.4f}')

print('\nBEST_RULE_CANDIDATES')
# More specific chain signal focused on low degree fraudulent layering.
for t in [4, 5, 6, 7, 8, 9, 10]:
    for rr in [0.2, 0.3, 0.4, 0.5, 0.6, 0.7]:
        for vol in [20000, 25000, 30000, 40000]:
            flagged = {
                acc for acc, s in account_stats.items()
                if s['cycle_member']
                or s['in_degree'] >= t
                or (
                    s['in_degree'] <= 2 and s['out_degree'] <= 2
                    and s['chain_like'] >= 2
                    and s['total_vol'] >= vol
                    and s['round_ratio'] >= rr
                )
            }
            tp, fp, fn, precision, recall = evaluate_flag_set(flagged, truth)
            if precision >= 0.45 or recall >= 0.30:
                print(f't={t} rr={rr:.1f} vol={vol}: flagged={len(flagged)} tp={tp} fp={fp} fn={fn} precision={precision:.4f} recall={recall:.4f}')
