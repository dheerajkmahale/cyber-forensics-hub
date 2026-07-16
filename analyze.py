import pandas as pd
import networkx as nx

def analyze_transactions(csv_path):
    # Load dataset
    df = pd.read_csv(csv_path)
    
    # Create directed graph
    G = nx.DiGraph()
    for _, row in df.iterrows():
        G.add_edge(row['sender_id'], row['receiver_id'], amount=row['amount'], tx_id=row['transaction_id'])
        
    print(f"Graph loaded with {G.number_of_nodes()} nodes (accounts) and {G.number_of_edges()} edges (transactions).")
    
    # Simple Cycle detection (Circular Money Flow)
    try:
        cycles = list(nx.simple_cycles(G))
        print(f"Detected {len(cycles)} circular money flows:")
        for cycle in cycles:
            print(f"  Cycle: {' -> '.join(cycle)}")
    except Exception as e:
        print("Error during cycle detection:", e)
        
    # In-degree anomaly detection (Layering/Structuring pattern)
    # High in-degree (fan-in) can represent a mule aggregator account
    mule_candidates = [node for node, in_deg in G.in_degree() if in_deg >= 5]
    if mule_candidates:
        print(f"Suspected mule aggregator accounts (fan-in >= 5): {mule_candidates}")
    else:
        print("No extreme aggregator mule candidates detected.")

if __name__ == "__main__":
    analyze_transactions("sample_transactions.csv")
