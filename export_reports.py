"""
Export Reports Helper
Generate PDF and CSV investigation reports per account
"""

import pandas as pd
from io import BytesIO
import sqlite3
from datetime import datetime
from fpdf import FPDF

def generate_csv_report(account_id, df, risk_score, risk_level, notes, status):
    """
    Generate CSV investigation report for account.
    Returns bytes for download.
    """
    incoming = df[df["receiver_id"] == account_id]
    outgoing = df[df["sender_id"] == account_id]
    
    # Compile report data
    report_data = {
        "Report Generated": datetime.now().isoformat(),
        "Account ID": account_id,
        "Risk Score": round(risk_score, 3),
        "Risk Level": risk_level,
        "Investigation Status": status,
        "Investigator Notes": notes if notes else "(No notes)",
        "": "",
        "INCOMING TRANSACTIONS": len(incoming),
        "Total Incoming Volume": f"${incoming["amount"].sum():.2f}" if len(incoming) > 0 else "$0.00",
        "Average Incoming Amount": f"${incoming["amount"].mean():.2f}" if len(incoming) > 0 else "$0.00",
        "": "",
        "OUTGOING TRANSACTIONS": len(outgoing),
        "Total Outgoing Volume": f"${outgoing["amount"].sum():.2f}" if len(outgoing) > 0 else "$0.00",
        "Average Outgoing Amount": f"${outgoing["amount"].mean():.2f}" if len(outgoing) > 0 else "$0.00",
    }
    
    # Create CSV
    report_df = pd.DataFrame(list(report_data.items()), columns=["Field", "Value"])
    csv_buffer = BytesIO()
    report_df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    
    return csv_buffer.getvalue()

def generate_pdf_report(account_id, df, risk_score, risk_level, notes, status):
    """
    Generate PDF investigation report for account.
    Returns bytes for download.
    """
    incoming = df[df["receiver_id"] == account_id]
    outgoing = df[df["sender_id"] == account_id]
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=10)
    
    # Title
    pdf.set_font("Helvetica", "B", size=14)
    pdf.cell(0, 10, f"Investigation Report: {account_id}", ln=True)
    
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 5, f"Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}", ln=True)
    pdf.ln(5)
    
    # Risk summary
    pdf.set_font("Helvetica", "B", size=11)
    pdf.cell(0, 8, "RISK ASSESSMENT", ln=True)
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 6, f"Risk Score: {risk_score:.3f}", ln=True)
    pdf.cell(0, 6, f"Risk Level: {risk_level}", ln=True)
    pdf.cell(0, 6, f"Status: {status}", ln=True)
    pdf.ln(3)
    
    # Investigation notes
    if notes:
        pdf.set_font("Helvetica", "B", size=11)
        pdf.cell(0, 8, "INVESTIGATOR NOTES", ln=True)
        pdf.set_font("Helvetica", size=9)
        pdf.multi_cell(0, 4, notes)
        pdf.ln(3)
    
    # Incoming transactions
    pdf.set_font("Helvetica", "B", size=11)
    pdf.cell(0, 8, f"INCOMING TRANSACTIONS ({len(incoming)})", ln=True)
    pdf.set_font("Helvetica", size=9)
    pdf.cell(0, 6, f"Total Volume: ${incoming["amount"].sum():.2f}", ln=True)
    pdf.cell(0, 6, f"Avg Amount: ${incoming["amount"].mean():.2f}" if len(incoming) > 0 else "N/A", ln=True)
    
    if len(incoming) > 0:
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", size=8)
        pdf.cell(40, 5, "TX ID")
        pdf.cell(40, 5, "From")
        pdf.cell(30, 5, "Amount")
        pdf.cell(30, 5, "Timestamp")
        pdf.ln()
        
        pdf.set_font("Helvetica", size=8)
        for _, row in incoming.head(10).iterrows():
            pdf.cell(40, 4, str(row["transaction_id"])[:15])
            pdf.cell(40, 4, str(row["sender_id"])[:15])
            pdf.cell(30, 4, f"${row["amount"]:.2f}")
            pdf.cell(30, 4, str(row["timestamp"])[:19])
            pdf.ln()
    
    pdf.ln(3)
    
    # Outgoing transactions
    pdf.set_font("Helvetica", "B", size=11)
    pdf.cell(0, 8, f"OUTGOING TRANSACTIONS ({len(outgoing)})", ln=True)
    pdf.set_font("Helvetica", size=9)
    pdf.cell(0, 6, f"Total Volume: ${outgoing["amount"].sum():.2f}", ln=True)
    pdf.cell(0, 6, f"Avg Amount: ${outgoing["amount"].mean():.2f}" if len(outgoing) > 0 else "N/A", ln=True)
    
    if len(outgoing) > 0:
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", size=8)
        pdf.cell(40, 5, "TX ID")
        pdf.cell(40, 5, "To")
        pdf.cell(30, 5, "Amount")
        pdf.cell(30, 5, "Timestamp")
        pdf.ln()
        
        pdf.set_font("Helvetica", size=8)
        for _, row in outgoing.head(10).iterrows():
            pdf.cell(40, 4, str(row["transaction_id"])[:15])
            pdf.cell(40, 4, str(row["receiver_id"])[:15])
            pdf.cell(30, 4, f"${row["amount"]:.2f}")
            pdf.cell(30, 4, str(row["timestamp"])[:19])
            pdf.ln()
    
    # Footer
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", size=8)
    pdf.cell(0, 5, "This report is based on synthetic transaction data for portfolio demonstration purposes.", ln=True)
    
    return pdf.output(dest="S")

def export_all_flagged_csv(risk_df, df):
    """
    Export CSV with all flagged accounts and their details.
    """
    flagged = risk_df[risk_df["risk_level"].isin(["HIGH", "MEDIUM"])].copy()
    
    details = []
    for acc_id in flagged.index:
        incoming = df[df["receiver_id"] == acc_id]
        outgoing = df[df["sender_id"] == acc_id]
        
        details.append({
            "account_id": acc_id,
            "risk_score": round(flagged.loc[acc_id, "risk_score"], 3),
            "risk_level": flagged.loc[acc_id, "risk_level"],
            "in_degree": int(flagged.loc[acc_id, "in_degree"]),
            "out_degree": int(flagged.loc[acc_id, "out_degree"]),
            "total_volume_in": round(incoming["amount"].sum(), 2),
            "total_volume_out": round(outgoing["amount"].sum(), 2),
            "transaction_count": len(pd.concat([incoming, outgoing])),
            "cycle_participant": int(flagged.loc[acc_id, "cycle_participant"]),
        })
    
    report_df = pd.DataFrame(details).sort_values("risk_score", ascending=False)
    csv_buffer = BytesIO()
    report_df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    
    return csv_buffer.getvalue()
