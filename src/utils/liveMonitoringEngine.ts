import { Transaction, AnalysisResult, SuspiciousAccount, FraudRing } from "@/types/fraud";

export interface StreamEvent {
  transaction: Transaction;
  logMessage: string;
  type: "normal" | "suspect" | "alert";
  suspiciousAccount?: SuspiciousAccount;
  fraudRing?: FraudRing;
}

let streamTxCount = 0;

// Preset account names to choose from for normal flow
const NORMAL_ACCOUNTS = [
  "ACC_NORM_ALPHA", "ACC_NORM_BETA", "ACC_NORM_GAMMA", "ACC_NORM_DELTA", "ACC_NORM_EPSILON",
  "ACC_NORM_ZETA", "ACC_NORM_ETA", "ACC_NORM_THETA", "ACC_NORM_IOTA", "ACC_NORM_KAPPA"
];

// Suspicious accounts preset pools
const SUSPECT_POOL = [
  "ACC_MULE_ALPHA", "ACC_MULE_BETA", "ACC_MULE_GAMMA",
  "ACC_SHELL_ALPHA", "ACC_SHELL_BETA", "ACC_SHELL_GAMMA",
  "ACC_OFFSHORE_INTEG", "ACC_VPN_BYPASS"
];

export const generateNextStreamEvent = (): StreamEvent => {
  streamTxCount++;
  const id = `TXN_STRM_${1000 + streamTxCount}`;
  const isSuspiciousRandom = Math.random() > 0.65; // ~35% chance of suspicious pattern injection
  
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  if (isSuspiciousRandom) {
    const patternType = Math.floor(Math.random() * 4);
    
    switch (patternType) {
      case 0: {
        // Circular routing step
        const sender = SUSPECT_POOL[0];
        const receiver = SUSPECT_POOL[1];
        const amount = Number((15000 + Math.random() * 5000).toFixed(2));
        
        return {
          transaction: { transaction_id: id, sender_id: sender, receiver_id: receiver, amount, timestamp },
          logMessage: `🚨 ANOMALOUS ROUTING: High-value transit ${sender} ➜ ${receiver} ($${amount.toLocaleString()}). Structuring risk!`,
          type: "suspect",
          suspiciousAccount: {
            account_id: sender,
            score: 87,
            reasons: ["Anomalous High-Velocity Transit", "Layering Intermediary Match"],
          }
        };
      }
      case 1: {
        // Smurfing / Structuring attempt
        const sender = `ACC_SMURF_${Math.floor(1 + Math.random() * 5)}`;
        const receiver = "ACC_SMURF_HUB";
        const amount = Number((8500 + Math.random() * 1200).toFixed(2)); // Structured deposit
        
        return {
          transaction: { transaction_id: id, sender_id: sender, receiver_id: receiver, amount, timestamp },
          logMessage: `🚨 STRUCTURING TACTIC: Structured deposit detected ${sender} ➜ ${receiver} ($${amount.toLocaleString()}) below compliance reporting cap.`,
          type: "alert",
          suspiciousAccount: {
            account_id: receiver,
            score: 91,
            reasons: ["Structured smurfing target consolidation", "Immediate offshore clearing pipeline"],
          }
        };
      }
      case 2: {
        // Offshore routing sweep
        const sender = SUSPECT_POOL[2];
        const receiver = "ACC_OFFSHORE_INTEG";
        const amount = Number((85000 + Math.random() * 15000).toFixed(2));
        
        return {
          transaction: { transaction_id: id, sender_id: sender, receiver_id: receiver, amount, timestamp },
          logMessage: `💀 TAX HAVEN ROUTER: Bulk wealth redirection ${sender} ➜ Offshore Cayman Router [${receiver}] ($${amount.toLocaleString()}).`,
          type: "alert",
          suspiciousAccount: {
            account_id: receiver,
            score: 98,
            reasons: ["Tax Haven integration hub", "High-volume offshore outward export"],
          }
        };
      }
      default: {
        // Rapid repetitive transfer (velocity)
        const sender = "ACC_VPN_BYPASS";
        const receiver = SUSPECT_POOL[0];
        const amount = Number((3200 + Math.random() * 300).toFixed(2));
        
        return {
          transaction: { transaction_id: id, sender_id: sender, receiver_id: receiver, amount, timestamp },
          logMessage: `⚡ VELOCITY ANOMALY: Rapid fire proxy transfer ${sender} ➜ ${receiver} ($${amount.toLocaleString()}). Latency bypass.`,
          type: "suspect",
          suspiciousAccount: {
            account_id: sender,
            score: 82,
            reasons: ["High-velocity proxy redirection", "TOR exit node terminal access"],
          }
        };
      }
    }
  } else {
    // Normal retail activity
    const idxS = Math.floor(Math.random() * NORMAL_ACCOUNTS.length);
    let idxR = Math.floor(Math.random() * NORMAL_ACCOUNTS.length);
    if (idxS === idxR) idxR = (idxR + 1) % NORMAL_ACCOUNTS.length;
    
    const sender = NORMAL_ACCOUNTS[idxS];
    const receiver = NORMAL_ACCOUNTS[idxR];
    const amount = Number((100 + Math.random() * 2500).toFixed(2));
    
    return {
      transaction: { transaction_id: id, sender_id: sender, receiver_id: receiver, amount, timestamp },
      logMessage: `📥 INCOMING TELEMETRY: Clear retail clearing node matched ${sender} ➜ ${receiver} ($${amount.toLocaleString()}).`,
      type: "normal"
    };
  }
};
