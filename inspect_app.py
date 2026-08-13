import pandas as pd
import networkx as nx
from evaluate import evaluate

def find_cycles_limited(G, max_length=5):
    cycles = set()
    def dfs(start, current, visited):
        if len(visited) > max_length:
            return
        for nbr in G.successors(current):
            if nbr == start and len(visited) >= 2:
                cycles.add(tuple(visited))
            elif nbr not in visited and nbr > start:
                dfs(start, nbr, visited + [nbr])
    nodes = list(G.nodes())
    for n in nodes:
        dfs(n, n, [n])
    return [list(c) for c in cycles]

df = pd.read_csv('sample_transactions.csv')
G = nx.DiGraph()
for _, r in df.iterrows():
    G.add_edge(r['sender_id'], r['receiver_id'], amount=r['amount'], tx_id=r['transaction_id'])

print(f"GRAPH: nodes={G.number_of_nodes()} edges={G.number_of_edges()}")
mules = [n for n,d in G.in_degree() if d>=5]
cycles = find_cycles_limited(G, max_length=5)
cycle_nodes = set(n for c in cycles for n in c)
flagged = set(mules) | cycle_nodes
gt_accounts = set(df.loc[df['is_fraud']==1, 'sender_id']).union(set(df.loc[df['is_fraud']==1, 'receiver_id']))

print(f"MULES detected: {len(mules)} sample: {mules[:10]}")
print(f"Cycles found (<=5): {len(cycles)} sample cycles: {cycles[:5]}")
print(f"Flagged accounts total: {len(flagged)} sample: {sorted(list(flagged))[:10]}")
print(f"Ground-truth fraudulent accounts: {len(gt_accounts)} sample: {sorted(list(gt_accounts))[:10]}")

prec, rec = evaluate()
print(f"evaluate() returned: precision={prec:.4f}, recall={rec:.4f}")
