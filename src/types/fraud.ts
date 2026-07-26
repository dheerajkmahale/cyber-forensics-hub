export interface Transaction {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: string;
}

export interface SuspiciousAccount {
  account_id: string;
  score: number;
  reasons: string[];
}

export interface FraudRing {
  ring_id: string;
  accounts: string[];
  cycle_length: number;
  type: string;
}

export interface SmurfingResult {
  fanIn: { receiver: string; senders: string[]; count: number }[];
  fanOut: { sender: string; receivers: string[]; count: number }[];
}

export interface GraphNode {
  id: string;
  suspicious: boolean;
  score: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  amount: number;
  transaction_id: string;
  timestamp?: string;
}

export interface AnalysisResult {
  suspicious_accounts: SuspiciousAccount[];
  fraud_rings: FraudRing[];
  smurfing: SmurfingResult;
  shell_chains: string[][];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  summary: {
    total_transactions: number;
    total_accounts: number;
    suspicious_accounts_count: number;
    fraud_rings_detected: number;
    smurfing_fan_in_detected: number;
    smurfing_fan_out_detected: number;
    shell_chains_detected: number;
    analysis_timestamp: string;
    processing_time_ms?: number;
  };
}
