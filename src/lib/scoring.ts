import { SuspiciousAccount } from "@/types/fraud";

export interface DetectionWeights {
  cycle: number;       // default 1.0 — multiplies cycle contributions
  velocity: number;    // default 1.0 — multiplies smurfing/fan-in/out + high-velocity contributions
  shell: number;       // default 1.0 — multiplies shell-chain & shell-tx-count contributions
}

export const DEFAULT_WEIGHTS: DetectionWeights = { cycle: 1.0, velocity: 1.0, shell: 1.0 };

export interface ScoreBreakdown {
  cycle: number;
  velocity: number;
  shell: number;
  falsePositivePenalty: number;
}

// Parse a single reason string into its category + raw point contribution.
// Mirrors the weighting in supabase/functions/analyze-transactions/index.ts (scoreAccounts).
function pointsForReason(reason: string): { category: keyof ScoreBreakdown; points: number } | null {
  if (reason === "Cycle participant") return { category: "cycle", points: 40 };

  // Velocity / smurfing family
  if (reason.startsWith("Fan-in receiver")) return { category: "velocity", points: 30 };
  if (reason === "Fan-in participant") return { category: "velocity", points: 10 };
  if (reason.startsWith("Fan-out sender")) return { category: "velocity", points: 30 };
  if (reason.startsWith("High velocity")) {
    const m = reason.match(/\(([\d.]+)\s*tx\/hr\)/);
    if (m) {
      const v = parseFloat(m[1]);
      const bonus = Math.min(20, Math.floor(v * 2));
      return { category: "velocity", points: bonus };
    }
    return { category: "velocity", points: 0 };
  }

  // Shell family
  if (reason === "Shell chain node") return { category: "shell", points: 10 };
  if (reason === "Shell account (low tx count)") return { category: "shell", points: 10 };

  // False-positive markers (applied unweighted)
  if (reason.startsWith("Payroll-like")) return { category: "falsePositivePenalty", points: 25 };
  if (reason === "Regular daily sender") return { category: "falsePositivePenalty", points: 15 };

  return null;
}

export function computeBreakdown(reasons: string[]): ScoreBreakdown {
  const b: ScoreBreakdown = { cycle: 0, velocity: 0, shell: 0, falsePositivePenalty: 0 };
  for (const r of reasons) {
    const p = pointsForReason(r);
    if (!p) continue;
    b[p.category] += p.points;
  }
  return b;
}

export function applyWeights(breakdown: ScoreBreakdown, w: DetectionWeights): number {
  const raw =
    breakdown.cycle * w.cycle +
    breakdown.velocity * w.velocity +
    breakdown.shell * w.shell;
  const adjusted = raw - breakdown.falsePositivePenalty;
  return Math.min(100, Math.max(0, Math.round(adjusted)));
}

export function rescoreAccounts(
  accounts: SuspiciousAccount[],
  weights: DetectionWeights,
): SuspiciousAccount[] {
  return accounts
    .map(a => {
      const breakdown = computeBreakdown(a.reasons);
      const score = applyWeights(breakdown, weights);
      return { ...a, score };
    })
    .filter(a => a.score > 5)
    .sort((a, b) => b.score - a.score);
}
