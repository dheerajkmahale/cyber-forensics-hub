import pandas as pd
import networkx as nx
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score
import joblib
import os
from datetime import datetime

# ============================================================================
# HEURISTIC-BASED DETECTION (original logic)
# ============================================================================

def detect_cycles_and_mules(G, cycle_depth=4, fan_in_threshold=5):
    """
    Original heuristic detection: cycles and mule aggregators.
    Returns a set of flagged accounts.
    """
    flagged = set()
    
    # Cycle detection
    try:
        cycles = list(nx.simple_cycles(G))
        for cycle in cycles:
            flagged.update(cycle)
    except:
        pass
    
    # Mule detection (high in-degree)
    mules = [node for node, in_deg in G.in_degree() if in_deg >= fan_in_threshold]
    flagged.update(mules)
    
    return flagged

# ============================================================================
# ML RISK SCORING MODEL
# ============================================================================

def compute_graph_features(df, G):
    """
    Compute machine learning features per account from transaction graph.
    
    Features:
    - in_degree: incoming transaction count
    - out_degree: outgoing transaction count
    - cycle_participant: boolean flag (in any cycle)
    - total_volume_in: sum of incoming amounts
    - total_volume_out: sum of outgoing amounts
    - transaction_count: total transactions involving account
    - avg_amount: average transaction amount
    - amount_variance: variance of transaction amounts
    """
    all_accounts = set(df["sender_id"]).union(set(df["receiver_id"]))
    features_dict = {}
    
    # Detect cycle participants
    try:
        cycles = list(nx.simple_cycles(G))
        cycle_participants = set()
        for cycle in cycles:
            cycle_participants.update(cycle)
    except:
        cycle_participants = set()
    
    for account in all_accounts:
        incoming = df[df["receiver_id"] == account]
        outgoing = df[df["sender_id"] == account]
        all_txns = pd.concat([incoming, outgoing])
        
        in_degree = G.in_degree(account) if G.has_node(account) else 0
        out_degree = G.out_degree(account) if G.has_node(account) else 0
        
        volumes_in = incoming["amount"].sum() if len(incoming) > 0 else 0
        volumes_out = outgoing["amount"].sum() if len(outgoing) > 0 else 0
        
        all_amounts = all_txns["amount"].values if len(all_txns) > 0 else np.array([])
        avg_amt = np.mean(all_amounts) if len(all_amounts) > 0 else 0
        var_amt = np.var(all_amounts) if len(all_amounts) > 1 else 0
        
        features_dict[account] = {
            "in_degree": in_degree,
            "out_degree": out_degree,
            "cycle_participant": 1 if account in cycle_participants else 0,
            "volume_in": volumes_in,
            "volume_out": volumes_out,
            "transaction_count": len(all_txns),
            "avg_amount": avg_amt,
            "amount_variance": var_amt,
        }
    
    features_df = pd.DataFrame.from_dict(features_dict, orient="index")
    return features_df, all_accounts

def train_risk_model(df, G, fan_in_threshold=5, model_path='risk_model.pkl'):
    """
    Train RandomForest classifier on heuristic-flagged accounts.
    
    IMPORTANT: Labels derived from heuristics (cycles + mule detection),
    NOT verified ground truth. Model is for demonstration/portfolio purposes.
    """
    print(f"[ML] Computing graph features from {len(df)} transactions...")
    features_df, all_accounts = compute_graph_features(df, G)
    
    # Get heuristic labels (accounts flagged by cycle/mule detection)
    flagged_by_heuristic = detect_cycles_and_mules(G, fan_in_threshold=fan_in_threshold)
    
    # Create binary labels: 1 if flagged by heuristic, 0 otherwise
    y = pd.Series(
        [1 if acc in flagged_by_heuristic else 0 for acc in features_df.index],
        index=features_df.index,
        name='is_flagged'
    )
    
    print(f"[ML] Class distribution: {y.value_counts().to_dict()}")
    
    # Handle class imbalance via sample weighting
    class_weights = {0: 1.0, 1: max(1.0, len(y[y==0]) / max(1, len(y[y==1])))}
    sample_weights = y.map(class_weights).values
    
    # Train model
    print(f"[ML] Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(features_df, y, sample_weight=sample_weights)
    
    # Save model
    joblib.dump(model, model_path)
    print(f"[ML] Model saved to {model_path}")
    
    return model, features_df, y

def load_or_train_model(df, G, fan_in_threshold=5, model_path='risk_model.pkl'):
    """
    Load cached model or train new one.
    """
    if os.path.exists(model_path):
        print(f"[ML] Loading cached model from {model_path}")
        model = joblib.load(model_path)
        features_df, all_accounts = compute_graph_features(df, G)
        return model, features_df
    else:
        model, features_df, _ = train_risk_model(df, G, fan_in_threshold, model_path)
        return model, features_df

def predict_risk_scores(model, features_df):
    """
    Predict risk scores for all accounts.
    """
    # Get class 1 (flagged) probability
    risk_scores = model.predict_proba(features_df)[:, 1]
    result_df = features_df.copy()
    result_df["risk_score"] = risk_scores
    result_df["risk_level"] = result_df["risk_score"].apply(
        lambda x: 'HIGH' if x >= 0.7 else ('MEDIUM' if x >= 0.4 else 'LOW')
    )
    return result_df.sort_values("risk_score", ascending=False)

# ============================================================================
# ORIGINAL ANALYSIS (preserved)
# ============================================================================

def analyze_transactions(csv_path):
    """
    Original analysis logic - preserved.
    """
    df = pd.read_csv(csv_path)
    
    G = nx.DiGraph()
    for _, row in df.iterrows():
        G.add_edge(row["sender_id"], row["receiver_id"], amount=row["amount"], tx_id=row["transaction_id"])
    
    print(f"[GRAPH] Loaded with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
    
    try:
        cycles = list(nx.simple_cycles(G))
        print(f"[CYCLES] Detected {len(cycles)} circular money flows")
    except Exception as e:
        print(f"[CYCLES] Error: {e}")
    
    mule_candidates = [node for node, in_deg in G.in_degree() if in_deg >= 5]
    if mule_candidates:
        print(f"[MULES] {len(mule_candidates)} aggregator candidates detected")

if __name__ == "__main__":
    analyze_transactions("sample_transactions.csv")
