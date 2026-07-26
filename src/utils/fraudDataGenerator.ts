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

  // Helper for generating dynamic timestamps relative to Date.now()
  const dynamicTimestamp = (minutesAgo: number): string => {
    const time = Date.now() - minutesAgo * 60 * 1000 - Math.random() * 30000;
    const d = new Date(time);
    return d.toISOString().replace("T", " ").slice(0, 19);
  };

  // Helper for generating randomized account numbers
  const randAcc = (prefix: string) => {
    const randNum = Math.floor(100000 + Math.random() * 900000);
    return `ACC_${prefix}_${randNum}`;
  };

  // Helper for generating randomized transaction IDs
  const randTxId = (prefix: string) => {
    // Requirements: use Date.now() and crypto.randomUUID()
    const uuidSuffix = typeof crypto !== "undefined" && crypto.randomUUID 
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TXN_${prefix}_${Date.now().toString().slice(-6)}_${uuidSuffix}`;
  };

  let scenarioName = "Normal Financial Influx";

  switch (scenario) {
    case "normal": {
      scenarioName = "Normal Activity Baseline";
      // Generate randomized normal transaction pool
      const accountsCount = 15 + Math.floor(Math.random() * 10);
      const normalPool = Array.from({ length: accountsCount }, (_, i) => randAcc("NORM"));
      
      const count = 40 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const sender = normalPool[Math.floor(Math.random() * normalPool.length)];
        let receiver = normalPool[Math.floor(Math.random() * normalPool.length)];
        while (receiver === sender) {
          receiver = normalPool[Math.floor(Math.random() * normalPool.length)];
        }
        
        const amount = Number((100 + Math.random() * 3000).toFixed(2));
        transactions.push({
          transaction_id: randTxId("NORM"),
          sender_id: sender,
          receiver_id: receiver,
          amount,
          timestamp: dynamicTimestamp(120 - (i * 2)),
        });
      }
      break;
    }

    case "fraud_ring": {
      scenarioName = "Circular Laundering Loop";
      
      // Normal background noise
      const noiseCount = 15 + Math.floor(Math.random() * 10);
      const noisePool = Array.from({ length: noiseCount }, (_, i) => randAcc("NORM"));
      for (let i = 0; i < 20; i++) {
        const s = noisePool[Math.floor(Math.random() * noisePool.length)];
        const r = noisePool[Math.floor(Math.random() * noisePool.length)];
        if (s !== r) {
          transactions.push({
            transaction_id: randTxId("RING_BG"),
            sender_id: s,
            receiver_id: r,
            amount: Number((300 + Math.random() * 1200).toFixed(2)),
            timestamp: dynamicTimestamp(180 - i * 5),
          });
        }
      }

      // Generate a cycle of 3 to 6 mule accounts
      const ringSize = 3 + Math.floor(Math.random() * 4); // 3 to 6
      const ringAccounts = Array.from({ length: ringSize }, () => randAcc("MULE"));
      const baseCycleAmount = 20000 + Math.floor(Math.random() * 30000); // 20k to 50k
      
      for (let i = 0; i < ringSize; i++) {
        const sender = ringAccounts[i];
        const receiver = ringAccounts[(i + 1) % ringSize];
        // Deplete amount slightly down the path (laundering fee / leakage)
        const amt = Number((baseCycleAmount - (i * (150 + Math.random() * 100))).toFixed(2));
        transactions.push({
          transaction_id: randTxId("MULE_CYC"),
          sender_id: sender,
          receiver_id: receiver,
          amount: amt,
          timestamp: dynamicTimestamp(20 - i * 3),
        });

        // Add to suspicious accounts with AI-generated threat scores (85-99)
        const score = 85 + Math.floor(Math.random() * 15);
        suspiciousAccounts.push({
          account_id: sender,
          score,
          reasons: [
            "Circular Routing Cycle Link",
            `Mule Ring Hop ${i + 1} of ${ringSize}`,
            "High value-to-balance egress ratio"
          ]
        });
      }

      fraudRings.push({
        ring_id: `RING_${Date.now().toString().slice(-6)}`,
        type: "circular_routing",
        accounts: ringAccounts,
        cycle_length: ringSize
      });
      break;
    }

    case "smurfing": {
      scenarioName = "Fan-In Smurfing Ingress";
      const centralHub = randAcc("SMURF_HUB");
      const smurfsCount = 6 + Math.floor(Math.random() * 6); // 6 to 11 smurfs
      const smurfAccounts = Array.from({ length: smurfsCount }, () => randAcc("SMURF_SND"));

      // Deposits just below AML reporting limit (e.g. $8,500 - $9,950)
      for (let i = 0; i < smurfsCount; i++) {
        const amt = Number((8500 + Math.random() * 1450).toFixed(2));
        transactions.push({
          transaction_id: randTxId("SMURF_DEP"),
          sender_id: smurfAccounts[i],
          receiver_id: centralHub,
          amount: amt,
          timestamp: dynamicTimestamp(30 - i * 2),
        });

        suspiciousAccounts.push({
          account_id: smurfAccounts[i],
          score: 75 + Math.floor(Math.random() * 15),
          reasons: ["Micro-deposit smurfing node", "Structured deposit pipeline emitter"]
        });
      }

      // Large consolidated exit transfer
      const exitAmount = Number((75000 + Math.random() * 50000).toFixed(2));
      const offshoreReceiver = randAcc("OFFSHORE");
      transactions.push({
        transaction_id: randTxId("SMURF_EXIT"),
        sender_id: centralHub,
        receiver_id: offshoreReceiver,
        amount: exitAmount,
        timestamp: dynamicTimestamp(2),
      });

      suspiciousAccounts.push({
        account_id: centralHub,
        score: 95 + Math.floor(Math.random() * 5),
        reasons: ["Structuring consolidation point", "Immediate offshore transfer of consolidated funds", "High fan-in deposit ingress"]
      });

      suspiciousAccounts.push({
        account_id: offshoreReceiver,
        score: 88 + Math.floor(Math.random() * 8),
        reasons: ["Offshore tax haven destination receiver", "Rapid integrated capital landing"]
      });

      fraudRings.push({
        ring_id: `RING_SMURF_${Date.now().toString().slice(-6)}`,
        type: "structuring",
        accounts: [centralHub, ...smurfAccounts],
        cycle_length: smurfsCount + 1
      });
      break;
    }

    case "shell_chain": {
      scenarioName = "Shell Stratification Chain";
      const chainLength = 4 + Math.floor(Math.random() * 4); // 4 to 7 hops
      const shellAccounts = Array.from({ length: chainLength }, () => randAcc("SHELL"));
      const initialAmount = 80000 + Math.floor(Math.random() * 100000); // 80k to 180k

      for (let i = 0; i < chainLength - 1; i++) {
        const amt = Number((initialAmount - i * (500 + Math.random() * 300)).toFixed(2));
        transactions.push({
          transaction_id: randTxId("SHELL_TX"),
          sender_id: shellAccounts[i],
          receiver_id: shellAccounts[i + 1],
          amount: amt,
          timestamp: dynamicTimestamp(40 - i * 5),
        });

        suspiciousAccounts.push({
          account_id: shellAccounts[i],
          score: 80 + Math.floor(Math.random() * 18),
          reasons: [
            i === 0 ? "Shell Chain Initiation Point" : "Mid-chain shell intermediary",
            "Suspicious rapid layering relay",
            `Hop ${i + 1} of the sequential chain`
          ]
        });
      }

      // Add last one as suspicious too
      suspiciousAccounts.push({
        account_id: shellAccounts[chainLength - 1],
        score: 90 + Math.floor(Math.random() * 10),
        reasons: ["Shell Chain Terminal Egress Node", "Rapid layering exit terminal"]
      });

      fraudRings.push({
        ring_id: `RING_SHELL_${Date.now().toString().slice(-6)}`,
        type: "other",
        accounts: shellAccounts,
        cycle_length: chainLength
      });
      break;
    }

    case "layered": {
      scenarioName = "Cross-Border Layering Corridor";
      // Country routing path: IN -> UAE -> SG -> CAYMAN
      const nodes = [randAcc("IN_CORR"), randAcc("UAE_ROUT"), randAcc("SG_ROUT"), randAcc("KY_CAYMAN")];
      const baseAmt = 100000 + Math.floor(Math.random() * 80000); // 100k to 180k

      for (let i = 0; i < nodes.length - 1; i++) {
        const amt = Number((baseAmt - i * (1000 + Math.random() * 500)).toFixed(2));
        transactions.push({
          transaction_id: randTxId("LAY_CORR"),
          sender_id: nodes[i],
          receiver_id: nodes[i + 1],
          amount: amt,
          timestamp: dynamicTimestamp(45 - i * 10),
        });

        suspiciousAccounts.push({
          account_id: nodes[i],
          score: 85 + Math.floor(Math.random() * 15),
          reasons: [
            i === 0 ? "Offshore export seed node" : "Cross-border intermediate router",
            "OFAC-monitored transit corridor exposure",
            `Global path node ${i + 1}`
          ]
        });
      }

      // Terminal node
      suspiciousAccounts.push({
        account_id: nodes[nodes.length - 1],
        score: 96 + Math.floor(Math.random() * 4),
        reasons: ["Tax Haven integration endpoint", "Ultimate beneficial ownership shield wallet"]
      });

      fraudRings.push({
        ring_id: `RING_LAYERING_${Date.now().toString().slice(-6)}`,
        type: "other",
        accounts: nodes,
        cycle_length: nodes.length
      });
      break;
    }

    case "velocity": {
      scenarioName = "High-Velocity Laundering";
      const emitter = randAcc("VEL_EMIT");
      const receiver = randAcc("VEL_RECV");
      const txsCount = 10 + Math.floor(Math.random() * 12); // 10 to 21 transactions

      // Extremely fast repetitive transfers
      for (let i = 0; i < txsCount; i++) {
        const amt = Number((1000 + Math.random() * 200).toFixed(2));
        transactions.push({
          transaction_id: randTxId("VEL_ATTACK"),
          sender_id: emitter,
          receiver_id: receiver,
          amount: amt,
          // Fractions of a minute apart
          timestamp: dynamicTimestamp(10 - i * 0.2),
        });
      }

      suspiciousAccounts.push(
        {
          account_id: emitter,
          score: 90 + Math.floor(Math.random() * 10),
          reasons: ["High-velocity transfer initiator", "Rapid repetitive structuring emission"]
        },
        {
          account_id: receiver,
          score: 82 + Math.floor(Math.random() * 15),
          reasons: ["Rapid high-frequency beneficiary", "Velocity layering integration node"]
        }
      );
      break;
    }

    case "insider": {
      scenarioName = "Anomalous Employee Threat";
      const employee = `EMP_${1000 + Math.floor(Math.random() * 9000)}_TREASURY`;
      const untrustedReceiver = randAcc("EXT_UNLISTED");
      const amount = Number((250000 + Math.random() * 350000).toFixed(2)); // $250k - $600k corporate sweep

      transactions.push({
        transaction_id: randTxId("INSIDER_SWEEP"),
        sender_id: employee,
        receiver_id: untrustedReceiver,
        amount,
        timestamp: dynamicTimestamp(6),
      });

      // Background filler
      const bgAccounts = Array.from({ length: 5 }, () => randAcc("NORM"));
      for (let i = 0; i < 8; i++) {
        transactions.push({
          transaction_id: randTxId("INSIDER_BG"),
          sender_id: bgAccounts[Math.floor(Math.random() * bgAccounts.length)],
          receiver_id: bgAccounts[Math.floor(Math.random() * bgAccounts.length)],
          amount: Number((1000 + Math.random() * 5000).toFixed(2)),
          timestamp: dynamicTimestamp(60 - i * 5),
        });
      }

      suspiciousAccounts.push(
        {
          account_id: employee,
          score: 99,
          reasons: ["Insider treasury asset sweep", "Out-of-hours unauthorized clearing access"]
        },
        {
          account_id: untrustedReceiver,
          score: 91,
          reasons: ["Unverified external clearing destination", "High integration profile risk"]
        }
      );
      break;
    }

    case "dark_web": {
      scenarioName = "Darknet Crypto Wash Out";
      const mixerNode = `MIXER_NODE_${Math.floor(1000 + Math.random() * 9000)}`;
      const washMuleA = randAcc("MULE_WASH");
      const washMuleB = randAcc("MULE_WASH");
      const exchangeExit = randAcc("EXCHANGE_EXIT");
      const washAmount = 50000 + Math.floor(Math.random() * 40000); // 50k to 90k

      transactions.push(
        {
          transaction_id: randTxId("DARKNET_01"),
          sender_id: mixerNode,
          receiver_id: washMuleA,
          amount: washAmount,
          timestamp: dynamicTimestamp(16),
        },
        {
          transaction_id: randTxId("DARKNET_02"),
          sender_id: washMuleA,
          receiver_id: washMuleB,
          amount: Number((washAmount - (150 + Math.random() * 100)).toFixed(2)),
          timestamp: dynamicTimestamp(10),
        },
        {
          transaction_id: randTxId("DARKNET_03"),
          sender_id: washMuleB,
          receiver_id: exchangeExit,
          amount: Number((washAmount - (400 + Math.random() * 200)).toFixed(2)),
          timestamp: dynamicTimestamp(4),
        }
      );

      // Add normal transactions
      const norms = Array.from({ length: 4 }, () => randAcc("NORM"));
      for (let i = 0; i < 5; i++) {
        transactions.push({
          transaction_id: randTxId("DARK_BG"),
          sender_id: norms[i % norms.length],
          receiver_id: norms[(i + 1) % norms.length],
          amount: Number((500 + Math.random() * 2000).toFixed(2)),
          timestamp: dynamicTimestamp(30 - i * 4),
        });
      }

      suspiciousAccounts.push(
        {
          account_id: mixerNode,
          score: 99,
          reasons: ["Darknet market association", "OFAC-flagged tumbler routing address"]
        },
        {
          account_id: washMuleA,
          score: 94,
          reasons: ["Primary darknet transit intermediary", "Immediate value dispatching"]
        },
        {
          account_id: washMuleB,
          score: 89,
          reasons: ["Secondary darknet transit intermediary", "Immediate value layering relay"]
        },
        {
          account_id: exchangeExit,
          score: 95,
          reasons: ["Ultimate fiat cashout receiver", "Rapid structuring integration endpoint"]
        }
      );

      fraudRings.push({
        ring_id: `RING_WASH_${Date.now().toString().slice(-6)}`,
        type: "other",
        accounts: [mixerNode, washMuleA, washMuleB, exchangeExit],
        cycle_length: 4
      });
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
    suspicious_accounts: suspiciousAccounts,
    fraud_rings: fraudRings,
    smurfing: { fanIn: [], fanOut: [] },
    shell_chains: [],
    graph: { nodes, edges },
    summary: {
      total_transactions: transactions.length,
      total_accounts: allAccountIds.length,
      suspicious_accounts_count: suspiciousAccounts.length,
      fraud_rings_detected: fraudRings.length,
      smurfing_fan_in_detected: scenario === "smurfing" ? 1 : 0,
      smurfing_fan_out_detected: 0,
      shell_chains_detected: scenario === "shell_chain" ? 1 : 0,
      analysis_timestamp: new Date().toISOString(),
    }
  };

  return {
    transactions,
    result,
    scenarioName,
  };
};
