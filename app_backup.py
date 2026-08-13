"""
Cyber Forensics Hub - Streamlit Application
Fraud detection and money-muling analysis using NetworkX graph analysis
"""

import streamlit as st
import pandas as pd
import networkx as nx
import plotly.graph_objects as go
from io import StringIO
import sqlite3
import os
from datetime import datetime
from pathlib import Path

# ============================================================================
# DATABASE SETUP
# ============================================================================

DB_PATH = "forensics_hub.db"

def init_database():
    """Initialize SQLite database with required tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Detection configuration table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS detection_config (
            id INTEGER PRIMARY KEY,
            cycle_depth INTEGER DEFAULT 4,
            fan_in_threshold INTEGER DEFAULT 5,
            shell_chain_length INTEGER DEFAULT 3,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Ensure default config exists
    cursor.execute("SELECT COUNT(*) FROM detection_config")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO detection_config (cycle_depth, fan_in_threshold, shell_chain_length)
            VALUES (4, 5, 3)
        """)
    
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
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO audit_logs (action, details) VALUES (?, ?)",
        (action, details)
    )
    conn.commit()
    conn.close()

def get_detection_config():
    """Retrieve detection configuration."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT cycle_depth, fan_in_threshold, shell_chain_length FROM detection_config LIMIT 1")
    result = cursor.fetchone()
    conn.close()
    return {
        "cycle_depth": result[0] if result else 4,
        "fan_in_threshold": result[1] if result else 5,
        "shell_chain_length": result[2] if result else 3,
    }

def update_detection_config(cycle_depth, fan_in_threshold, shell_chain_length):
    """Update detection configuration."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE detection_config SET cycle_depth = ?, fan_in_threshold = ?, shell_chain_length = ?, updated_at = CURRENT_TIMESTAMP",
        (cycle_depth, fan_in_threshold, shell_chain_length)
    )
    conn.commit()
    conn.close()
    log_audit("CONFIG_UPDATED", f"cycle_depth={cycle_depth}, fan_in_threshold={fan_in_threshold}, shell_chain_length={shell_chain_length}")

def get_trusted_accounts():
    """Retrieve all trusted accounts."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT account_ref, reason FROM trusted_accounts ORDER BY account_ref")
    results = cursor.fetchall()
    conn.close()
    return [{"account": r[0], "reason": r[1]} for r in results]

def add_trusted_account(account_ref: str, reason: str = ""):
    """Add account to whitelist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO trusted_accounts (account_ref, reason) VALUES (?, ?)",
            (account_ref, reason)
        )
        conn.commit()
        log_audit("ACCOUNT_WHITELISTED", f"account={account_ref}")
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def remove_trusted_account(account_ref: str):
    """Remove account from whitelist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM trusted_accounts WHERE account_ref = ?", (account_ref,))
    conn.commit()
    conn.close()
    log_audit("ACCOUNT_UNWHITELISTED", f"account={account_ref}")

def get_investigation_notes(account_id: str):
    """Get investigation notes for an account."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT notes, status FROM investigation_notes WHERE account_id = ?", (account_id,))
    result = cursor.fetchone()
    conn.close()
    return {"notes": result[0], "status": result[1]} if result else {"notes": "", "status": "none"}

def update_investigation_notes(account_id: str, notes: str, status: str = "none"):
    """Update investigation notes for an account."""
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

# ============================================================================
# FRAUD DETECTION LOGIC (from analyze.py)
# ============================================================================

def analyze_transactions(df, config):
    """
    Analyze transactions for fraud patterns.
    Reuses logic from analyze.py: cycle detection + mule detection
    """
    if df.empty:
        return {"cycles": [], "mules": [], "graph": None, "stats": {}}
    
    # Create directed graph
    G = nx.DiGraph()
    for _, row in df.iterrows():
        G.add_edge(row['sender_id'], row['receiver_id'], 
                  amount=row['amount'], tx_id=row['transaction_id'])
    
    stats = {
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "total_volume": df['amount'].sum()
    }
    
    # Cycle detection (circular money flows)
    cycles = []
    try:
        all_cycles = list(nx.simple_cycles(G))
        cycles = all_cycles[:config['cycle_depth']]  # Limit to top N cycles
    except:
        pass
    
    # Mule detection (high in-degree accounts)
    fan_in_threshold = config['fan_in_threshold']
    mules = [node for node, in_deg in G.in_degree() if in_deg >= fan_in_threshold]
    
    return {
        "cycles": cycles,
        "mules": mules,
        "graph": G,
        "stats": stats,
        "dataframe": df
    }

# ============================================================================
# VISUALIZATION
# ============================================================================

def create_network_graph(G, cycles, mules, trusted_accounts_set):
    """Create Plotly network visualization."""
    pos = nx.spring_layout(G, k=1.5, iterations=50, seed=42)
    
    edge_trace = go.Scatter(
        x=[], y=[],
        mode='lines',
        line=dict(width=0.5, color='rgba(100,100,100,0.3)'),
        hoverinfo='none'
    )
    
    for edge in G.edges():
        x0, y0 = pos[edge[0]]
        x1, y1 = pos[edge[1]]
        edge_trace['x'] += tuple([x0, x1, None])
        edge_trace['y'] += tuple([y0, y1, None])
    
    node_x, node_y, node_color, node_size, node_text = [], [], [], [], []
    
    for node in G.nodes():
        x, y = pos[node]
        node_x.append(x)
        node_y.append(y)
        node_text.append(f"<b>{node}</b><br>In-deg: {G.in_degree(node)}<br>Out-deg: {G.out_degree(node)}")
        
        # Color nodes by risk
        if node in mules:
            node_color.append('red')
            node_size.append(25)
        elif node in trusted_accounts_set:
            node_color.append('green')
            node_size.append(15)
        else:
            node_color.append('blue')
            node_size.append(15)
    
    node_trace = go.Scatter(
        x=node_x, y=node_y,
        mode='markers+text',
        text=[n.replace('ACC_', '') for n in G.nodes()],
        textposition="top center",
        hovertext=node_text,
        hoverinfo='text',
        marker=dict(
            size=node_size,
            color=node_color,
            opacity=0.8,
            line=dict(width=2, color='white')
        )
    )
    
    fig = go.Figure(data=[edge_trace, node_trace])
    fig.update_layout(
        title="Transaction Network Graph",
        showlegend=False,
        hovermode='closest',
        margin=dict(b=0, l=0, r=0, t=30),
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        plot_bgcolor='rgba(240, 240, 240, 0.5)',
        paper_bgcolor='white',
        height=600
    )
    
    return fig

# ============================================================================
# STREAMLIT PAGE CONFIG
# ============================================================================

st.set_page_config(
    page_title="Cyber Forensics Hub - Fraud Detection",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main {
        padding-top: 0rem;
    }
    .cyber-header {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 2rem;
        border-radius: 10px;
        color: #00ff41;
        font-family: 'Courier New', monospace;
        border: 2px solid #00ff41;
        margin-bottom: 2rem;
    }
    .cyber-header h1 {
        margin: 0;
        font-size: 2.5rem;
        text-shadow: 0 0 10px #00ff41;
    }
    .stat-box {
        background: #f0f0f0;
        padding: 1rem;
        border-radius: 5px;
        border-left: 4px solid #ff1744;
    }
    .success-box {
        background: #e8f5e9;
        padding: 1rem;
        border-radius: 5px;
        border-left: 4px solid #4caf50;
    }
    .warning-box {
        background: #fff3e0;
        padding: 1rem;
        border-radius: 5px;
        border-left: 4px solid #ff9800;
    }
</style>
""", unsafe_allow_html=True)

# Initialize database
init_database()

# ============================================================================
# SESSION STATE
# ============================================================================

if "analysis_result" not in st.session_state:
    st.session_state.analysis_result = None
if "uploaded_df" not in st.session_state:
    st.session_state.uploaded_df = None

# ============================================================================
# MAIN UI
# ============================================================================

st.markdown("""
<div class="cyber-header">
    <h1>🛡️ CYBER FORENSICS HUB</h1>
    <p><i>Mule Sentinel: Fraud Ring Detection & Money-Flow Analysis</i></p>
</div>
""", unsafe_allow_html=True)

# Create tabs
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Analysis",
    "🔧 Configuration",
    "✅ Trusted Accounts",
    "📋 Investigation",
    "📝 Audit Log"
])

# ============================================================================
# TAB 1: ANALYSIS
# ============================================================================

with tab1:
    st.header("Transaction Analysis & Fraud Detection")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("Upload CSV File")
        uploaded_file = st.file_uploader(
            "Choose a CSV file with columns: transaction_id, sender_id, receiver_id, amount, timestamp",
            type=["csv"]
        )
        
        if uploaded_file is not None:
            try:
                df = pd.read_csv(uploaded_file)
                st.session_state.uploaded_df = df
                
                # Validate required columns
                required = {'transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'}
                if not required.issubset(df.columns):
                    st.error(f"❌ Missing required columns. Expected: {required}")
                else:
                    st.success("✅ CSV loaded successfully")
                    st.write(f"**Rows:** {len(df)} | **Columns:** {len(df.columns)}")
                    
                    with st.expander("Preview data"):
                        st.dataframe(df.head(10), use_container_width=True)
                    
                    # Run analysis
                    config = get_detection_config()
                    result = analyze_transactions(df, config)
                    st.session_state.analysis_result = result
                    log_audit("ANALYSIS_RUN", f"rows={len(df)}")
                    
            except Exception as e:
                st.error(f"Error reading CSV: {e}")
    
    with col2:
        st.metric("Status", "Ready" if st.session_state.uploaded_df is not None else "Waiting")
    
    # Display results if available
    if st.session_state.analysis_result:
        result = st.session_state.analysis_result
        
        st.divider()
        st.subheader("📈 Analysis Results")
        
        # Statistics
        cols = st.columns(4)
        cols[0].metric("Total Accounts", result['stats']['total_nodes'])
        cols[1].metric("Total Transactions", result['stats']['total_edges'])
        cols[2].metric("Total Volume", f"${result['stats']['total_volume']:,.2f}")
        cols[3].metric("Cycles Detected", len(result['cycles']))
        
        st.divider()
        
        # Network Visualization
        st.subheader("🕸️ Transaction Network Graph")
        trusted_set = {t['account'] for t in get_trusted_accounts()}
        fig = create_network_graph(result['graph'], result['cycles'], result['mules'], trusted_set)
        st.plotly_chart(fig, use_container_width=True)
        
        st.divider()
        
        # Fraud Patterns
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("🔄 Circular Money Flows (Cycles)")
            if result['cycles']:
                for i, cycle in enumerate(result['cycles'], 1):
                    cycle_str = " → ".join(cycle) + " → " + cycle[0]
                    st.markdown(f"""
                    <div class="warning-box">
                    <b>Cycle {i}:</b> {cycle_str}
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.info("No circular money flows detected.")
        
        with col2:
            st.subheader("💰 Money Mule Accounts (Fan-in ≥ threshold)")
            if result['mules']:
                for mule in result['mules']:
                    in_degree = result['graph'].in_degree(mule)
                    out_degree = result['graph'].out_degree(mule)
                    col_a, col_b = st.columns([2, 1])
                    with col_a:
                        st.markdown(f"""
                        <div class="warning-box">
                        <b>{mule}</b> (In: {in_degree}, Out: {out_degree})
                        </div>
                        """, unsafe_allow_html=True)
                    with col_b:
                        if st.button("Add to Whitelist", key=f"wl_{mule}"):
                            if add_trusted_account(mule, "Manually reviewed"):
                                st.success(f"Added {mule} to whitelist")
                            else:
                                st.warning(f"{mule} already in whitelist")
                            st.rerun()
            else:
                st.info("No money mule accounts detected.")

# ============================================================================
# TAB 2: CONFIGURATION
# ============================================================================

with tab2:
    st.header("Detection Configuration")
    
    config = get_detection_config()
    
    st.markdown("""
    Adjust fraud detection thresholds. These parameters control:
    - **Cycle Depth**: Maximum number of cycles to report
    - **Fan-in Threshold**: Minimum incoming transactions to flag as mule
    - **Shell Chain Length**: Maximum chain depth for shell company detection
    """)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        cycle_depth = st.slider("Cycle Depth", min_value=1, max_value=20, value=config['cycle_depth'], help="Max cycles to detect")
    
    with col2:
        fan_in = st.slider("Fan-in Threshold", min_value=2, max_value=20, value=config['fan_in_threshold'], help="Min incoming txns for mule flag")
    
    with col3:
        shell_chain = st.slider("Shell Chain Length", min_value=1, max_value=10, value=config['shell_chain_length'], help="Max shell chain depth")
    
    if st.button("💾 Save Configuration", type="primary"):
        update_detection_config(cycle_depth, fan_in, shell_chain)
        st.success("✅ Configuration updated")
        st.rerun()
    
    st.divider()
    st.subheader("Current Settings")
    st.json(config)

# ============================================================================
# TAB 3: TRUSTED ACCOUNTS
# ============================================================================

with tab3:
    st.header("Trusted Accounts (Whitelist)")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("Add New Trusted Account")
        account_ref = st.text_input("Account Reference", placeholder="ACC_XXXX")
        reason = st.text_area("Reason for Whitelisting", placeholder="e.g., Verified partner, government agency")
        
        if st.button("➕ Add Account", type="primary"):
            if account_ref.strip():
                if add_trusted_account(account_ref, reason):
                    st.success(f"✅ Added {account_ref} to whitelist")
                else:
                    st.error(f"Account already in whitelist")
                st.rerun()
            else:
                st.warning("Please enter an account reference")
    
    st.divider()
    st.subheader("Current Whitelist")
    
    trusted = get_trusted_accounts()
    if trusted:
        for item in trusted:
            col_a, col_b, col_c = st.columns([2, 2, 1])
            with col_a:
                st.write(f"**{item['account']}**")
            with col_b:
                st.caption(item['reason'] if item['reason'] else "(No reason provided)")
            with col_c:
                if st.button("❌ Remove", key=f"del_{item['account']}"):
                    remove_trusted_account(item['account'])
                    st.success(f"Removed {item['account']}")
                    st.rerun()
    else:
        st.info("No trusted accounts in whitelist")

# ============================================================================
# TAB 4: INVESTIGATION
# ============================================================================

with tab4:
    st.header("Investigation Notes")
    
    if st.session_state.analysis_result:
        result = st.session_state.analysis_result
        all_accounts = sorted(list(result['graph'].nodes()))
        
        if all_accounts:
            account = st.selectbox("Select Account", all_accounts, format_func=lambda x: f"{x} (In: {result['graph'].in_degree(x)}, Out: {result['graph'].out_degree(x)})")
            
            notes_data = get_investigation_notes(account)
            
            notes = st.text_area(
                "Investigation Notes",
                value=notes_data['notes'],
                height=150,
                placeholder="Document your findings about this account..."
            )
            
            status = st.radio(
                "Status",
                options=['none', 'under_review', 'verified'],
                index=['none', 'under_review', 'verified'].index(notes_data['status'])
            )
            
            if st.button("💾 Save Notes", type="primary"):
                update_investigation_notes(account, notes, status)
                st.success("✅ Notes saved")
                st.rerun()
            
            # Transaction details
            st.divider()
            st.subheader("Account Transactions")
            
            df = result['dataframe']
            incoming = df[df['receiver_id'] == account]
            outgoing = df[df['sender_id'] == account]
            
            col1, col2 = st.columns(2)
            with col1:
                st.write(f"**Incoming Transactions ({len(incoming)})**")
                if len(incoming) > 0:
                    st.dataframe(incoming[['transaction_id', 'sender_id', 'amount', 'timestamp']], use_container_width=True)
                else:
                    st.info("No incoming transactions")
            
            with col2:
                st.write(f"**Outgoing Transactions ({len(outgoing)})**")
                if len(outgoing) > 0:
                    st.dataframe(outgoing[['transaction_id', 'receiver_id', 'amount', 'timestamp']], use_container_width=True)
                else:
                    st.info("No outgoing transactions")
        else:
            st.info("No accounts found. Upload data in the Analysis tab.")
    else:
        st.info("Please upload and analyze data first in the Analysis tab.")

# ============================================================================
# TAB 5: AUDIT LOG
# ============================================================================

with tab5:
    st.header("Audit Log")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT timestamp, action, details FROM audit_logs ORDER BY id DESC LIMIT 100")
    logs = cursor.fetchall()
    conn.close()
    
    if logs:
        df_logs = pd.DataFrame(logs, columns=['Timestamp', 'Action', 'Details'])
        st.dataframe(df_logs, use_container_width=True)
    else:
        st.info("No audit events yet")

# ============================================================================
# FOOTER
# ============================================================================

st.divider()
st.markdown("""
<div style="text-align: center; color: #666; font-size: 0.8rem;">
    <p>Cyber Forensics Hub v2.0 | Python + Streamlit | NetworkX Graph Analysis</p>
    <p>🛡️ Detecting money-muling, circular transfers, and structured layering patterns</p>
</div>
""", unsafe_allow_html=True)
