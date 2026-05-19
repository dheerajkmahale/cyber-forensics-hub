import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageMap: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  kn: "Kannada",
  te: "Telugu",
  ta: "Tamil",
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
${(context.top_suspects || []).map((a: { id: string; score: number; reasons: string[] }) =>
  `  • ${a.id}: Score ${a.score}/100 — ${(a.reasons || []).join(', ')}`
).join('\n') || '  None'}

DETECTED FRAUD RINGS:
${(context.fraud_rings || []).map((r: { id: string; type?: string; members: number; accounts: string[] }) =>
  `  • ${r.id} (${r.type?.replace(/_/g, ' ')}): ${r.members} accounts — ${(r.accounts || []).join(', ')}...`
).join('\n') || '  None'}

SMURFING DETAIL:
Fan-in (many→one): ${(context.smurfing_detail?.fanIn || []).map((fi: { receiver: string; count: number }) => `${fi.receiver} ← ${fi.count} senders`).join(', ') || 'None'}
Fan-out (one→many): ${(context.smurfing_detail?.fanOut || []).map((fo: { sender: string; count: number }) => `${fo.sender} → many`).join(', ') || 'None'}`;
    }

    const systemPrompt = `You are "CyberShield AI", an expert financial forensics assistant for the Money Muling Detection Engine.
Your goal is to help fraud investigators analyze suspicious transaction patterns.

STRICT LANGUAGE RULE:
- Configured Language: ${langName}
- You MUST respond ENTIRELY in ${langName} — no exceptions.
- Do NOT mix languages. Do NOT include any words from other languages unless they are proper nouns (e.g. account IDs).
- If the user's question is in a different language, detect the intent and answer ONLY in ${langName}.
- Respond in clear, natural, standard ${langName} script (e.g., Devanagari for Hindi, Kannada script for Kannada, Telugu script for Telugu, Tamil script for Tamil).
- For technical terms, you can use the English term in brackets if helpful — e.g. "संदिग्ध खाता (Suspicious Account)" or "ವಂಚನೆ ಜಾಲ (Fraud Ring)".
- Be brief and direct for high-performance voice output.`;

FRAUD DETECTION KNOWLEDGE:
- Money Muling: Moving illicit funds through multiple accounts.
- Cycle Detection: A → B → C → A loops used for money laundering.
- Smurfing (Fan-in): Many small deposits into one account (aggregation).
- Smurfing (Fan-out): One account distributing small amounts to many (dispersal).
- Shell Account Chains: Short-lived accounts with low activity, used as laundering layers.
- Suspicion Scoring: High score (70-100) indicates high risk of fraud.

CURRENT SCREEN: ${screen.toUpperCase()}
${screenContext}

ANALYSIS DATA SUMMARY:
${dataContext}

RESPONSE STYLE:
1. Keep it professional, concise, and helpful — ideal for voice playback.
2. Limit response to 2-4 short sentences.
3. Mention Account IDs, Scores, and Ring IDs when the data is available.
4. Maintain the persona of a high-tech forensic AI tool.
5. ALWAYS respond in ${langName} only.`;

    const wrappedMessage = `User query: "${safeMessage}"

⚠️ FINAL REMINDER: Your language is strictly set to ${langName}.
Do NOT respond in any other language under any circumstances.
Respond naturally as a voice assistant — keep it concise (2-4 sentences) and in ${langName} only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: wrappedMessage },
        ],
        max_tokens: 450,
        temperature: 0.3,
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
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error("empty_response");

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
