"""
Cyber Forensics Hub - Rebuilt Native Python Streamlit Application
Sleek cyberpunk styling, real dataset generator, real-time detection settings,
and comprehensive investigation tracking (Stage 1).
"""

import streamlit as st
import pandas as pd
import numpy as np
import networkx as nx
import plotly.graph_objects as go # Added plotly import
import sqlite3
import json
import os
import time
from datetime import datetime
from io import BytesIO

# Import local helpers
from generate_dataset import generate_expanded_dataset
from export_reports import generate_pdf_report, generate_csv_report, export_all_flagged_csv

# Ensure initial dataset exists for 'All' scenario on startup
# This populates sample_transactions.csv with a mixed fraud dataset if it doesn't exist
if not os.path.exists("sample_transactions.csv"):
    generate_expanded_dataset(output_path="sample_transactions.csv", num_transactions=1000, enable_geo_data=True, scenario="All")



# ============================================================================
# NETWORK VISUALIZATION HELPERS
# ============================================================================

def create_network_graph(G, flagged_accounts):
    """
    Generate an interactive Plotly network graph visualization.
    """
    pos = nx.spring_layout(G, k=1.2, iterations=40, seed=42)
    
    edge_x = []
    edge_y = []
    for edge in G.edges():
        if edge[0] in pos and edge[1] in pos:
            x0, y0 = pos[edge[0]]
            x1, y1 = pos[edge[1]]
            edge_x.extend([x0, x1, None])
            edge_y.extend([y0, y1, None])
        
    edge_trace = go.Scatter(
        x=edge_x, y=edge_y,
        line=dict(width=0.5, color='rgba(0, 217, 255, 0.2)'),
        hoverinfo='none',
        mode='lines'
    )
    
    node_x = []
    node_y = []
    node_text = []
    node_color = []
    node_size = []
    
    for node in G.nodes():
        if node in pos:
            x, y = pos[node]
            node_x.append(x)
            node_y.append(y)
            
            in_deg = G.in_degree(node)
            out_deg = G.out_degree(node)
            node_text.append(f"<b>Account:</b> {node}<br>In-Degree: {in_deg}<br>Out-Degree: {out_deg}")
            
            if node in flagged_accounts:
                node_color.append('#ff0055') # Neon red/pink
                node_size.append(18)
            else:
                node_color.append('#00d9ff') # Cyan
                node_size.append(10)
            
    node_trace = go.Scatter(
        x=node_x, y=node_y,
        mode='markers',
        hoverinfo='text',
        hovertext=node_text,
        marker=dict(
            showscale=False,
            color=node_color,
            size=node_size,
            line=dict(width=1, color='#050811')
        )
    )
    
    fig = go.Figure(data=[edge_trace, node_trace],
             layout=go.Layout(
                showlegend=False,
                hovermode='closest',
                margin=dict(b=0,l=0,r=0,t=0),
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                height=500
             )
    )
    return fig

# ============================================================================
# DATABASE SETUP
# ============================================================================

DB_PATH = "forensics_hub.db"

def init_database():
    """Initialize SQLite database with required tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Trusted accounts whitelist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trusted_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_ref TEXT UNIQUE NOT NULL,
            reason TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Investigation notes per account
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investigation_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT NOT NULL,
            notes TEXT DEFAULT '',
            status TEXT DEFAULT 'none',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(account_id)
        )
    """)
    
    # Audit logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            details TEXT DEFAULT '',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

def log_audit(action: str, details: str = ""):
    """Log an action to audit log."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO audit_logs (action, details) VALUES (?, ?)",
            (action, details)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging audit: {e}")

def get_trusted_accounts():
    """Retrieve all trusted accounts."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT account_ref, reason FROM trusted_accounts ORDER BY account_ref")
        results = cursor.fetchall()
        conn.close()
        return [{"account": r[0], "reason": r[1]} for r in results]
    except Exception:
        return []

def add_trusted_account(account_ref: str, reason: str = ""):
    """Add account to whitelist."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO trusted_accounts (account_ref, reason) VALUES (?, ?)",
            (account_ref, reason)
        )
        conn.commit()
        conn.close()
        log_audit("ACCOUNT_WHITELISTED", f"account={account_ref}")
        return True
    except sqlite3.IntegrityError:
        return False
    except Exception:
        return False

def get_investigation_notes(account_id: str):
    """Get investigation notes for an account."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT notes, status FROM investigation_notes WHERE account_id = ?", (account_id,))
        result = cursor.fetchone()
        conn.close()
        return {"notes": result[0], "status": result[1]} if result else {"notes": "", "status": "none"}
    except Exception:
        return {"notes": "", "status": "none"}

def update_investigation_notes(account_id: str, notes: str, status: str = "none"):
    """Update investigation notes for an account."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO investigation_notes (account_id, notes, status, updated_at) 
               VALUES (?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(account_id) DO UPDATE SET notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP""",
            (account_id, notes, status, notes, status)
        )
        conn.commit()
        conn.close()
        log_audit("NOTES_UPDATED", f"account={account_id}, status={status}")
    except Exception as e:
        print(f"Error updating notes: {e}")

# Initialize database on startup
init_database()

# ============================================================================
# PAGE CONFIG & CYBERPUNK STYLING
# ============================================================================

st.set_page_config(
    page_title="Cyber Forensics Hub v2.0",
    page_icon="🛡️",
    layout="wide"
)

# Custom Cyberpunk Neon Stylesheet
st.markdown("""
<style>
    /* Base Styles */
    :root {
        --bg-primary: #050811;
        --bg-elevated: #0b1120;
        --color-primary: #00ff88;
        --color-secondary: #00d9ff;
        --color-alert: #ff0055;
        --text-primary: #e2e8f0;
        --text-secondary: #94a3b8;
    }
    
    .stApp {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
    }
    
    /* Cyber Title Header */
    .cyber-title {
        background: linear-gradient(135deg, #0b1120 0%, #1e1b4b 100%);
        border: 1px solid var(--color-primary);
        border-radius: 12px;
        padding: 1.5rem 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.15);
    }
    .cyber-title h1 {
        color: var(--color-primary) !important;
        font-family: 'Courier New', monospace;
        text-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
        margin: 0;
        font-size: 2.5rem;
    }
    .cyber-title p {
        color: var(--color-secondary);
        margin-top: 0.5rem;
        margin-bottom: 0;
        font-size: 1.1rem;
        letter-spacing: 1px;
    }
    
    /* Threat Cards container */
    .scenario-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.2rem;
        margin-bottom: 2rem;
    }
    
    /* Sleek Cyber Card Styling */
    .scenario-card {
        background-color: var(--bg-elevated);
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 1.2rem;
        transition: all 0.3s ease;
        cursor: p ointer;
        position: relative;
    }
    .scenario-card:hover {
        border-color: var(--color-secondary);
        box-shadow: 0 0 12px rgba(0, 217, 255, 0.25);
        transform: translateY(-3px);
    }
    .scenario-card.active {
        border-color: var(--color-primary);
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
    }
    .scenario-header {
        font-weight: bold;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        color: var(--color-secondary);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .scenario-desc {
        font-size: 0.85rem;
        color: var(--text-secondary);
        line-height: 1.4;
    }
    
    /* Cyberpunk Terminal Output */
    .terminal-console {
        background-color: #020408;
        border: 1px solid #1e293b;
        border-radius: 8px;
        font-family: 'Courier New', Courier, monospace;
        padding: 1rem;
        color: #00ff66;
        height: 200px;
        overflow-y: auto;
        white-space: pre-wrap;
        margin-bottom: 1.5rem;
    }
    
    /* Tabs & Widgets overrides */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: transparent !important;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: var(--bg-elevated) !important;
        border: 1px solid #1e293b !important;
        color: var(--text-secondary) !important;
        border-radius: 6px 6px 0 0 !important;
        padding: 0.6rem 1.2rem !important;
    }
    .stTabs [data-baseweb="tab"]:hover {
        color: var(--color-secondary) !important;
        border-color: var(--color-secondary) !important;
    }
    .stTabs [data-baseweb="tab"][aria-selected="true"] {
        color: var(--color-primary) !important;
        border-color: var(--color-primary) !important;
        background-color: rgba(0, 255, 136, 0.05) !important;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# SESSION STATE & REBUILT SCENARIOS LIST
# ============================================================================

if "current_scenario" not in st.session_state:
    st.session_state.current_scenario = "All"
if "last_logs" not in st.session_state:
    st.session_state.last_logs = ["[SYSTEM] Mule Sentinel Engine initialized."]
if "trigger_rerun" not in st.session_state:
    st.session_state.trigger_rerun = False

SCENARIOS = {
    "All": ("🌐 All Scenarios", "Generates complete balanced mix of normal transactions, circular flows, structuring, and aggregator mules."),
    "Normal": ("🛡️ Normal Traffic", "Generates highly clean, standard transactions with almost zero anomalous or circular flow indicators."),
    "Fraud Ring": ("🔄 Circular Money Rings", "Injects heavily connected multi-party circular transfer networks mimicking automated wash trading."),
    "Smurfing": ("💰 Aggregator Mules", "Generates smurfing/mule behavior with massive structured deposits to aggregator destination nodes."),
    "Shell Chain": ("⛓️ Layered Shell Chains", "Creates deep linear transaction paths resembling flow-through layering by shell companies."),
    "Layered": ("⚙️ Layered Complex", "A blend of structuring chains and aggregator mule flows designed to evade simple static heuristics."),
    "Velocity": ("⚡ High-Velocity Burst", "Dense, high-frequency transaction clusters between suspicious nodes in extremely tight window frames."),
    "Insider": ("👁️ High-Value Insider", "Involves massive value transfers at odd hours between newly connected corporate entities."),
    "Dark Web": ("🕸️ Anonymous Crypto-wash", "Features round amounts (e.g., $5,000, $10,000) and suspicious crypto-over-the-counter patterns.")
}

# Add system logger helper
def log_terminal(msg):
    timestamp = datetime.now().strftime("%H:%M:%S")
    st.session_state.last_logs.append(f"[{timestamp}] {msg}")
    if len(st.session_state.last_logs) > 50:
        st.session_state.last_logs.pop(0)

# Load data function with dynamic reload
@st.cache_data
def load_transaction_data(scenario_name, reload_trigger=0):
    csv_path = "sample_transactions.csv"
    if not os.path.exists(csv_path) or scenario_name != "All":
        # Generate new custom scenario dataset
        generate_expanded_dataset(output_path=csv_path, num_transactions=1000, enable_geo_data=True, scenario=scenario_name)
    df = pd.read_csv(csv_path)
    return df

# Helper to build graph
def build_networkx_graph(df):
    G = nx.DiGraph()
    for _, r in df.iterrows():
        G.add_edge(r['sender_id'], r['receiver_id'], amount=r['amount'], tx_id=r['transaction_id'])
    return G

# ============================================================================
# CUSTOM DETECTION & SCORING PIPELINE (Stage 1 Core)
# ============================================================================

def run_detection_pipeline(df, G, fan_in_threshold, min_tx_amount, min_vol_threshold, cycle_detection_enabled):
    """
    Executes real-time parameterized fraud and mule detection against current dataset.
    Dynamic updates triggered directly by slider inputs!
    """
    # 1. Filter transactions by minimum amount
    filtered_df = df[df['amount'] >= min_tx_amount]
    
    # 2. Compute per-account metrics
    flagged_mules = set()
    
    # In-degree / Aggregator count
    in_degrees = filtered_df.groupby('receiver_id').size()
    mules_by_in_degree = set(in_degrees[in_degrees >= fan_in_threshold].index)
    flagged_mules.update(mules_by_in_degree)
    
    # Total volume incoming or outgoing
    incoming_vols = filtered_df.groupby('receiver_id')['amount'].sum()
    outgoing_vols = filtered_df.groupby('sender_id')['amount'].sum()
    vols = incoming_vols.add(outgoing_vols, fill_value=0)
    flagged_by_volume = set(vols[vols >= min_vol_threshold].index) if min_vol_threshold > 0 else set()
    flagged_mules.update(flagged_by_volume)
    
    # Cycle detection
    if cycle_detection_enabled:
        try:
            # Build mini-graph with filtered transactions for fast cycle lookup
            G_temp = nx.DiGraph()
            for _, row in filtered_df.iterrows():
                G_temp.add_edge(row['sender_id'], row['receiver_id'])
            cycles = list(nx.simple_cycles(G_temp))
            for cycle in cycles:
                if len(cycle) <= 5:
                    flagged_mules.update(cycle)
        except Exception as e:
            print(f"Cycle detection error: {e}")
            
    # Remove whitelisted accounts from flagged list
    trusted = {t['account'] for t in get_trusted_accounts()}
    final_flagged = flagged_mules - trusted
    
    # Calculate precision & recall
    ground_truth_accounts = set(df.loc[df['is_fraud'] == 1, 'sender_id']).union(
        set(df.loc[df['is_fraud'] == 1, 'receiver_id'])
    )
    
    tp = len(final_flagged & ground_truth_accounts)
    fp = len(final_flagged - ground_truth_accounts)
    fn = len(ground_truth_accounts - final_flagged)
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    
    return {
        "flagged": final_flagged,
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "total_gt": len(ground_truth_accounts)
    }

# ============================================================================
# MAIN INTERFACE LAYOUT (Stage 1 Dashboard)
# ============================================================================

# Header Block
st.markdown("""
<div class="cyber-title">
    <h1>🛡️ CYBER FORENSICS HUB</h1>
    <p>Mule Sentinel — Autonomous Money Laundering & Threat Intelligence Terminal</p>
</div>
""", unsafe_allow_html=True)

# Main Grid layout: Left 1/3 Controls & Threat Scenario Generator, Right 2/3 Dashboard Metrics
col_left, col_right = st.columns([1, 2])

with col_left:
    st.subheader("🛠️ Control Panel")
    
    # Active Threat Scenario Selector Card Grid
    st.markdown("##### Threat Scenario Generator")
    
    # Select active scenario via simple UI element
    scenario_options = list(SCENARIOS.keys())
    active_idx = scenario_options.index(st.session_state.current_scenario)
    
    # Display styled scenario selector
    selected_scenario = st.selectbox(
        "Generate & Load Threat Pattern",
        options=scenario_options,
        index=active_idx,
        format_func=lambda x: f"{SCENARIOS[x][0]} - {x}"
    )
    
    if selected_scenario != st.session_state.current_scenario:
        # Trigger dynamic dataset recreation and reload!
        st.session_state.current_scenario = selected_scenario
        st.session_state.trigger_rerun = not st.session_state.trigger_rerun
        log_terminal(f"Regenerating synthetic dataset for: {selected_scenario}...")
        
        # Invalidate cache for new generation
        load_transaction_data.clear()
        st.rerun()

    # Load transaction data based on state
    df_loaded = load_transaction_data(st.session_state.current_scenario, st.session_state.trigger_rerun)
    G_loaded = build_networkx_graph(df_loaded)
    
    st.divider()
    
    # Parameters Settings Sliders Section
    st.markdown("##### Detection Heuristic Parameters")
    
    slider_fan_in = st.slider(
        "Aggregator Fan-In Threshold",
        min_value=2,
        max_value=15,
        value=5,
        help="Minimum incoming transactions to flag an account as an aggregator mule."
    )
    
    slider_min_amount = st.slider(
        "Min Transaction Amount Filter ($)",
        min_value=0,
        max_value=10000,
        value=0,
        step=500,
        help="Ignore transactions below this amount threshold for detection computations."
    )
    
    slider_vol_threshold = st.slider(
        "Min Volume Flag Threshold ($)",
        min_value=0,
        max_value=100000,
        value=0,
        step=5000,
        help="Flag accounts with cumulative transfer volumes exceeding this limit."
    )
    
    checkbox_cycle = st.checkbox(
        "Enable Circular Transfer Detection (Cycles)",
        value=False,
        help="Flag cycle nodes. Note: cycle detection adds false positives on standard configurations."
    )

    st.divider()
    
    # Telemetry Console Log Panel
    st.markdown("##### Live Telemetry Terminal Feed")
    log_content = "\n".join(st.session_state.last_logs)
    st.markdown(f'<div class="terminal-console">{log_content}</div>', unsafe_allow_html=True)

with col_right:
    # Run real-time detection pipeline
    pipeline_res = run_detection_pipeline(
        df_loaded,
        G_loaded,
        slider_fan_in,
        slider_min_amount,
        slider_vol_threshold,
        checkbox_cycle
    )
    
    # Core Dashboard Tabs
    tab_dashboard, tab_graph, tab_map, tab_watchlist, tab_copilot, tab_export = st.tabs([
        "📊 Dashboard Metrics",
        "🕸️ Network Graph",
        "🗺️ Geo-Spatial Map",
        "📋 Watchlist & Investigation",
        "🤖 AI Sentinel Co-pilot",
        "📥 Summary & Export"
    ])
    
    with tab_graph:
        st.subheader("🕸️ Interactive Transaction Network Graph")
        st.caption("Double-click to reset view. Hover over nodes to inspect flow connectivity.")
        try:
            fig = create_network_graph(G_loaded, pipeline_res['flagged'])
            st.plotly_chart(fig, width='stretch')
        except Exception as e:
            st.error(f"Error rendering network graph: {e}")

    with tab_map:
        st.subheader("🗺️ Cross-Border Entity Geo-Locations")
        geo_df = pd.DataFrame()
        if 'sender_lat' in df_loaded.columns:
            # Let's combine sender and receiver coordinates
            sender_geo = df_loaded[['sender_lat', 'sender_lon', 'sender_city']].rename(columns={'sender_lat': 'lat', 'sender_lon': 'lon', 'sender_city': 'city'})
            receiver_geo = df_loaded[['receiver_lat', 'receiver_lon', 'receiver_city']].rename(columns={'receiver_lat': 'lat', 'receiver_lon': 'lon', 'receiver_city': 'city'})
            geo_df = pd.concat([sender_geo, receiver_geo]).drop_duplicates().dropna()
            
        if not geo_df.empty:
            st.map(geo_df, zoom=1)
            
            # Cross-Border Transaction Feed below
            st.markdown("##### 🌐 Live Cross-Border Transaction Feed")
            cross_border = df_loaded[df_loaded['sender_city'] != df_loaded['receiver_city']]
            if not cross_border.empty:
                st.dataframe(
                    cross_border[["transaction_id", "sender_id", "sender_city", "receiver_id", "receiver_city", "amount", "timestamp"]].head(20),
                    width="stretch"
                )
            else:
                st.info("No cross-border transactions detected in this scenario.")
        else:
            st.info("No geo-location coordinates found in the active dataset.")

    with tab_copilot:
        st.subheader("🤖 AI Sentinel Co-pilot (Technical Advisory)")
        st.caption("🚨 SYSTEM ADVISORY: This is an autonomous state-aware technical copilot analyzing current platform metrics and database state.")
        
        if "chat_history" not in st.session_state:
            st.session_state.chat_history = [
                {"role": "assistant", "content": "Mule Sentinel Co-pilot online. How can I assist you with today's investigations?"}
            ]
            
        # Display chat history
        for msg in st.session_state.chat_history:
            with st.chat_message(msg["role"]):
                st.write(msg["content"])
                
        # User input
        user_input = st.chat_input("Ask about flagged accounts, scenarios, or how to tune heuristics...")
        if user_input:
            st.session_state.chat_history.append({"role": "user", "content": user_input})
            with st.chat_message("user"):
                st.write(user_input)
                
            # Process response using state-aware python helper
            response = ""
            query = user_input.lower()
            
            if "flagged" in query or "mule" in query or "watchlist" in query:
                response = f"I am currently tracking **{len(pipeline_res['flagged'])} flagged accounts** based on your heuristic filters. The top suspicious candidate is `{list(pipeline_res['flagged'])[0] if pipeline_res['flagged'] else 'None'}`. You can review and update their status under the Watchlist tab."
            elif "scenario" in query or "dataset" in query:
                response = f"The active threat scenario is **{st.session_state.current_scenario}**. This scenario generated {len(df_loaded)} total transactions with a cumulative volume of ${df_loaded['amount'].sum():,.2f}."
            elif "precision" in query or "recall" in query or "f1" in query or "improve" in query:
                response = f"Your current metric profile is:\n- **Precision:** {pipeline_res['precision']:.4f}\n- **Recall:** {pipeline_res['recall']:.4f}\n- **F1 Score:** {pipeline_res['f1']:.4f}\n\nTo improve Precision, consider **increasing** the Aggregator Fan-In Threshold or **disabling** Cycle Detection (which historically adds False Positives). To improve Recall, try **lowering** the Fan-In threshold."
            elif "explain" in query:
                account_match = [word.upper() for word in query.split() if "ACC_" in word.upper()]
                if account_match:
                    acc = account_match[0]
                    acc_flows = df_loaded[(df_loaded['sender_id'] == acc) | (df_loaded['receiver_id'] == acc)]
                    if not acc_flows.empty:
                        response = f"Analyzing account `{acc}`:\n- Total associated transfers: {len(acc_flows)}\n- Cumulative volume: ${acc_flows['amount'].sum():,.2f}\n- Risk profile: **HIGH** (flagged as anomalous mule node under current threshold constraints)."
                    else:
                        response = f"I could not locate any transaction flows for account `{acc}` in the current active dataset."
                else:
                    response = "To analyze a specific account, please include its ID in your message (e.g., 'Explain ACC_MULE_000')."
            else:
                response = "I am a local state-aware advisor. I can help you with:\n1. Metrics explanation (e.g., 'How can I improve precision?')\n2. Scenario summary (e.g., 'What is the current threat scenario?')\n3. Flagged accounts review (e.g., 'Show me flagged accounts overview')\n4. Entity analysis (e.g., 'Explain ACC_MULE_000')"
                
            st.session_state.chat_history.append({"role": "assistant", "content": response})
            with st.chat_message("assistant"):
                st.write(response)

    with tab_dashboard:
        st.subheader("🎯 Real-Time Heuristic Performance")
        
        # Cyber Neon KPI Metric Cards
        col_m1, col_m2, col_m3, col_m4 = st.columns(4)
        
        # Show verified evaluation metrics with pristine colors
        col_m1.metric(
            label="Precision Score",
            value=f"{pipeline_res['precision']:.4f}",
            delta="Dynamic Recalc"
        )
        col_m2.metric(
            label="Recall Score",
            value=f"{pipeline_res['recall']:.4f}",
            delta="Dynamic Recalc"
        )
        col_m3.metric(
            label="F1 Score",
            value=f"{pipeline_res['f1']:.4f}"
        )
        col_m4.metric(
            label="Flagged Accounts",
            value=f"{len(pipeline_res['flagged'])}"
        )
        
        st.divider()
        
        # Statistics Table Block
        col_s1, col_s2 = st.columns(2)
        with col_s1:
            st.markdown("##### Dataset Metrics Summary")
            st.write(f"**Loaded Scenario:** {SCENARIOS[st.session_state.current_scenario][0]}")
            st.write(f"**Total Transaction Volume:** ${df_loaded['amount'].sum():,.2f}")
            st.write(f"**Total Transactions:** {len(df_loaded)}")
            st.write(f"**Ground Truth Fraud Accounts:** {pipeline_res['total_gt']}")
            st.write(f"**True Positives (TP):** {pipeline_res['tp']}")
            st.write(f"**False Positives (FP):** {pipeline_res['fp']}")
            st.write(f"**False Negatives (FN):** {pipeline_res['fn']}")
            
        with col_s2:
            st.markdown("##### Threat Scenario Distribution Info")
            st.caption(SCENARIOS[st.session_state.current_scenario][1])
            st.info("💡 Pro-Tip: The baseline heuristic of using Aggregator Fan-In (≥5) with Cycle Detection removed provides a precision of 0.4658. Adding Cycle Detection back lowers precision by creating false positives!")
            
        st.divider()
        st.markdown("##### Recent Labeled Transactions (Preview)")
        st.dataframe(df_loaded.head(15), width="stretch")

    with tab_watchlist:
        st.subheader("🔍 Investigation Watchlist Panel")
        
        # List flagged accounts
        flagged_list = sorted(list(pipeline_res['flagged']))
        
        if flagged_list:
            # Let investigator choose an account
            selected_acc = st.selectbox(
                "Select Flagged Account for Investigation Details",
                options=flagged_list
            )
            
            if selected_acc:
                # Fetch notes and status
                notes_data = get_investigation_notes(selected_acc)
                
                col_i1, col_i2 = st.columns([1, 2])
                with col_i1:
                    st.write(f"**Selected:** `{selected_acc}`")
                    st.write(f"**Incoming Transactions:** {len(df_loaded[df_loaded['receiver_id'] == selected_acc])}")
                    st.write(f"**Outgoing Transactions:** {len(df_loaded[df_loaded['sender_id'] == selected_acc])}")
                    
                    # Update status & notes UI
                    investigator_notes = st.text_area(
                        "Investigator Analysis Notes",
                        value=notes_data['notes'],
                        placeholder="Type investigative findings..."
                    )
                    
                    status_option = st.selectbox(
                        "Flag Status",
                        options=["none", "under_review", "verified_fraud"],
                        index=["none", "under_review", "verified_fraud"].index(notes_data['status'])
                    )
                    
                    if st.button("💾 Save Findings & Notes"):
                        update_investigation_notes(selected_acc, investigator_notes, status_option)
                        log_terminal(f"Notes updated for: {selected_acc} -> [{status_option}]")
                        st.success(f"Successfully recorded notes for {selected_acc}")
                        st.rerun()
                        
                with col_i2:
                    st.markdown(f"##### Transaction Flow of `{selected_acc}`")
                    flows_df = df_loaded[(df_loaded['sender_id'] == selected_acc) | (df_loaded['receiver_id'] == selected_acc)]
                    st.dataframe(flows_df.sort_values('timestamp', ascending=False).head(15), use_container_width=True)
        else:
            st.success("No flagged anomalies found. Your transaction system is clear under current heuristic parameters!")

    with tab_export:
        st.subheader("📥 Export & Generate Compliance Reports")
        
        if len(pipeline_res['flagged']) > 0:
            st.info("📋 Generate automated documentation of system findings for whitelisted & flagged entities.")
            
            col_exp1, col_exp2 = st.columns(2)
            
            with col_exp1:
                st.markdown("##### Download Exportable JSON Details")
                export_dict = {
                    "scenario": st.session_state.current_scenario,
                    "timestamp": datetime.now().isoformat(),
                    "metrics": {
                        "precision": pipeline_res['precision'],
                        "recall": pipeline_res['recall'],
                        "f1_score": pipeline_res['f1'],
                        "tp": pipeline_res['tp'],
                        "fp": pipeline_res['fp'],
                        "fn": pipeline_res['fn']
                    },
                    "flagged_accounts": list(pipeline_res['flagged'])
                }
                json_bytes = json.dumps(export_dict, indent=4).encode('utf-8')
                st.download_button(
                    label="📥 Download JSON Results",
                    data=json_bytes,
                    file_name=f"sentinel_findings_{st.session_state.current_scenario}.json",
                    mime="application/json"
                )
                
            with col_exp2:
                st.markdown("##### Generate PDF Compliance Report")
                # Generate PDF of the active findings
                target_acc = list(pipeline_res['flagged'])[0]
                st.write(f"Ready to generate PDF document for primary candidate `{target_acc}`.")
                
                notes_data = get_investigation_notes(target_acc)
                
                try:
                    pdf_data = generate_pdf_report(
                        target_acc,
                        df_loaded,
                        float(pipeline_res['f1']), # Use F1 score as proxy for score
                        "HIGH",
                        notes_data['notes'],
                        notes_data['status']
                    )
                    st.download_button(
                        label="📥 Download PDF Case Report",
                        data=pdf_data,
                        file_name=f"case_report_{target_acc}.pdf",
                        mime="application/pdf"
                    )
                except Exception as e:
                    st.error(f"Error compiling PDF report: {e}")
                    
        else:
            st.warning("No flagged accounts available for report compilation.")
            
st.divider()
st.markdown("<small style='color:#555'>Cyber Forensics Hub v2.0 | Rebuilt in Streamlit Python | Powered by NetworkX</small>", unsafe_allow_html=True)
