import streamlit as st
import pandas as pd
import networkx as nx
import plotly.graph_objects as go
from datetime import datetime
from evaluate import evaluate

st.set_page_config(page_title="Cyber Forensics Hub - Minimal", layout="wide")

st.title("Cyber Forensics Hub — Minimal Streamlit Interface")

@st.cache_data
def load_data(path="sample_transactions.csv"):
    return pd.read_csv(path)

@st.cache_data
def build_graph(df):
    G = nx.DiGraph()
    for _, r in df.iterrows():
        G.add_edge(r['sender_id'], r['receiver_id'], amount=r['amount'], tx_id=r['transaction_id'])
    return G

df = load_data()
G = build_graph(df)

tabs = st.tabs(["Graph View", "Geo-Spatial Map", "Fraud Table", "Summary"])

with tabs[0]:
    st.header("Graph View")
    pos = nx.spring_layout(G, seed=42)
    edge_x, edge_y = [], []
    for e in G.edges():
        x0, y0 = pos[e[0]]
        x1, y1 = pos[e[1]]
        edge_x += [x0, x1, None]
        edge_y += [y0, y1, None]
    node_x, node_y, node_text = [], [], []
    for n in G.nodes():
        x, y = pos[n]
        node_x.append(x); node_y.append(y)
        node_text.append(n)
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=edge_x, y=edge_y, mode='lines', line=dict(width=0.5, color='#888')))
    fig.add_trace(go.Scatter(x=node_x, y=node_y, mode='markers+text', text=node_text, textposition='top center', marker=dict(size=8)))
    fig.update_layout(height=600, showlegend=False)
    st.plotly_chart(fig, width='stretch')

with tabs[1]:
    st.header("Geo-Spatial Map")
    geo_cols = {'sender_lat','sender_lon','receiver_lat','receiver_lon'}
    if geo_cols.issubset(df.columns):
        st.map(pd.DataFrame({ 'lat': pd.concat([df['sender_lat'], df['receiver_lat']]), 'lon': pd.concat([df['sender_lon'], df['receiver_lon']]) }))
    else:
        st.info("Geo-location columns not present in dataset.")

with tabs[2]:
    st.header("Fraud Table")
    # compute flagged accounts (mules only)
    mules = [n for n,d in G.in_degree() if d>=5]
    gt_accounts = set(df.loc[df['is_fraud']==1, 'sender_id']).union(set(df.loc[df['is_fraud']==1, 'receiver_id']))
    rows = []
    for acc in sorted(mules):
        rows.append({
            'account': acc,
            'in_degree': G.in_degree(acc),
            'out_degree': G.out_degree(acc),
            'is_fraud_ground_truth': 1 if acc in gt_accounts else 0
        })
    st.dataframe(pd.DataFrame(rows))

with tabs[3]:
    st.header("Summary")
    st.markdown("**Evaluation (heuristic detection vs dataset ground truth)**")
    precision, recall = evaluate()
    st.metric("Precision", f"{precision:.4f}")
    st.metric("Recall", f"{recall:.4f}")
    st.markdown("**AI assistant panel:** scripted placeholder (no external model calls).")

    st.markdown("Notes: Heuristic uses high in-degree (≥5) to identify mules. Cycle detection was removed (it added 86 false positives without improving recall). Metrics are produced by `evaluate.py` on synthetic ground truth labels from `sample_transactions.csv`.")
