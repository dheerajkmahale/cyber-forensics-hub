import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageMap: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  bn: "Bengali",
  gu: "Gujarati",
  pa: "Punjabi",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizePromptText(value: unknown): string {
  return String(value ?? "").replace(/[<>`\\]/g, "").slice(0, 1000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { message, language, context } = await req.json();
    const safeMessage = sanitizePromptText(message);
    if (!safeMessage.trim()) return jsonResponse({ error: "Message is required" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langName = languageMap[language] || "English";
    const screen = context?.screen || "upload";

    // Build context-aware screen instructions
    const screenContext = screen === "upload"
      ? `The user is on the UPLOAD PAGE. Help them understand:
- The app analyzes financial transactions to detect money muling (fraud).
- CSV format required: transaction_id, sender_id, receiver_id, amount, timestamp
- Example row: TX001,ACC001,ACC002,5000.00,2024-01-15T10:30:00Z
- Maximum 10,000 transactions per upload.
- After upload, click to analyze — results show in Graph, Fraud Table, and Summary tabs.`
      : screen === "graph"
      ? `The user is on the GRAPH VIEW PAGE. Help them understand:
- Red/orange nodes = suspicious accounts (higher score = more suspicious).
- Each colored cluster = a detected fraud ring.
- Click a ring in the legend to highlight all members.
- Filter buttons: ALL / SUSPICIOUS / CYCLES / SMURFING
- Hover over a node to see its account ID, suspicion score, and ring membership.
- Zoom (scroll) and pan (drag) are supported.`
      : `The user is on the SUMMARY/TABLE PAGE. Help them understand the results.`;

    // Build rich data context if available
    let dataContext = "No analysis data loaded yet. Ask the user to upload a CSV first.";
    if (context && context.total_accounts) {
      const suspicionRate = context.total_accounts > 0
        ? ((context.suspicious_accounts_count / context.total_accounts) * 100).toFixed(1)
        : "0";

      dataContext = `ANALYSIS RESULTS:
- Total transactions: ${context.total_transactions?.toLocaleString() || 0}
- Total unique accounts: ${context.total_accounts?.toLocaleString() || 0}
- Suspicious accounts flagged: ${context.suspicious_accounts_count} (${suspicionRate}% of total)
- Fraud rings detected: ${context.fraud_rings_count}
- Smurfing fan-in patterns: ${context.smurfing_fan_in}
- Smurfing fan-out patterns: ${context.smurfing_fan_out}
- Shell chains detected: ${context.shell_chains_count}
- Processing time: ${context.processing_time_ms ? (context.processing_time_ms / 1000).toFixed(2) + 's' : 'N/A'}

TOP SUSPICIOUS ACCOUNTS:
${(context.top_suspects || []).map((a: any) =>
  `  • ${a.id}: Score ${a.score}/100 — ${(a.reasons || []).join(', ')}`
).join('\n') || '  None'}

DETECTED FRAUD RINGS:
${(context.fraud_rings || []).map((r: any) =>
  `  • ${r.id} (${r.type?.replace(/_/g, ' ')}): ${r.members} accounts — ${(r.accounts || []).join(', ')}...`
).join('\n') || '  None'}

SMURFING DETAIL:
Fan-in (many→one): ${(context.smurfing_detail?.fanIn || []).map((fi: any) => `${fi.receiver} ← ${fi.count} senders`).join(', ') || 'None'}
Fan-out (one→many): ${(context.smurfing_detail?.fanOut || []).map((fo: any) => `${fo.sender} → many`).join(', ') || 'None'}`;
    }

    const systemPrompt = `You are an expert AI assistant for the "Money Muling Detection Engine" — a real-time financial crime analysis platform for fraud investigators.

LANGUAGE RULE: You MUST respond ONLY in ${langName}. Regardless of what language the user speaks, your entire response must be in ${langName}.

FRAUD DETECTION CONCEPTS YOU KNOW:
- Money Muling: Using innocent-seeming accounts to move illicit funds.
- Cycle Detection: Accounts that form circular money flows (A→B→C→A) to obscure the origin of funds.
- Smurfing (Fan-in): 10+ senders sending to a single receiver in 72 hours — indicates money aggregation.
- Smurfing (Fan-out): A single sender distributing to 10+ receivers — indicates money dispersal.
- Shell Account Chains: Layered accounts with only 2–3 transactions, used to obfuscate the trail.
- Suspicion Scoring: Weighted system — Cycle participation +40, Fan-in/out +30, High velocity +20, Shell account +10. False positives (payroll-like, regular daily patterns) are reduced.

CURRENT SCREEN CONTEXT:
${screenContext}

CURRENT ANALYSIS DATA:
${dataContext}

RESPONSE RULES:
1. Keep responses SHORT (2-4 sentences) — optimized for voice output.
2. Be specific when data is available — mention exact account IDs, scores, ring IDs.
3. For technical questions, give a simple explanation first, then details.
4. Always respond in ${langName} — even if the user writes in English or another language.
5. Be helpful, professional, and clear. Avoid jargon unless explaining it.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: safeMessage },
        ],
        max_tokens: 350,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({
          reply: "I'm currently rate limited. Please try again in a moment.",
          error: "Rate limit exceeded."
        }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          reply: "AI credits exhausted. Please add credits to your workspace.",
          error: "Payment required."
        }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voice assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
