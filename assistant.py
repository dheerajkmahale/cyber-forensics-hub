"""
Multilingual Assistant & Terminal Command Panel
Rules-based intent matching to query loaded data in English and Hindi
"""

import re
from typing import Dict, List, Any

class DataAssistant:
    """Rules-based data query assistant."""
    
    def __init__(self):
        self.language = "en"  # en or hi
        self.data_context = None  # Will store (df, graph, cycles, mules)
    
    def set_context(self, df, graph, cycles, mules):
        """Set the current dataset context."""
        self.data_context = {
            'df': df,
            'graph': graph,
            'cycles': cycles,
            'mules': mules
        }
    
    def parse_intent_en(self, query: str) -> Dict[str, Any]:
        """Parse English queries and return intent."""
        query_lower = query.lower().strip()
        
        # Show flagged accounts
        if any(phrase in query_lower for phrase in ['show flagged', 'flagged accounts', 'suspicious accounts']):
            return {'intent': 'show_flagged', 'args': {}}
        
        # Explain fraud ring
        if any(phrase in query_lower for phrase in ['explain ring', 'show ring', 'cycle details']):
            match = re.search(r'ring\s+(\w+)', query_lower)
            ring_id = match.group(1) if match else None
            return {'intent': 'explain_ring', 'args': {'ring_id': ring_id}}
        
        # Show mule accounts
        if any(phrase in query_lower for phrase in ['show mules', 'mule accounts', 'aggregators']):
            return {'intent': 'show_mules', 'args': {}}
        
        # Account details
        if any(phrase in query_lower for phrase in ['account', 'show account', 'details of']):
            match = re.search(r'(acc_\w+|\bacc\w+)', query_lower)
            account_id = match.group(0).upper() if match else None
            return {'intent': 'account_details', 'args': {'account_id': account_id}}
        
        # Risk scores
        if any(phrase in query_lower for phrase in ['risk score', 'high risk', 'risk analysis']):
            return {'intent': 'risk_summary', 'args': {}}
        
        # What is smurfing/layering
        if any(phrase in query_lower for phrase in ['what is smurfing', 'what is layering', 'define']):
            if 'smurfing' in query_lower:
                return {'intent': 'explain_term', 'args': {'term': 'smurfing'}}
            elif 'layering' in query_lower:
                return {'intent': 'explain_term', 'args': {'term': 'layering'}}
            else:
                return {'intent': 'explain_term', 'args': {'term': 'general'}}
        
        # Default
        return {'intent': 'help', 'args': {}}
    
    def parse_intent_hi(self, query: str) -> Dict[str, Any]:
        """Parse Hindi queries and return intent."""
        query_lower = query.lower().strip()
        
        # Hindi phrases (basic examples - full implementation would need more)
        if any(phrase in query_lower for phrase in ['aashankaspaad', 'jhooth', 'flag']):
            return {'intent': 'show_flagged', 'args': {}}
        
        if any(phrase in query_lower for phrase in ['khataun', 'khatey']):
            return {'intent': 'account_details', 'args': {}}
        
        # Fallback to English parsing
        return self.parse_intent_en(query)
    
    def execute_intent(self, intent_result: Dict[str, Any]) -> str:
        """Execute the parsed intent and return response."""
        if not self.data_context:
            return "⚠️ No dataset loaded. Please upload a CSV file first."
        
        intent = intent_result['intent']
        args = intent_result['args']
        
        df = self.data_context['df']
        graph = self.data_context['graph']
        cycles = self.data_context['cycles']
        mules = self.data_context['mules']
        
        if intent == 'show_flagged':
            flagged = set()
            for cycle in cycles:
                flagged.update(cycle)
            flagged.update(mules)
            
            if not flagged:
                return "No flagged accounts detected."
            
            flagged_list = sorted(list(flagged))[:10]
            response = f"🚨 Detected {len(flagged)} flagged accounts.\n\nTop 10:\n"
            for i, acc in enumerate(flagged_list, 1):
                in_deg = graph.in_degree(acc)
                out_deg = graph.out_degree(acc)
                response += f"{i}. {acc} (In: {in_deg}, Out: {out_deg})\n"
            return response
        
        elif intent == 'show_mules':
            if not mules:
                return "No mule/aggregator accounts detected."
            mule_list = sorted(mules)[:10]
            response = f"💼 Detected {len(mules)} mule accounts.\n\nTop 10:\n"
            for i, mule in enumerate(mule_list, 1):
                in_deg = graph.in_degree(mule)
                response += f"{i}. {mule} (In-degree: {in_deg})\n"
            return response
        
        elif intent == 'explain_ring':
            if not cycles:
                return "No fraud rings (cycles) detected."
            ring_id = args.get('ring_id')
            response = f"🔄 Detected {len(cycles)} fraud rings (cycles).\n\n"
            
            if ring_id and len(cycles) > 0:
                try:
                    idx = int(ring_id.replace('RING_', '')) if 'RING_' in str(ring_id).upper() else 0
                    if idx < len(cycles):
                        cycle = cycles[idx]
                        response += f"Ring #{idx + 1}: {' → '.join(cycle[:5])}{'...' if len(cycle) > 5 else ''}\n"
                except:
                    pass
            
            for i, cycle in enumerate(cycles[:3], 1):
                response += f"\nRing #{i} ({len(cycle)} nodes): {' → '.join(cycle[:5])}{'...' if len(cycle) > 5 else ''}\n"
            return response
        
        elif intent == 'account_details':
            account_id = args.get('account_id')
            if not account_id:
                return "Please specify an account ID (e.g., 'show account ACC_001')"
            
            if account_id not in graph:
                return f"Account {account_id} not found in dataset."
            
            in_deg = graph.in_degree(account_id)
            out_deg = graph.out_degree(account_id)
            
            incoming = df[df['receiver_id'] == account_id]
            outgoing = df[df['sender_id'] == account_id]
            
            in_vol = incoming['amount'].sum() if len(incoming) > 0 else 0
            out_vol = outgoing['amount'].sum() if len(outgoing) > 0 else 0
            
            response = f"📊 Account: {account_id}\n"
            response += f"Incoming: {in_deg} txn | ${in_vol:,.0f}\n"
            response += f"Outgoing: {out_deg} txn | ${out_vol:,.0f}\n"
            
            is_flagged = account_id in mules or any(account_id in c for c in cycles)
            response += f"Status: {'🚨 FLAGGED' if is_flagged else '✅ Normal'}\n"
            
            return response
        
        elif intent == 'risk_summary':
            flagged = set()
            for cycle in cycles:
                flagged.update(cycle)
            flagged.update(mules)
            
            response = f"📈 Risk Summary\n"
            response += f"Total Accounts: {len(set(df['sender_id']).union(set(df['receiver_id'])))}\n"
            response += f"Flagged Accounts: {len(flagged)}\n"
            response += f"Fraud Rings: {len(cycles)}\n"
            response += f"Mule Accounts: {len(mules)}\n"
            response += f"Total Volume: ${df['amount'].sum():,.0f}\n"
            
            return response
        
        elif intent == 'explain_term':
            term = args.get('term', 'general')
            
            if term == 'smurfing':
                return (
                    "**Smurfing (Structuring)**\n"
                    "Breaking large transactions into many small ones to evade detection "
                    "thresholds. Pattern: High out-degree account → many low-volume transactions.\n"
                    "Detection: Accounts with unusually high transaction count but normal volume."
                )
            elif term == 'layering':
                return (
                    "**Layering**\n"
                    "Moving funds through multiple accounts to obscure origin/destination. "
                    "Creates complex chains of transactions.\n"
                    "Detection: Circular transfer patterns, long chains, minimal net flow."
                )
            else:
                return (
                    "**Fraud Detection Patterns**\n"
                    "• **Cycles**: Circular transfers (A→B→C→A)\n"
                    "• **Mules**: High in-degree aggregators\n"
                    "• **Structuring**: High transaction count, low individual amounts\n"
                    "• **Layering**: Complex chains obscuring fund flow"
                )
        
        elif intent == 'help':
            return (
                "🤖 **Data Assistant Commands**\n\n"
                "**English:**\n"
                "• 'show flagged accounts'\n"
                "• 'show mule accounts'\n"
                "• 'explain fraud ring'\n"
                "• 'show account ACC_001'\n"
                "• 'what is smurfing'\n"
                "• 'risk summary'\n\n"
                "**Hindi (Basic):**\n"
                "• 'aashankaspaad khataun' (suspicious accounts)\n"
                "• 'jhooth khataun' (mule accounts)\n\n"
                "Ask anything about the currently loaded dataset!"
            )
        
        return "Command not recognized. Type 'help' for options."
    
    def process_query(self, query: str) -> str:
        """Main entry point: parse and execute query."""
        if not query.strip():
            return "Please enter a question or command."
        
        # Detect language
        if any(char in query for char in 'अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह'):
            self.language = 'hi'
            intent_result = self.parse_intent_hi(query)
        else:
            self.language = 'en'
            intent_result = self.parse_intent_en(query)
        
        return self.execute_intent(intent_result)

# ============================================================================
# Terminal Command Parser (for Feature 4)
# ============================================================================

class TerminalCommandParser:
    """Parse and execute terminal-style commands."""
    
    def __init__(self):
        self.data_context = None
    
    def set_context(self, df, graph, cycles, mules):
        """Set dataset context."""
        self.data_context = {
            'df': df,
            'graph': graph,
            'cycles': cycles,
            'mules': mules
        }
    
    def parse_command(self, cmd: str) -> Dict[str, Any]:
        """Parse command string."""
        cmd = cmd.strip().lower()
        
        if cmd.startswith('show '):
            parts = cmd[5:].split()
            if parts[0] == 'flagged':
                return {'type': 'show_flagged'}
            elif parts[0] == 'mules':
                return {'type': 'show_mules'}
            elif parts[0] == 'cycles':
                return {'type': 'show_cycles'}
        
        elif cmd.startswith('explain '):
            parts = cmd[8:].split()
            if parts[0] == 'ring' and len(parts) > 1:
                return {'type': 'explain_ring', 'ring_id': parts[1]}
        
        elif cmd.startswith('export '):
            parts = cmd[7:].split()
            if parts[0] == 'report' and len(parts) > 1:
                return {'type': 'export_report', 'account_id': parts[1]}
        
        elif cmd.startswith('account '):
            account_id = cmd[8:].strip().upper()
            return {'type': 'account_details', 'account_id': account_id}
        
        elif cmd == 'help':
            return {'type': 'help'}
        
        return {'type': 'error', 'message': 'Command not recognized'}
    
    def execute_command(self, parsed: Dict[str, Any]) -> str:
        """Execute parsed command."""
        if not self.data_context:
            return "⚠️ No dataset loaded."
        
        cmd_type = parsed.get('type')
        
        if cmd_type == 'show_flagged':
            flagged = set()
            for c in self.data_context['cycles']:
                flagged.update(c)
            flagged.update(self.data_context['mules'])
            return f"FLAGGED_ACCOUNTS: {len(flagged)} detected\n" + "\n".join(sorted(flagged)[:10])
        
        elif cmd_type == 'show_mules':
            mules = self.data_context['mules']
            return f"MULE_ACCOUNTS: {len(mules)} detected\n" + "\n".join(sorted(mules)[:10])
        
        elif cmd_type == 'show_cycles':
            cycles = self.data_context['cycles']
            return f"FRAUD_RINGS: {len(cycles)} detected\n" + "\n".join([str(c) for c in cycles[:5]])
        
        elif cmd_type == 'account_details':
            account_id = parsed.get('account_id')
            graph = self.data_context['graph']
            df = self.data_context['df']
            
            if account_id not in graph:
                return f"ERROR: Account {account_id} not found"
            
            in_deg = graph.in_degree(account_id)
            out_deg = graph.out_degree(account_id)
            incoming_vol = df[df['receiver_id'] == account_id]['amount'].sum()
            outgoing_vol = df[df['sender_id'] == account_id]['amount'].sum()
            
            return (
                f"ACCOUNT_REPORT: {account_id}\n"
                f"INCOMING: {in_deg} txn | ${incoming_vol:,.0f}\n"
                f"OUTGOING: {out_deg} txn | ${outgoing_vol:,.0f}"
            )
        
        elif cmd_type == 'help':
            return (
                "TERMINAL_COMMANDS:\n"
                "  show flagged     - List flagged accounts\n"
                "  show mules       - List mule accounts\n"
                "  show cycles      - List fraud rings\n"
                "  account ACC_001  - Get account details\n"
                "  explain ring 0   - Explain fraud ring\n"
                "  help             - Show this help"
            )
        
        elif cmd_type == 'error':
            return f"ERROR: {parsed.get('message', 'Unknown error')}"
        
        return "COMMAND_FAILED"
    
    def process_command(self, cmd: str) -> str:
        """Main entry point."""
        if not cmd.strip():
            return "$ "
        parsed = self.parse_command(cmd)
        return self.execute_command(parsed)
