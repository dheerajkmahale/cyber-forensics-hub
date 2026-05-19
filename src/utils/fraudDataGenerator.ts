import { Transaction, AnalysisResult, SuspiciousAccount, FraudRing } from "@/types/fraud";

export type ScenarioType = "normal" | "fraud_ring" | "smurfing" | "shell_chain" | "layered" | "velocity" | "insider" | "dark_web";

export interface GeneratedScenarioData {
  transactions: Transaction[];
  result: AnalysisResult;
  scenarioName: string;
}

// Generate realistic synthetic transactions based on target cyberthreat scenarios
export const generateScenarioData = (scenario: ScenarioType): GeneratedScenarioData => {
  const transactions: Transaction[] = [];
  const suspiciousAccounts: SuspiciousAccount[] = [];
  const fraudRings: FraudRing[] = [];
  
  const timestampOffset = (minutesAgo: number): string => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - minutesAgo);
    return d.toISOString().replace("T", " ").slice(0, 19);
  };

  let scenarioName = "Normal Financial Influx";

  switch (scenario) {
    case "normal": {
      scenarioName = "Normal Activity Baseline";
      // Generate clean baseline data
      for (let i = 1; i <= 25; i++) {
        const id = `TXN_NORM_${100 + i}`;
        const source = `ACC_NORM_${10 + (i % 7)}`;
        const target = `ACC_NORM_${20 + (i % 5)}`;
        const amount = Number((100 + Math.random() * 2400).toFixed(2));
        transactions.push({
          transaction_id: id,
          sender_id: source,
          receiver_id: target,
          amount,
          timestamp: timestampOffset(60 - i * 2),
        });
      }
      break;
    }

    case "fraud_ring": {
      scenarioName = "Circular Laundering Loop";
      // Construct clean baseline
      for (let i = 1; i <= 10; i++) {
        transactions.push({
          transaction_id: `TXN_RING_BASE_${i}`,
          sender_id: `ACC_NORMAL_${10 + i}`,
          receiver_id: `ACC_NORMAL_${20 + i}`,
          amount: Number((500 + Math.random() * 1000).toFixed(2)),
          timestamp: timestampOffset(90 - i * 5),
        });
      }
      
      // Inject circular routing loop: ACC_MULE_A -> ACC_MULE_B -> ACC_MULE_C -> ACC_MULE_A
      const cycleAmount = 25000;
      transactions.push({
        transaction_id: "TXN_MULE_CYC_01",
        sender_id: "ACC_MULE_ALPHA",
        receiver_id: "ACC_MULE_BETA",
        amount: cycleAmount,
        timestamp: timestampOffset(12),
      });
      transactions.push({
        transaction_id: "TXN_MULE_CYC_02",
        sender_id: "ACC_MULE_BETA",
        receiver_id: "ACC_MULE_GAMMA",
        amount: cycleAmount - 50, // Slight layering depletion
        timestamp: timestampOffset(9),
      });
      transactions.push({
        transaction_id: "TXN_MULE_CYC_03",
        sender_id: "ACC_MULE_GAMMA",
        receiver_id: "ACC_MULE_ALPHA",
        amount: cycleAmount - 120, // Circular closure
        timestamp: timestampOffset(5),
      });

      suspiciousAccounts.push(
        { account_id: "ACC_MULE_ALPHA", score: 96, reasons: ["Circular Routing Cycle Source", "High-Volume Layering transit"] },
        { account_id: "ACC_MULE_BETA", score: 92, reasons: ["Circular Routing Cycle Link", "Rapid Value Egress Transit"] },
        { account_id: "ACC_MULE_GAMMA", score: 94, reasons: ["Circular Routing Cycle Terminal", "Value Loop Closure Egress"] }
      );

      fraudRings.push({
        ring_id: "RING_CYCLIC_MULES",
        type: "circular_routing",
        accounts: ["ACC_MULE_ALPHA", "ACC_MULE_BETA", "ACC_MULE_GAMMA"],
      });
      break;
    }

    case "smurfing": {
      scenarioName = "Fan-In Smurfing Ingress";
      // Central receiver receiving structuring micro-transfers
      const centralHub = "ACC_SMURF_HUB";
      
      for (let i = 1; i <= 8; i++) {
        const smurf = `ACC_SMURF_NODE_${i}`;
        // Structured amounts just below AML reporting limit (e.g., $9,500)
        const amount = Number((9000 + Math.random() * 850).toFixed(2));
        transactions.push({
          transaction_id: `TXN_SMURF_${i}`,
          sender_id: smurf,
          receiver_id: centralHub,
          amount,
          timestamp: timestampOffset(20 - i),
        });

        suspiciousAccounts.push({
          account_id: smurf,
          score: 78,
          reasons: ["Micro-deposit smurfing node", "Structured deposit pipeline emitter"],
        });
      }

      // Exit transfer out of centralHub
      transactions.push({
        transaction_id: "TXN_SMURF_EXIT",
        sender_id: centralHub,
        receiver_id: "ACC_CAYMAN_ROUTER",
        amount: 75000,
        timestamp: timestampOffset(2),
      });

      suspiciousAccounts.push({
        account_id: centralHub,
        score: 95,
        reasons: ["Structuring consolidation point", "High structuring integration risk", "Immediate offshore transfer"],
      });

      fraudRings.push({
        ring_id: "RING_SMURF_STRUCTURING",
        type: "structuring",
        accounts: [centralHub, "ACC_SMURF_NODE_1", "ACC_SMURF_NODE_2", "ACC_SMURF_NODE_3", "ACC_SMURF_NODE_4"],
      });
      break;
    }

    case "shell_chain": {
      scenarioName = "Shell stratification Chain";
      // Deep chain to obscure audit trail
      transactions.push(
        { transaction_id: "TXN_SHELL_01", sender_id: "ACC_SHELL_ALPHA", receiver_id: "ACC_SHELL_BETA", amount: 50000, timestamp: timestampOffset(25) },
        { transaction_id: "TXN_SHELL_02", sender_id: "ACC_SHELL_BETA", receiver_id: "ACC_SHELL_GAMMA", amount: 49500, timestamp: timestampOffset(20) },
        { transaction_id: "TXN_SHELL_03", sender_id: "ACC_SHELL_GAMMA", receiver_id: "ACC_SHELL_DELTA", amount: 49000, timestamp: timestampOffset(15) },
        { transaction_id: "TXN_SHELL_04", sender_id: "ACC_SHELL_DELTA", receiver_id: "ACC_SHELL_EPSILON", amount: 48500, timestamp: timestampOffset(10) }
      );

      suspiciousAccounts.push(
        { account_id: "ACC_SHELL_ALPHA", score: 85, reasons: ["Shell Chain Initiation Point", "High-volume transfer trigger"] },
        { account_id: "ACC_SHELL_BETA", score: 88, reasons: ["Mid-chain shell intermediary", "Suspicious layering transit"] },
        { account_id: "ACC_SHELL_GAMMA", score: 89, reasons: ["Mid-chain shell intermediary", "Suspicious layering transit"] },
        { account_id: "ACC_SHELL_DELTA", score: 91, reasons: ["Shell Chain Terminal Node", "Layering depletion egress"] }
      );

      fraudRings.push({
        ring_id: "RING_SHELL_STRATIFICATION",
        type: "other",
        accounts: ["ACC_SHELL_ALPHA", "ACC_SHELL_BETA", "ACC_SHELL_GAMMA", "ACC_SHELL_DELTA"],
      });
      break;
    }

    case "layered": {
      scenarioName = "Cross-Border Layering Loop";
      // Multi-jurisdictional transfers to escape domestic audit
      transactions.push(
        { transaction_id: "TXN_LAY_IND", sender_id: "ACC_IN_OPERATOR", receiver_id: "ACC_UAE_ROUTER", amount: 120000, timestamp: timestampOffset(30) },
        { transaction_id: "TXN_LAY_UAE", sender_id: "ACC_UAE_ROUTER", receiver_id: "ACC_SG_ROUTER", amount: 119500, timestamp: timestampOffset(20) },
        { transaction_id: "TXN_LAY_SG", sender_id: "ACC_SG_ROUTER", receiver_id: "ACC_CAYMAN_ESCROW", amount: 119000, timestamp: timestampOffset(10) }
      );

      suspiciousAccounts.push(
        { account_id: "ACC_IN_OPERATOR", score: 88, reasons: ["Offshore export seed node", "High-value outward transit"] },
        { account_id: "ACC_UAE_ROUTER", score: 93, reasons: ["Cross-border router hub", "OFAC-monitored corridor exposure"] },
        { account_id: "ACC_SG_ROUTER", score: 90, reasons: ["Intermediate layering transit", "Offshore redirection routing"] },
        { account_id: "ACC_CAYMAN_ESCROW", score: 97, reasons: ["Tax Haven integration point", "Ultimate beneficial owner mask"] }
      );

      fraudRings.push({
        ring_id: "RING_CROSSBOR_LAUNDERING",
        type: "other",
        accounts: ["ACC_IN_OPERATOR", "ACC_UAE_ROUTER", "ACC_SG_ROUTER", "ACC_CAYMAN_ESCROW"],
      });
      break;
    }

    case "velocity": {
      scenarioName = "High-Velocity Smurfing";
      // Rapid repetitive transfers
      const velocityEmitter = "ACC_VELOCITY_EMITTER";
      const receiver = "ACC_VELOCITY_RECEIVER";

      for (let i = 1; i <= 10; i++) {
        transactions.push({
          transaction_id: `TXN_VEL_${i}`,
          sender_id: velocityEmitter,
          receiver_id: receiver,
          amount: Number((1500 + Math.random() * 50).toFixed(2)),
          timestamp: timestampOffset(10 - i * 0.1), // Fractions of minutes apart
        });
      }

      suspiciousAccounts.push(
        { account_id: velocityEmitter, score: 92, reasons: ["High-velocity transfer initiator", "Rapid repetitive smurfing"] },
        { account_id: receiver, score: 84, reasons: ["Rapid high-frequency beneficiary", "Velocity structuring targets"] }
      );
      break;
    }

    case "insider": {
      scenarioName = "Anomalous Employee Threat";
      transactions.push({
        transaction_id: "TXN_INSIDER_HIGH",
        sender_id: "EMP_TREASURY_MGMT",
        receiver_id: "ACC_UNLISTED_EXTERNAL",
        amount: 450000, // Massive corporate asset sweep
        timestamp: timestampOffset(5),
      });

      suspiciousAccounts.push(
        { account_id: "EMP_TREASURY_MGMT", score: 99, reasons: ["Insider treasury asset sweep", "Out-of-hours unauthorized access"] },
        { account_id: "ACC_UNLISTED_EXTERNAL", score: 89, reasons: ["Unverified clearing destination", "High integration risk"] }
      );
      break;
    }

    case "dark_web": {
      scenarioName = "Darknet Crypto Wash Out";
      transactions.push(
        { transaction_id: "TXN_DARK_01", sender_id: "HYDRA_MARKET_NODE", receiver_id: "ACC_MULE_WASH_A", amount: 65000, timestamp: timestampOffset(15) },
        { transaction_id: "TXN_DARK_02", sender_id: "ACC_MULE_WASH_A", receiver_id: "ACC_MULE_WASH_B", amount: 64200, timestamp: timestampOffset(10) },
        { transaction_id: "TXN_DARK_03", sender_id: "ACC_MULE_WASH_B", receiver_id: "ACC_INTEGRATION_EXIT", amount: 63800, timestamp: timestampOffset(4) }
      );

      suspiciousAccounts.push(
        { account_id: "HYDRA_MARKET_NODE", score: 99, reasons: ["Darknet illegal market association", "OFAC-flagged address profile"] },
        { account_id: "ACC_MULE_WASH_A", score: 93, reasons: ["Primary darknet transit intermediary", "Immediate value dispatching"] },
        { account_id: "ACC_MULE_WASH_B", score: 88, reasons: ["Secondary darknet transit intermediary", "Immediate value dispatching"] },
        { account_id: "ACC_INTEGRATION_EXIT", score: 95, reasons: ["Ultimate fiat cashout receiver", "Structuring integration route"] }
      );
      break;
    }
  }

  // Auto-calculate graph structures
  const allAccountIds = Array.from(new Set([
    ...transactions.map(t => t.sender_id),
    ...transactions.map(t => t.receiver_id),
  ]));

  const nodes = allAccountIds.map(id => {
    const suspect = suspiciousAccounts.find(sm => sm.account_id === id);
    return {
      id,
      suspicious: !!suspect,
      score: suspect ? suspect.score : Number((5 + Math.random() * 15).toFixed(0)),
    };
  });

  const edges = transactions.map(t => ({
    transaction_id: t.transaction_id,
    source: t.sender_id,
    target: t.receiver_id,
    amount: t.amount,
    timestamp: t.timestamp,
  }));

  const result: AnalysisResult = {
    graph: { nodes, edges },
    suspicious_accounts: suspiciousAccounts,
    fraud_rings: fraudRings,
    summary: {
      total_accounts: allAccountIds.length,
      suspicious_accounts_count: suspiciousAccounts.length,
      fraud_rings_detected: fraudRings.length,
    }
  };

  return {
    transactions,
    result,
    scenarioName,
  };
};
