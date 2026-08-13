import pandas as pd
import networkx as nx
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


def build_graph(df):
    G = nx.DiGraph()
    for _, r in df.iterrows():
        G.add_edge(r['sender_id'], r['receiver_id'], amount=r['amount'], tx_id=r['transaction_id'], ts=r['timestamp'])
    return G


def get_cycle_nodes(G):
    return {n for c in nx.simple_cycles(G) if len(c) <= 5 for n in c}


def account_features(df, G):
    truth = set(df.loc[df['is_fraud'] == 1, 'sender_id']).union(set(df.loc[df['is_fraud'] == 1, 'receiver_id']))
    cycle_nodes = get_cycle_nodes(G)
    rows = []
    for acc in sorted(set(df['sender_id']).union(set(df['receiver_id']))):
        incoming = df[df['receiver_id'] == acc].sort_values('timestamp')
        outgoing = df[df['sender_id'] == acc].sort_values('timestamp')
        tx = pd.concat([incoming, outgoing], ignore_index=True).sort_values('timestamp')
        total_vol = float(incoming['amount'].sum() + outgoing['amount'].sum())
        round_ratio = 0.0 if tx.empty else float((tx['amount'] % 1000 == 0).mean())
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
        rows.append({
            'account': acc,
            'in_degree': int(G.in_degree(acc)),
            'out_degree': int(G.out_degree(acc)),
            'cycle_member': int(acc in cycle_nodes),
            'total_vol': total_vol,
            'round_ratio': round_ratio,
            'velocity': velocity,
            'chain_like': chain_like,
            'tx_count': len(tx),
            'is_truth': int(acc in truth),
        })
    return pd.DataFrame(rows), truth


def metrics(flagged, truth):
    tp = len(flagged & truth)
    fp = len(flagged - truth)
    fn = len(truth - flagged)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    return tp, fp, fn, precision, recall


def print_sample_cases(flagged, truth, df):
    fp = sorted(flagged - truth)[:5]
    fn = sorted(truth - flagged)[:5]
    print('SAMPLE_FP')
    for acc in fp:
        inc = df[df['receiver_id'] == acc].copy()
        out = df[df['sender_id'] == acc].copy()
        print(acc, 'in_deg=', int(inc.shape[0]), 'out_deg=', int(out.shape[0]), 'avg_in=', round(inc['amount'].mean() if not inc.empty else 0, 2), 'avg_out=', round(out['amount'].mean() if not out.empty else 0, 2))
        print('  incoming=', inc[['transaction_id', 'sender_id', 'receiver_id', 'amount', 'is_fraud', 'is_mule']].head(2).to_dict('records'))
        print('  outgoing=', out[['transaction_id', 'sender_id', 'receiver_id', 'amount', 'is_fraud', 'is_mule']].head(2).to_dict('records'))
    print('SAMPLE_FN')
    for acc in fn:
        inc = df[df['receiver_id'] == acc].copy()
        out = df[df['sender_id'] == acc].copy()
        print(acc, 'in_deg=', int(inc.shape[0]), 'out_deg=', int(out.shape[0]), 'avg_in=', round(inc['amount'].mean() if not inc.empty else 0, 2), 'avg_out=', round(out['amount'].mean() if not out.empty else 0, 2))
        print('  incoming=', inc[['transaction_id', 'sender_id', 'receiver_id', 'amount', 'is_fraud', 'is_mule']].head(2).to_dict('records'))
        print('  outgoing=', out[['transaction_id', 'sender_id', 'receiver_id', 'amount', 'is_fraud', 'is_mule']].head(2).to_dict('records'))


def run_threshold_sweep(stats, truth):
    print('THRESHOLD_SWEEP')
    for threshold in [3, 4, 5, 6, 7, 8, 10]:
        flagged = {row['account'] for _, row in stats.iterrows() if row['cycle_member'] or row['in_degree'] >= threshold}
        tp, fp, fn, precision, recall = metrics(flagged, truth)
        print(f't={threshold}: flagged={len(flagged)} tp={tp} fp={fp} fn={fn} precision={precision:.4f} recall={recall:.4f}')


def run_chain_rule_search(stats, truth):
    print('CHAIN_RULE_SEARCH')
    best = None
    for threshold in [4, 5, 6, 7, 8, 9, 10]:
        for round_threshold in [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
            for volume_threshold in [20000, 25000, 30000, 40000]:
                flagged = {
                    row['account'] for _, row in stats.iterrows()
                    if row['cycle_member']
                    or row['in_degree'] >= threshold
                    or (
                        row['in_degree'] <= 2 and row['out_degree'] <= 2 and row['tx_count'] >= 3
                        and row['chain_like'] >= 2 and row['round_ratio'] >= round_threshold
                        and row['total_vol'] >= volume_threshold
                    )
                }
                tp, fp, fn, precision, recall = metrics(flagged, truth)
                f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
                candidate = (f1, precision, recall, threshold, round_threshold, volume_threshold, len(flagged), tp, fp, fn)
                if best is None or candidate[0] > best[0]:
                    best = candidate
    print('BEST_CHAIN_RULE', best)


def run_ml_model(df, stats, truth):
    X = stats[[c for c in stats.columns if c not in ['account', 'is_truth']]].copy()
    y = stats['is_truth']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)
    model = RandomForestClassifier(n_estimators=400, max_depth=10, min_samples_leaf=2, random_state=42)
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    acc = accuracy_score(y_test, pred)
    prec = precision_score(y_test, pred, zero_division=0)
    rec = recall_score(y_test, pred, zero_division=0)
    f1 = f1_score(y_test, pred, zero_division=0)
    print('ML_MODEL')
    print(f'accuracy={acc:.6f} precision={prec:.6f} recall={rec:.6f} f1={f1:.6f}')
    print(pd.crosstab(y_test, pred, rownames=['true'], colnames=['pred']).to_string())
    print('TOP_INPUT_FEATURES')
    for name, val in sorted(zip(X.columns, model.feature_importances_), key=lambda x: x[1], reverse=True)[:8]:
        print(name, round(val, 6))


if __name__ == '__main__':
    df = pd.read_csv('sample_transactions.csv')
    df['timestamp'] = pd.to_datetime(df['timestamp'].str.replace('Z', ''))
    G = build_graph(df)
    stats, truth = account_features(df, G)

    baseline_flagged = {row['account'] for _, row in stats.iterrows() if row['cycle_member'] or row['in_degree'] >= 5}
    tp, fp, fn, precision, recall = metrics(baseline_flagged, truth)
    print('BASELINE_HEURISTIC')
    print(f'flagged={len(baseline_flagged)} tp={tp} fp={fp} fn={fn} precision={precision:.4f} recall={recall:.4f}')

    print_sample_cases(baseline_flagged, truth, df)
    run_threshold_sweep(stats, truth)
    run_chain_rule_search(stats, truth)
    run_ml_model(df, stats, truth)
