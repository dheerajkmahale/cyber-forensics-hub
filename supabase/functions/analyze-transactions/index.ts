import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Transaction {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: string;
}

interface RequestBody {
  transactions: Transaction[];
  fileName?: string;
  fileHash?: string;
}

const ID_PATTERN = /^[A-Za-z0-9._:-]{1,80}$/;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeId(value: unknown, field: string, row: number): string {
  if (typeof value !== "string") throw new Error(`Row ${row}: ${field} must be text`);
  // eslint-disable-next-line no-control-regex
  const sanitized = value.trim().replace(/[\u0000-\u001F\u007F<>`"'\\]/g, "");
  if (!ID_PATTERN.test(sanitized)) throw new Error(`Row ${row}: ${field} contains unsupported characters`);
  return sanitized;
}

function validateTransactions(input: unknown): Transaction[] {
  if (!Array.isArray(input)) throw new Error("Invalid transactions data");
  if (input.length > 10000) throw new Error("Maximum 10,000 transactions allowed");

  return input.map((tx, index) => {
    if (!tx || typeof tx !== "object") throw new Error(`Row ${index + 1}: invalid transaction`);
    const record = tx as Record<string, unknown>;
    const amount = typeof record.amount === "number" ? record.amount : Number(record.amount);
    const timestamp = typeof record.timestamp === "string" ? record.timestamp.trim() : "";
    const parsedTimestamp = new Date(timestamp);

    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000_000) {
      throw new Error(`Row ${index + 1}: amount is outside the accepted range`);
    }
    if (!timestamp || Number.isNaN(parsedTimestamp.getTime())) {
      throw new Error(`Row ${index + 1}: timestamp is not a valid date`);
    }

    return {
      transaction_id: sanitizeId(record.transaction_id, "transaction_id", index + 1),
      sender_id: sanitizeId(record.sender_id, "sender_id", index + 1),
      receiver_id: sanitizeId(record.receiver_id, "receiver_id", index + 1),
      amount,
      timestamp: parsedTimestamp.toISOString(),
    };
  });
}

interface GraphNode {
  id: string;
  outEdges: string[];
  inEdges: string[];
  transactions: Transaction[];
}

function buildGraph(transactions: Transaction[]): Map<string, GraphNode> {
  const graph = new Map<string, GraphNode>();
  const ensureNode = (id: string) => {
    if (!graph.has(id)) graph.set(id, { id, outEdges: [], inEdges: [], transactions: [] });
  };
  for (const tx of transactions) {
    ensureNode(tx.sender_id);
    ensureNode(tx.receiver_id);
    graph.get(tx.sender_id)!.outEdges.push(tx.receiver_id);
    graph.get(tx.receiver_id)!.inEdges.push(tx.sender_id);
    graph.get(tx.sender_id)!.transactions.push(tx);
  }
  return graph;
}

// Detect cycles of length 3–5 using DFS
function detectCycles(graph: Map<string, GraphNode>): string[][] {
  const cycles: string[][] = [];
  const nodes = Array.from(graph.keys());

  for (const startNode of nodes) {
    const dfs = (path: string[], visited: Set<string>) => {
      if (path.length > 5) return;
      const current = path[path.length - 1];
      const node = graph.get(current);
      if (!node) return;
      for (const neighbor of node.outEdges) {
        if (neighbor === startNode && path.length >= 3) {
          const cycle = [...path];
          const minIdx = cycle.indexOf(cycle.reduce((a, b) => a < b ? a : b));
          const normalized = [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
          const key = normalized.join(",");
          if (!cycles.some(c => c.join(",") === key)) cycles.push(normalized);
          continue;
        }
        if (!visited.has(neighbor) && neighbor >= startNode) {
          visited.add(neighbor);
          dfs([...path, neighbor], visited);
          visited.delete(neighbor);
        }
      }
    };
    dfs([startNode], new Set([startNode]));
  }
  return cycles;
}

// Smurfing: fan-in (10+ senders → 1 receiver) or fan-out (1 sender → 10+ receivers) within 72h
function detectSmurfing(transactions: Transaction[]): {
  fanIn: { receiver: string; senders: string[]; count: number }[];
  fanOut: { sender: string; receivers: string[]; count: number }[];
} {
  const windowMs = 72 * 60 * 60 * 1000;
  const txByTime = transactions.map(tx => ({ ...tx, ts: new Date(tx.timestamp).getTime() }));

  const fanIn: { receiver: string; senders: string[]; count: number }[] = [];
  const fanOut: { sender: string; receivers: string[]; count: number }[] = [];

  const byReceiver = new Map<string, typeof txByTime>();
  for (const tx of txByTime) {
    if (!byReceiver.has(tx.receiver_id)) byReceiver.set(tx.receiver_id, []);
    byReceiver.get(tx.receiver_id)!.push(tx);
  }
  for (const [receiver, txs] of byReceiver) {
    txs.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < txs.length; i++) {
      const window = txs.filter(t => t.ts >= txs[i].ts && t.ts <= txs[i].ts + windowMs);
      const uniqueSenders = [...new Set(window.map(t => t.sender_id))];
      if (uniqueSenders.length >= 10) {
        if (!fanIn.some(fi => fi.receiver === receiver))
          fanIn.push({ receiver, senders: uniqueSenders, count: uniqueSenders.length });
        break;
      }
    }
  }

  const bySender = new Map<string, typeof txByTime>();
  for (const tx of txByTime) {
    if (!bySender.has(tx.sender_id)) bySender.set(tx.sender_id, []);
    bySender.get(tx.sender_id)!.push(tx);
  }
  for (const [sender, txs] of bySender) {
    txs.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < txs.length; i++) {
      const window = txs.filter(t => t.ts >= txs[i].ts && t.ts <= txs[i].ts + windowMs);
      const uniqueReceivers = [...new Set(window.map(t => t.receiver_id))];
      if (uniqueReceivers.length >= 10) {
        if (!fanOut.some(fo => fo.sender === sender))
          fanOut.push({ sender, receivers: uniqueReceivers, count: uniqueReceivers.length });
        break;
      }
    }
  }
  return { fanIn, fanOut };
}

// Shell chain: chains of 3+ hops where intermediates have only 2-3 total transactions
function detectShellChains(graph: Map<string, GraphNode>, transactions: Transaction[]): string[][] {
  const txCountByAccount = new Map<string, number>();
  for (const tx of transactions) {
    txCountByAccount.set(tx.sender_id, (txCountByAccount.get(tx.sender_id) || 0) + 1);
    txCountByAccount.set(tx.receiver_id, (txCountByAccount.get(tx.receiver_id) || 0) + 1);
  }
  const isShell = (id: string) => { const c = txCountByAccount.get(id) || 0; return c >= 2 && c <= 3; };
  const chains: string[][] = [];
  const dfs = (path: string[], visited: Set<string>) => {
    if (path.length >= 3) {
      const intermediates = path.slice(1, -1);
      if (intermediates.every(n => isShell(n))) chains.push([...path]);
    }
    if (path.length >= 6) return;
    const node = graph.get(path[path.length - 1]);
    if (!node) return;
    for (const neighbor of node.outEdges) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        dfs([...path, neighbor], visited);
        visited.delete(neighbor);
      }
    }
  };
  for (const nodeId of graph.keys()) {
    dfs([nodeId], new Set([nodeId]));
  }
  const uniqueChains: string[][] = [];
  for (const chain of chains) {
    const key = chain.join(",");
    if (!uniqueChains.some(c => c.join(",").includes(key))) uniqueChains.push(chain);
  }
  return uniqueChains.slice(0, 100);
}

// -------------------------
// Advanced Suspicion Scoring
// Weights: Cycle=+40, Fan-in/out=+30, High velocity=+20, Shell=+10
// False positive controls: payroll-like and regular daily accounts are penalized/ignored
// -------------------------
function scoreAccounts(
  graph: Map<string, GraphNode>,
  cycles: string[][],
  smurfing: ReturnType<typeof detectSmurfing>,
  shellChains: string[][],
  transactions: Transaction[]
): { account_id: string; score: number; reasons: string[] }[] {
  const scores = new Map<string, { raw: number; reasons: string[] }>();
  const ensureScore = (id: string) => { if (!scores.has(id)) scores.set(id, { raw: 0, reasons: [] }); };

  // Detect payroll-like accounts: consistently large, regular amounts (false positive control)
  // An account is "payroll-like" if its sent amounts have <15% coefficient of variation AND avg > median * 0.85
  const bySenderAmounts = new Map<string, number[]>();
  const byReceiverAmounts = new Map<string, number[]>();
  const txByDaySender = new Map<string, Set<string>>(); // account -> set of date strings
  for (const tx of transactions) {
    if (!bySenderAmounts.has(tx.sender_id)) bySenderAmounts.set(tx.sender_id, []);
    bySenderAmounts.get(tx.sender_id)!.push(tx.amount);
    if (!byReceiverAmounts.has(tx.receiver_id)) byReceiverAmounts.set(tx.receiver_id, []);
    byReceiverAmounts.get(tx.receiver_id)!.push(tx.amount);
    // Track unique days
    const day = tx.timestamp.slice(0, 10);
    if (!txByDaySender.has(tx.sender_id)) txByDaySender.set(tx.sender_id, new Set());
    txByDaySender.get(tx.sender_id)!.add(day);
  }

  const isPayrollLike = (accountId: string): boolean => {
    const amounts = bySenderAmounts.get(accountId);
    if (!amounts || amounts.length < 5) return false;
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((a, b) => a + (b - avg) ** 2, 0) / amounts.length;
    const cv = Math.sqrt(variance) / avg;
    return cv < 0.15 && avg > 1000; // Consistent large amounts = payroll
  };

  const isRegularDaily = (accountId: string): boolean => {
    const days = txByDaySender.get(accountId);
    if (!days || days.size < 20) return false;
    // If sending every day for 20+ unique days = regular
    return true;
  };

  // ---- WEIGHTED SCORING ----

  // Cycle participation: +40
  for (const cycle of cycles) {
    for (const node of cycle) {
      ensureScore(node);
      const s = scores.get(node)!;
      s.raw += 40;
      if (!s.reasons.includes("Cycle participant")) s.reasons.push("Cycle participant");
    }
  }

  // Fan-in: receiver gets +30, each sender gets +10
  for (const fi of smurfing.fanIn) {
    ensureScore(fi.receiver);
    const s = scores.get(fi.receiver)!;
    s.raw += 30;
    s.reasons.push(`Fan-in receiver (${fi.count} senders)`);
    for (const sender of fi.senders) {
      ensureScore(sender);
      const ss = scores.get(sender)!;
      ss.raw += 10;
      if (!ss.reasons.includes("Fan-in participant")) ss.reasons.push("Fan-in participant");
    }
  }

  // Fan-out: sender gets +30
  for (const fo of smurfing.fanOut) {
    ensureScore(fo.sender);
    const s = scores.get(fo.sender)!;
    s.raw += 30;
    s.reasons.push(`Fan-out sender (${fo.count} receivers)`);
  }

  // High velocity: +20 (up to)
  const txTimestamps = new Map<string, number[]>();
  for (const tx of transactions) {
    if (!txTimestamps.has(tx.sender_id)) txTimestamps.set(tx.sender_id, []);
    txTimestamps.get(tx.sender_id)!.push(new Date(tx.timestamp).getTime());
  }
  for (const [account, timestamps] of txTimestamps) {
    if (timestamps.length < 2) continue;
    timestamps.sort((a, b) => a - b);
    const span = (timestamps[timestamps.length - 1] - timestamps[0]) / 3600000;
    if (span > 0) {
      const velocity = timestamps.length / span;
      if (velocity > 5) {
        ensureScore(account);
        const s = scores.get(account)!;
        const bonus = Math.min(20, Math.floor(velocity * 2));
        s.raw += bonus;
        s.reasons.push(`High velocity (${velocity.toFixed(1)} tx/hr)`);
      }
    }
  }

  // Shell account characteristic: +10
  const txCountByAccount = new Map<string, number>();
  for (const tx of transactions) {
    txCountByAccount.set(tx.sender_id, (txCountByAccount.get(tx.sender_id) || 0) + 1);
    txCountByAccount.set(tx.receiver_id, (txCountByAccount.get(tx.receiver_id) || 0) + 1);
  }
  for (const chain of shellChains) {
    for (const node of chain) {
      ensureScore(node);
      const s = scores.get(node)!;
      s.raw += 10;
      if (!s.reasons.includes("Shell chain node")) s.reasons.push("Shell chain node");
    }
  }

  // Shell account signature: 2-3 tx count (adds to raw)
  for (const [account, count] of txCountByAccount) {
    if (count >= 2 && count <= 3) {
      ensureScore(account);
      const s = scores.get(account)!;
      s.raw += 10;
      if (!s.reasons.includes("Shell account (low tx count)")) s.reasons.push("Shell account (low tx count)");
    }
  }

  // ---- FALSE POSITIVE REDUCTION ----
  // Reduce score for payroll-like or regular-daily accounts
  const result: { account_id: string; score: number; reasons: string[] }[] = [];
  for (const [account_id, { raw, reasons }] of scores) {
    if (raw <= 5) continue; // Below threshold

    let finalScore = raw;
    const fpReasons = [];

    if (isPayrollLike(account_id)) {
      finalScore = Math.max(0, finalScore - 25);
      fpReasons.push("Payroll-like pattern detected");
    }
    if (isRegularDaily(account_id)) {
      finalScore = Math.max(0, finalScore - 15);
      fpReasons.push("Regular daily sender");
    }

    const clampedScore = Math.min(100, Math.max(0, finalScore));
    if (clampedScore > 5) {
      result.push({ account_id, score: clampedScore, reasons: [...reasons, ...fpReasons] });
    }
  }

  return result.sort((a, b) => b.score - a.score);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Secure backend configuration missing" }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData.user) return jsonResponse({ error: "Invalid or expired session" }, 401);

    const body = await req.json() as RequestBody;
    const transactions = validateTransactions(body.transactions);

    // Load admin-tunable detection config + trusted account whitelist
    const { data: cfgRow } = await supabase
      .from("detection_config")
      .select("cycle_depth, fan_in_threshold, shell_chain_length")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const cfg = {
      cycle_depth: cfgRow?.cycle_depth ?? 4,
      fan_in_threshold: cfgRow?.fan_in_threshold ?? 10,
      shell_chain_length: cfgRow?.shell_chain_length ?? 3,
    };
    const { data: trustedRows } = await supabase.from("trusted_accounts").select("account_ref");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trustedSet = new Set<string>((trustedRows ?? []).map((r: any) => r.account_ref));

    const graph = buildGraph(transactions);
    const cycles = detectCycles(graph).filter((c) => c.length <= cfg.cycle_depth);
    const smurfing = detectSmurfing(transactions);
    smurfing.fanIn = smurfing.fanIn.filter((fi) => fi.count >= cfg.fan_in_threshold);
    const shellChains = detectShellChains(graph, transactions).filter((c) => c.length >= cfg.shell_chain_length);
    const scored = scoreAccounts(graph, cycles, smurfing, shellChains, transactions);
    // Apply trusted-account whitelist (false-positive control)
    const suspiciousAccounts = scored.filter((a) => !trustedSet.has(a.account_id));

    // Build fraud rings from cycles with type
    const fraudRings = cycles.map((cycle, i) => ({
      ring_id: `RING-${String(i + 1).padStart(3, "0")}`,
      accounts: cycle,
      cycle_length: cycle.length,
      type: "circular_routing",
    }));

    // Add smurfing rings
    smurfing.fanIn.slice(0, 20).forEach((fi, i) => {
      fraudRings.push({
        ring_id: `SMURF-IN-${String(i + 1).padStart(3, "0")}`,
        accounts: [fi.receiver, ...fi.senders.slice(0, 5)],
        cycle_length: fi.count,
        type: "smurfing",
      });
    });

    // Build graph output
    const allNodes = Array.from(graph.keys());
    const suspiciousSet = new Set(suspiciousAccounts.map(a => a.account_id));
    const graphNodes = allNodes.map(id => ({
      id,
      suspicious: suspiciousSet.has(id),
      score: suspiciousAccounts.find(a => a.account_id === id)?.score || 0,
    }));
    const graphEdges = transactions.slice(0, 2000).map(tx => ({
      source: tx.sender_id,
      target: tx.receiver_id,
      amount: tx.amount,
      transaction_id: tx.transaction_id,
      timestamp: tx.timestamp,
    }));

    const processingTimeMs = Date.now() - startTime;

    const summary = {
      total_transactions: transactions.length,
      total_accounts: graph.size,
      suspicious_accounts_count: suspiciousAccounts.length,
      fraud_rings_detected: cycles.length,
      smurfing_fan_in_detected: smurfing.fanIn.length,
      smurfing_fan_out_detected: smurfing.fanOut.length,
      shell_chains_detected: shellChains.length,
      analysis_timestamp: new Date().toISOString(),
      processing_time_ms: processingTimeMs,
    };

    const result = {
      suspicious_accounts: suspiciousAccounts,
      fraud_rings: fraudRings,
      smurfing,
      shell_chains: shellChains.slice(0, 50),
      graph: { nodes: graphNodes, edges: graphEdges },
      summary,
    };

    const { data: uploadRecord, error: uploadError } = await supabase
      .from("analysis_uploads")
      .insert({
        user_id: userData.user.id,
        file_name: typeof body.fileName === "string" ? body.fileName.slice(0, 180).replace(/[<>`"'\\]/g, "") : null,
        file_sha256: typeof body.fileHash === "string" && /^[a-f0-9]{64}$/i.test(body.fileHash) ? body.fileHash.toLowerCase() : null,
        transaction_count: summary.total_transactions,
        account_count: summary.total_accounts,
        suspicious_count: summary.suspicious_accounts_count,
        fraud_ring_count: summary.fraud_rings_detected,
        processing_time_ms: processingTimeMs,
      })
      .select("id")
      .single();

    if (uploadError) console.error("Audit upload log failed:", uploadError.message);
    if (uploadRecord?.id) {
      const { error: auditError } = await supabase.from("audit_logs").insert({
        user_id: userData.user.id,
        analysis_upload_id: uploadRecord.id,
        event_type: "analysis_performed",
        metadata: {
          transaction_count: summary.total_transactions,
          account_count: summary.total_accounts,
          suspicious_count: summary.suspicious_accounts_count,
          fraud_ring_count: summary.fraud_rings_detected,
          processing_time_ms: processingTimeMs,
        },
      });
      if (auditError) console.error("Audit event log failed:", auditError.message);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    const status = message.startsWith("Row ") || message.startsWith("Invalid ") || message.startsWith("Maximum ") ? 400 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
