"""
Cyber Forensics Hub - Enhanced Streamlit Application v2.0
Fraud detection with ML risk scoring, advanced visualization, and reporting
"""

import streamlit as st
import pandas as pd
import networkx as nx
import plotly.graph_objects as go
import plotly.express as px
import sqlite3
from datetime import datetime
from pathlib import Path

# Import our modules
from analyze import analyze_transactions, compute_graph_features, detect_cycles_and_mules, predict_risk_scores
from ml_model import load_and_prepare_model, get_account_risk_breakdown
from export_reports import generate_csv_report, generate_pdf_report, export_all_flagged_csv
from assistant import DataAssistant, TerminalCommandParser

# ============================================================================
# PAGE CONFIG & STYLING
# ============================================================================

st.set_page_config(
    page_title="Cyber Forensics Hub v2.0",
    page_icon="🛡️",
    layout="wide"
)

st.markdown("""
<style>
/* ========== BASE STYLES ========== */
:root {
    --bg-primary: #0a0e27;
    --bg-elevated: #1a1f3a;
    --color-primary: #00ff88;
    --color-secondary: #00d9ff;
    --color-alert: #ff3333;
    --text-primary: #e8f5e9;
    --text-secondary: #a0aac0;
    --text-dimmed: #5a6680;
}

html, body {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    font-family: 'Segoe UI', 'Inter', sans-serif !important;
}

/* Subtle matrix background texture */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: repeating-linear-gradient(
        0deg,
        rgba(0, 255, 136, 0.03) 0px,
        rgba(0, 255, 136, 0.03) 1px,
        transparent 1px,
        transparent 2px
    );
    pointer-events: none;
    z-index: -1;
}

/* ========== STREAMLIT OVERRIDES ========== */
.stApp {
    background-color: var(--bg-primary) !important;
}

/* Tabs styling */
.stTabs [data-baseweb="tab-list"] {
    background-color: var(--bg-elevated) !important;
    border-bottom: 2px solid var(--text-dimmed) !important;
}

.stTabs [data-baseweb="tab"] {
    color: var(--text-secondary) !important;
    border: none !important;
    padding: 1rem 1.5rem !important;
}

.stTabs [aria-selected="true"] {
    color: var(--color-primary) !important;
    border-bottom: 3px solid var(--color-primary) !important;
}

/* Button styling */
.stButton > button {
    background: var(--color-primary) !important;
    color: var(--bg-primary) !important;
    border: none !important;
    font-weight: bold !important;
    text-transform: uppercase !important;
    border-radius: 4px !important;
    padding: 0.7rem 1.5rem !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 8px rgba(0, 255, 136, 0.2) !important;
}

.stButton > button:hover {
    background: #00ff88 !important;
    transform: scale(1.02) !important;
    box-shadow: 0 0 12px rgba(0, 255, 136, 0.4) !important;
}

.stButton > button:active {
    transform: scale(0.98) !important;
}

/* Secondary button variant (cyan) - use in selectbox/multiselect */
.stSelectbox [data-baseweb="select"] button:hover {
    border-color: var(--color-secondary) !important;
    box-shadow: 0 0 8px rgba(0, 217, 255, 0.3) !important;
}

/* Text input & selectbox styling */
.stTextInput > div > div > input,
.stSelectbox [data-baseweb="select"],
.stSlider [data-baseweb="slider"] {
    background-color: var(--bg-elevated) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--text-dimmed) !important;
    border-radius: 4px !important;
}

.stTextInput > div > div > input:focus,
.stSelectbox [data-baseweb="select"]:focus,
.stSlider:focus {
    border-color: var(--color-primary) !important;
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.3) !important;
}

/* Dataframe/Table styling */
.stDataFrame, .dataframe {
    background-color: var(--bg-elevated) !important;
    color: var(--text-primary) !important;
}

.stDataFrame table {
    border-collapse: collapse !important;
}

.stDataFrame th {
    background-color: var(--bg-primary) !important;
    color: var(--color-primary) !important;
    font-family: 'Courier New', monospace !important;
    font-weight: bold !important;
    border-bottom: 2px solid var(--color-primary) !important;
    padding: 0.8rem !important;
}

.stDataFrame td {
    border-bottom: 1px solid var(--text-dimmed) !important;
    padding: 0.6rem !important;
    font-family: 'Courier New', monospace !important;
}

.stDataFrame tr:nth-child(even) {
    background-color: rgba(26, 31, 58, 0.5) !important;
}

.stDataFrame tr:hover {
    background-color: rgba(0, 217, 255, 0.1) !important;
}

/* ========== CUSTOM CLASSES ========== */

/* Metric card - highlighted data boxes */
.metric-card {
    background: var(--bg-elevated) !important;
    border: 1px solid var(--color-primary) !important;
    border-radius: 6px !important;
    padding: 1.2rem !important;
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.1) !important;
}

.metric-card-header {
    font-size: 0.9rem !important;
    color: var(--text-secondary) !important;
    font-weight: 500 !important;
    margin-bottom: 0.5rem !important;
}

.metric-card-value {
    font-size: 2rem !important;
    font-family: 'Courier New', monospace !important;
    color: var(--color-primary) !important;
    font-weight: bold !important;
}

/* Alert card - flagged account highlighting */
.alert-card {
    background: var(--bg-elevated) !important;
    border-left: 4px solid var(--color-alert) !important;
    border-radius: 4px !important;
    padding: 1rem !important;
    box-shadow: 0 0 8px rgba(255, 51, 51, 0.2) !important;
}

.alert-card-title {
    color: var(--color-alert) !important;
    font-weight: bold !important;
    font-size: 1.1rem !important;
}

/* Terminal status line */
.terminal-status {
    background: var(--bg-elevated) !important;
    border: 1px solid var(--color-primary) !important;
    border-radius: 3px !important;
    padding: 0.8rem 1rem !important;
    font-family: 'Courier New', monospace !important;
    font-size: 0.9rem !important;
    color: var(--text-primary) !important;
    margin-bottom: 1rem !important;
    box-shadow: 0 0 6px rgba(0, 255, 136, 0.15) !important;
}

.terminal-status-active {
    color: var(--color-primary) !important;
    font-weight: bold !important;
}

.terminal-status-alert {
    color: var(--color-alert) !important;
    font-weight: bold !important;
}

.terminal-status-info {
    color: var(--color-secondary) !important;
}

/* Risk score styling */
.risk-high {
    color: var(--color-alert) !important;
    font-weight: bold !important;
    font-family: 'Courier New', monospace !important;
}

.risk-med {
    color: #ffaa00 !important;
    font-weight: bold !important;
    font-family: 'Courier New', monospace !important;
}

.risk-low {
    color: var(--color-primary) !important;
    font-weight: bold !important;
    font-family: 'Courier New', monospace !important;
}

/* Chart container styling */
.plotly-graph {
    border-radius: 6px !important;
    background: var(--bg-elevated) !important;
}

/* Expander (collapsible sections) */
.streamlit-expanderHeader {
    background: var(--bg-elevated) !important;
    color: var(--color-primary) !important;
    border: 1px solid var(--color-primary) !important;
}

.streamlit-expanderHeader:hover {
    background: var(--bg-primary) !important;
    box-shadow: 0 0 6px rgba(0, 255, 136, 0.2) !important;
}

/* Scrollbar styling */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--bg-primary) !important;
}

::-webkit-scrollbar-thumb {
    background: var(--color-primary) !important;
    border-radius: 4px !important;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--color-secondary) !important;
}

/* Heading styling - add glow */
h1, h2, h3 {
    color: var(--color-primary) !important;
}

h1 {
    font-size: 2rem !important;
    text-shadow: 0 0 10px rgba(0, 255, 136, 0.3) !important;
}

/* Link styling */
a {
    color: var(--color-secondary) !important;
    text-decoration: none !important;
}

a:hover {
    color: var(--color-primary) !important;
    text-decoration: underline !important;
}

/* ========== ANIMATIONS ========== */
@keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 6px rgba(0, 255, 136, 0.2); }
    50% { box-shadow: 0 0 12px rgba(0, 255, 136, 0.4); }
}

.pulse-glow {
    animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

.fade-in {
    animation: fade-in 0.3s ease-in-out;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
    .metric-card {
        padding: 0.8rem !important;
    }
    
    .metric-card-value {
        font-size: 1.5rem !important;
    }
    
    .terminal-status {
        font-size: 0.8rem !important;
        padding: 0.6rem 0.8rem !important;
    }
}
</style>
""", unsafe_allow_html=True)

# ============================================================================
# DATABASE SETUP (from original)
# ============================================================================

DB_PATH = "forensics_hub.db"

def init_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS detection_config (
            id INTEGER PRIMARY KEY, cycle_depth INTEGER DEFAULT 4,
            fan_in_threshold INTEGER DEFAULT 5, shell_chain_length INTEGER DEFAULT 3,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    """)
    
    cursor.execute("SELECT COUNT(*) FROM detection_config")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO detection_config (cycle_depth, fan_in_threshold, shell_chain_length) VALUES (4, 5, 3)"
        )
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trusted_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, account_ref TEXT UNIQUE NOT NULL,
            reason TEXT DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investigation_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, account_id TEXT NOT NULL,
            notes TEXT DEFAULT '', status TEXT DEFAULT 'none',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(account_id))
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL,
            details TEXT DEFAULT '', timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    """)
    
    conn.commit()
    conn.close()

def log_audit(action: str, details: str = ""):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO audit_logs (action, details) VALUES (?, ?)", (action, details))
    conn.commit()
    conn.close()

def get_detection_config():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT cycle_depth, fan_in_threshold, shell_chain_length FROM detection_config LIMIT 1")
    result = cursor.fetchone()
    conn.close()
    return {"cycle_depth": result[0] if result else 4, "fan_in_threshold": result[1] if result else 5, 
            "shell_chain_length": result[2] if result else 3}

def update_detection_config(cycle_depth, fan_in_threshold, shell_chain_length):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE detection_config SET cycle_depth = ?, fan_in_threshold = ?, shell_chain_length = ?",
                   (cycle_depth, fan_in_threshold, shell_chain_length))
    conn.commit()
    conn.close()
    log_audit("CONFIG_UPDATED", f"cycle_depth={cycle_depth}, fan_in={fan_in_threshold}, shell={shell_chain_length}")

def get_trusted_accounts():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT account_ref, reason FROM trusted_accounts ORDER BY account_ref")
    results = cursor.fetchall()
    conn.close()
    return [{"account": r[0], "reason": r[1]} for r in results]

def add_trusted_account(account_ref: str, reason: str = ""):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO trusted_accounts (account_ref, reason) VALUES (?, ?)", (account_ref, reason))
        conn.commit()
        log_audit("ACCOUNT_WHITELISTED", f"account={account_ref}")
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def remove_trusted_account(account_ref: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM trusted_accounts WHERE account_ref = ?", (account_ref,))
    conn.commit()
    conn.close()
    log_audit("ACCOUNT_UNWHITELISTED", f"account={account_ref}")

def get_investigation_notes(account_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT notes, status FROM investigation_notes WHERE account_id = ?", (account_id,))
    result = cursor.fetchone()
    conn.close()
    return {"notes": result[0], "status": result[1]} if result else {"notes": "", "status": "none"}

def update_investigation_notes(account_id: str, notes: str, status: str = "none"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO investigation_notes (account_id, notes, status) VALUES (?, ?, ?) ON CONFLICT(account_id) DO UPDATE SET notes = ?, status = ?",
        (account_id, notes, status, notes, status))
    conn.commit()
    conn.close()
    log_audit("NOTES_UPDATED", f"account={account_id}, status={status}")

# ============================================================================
# MAIN UI
# ============================================================================

init_database()

st.markdown("# 🛡️ CYBER FORENSICS HUB v2.0")
st.markdown("**Synthetic Data Fraud Detection & Investigation Platform**  \n*Heuristic + ML risk scoring on NetworkX graph analysis*")

if "analysis_result" not in st.session_state:
    st.session_state.analysis_result = None
if "uploaded_df" not in st.session_state:
    st.session_state.uploaded_df = None
if "model_result" not in st.session_state:
    st.session_state.model_result = None

# ================================================================
# PHASE C FEATURES 3 & 4: MULTILINGUAL ASSISTANT & TERMINAL PANEL
# ================================================================

# Initialize assistants
assistant = DataAssistant()
terminal_parser = TerminalCommandParser()

# Set context if data is loaded
if st.session_state.uploaded_df is not None and st.session_state.analysis_result:
    df = st.session_state.uploaded_df
    r = st.session_state.analysis_result
    assistant.set_context(df, r['graph'], r['cycles'], r['mules'])
    terminal_parser.set_context(df, r['graph'], r['cycles'], r['mules'])

# Sidebar panels
with st.sidebar:
    st.markdown("### 🤖 Data Assistant & Terminal")
    
    panel_tab1, panel_tab2 = st.tabs(["💬 Assistant", "⌨️ Terminal"])
    
    # Panel 1: Multilingual Assistant
    with panel_tab1:
        st.markdown("**Query your data in English or Hindi**")
        user_query = st.text_input(
            "Ask a question (e.g., 'show flagged accounts', 'what is smurfing'):",
            placeholder="Type your question...",
            label_visibility="collapsed"
        )
        
        if user_query:
            response = assistant.process_query(user_query)
            st.markdown(response)
        else:
            st.markdown(
                "**Example queries:**\n"
                "• Show flagged accounts\n"
                "• What is smurfing?\n"
                "• Account details ACC_001\n"
                "• Explain fraud ring\n\n"
                "*Hint: Data is queried in real-time from your loaded dataset*"
            )
    
    # Panel 2: Terminal Command Panel
    with panel_tab2:
        st.markdown("**Command-line interface to your data**")
        user_command = st.text_input(
            "Enter command (e.g., 'show flagged', 'account ACC_001'):",
            placeholder="$ ",
            label_visibility="collapsed"
        )
        
        if user_command:
            cmd_output = terminal_parser.process_command(user_command)
            st.code(cmd_output, language="text")
        else:
            st.markdown(
                "**Available commands:**\n"
                "```\n"
                "show flagged     # List flagged accounts\n"
                "show mules       # List mule accounts\n"
                "show cycles      # List fraud rings\n"
                "account ACC_001  # Account details\n"
                "help             # Show all commands\n"
                "```"
            )

tab1, tab2, tab3, tab4, tab5, tab6, tab7 = st.tabs([
    "📊 Analysis", "🤖 Risk Model", "🔧 Configuration", 
    "✅ Whitelist", "📋 Investigation", "💾 Export", "📝 Audit"
])

# ============================================================================
# TAB 1: ANALYSIS
# ============================================================================

with tab1:
    st.subheader("Transaction Analysis & Heuristic Detection")
    
    # Terminal Status Line - signature element
    if st.session_state.analysis_result:
        r = st.session_state.analysis_result
        status_text = f"► SYSTEM STATUS: [●●●●●] ACTIVE | {r['stats']['nodes']} ACCOUNTS | {r['stats']['edges']} TXN | CYCLES: {len(r['cycles'])} DETECTED"
        st.markdown(f'<div class="terminal-status"><span class="terminal-status-active">{status_text}</span></div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([3, 1])
    with col1:
        uploaded_file = st.file_uploader("Upload CSV (columns: transaction_id, sender_id, receiver_id, amount, timestamp)",
                                        type=["csv"])
        if uploaded_file is not None:
            try:
                df = pd.read_csv(uploaded_file)
                st.session_state.uploaded_df = df
                required = {'transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'}
                if not required.issubset(df.columns):
                    st.error(f"Missing columns: {required - set(df.columns)}")
                else:
                    st.success(f"✅ Loaded {len(df)} transactions, {len(set(df['sender_id']).union(set(df['receiver_id'])))} accounts")
                    
                    config = get_detection_config()
                    G = nx.DiGraph()
                    for _, row in df.iterrows():
                        G.add_edge(row['sender_id'], row['receiver_id'], amount=row['amount'], tx_id=row['transaction_id'])
                    
                    cycles = list(nx.simple_cycles(G))
                    mules = [n for n, d in G.in_degree() if d >= config['fan_in_threshold']]
                    
                    result = {
                        'cycles': cycles[:config['cycle_depth']], 'mules': mules,
                        'graph': G, 'df': df,
                        'stats': {'nodes': G.number_of_nodes(), 'edges': G.number_of_edges(), 
                                  'volume': df['amount'].sum()}
                    }
                    st.session_state.analysis_result = result
                    log_audit("ANALYSIS_RUN", f"rows={len(df)}, accounts={result['stats']['nodes']}")
            except Exception as e:
                st.error(f"Error: {e}")
    
    with col2:
        st.metric("Status", "Ready" if st.session_state.uploaded_df is not None else "Waiting")
    
    if st.session_state.analysis_result:
        r = st.session_state.analysis_result
        
        st.divider()
        cols = st.columns(4)
        cols[0].metric("Accounts", r['stats']['nodes'])
        cols[1].metric("Transactions", r['stats']['edges'])
        cols[2].metric("Total Volume", f"${r['stats']['volume']:,.0f}")
        cols[3].metric("Cycles", len(r['cycles']))
        
        st.subheader("🕸️ Network Graph")
        trusted_set = {t['account'] for t in get_trusted_accounts()}
        pos = nx.spring_layout(r['graph'], k=1.5, iterations=50, seed=42)
        edge_x, edge_y = [], []
        for e in r['graph'].edges():
            x0, y0 = pos[e[0]]
            x1, y1 = pos[e[1]]
            edge_x.extend([x0, x1, None])
            edge_y.extend([y0, y1, None])
        
        node_x, node_y, node_color, node_size, node_text = [], [], [], [], []
        for n in r['graph'].nodes():
            x, y = pos[n]
            node_x.append(x)
            node_y.append(y)
            node_text.append(f"<b>{n}</b><br>In:{r['graph'].in_degree(n)} Out:{r['graph'].out_degree(n)}")
            if n in r['mules']:
                node_color.append('red')
                node_size.append(25)
            elif n in trusted_set:
                node_color.append('green')
                node_size.append(15)
            else:
                node_color.append('blue')
                node_size.append(12)
        
        fig = go.Figure(data=[
            go.Scatter(x=edge_x, y=edge_y, mode='lines', line=dict(width=0.5, color='rgba(100,100,100,0.3)'), hoverinfo='none'),
            go.Scatter(x=node_x, y=node_y, mode='markers+text', text=[n.split('_')[-1] for n in r['graph'].nodes()],
                      textposition='top center', hovertext=node_text, hoverinfo='text',
                      marker=dict(size=node_size, color=node_color, opacity=0.8, line=dict(width=2, color='white')))
        ])
        fig.update_layout(title="Transaction Network", showlegend=False, hovermode='closest', 
                         margin=dict(b=0,l=0,r=0,t=30), height=600, plot_bgcolor='rgba(240,240,240,0.5)')
        st.plotly_chart(fig, use_container_width=True)
        
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("🔄 Cycles Detected")
            if r['cycles']:
                for i, c in enumerate(r['cycles'][:5]):
                    st.write(f"**{i+1}.** {' → '.join(c[:4])}{'...' if len(c)>4 else ''}")
            else:
                st.info("No circular flows")
        
        with col2:
            st.subheader("💰 Mule Accounts")
            if r['mules']:
                for m in r['mules'][:10]:
                    col_a, col_b = st.columns([3, 1])
                    with col_a:
                        st.write(f"**{m}** (In:{r['graph'].in_degree(m)})")
                    with col_b:
                        if st.button("Add", key=f"wl_{m}", use_container_width=True):
                            add_trusted_account(m, "Reviewed")
                            st.rerun()
            else:
                st.info("No mule accounts")
        
        # Transaction velocity
        st.divider()
        st.subheader("📈 Transaction Velocity Over Time")
        
        df_time = r['df'].copy()
        df_time['timestamp'] = pd.to_datetime(df_time['timestamp'])
        df_time = df_time.sort_values('timestamp')
        df_time['date'] = df_time['timestamp'].dt.date
        
        daily_vol = df_time.groupby('date')['amount'].agg(['sum', 'count']).reset_index()
        daily_vol.columns = ['date', 'volume', 'transaction_count']
        
        fig_vel = go.Figure()
        fig_vel.add_trace(go.Scatter(
            x=daily_vol['date'], y=daily_vol['volume'],
            name='Daily Volume', mode='lines+markers',
            fill='tozeroy', line=dict(color='#00ff41'),
            hovertemplate='<b>%{x}</b><br>Volume: $%{y:,.0f}<extra></extra>'
        ))
        fig_vel.update_layout(title="Daily Transaction Volume", xaxis_title="Date", yaxis_title="Volume ($)",
                            height=300, hovermode='x unified', plot_bgcolor='rgba(240,240,240,0.5)')
        st.plotly_chart(fig_vel, use_container_width=True)
        
        # ================================================================
        # PHASE C FEATURE 1: TIMELINE SCRUBBER
        # ================================================================
        st.divider()
        st.subheader("⏱️ Timeline Scrubber — Replay Fraud Pattern Formation")
        st.markdown("Drag the slider to filter transactions by date range and watch how fraud patterns emerge over time.")
        
        # Parse timestamps
        df_time_scrub = r['df'].copy()
        df_time_scrub['timestamp'] = pd.to_datetime(df_time_scrub['timestamp'])
        min_date = df_time_scrub['timestamp'].min()
        max_date = df_time_scrub['timestamp'].max()
        
        # Time range slider
        time_range = st.slider(
           "Select time range:",
           value=(min_date, max_date),
           min_value=min_date,
           max_value=max_date,
           step=pd.Timedelta(hours=6),
           format="MM/DD HH:mm"
        )
        
        # Filter data by time range
        df_filtered = df_time_scrub[(df_time_scrub['timestamp'] >= time_range[0]) & 
                                    (df_time_scrub['timestamp'] <= time_range[1])]
        
        # Rebuild graph for filtered data
        G_filtered = nx.DiGraph()
        for _, row in df_filtered.iterrows():
           G_filtered.add_edge(row['sender_id'], row['receiver_id'], amount=row['amount'])
        
        # Recalculate detections for filtered data
        cycles_filtered = list(nx.simple_cycles(G_filtered))
        mules_filtered = [n for n, d in G_filtered.in_degree() if d >= config['fan_in_threshold']]
        
        # Display filtered stats
        col_t1, col_t2, col_t3, col_t4, col_t5 = st.columns(5)
        col_t1.metric("Period", f"{len(df_filtered)} TXN")
        col_t2.metric("Accounts", G_filtered.number_of_nodes())
        col_t3.metric("Volume", f"${df_filtered['amount'].sum():,.0f}")
        col_t4.metric("Cycles", len(cycles_filtered))
        col_t5.metric("Mules", len(mules_filtered))
        
        # Timeline graph for filtered period
        trusted_set_filtered = {t['account'] for t in get_trusted_accounts()}
        pos_filtered = nx.spring_layout(G_filtered, k=1.5, iterations=50, seed=42)
        
        edge_x_f, edge_y_f = [], []
        for edge in G_filtered.edges():
           x0, y0 = pos_filtered[edge[0]]
           x1, y1 = pos_filtered[edge[1]]
           edge_x_f.extend([x0, x1, None])
           edge_y_f.extend([y0, y1, None])
        
        edge_trace_f = go.Scatter(x=edge_x_f, y=edge_y_f, mode='lines',
                                 line=dict(width=0.5, color='#5a6680'),
                                 hoverinfo='none', showlegend=False)
        
        node_x_f, node_y_f, node_color_f, node_size_f, node_label_f = [], [], [], [], []
        for node in G_filtered.nodes():
           x, y = pos_filtered[node]
           node_x_f.append(x)
           node_y_f.append(y)
           node_label_f.append(node)
            
           if node in trusted_set_filtered:
               node_color_f.append('#00d9ff')
               node_size_f.append(15)
           elif node in cycles_filtered or any(node in c for c in cycles_filtered):
               node_color_f.append('#00ff88')
               node_size_f.append(12)
           elif node in mules_filtered:
               node_color_f.append('#ff3333')
               node_size_f.append(14)
           else:
               node_color_f.append('#5a6680')
               node_size_f.append(8)
        
        node_trace_f = go.Scatter(x=node_x_f, y=node_y_f, mode='markers+text',
                                 marker=dict(size=node_size_f, color=node_color_f, line_width=2),
                                 text=node_label_f, textposition='top center', textfont=dict(color='#e8f5e9', size=8),
                                 hovertemplate='<b>%{text}</b><extra></extra>', showlegend=False)
        
        fig_timeline = go.Figure(data=[edge_trace_f, node_trace_f])
        fig_timeline.update_layout(
           title=f"Network Snapshot: {time_range[0].strftime('%Y-%m-%d %H:%M')} → {time_range[1].strftime('%Y-%m-%d %H:%M')}",
           showlegend=False, hovermode='closest', margin=dict(b=0, l=0, r=0, t=40),
           xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
           yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
           plot_bgcolor='#1a1f3a', paper_bgcolor='#0a0e27',
           height=400, font=dict(color='#e8f5e9')
        )
        st.plotly_chart(fig_timeline, use_container_width=True)
        
        log_audit("TIMELINE_SCRUB", f"range={time_range[0]} to {time_range[1]}, txn={len(df_filtered)}")
        
        # ================================================================
        # PHASE C FEATURE 2: GEO-SPATIAL MAP
        # ================================================================
        st.divider()
        st.subheader("🌍 Geo-Spatial Map — Transaction Routes Across Locations")
        st.markdown("**Note:** Synthetic account location data for demonstration purposes. Shows transaction flow between geographic regions.")
        
        # Check if geo-location columns exist
        geo_cols_required = {'sender_lat', 'sender_lon', 'receiver_lat', 'receiver_lon', 'sender_city', 'receiver_city'}
        if geo_cols_required.issubset(r['df'].columns):
           # Create aggregated routes (sender_city -> receiver_city)
           routes = r['df'].groupby(['sender_city', 'sender_lat', 'sender_lon', 'receiver_city', 'receiver_lat', 'receiver_lon']).agg({
               'amount': ['sum', 'count']
           }).reset_index()
           routes.columns = ['sender_city', 'sender_lat', 'sender_lon', 'receiver_city', 'receiver_lat', 'receiver_lon', 'total_amount', 'txn_count']
            
           # Build scattergeo map
           fig_geo = go.Figure()
            
           # Add transaction routes as lines
           for _, route in routes.iterrows():
               # Determine line color based on transaction count (proxy for suspicion)
               if route['txn_count'] > 5:
                   line_color = '#ff3333'  # Red - suspicious
                   line_width = 2
               else:
                   line_color = '#00ff88'  # Green - normal
                   line_width = 1
                
               fig_geo.add_trace(go.Scattergeo(
                   lon=[route['sender_lon'], route['receiver_lon']],
                   lat=[route['sender_lat'], route['receiver_lat']],
                   mode='lines',
                   line=dict(width=line_width, color=line_color),
                   hoverinfo='text',
                   hovertext=f"{route['sender_city']} → {route['receiver_city']}<br>Transactions: {route['txn_count']}<br>Volume: ${route['total_amount']:,.0f}",
                   showlegend=False,
                   opacity=0.6
               ))
            
           # Add sender locations
           sender_cities = routes[['sender_city', 'sender_lat', 'sender_lon']].drop_duplicates()
           fig_geo.add_trace(go.Scattergeo(
               lon=sender_cities['sender_lon'],
               lat=sender_cities['sender_lat'],
               mode='markers',
               marker=dict(size=10, color='#00d9ff', symbol='circle', line=dict(width=2, color='#00ff88')),
               text=sender_cities['sender_city'],
               hoverinfo='text',
               hovertext=sender_cities['sender_city'],
               name='Source Cities',
               showlegend=True
           ))
            
           # Add receiver locations
           receiver_cities = routes[['receiver_city', 'receiver_lat', 'receiver_lon']].drop_duplicates()
           fig_geo.add_trace(go.Scattergeo(
               lon=receiver_cities['receiver_lon'],
               lat=receiver_cities['receiver_lat'],
               mode='markers',
               marker=dict(size=10, color='#00ff88', symbol='square', line=dict(width=2, color='#00d9ff')),
               text=receiver_cities['receiver_city'],
               hoverinfo='text',
               hovertext=receiver_cities['receiver_city'],
               name='Destination Cities',
               showlegend=True
           ))
            
           fig_geo.update_layout(
               title="Global Transaction Routes (Synthetic Account Locations)",
               geo=dict(
                   scope='world',
                   projection_type='natural earth',
                   showland=True,
                   landcolor='#1a1f3a',
                   showocean=True,
                   oceancolor='#0a0e27',
                   coastcolor='#5a6680',
                   bgcolor='#0a0e27'
               ),
               height=500,
               hovermode='closest',
               margin=dict(b=0, l=0, r=0, t=40),
               font=dict(color='#e8f5e9'),
               paper_bgcolor='#0a0e27',
               plot_bgcolor='#0a0e27',
               legend=dict(bgcolor='rgba(26, 31, 58, 0.8)', bordercolor='#00ff88', borderwidth=1)
           )
            
           st.plotly_chart(fig_geo, use_container_width=True)
            
           # Summary stats
           col_g1, col_g2, col_g3, col_g4 = st.columns(4)
           col_g1.metric("Unique Source Cities", len(sender_cities))
           col_g2.metric("Unique Dest Cities", len(receiver_cities))
           col_g3.metric("Route Count", len(routes))
           col_g4.metric("High-Volume Routes", len(routes[routes['txn_count'] > 5]))
            
           log_audit("GEO_MAP_VIEW", f"routes={len(routes)}, cities={len(sender_cities) + len(receiver_cities)}")
        else:
           st.info("Geo-location data not available in current dataset.")

# ============================================================================
# TAB 2: RISK MODEL (PHASE A FEATURE 3)
# ============================================================================

with tab2:
    st.subheader("🤖 ML Risk Scoring Model")
    st.markdown("**Status:** Heuristic labels (cycles + mule detection) → RandomForest classifier  \n" +
               "**Note:** For portfolio/demonstration purposes — labels NOT verified ground truth")
    
    # Terminal Status Line
    if st.session_state.model_result:
        metrics = st.session_state.model_result['metrics']
        status_text = f"► RISK MODEL: ACTIVE | PRECISION: {metrics['precision']:.2f} | RECALL: {metrics['recall']:.2f} | F1: {metrics['f1']:.2f} | TRAINED"
        st.markdown(f'<div class="terminal-status"><span class="terminal-status-active">{status_text}</span></div>', unsafe_allow_html=True)
    
    if st.session_state.uploaded_df is not None and st.session_state.analysis_result:
        try:
            df = st.session_state.uploaded_df
            r = st.session_state.analysis_result
            G = r['graph']
            
            if st.button("🔄 Train/Load Model"):
                with st.spinner("Training RandomForest on graph features..."):
                    model, risk_df, metrics, y_true = load_and_prepare_model(df, G)
                    st.session_state.model_result = {
                        'model': model, 'risk_df': risk_df, 'metrics': metrics, 'y_true': y_true
                    }
                    st.success("✅ Model trained/loaded")
                    st.rerun()
            
            if st.session_state.model_result:
                mr = st.session_state.model_result
                metrics = mr['metrics']
                risk_df = mr['risk_df']
                
                # Metrics cards
                col1, col2, col3, col4 = st.columns(4)
                col1.metric("Precision", f"{metrics['precision']:.3f}")
                col2.metric("Recall", f"{metrics['recall']:.3f}")
                col3.metric("F1 Score", f"{metrics['f1']:.3f}")
                col4.metric("Accuracy", f"{metrics['accuracy']:.3f}")
                
                st.divider()
                
                # Confusion matrix
                st.subheader("Confusion Matrix")
                cm = metrics['confusion_matrix']
                cm_df = pd.DataFrame(cm, index=['Predicted Normal', 'Predicted Flagged'],
                                     columns=['Actual Normal', 'Actual Flagged'])
                st.dataframe(cm_df, use_container_width=True)
                
                # Feature importance
                st.subheader("Feature Importance")
                importance_df = pd.DataFrame({
                    'Feature': metrics['feature_names'],
                    'Importance': metrics['feature_importance']
                }).sort_values('Importance', ascending=True)
                
                fig_imp = px.barh(importance_df, x='Importance', y='Feature', title="Feature Contributions to Risk")
                st.plotly_chart(fig_imp, use_container_width=True)
                
                # Risk distribution
                st.subheader("Risk Score Distribution")
                fig_dist = px.histogram(risk_df, x='risk_score', nbins=20, 
                                       title="Account Risk Scores Distribution",
                                       labels={'risk_score': 'Risk Score', 'count': 'Number of Accounts'})
                st.plotly_chart(fig_dist, use_container_width=True)
                
                # Top flagged accounts
                st.subheader("Top Flagged Accounts")
                top_flagged = risk_df[risk_df['risk_level'].isin(['HIGH', 'MEDIUM'])].head(15)
                st.dataframe(top_flagged[['risk_score', 'risk_level', 'in_degree', 'out_degree', 'transaction_count']],
                            use_container_width=True)
        
        except Exception as e:
            st.error(f"ML Error: {e}")
    else:
        st.info("Please upload and analyze data in the Analysis tab first")

# ============================================================================
# TAB 3: CONFIGURATION
# ============================================================================

with tab3:
    st.subheader("Detection Thresholds")
    config = get_detection_config()
    
    col1, col2, col3 = st.columns(3)
    with col1:
        cycle_depth = st.slider("Cycle Depth", 1, 20, config['cycle_depth'])
    with col2:
        fan_in = st.slider("Fan-in Threshold", 2, 20, config['fan_in_threshold'])
    with col3:
        shell_chain = st.slider("Shell Chain Length", 1, 10, config['shell_chain_length'])
    
    if st.button("💾 Save Configuration"):
        update_detection_config(cycle_depth, fan_in, shell_chain)
        st.success("✅ Updated")
        st.rerun()

# ============================================================================
# TAB 4: WHITELIST
# ============================================================================

with tab4:
    st.subheader("Trusted Accounts Whitelist")
    
    col1, col2 = st.columns([2, 1])
    with col1:
        account_ref = st.text_input("Account Reference")
        reason = st.text_area("Reason")
        if st.button("➕ Add Account"):
            if account_ref.strip():
                if add_trusted_account(account_ref, reason):
                    st.success("✅ Added")
                else:
                    st.warning("Already exists")
                st.rerun()
    
    st.divider()
    trusted = get_trusted_accounts()
    if trusted:
        for item in trusted:
            col_a, col_b, col_c = st.columns([2, 2, 1])
            with col_a:
                st.write(f"**{item['account']}**")
            with col_b:
                st.caption(item['reason'] if item['reason'] else "(No reason)")
            with col_c:
                if st.button("❌", key=f"del_{item['account']}"):
                    remove_trusted_account(item['account'])
                    st.rerun()
    else:
        st.info("No trusted accounts")

# ============================================================================
# TAB 5: INVESTIGATION
# ============================================================================

with tab5:
    st.subheader("Investigation Notes")
    
    if st.session_state.analysis_result:
        r = st.session_state.analysis_result
        all_accs = sorted(list(r['graph'].nodes()))
        
        if all_accs:
            account = st.selectbox("Account", all_accs,
                                  format_func=lambda x: f"{x} (In:{r['graph'].in_degree(x)}, Out:{r['graph'].out_degree(x)})")
            
            notes_data = get_investigation_notes(account)
            notes = st.text_area("Notes", value=notes_data['notes'], height=150)
            status = st.radio("Status", ['none', 'under_review', 'verified'], 
                            index=['none', 'under_review', 'verified'].index(notes_data['status']))
            
            if st.button("💾 Save Notes"):
                update_investigation_notes(account, notes, status)
                st.success("✅ Saved")
                st.rerun()
            
            st.divider()
            incoming = r['df'][r['df']['receiver_id'] == account]
            outgoing = r['df'][r['df']['sender_id'] == account]
            
            col1, col2 = st.columns(2)
            with col1:
                st.write(f"**Incoming ({len(incoming)})**")
                if len(incoming) > 0:
                    st.dataframe(incoming[['transaction_id', 'sender_id', 'amount']].head(10), use_container_width=True)
            with col2:
                st.write(f"**Outgoing ({len(outgoing)})**")
                if len(outgoing) > 0:
                    st.dataframe(outgoing[['transaction_id', 'receiver_id', 'amount']].head(10), use_container_width=True)
    else:
        st.info("Upload data in Analysis tab first")

# ============================================================================
# TAB 6: EXPORT REPORTS (PHASE A FEATURE 4)
# ============================================================================

with tab6:
    st.subheader("📥 Export Investigation Reports")
    
    if st.session_state.uploaded_df is not None and st.session_state.model_result:
        df = st.session_state.uploaded_df
        mr = st.session_state.model_result
        risk_df = mr['risk_df']
        
        st.info("📋 Generate PDF/CSV reports for flagged accounts")
        
        # Export all flagged accounts as CSV
        if st.button("📊 Export All Flagged Accounts (CSV)"):
            csv_data = export_all_flagged_csv(risk_df, df)
            st.download_button(
                label="Download CSV",
                data=csv_data,
                file_name=f"flagged_accounts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
            st.success("✅ CSV ready for download")
        
        st.divider()
        st.subheader("Individual Account Reports")
        
        flagged_accs = risk_df[risk_df['risk_level'].isin(['HIGH', 'MEDIUM'])].index.tolist()
        if flagged_accs:
            selected_acc = st.selectbox("Select Account", flagged_accs[:20])
            
            if selected_acc:
                acc_risk = risk_df.loc[selected_acc]
                notes_data = get_investigation_notes(selected_acc)
                
                col1, col2, col3 = st.columns(3)
                col1.metric("Risk Score", f"{acc_risk['risk_score']:.3f}")
                col2.metric("Risk Level", acc_risk['risk_level'])
                col3.metric("Status", notes_data['status'])
                
                col_pdf, col_csv = st.columns(2)
                
                with col_pdf:
                    if st.button("📄 Generate PDF Report"):
                        pdf_data = generate_pdf_report(
                            selected_acc, df, acc_risk['risk_score'],
                            acc_risk['risk_level'], notes_data['notes'], notes_data['status']
                        )
                        st.download_button(
                            label="Download PDF",
                            data=pdf_data,
                            file_name=f"report_{selected_acc}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                            mime="application/pdf"
                        )
                
                with col_csv:
                    if st.button("📊 Generate CSV Report"):
                        csv_data = generate_csv_report(
                            selected_acc, df, acc_risk['risk_score'],
                            acc_risk['risk_level'], notes_data['notes'], notes_data['status']
                        )
                        st.download_button(
                            label="Download CSV",
                            data=csv_data,
                            file_name=f"report_{selected_acc}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                            mime="text/csv"
                        )
        else:
            st.info("No flagged accounts to export")
    else:
        st.info("Please load data and run Risk Model analysis first")

# ============================================================================
# TAB 7: AUDIT LOG
# ============================================================================

with tab7:
    st.subheader("Audit Log")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT timestamp, action, details FROM audit_logs ORDER BY id DESC LIMIT 100")
    logs = cursor.fetchall()
    conn.close()
    
    if logs:
        df_logs = pd.DataFrame(logs, columns=['Timestamp', 'Action', 'Details'])
        st.dataframe(df_logs, use_container_width=True)
    else:
        st.info("No events yet")

st.divider()
st.markdown("<small style='color:#666'>Cyber Forensics Hub v2.0 | Synthetic data for portfolio/education | " +
            "Heuristic + ML-based detection | NetworkX graph analysis</small>", unsafe_allow_html=True)
