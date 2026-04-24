/**
 * Two label badge variants:
 *
 * LabelBadge       — scouting label (ELITE_PROSPECT, RISING_STAR, VALUE_PICK, STABLE, DECLINING)
 * PlayerLevelBadge — overall-based tier label (Ícone → Promessa)
 */
import { Gem, Rocket, Star, TrendingDown, Trophy } from "lucide-react";
import type { ScoutingLabel } from "../../../services/scouting";

// ─── Scouting label config ─────────────────────────────────────────────────────

export const LABEL_CONFIG: Record<
  ScoutingLabel,
  { label: string; color: string; bg: string; border: string; glow: string; Icon: React.ElementType }
> = {
  ELITE_PROSPECT: {
    label: "Elite Prospect",
    color: "#FFD700",
    bg: "rgba(255,215,0,0.12)",
    border: "rgba(255,215,0,0.35)",
    glow: "rgba(255,215,0,0.15)",
    Icon: Trophy,
  },
  RISING_STAR: {
    label: "Rising Star",
    color: "#00C2FF",
    bg: "rgba(0,194,255,0.12)",
    border: "rgba(0,194,255,0.35)",
    glow: "rgba(0,194,255,0.12)",
    Icon: Rocket,
  },
  VALUE_PICK: {
    label: "Value Pick",
    color: "#7A5CFF",
    bg: "rgba(122,92,255,0.14)",
    border: "rgba(122,92,255,0.35)",
    glow: "rgba(122,92,255,0.12)",
    Icon: Gem,
  },
  STABLE: {
    label: "Stable",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.22)",
    glow: "transparent",
    Icon: Star,
  },
  DECLINING: {
    label: "Declining",
    color: "#FF4D4F",
    bg: "rgba(255,77,79,0.10)",
    border: "rgba(255,77,79,0.28)",
    glow: "rgba(255,77,79,0.08)",
    Icon: TrendingDown,
  },
};

// ─── LabelBadge ───────────────────────────────────────────────────────────────

export function LabelBadge({ scoutingLabel }: { scoutingLabel: ScoutingLabel }) {
  const cfg = LABEL_CONFIG[scoutingLabel];
  const { Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── PlayerLevelBadge ─────────────────────────────────────────────────────────

export function getPlayerLevel(overall: number | null) {
  const v = overall ?? 0;
  if (v >= 90) return { label: "Ícone",    color: "#FFD700", bg: "rgba(255,215,0,0.14)",   border: "rgba(255,215,0,0.35)" };
  if (v >= 85) return { label: "Elite",    color: "#00FF9C", bg: "rgba(0,255,156,0.12)",   border: "rgba(0,255,156,0.32)" };
  if (v >= 78) return { label: "Premium",  color: "#00C2FF", bg: "rgba(0,194,255,0.12)",   border: "rgba(0,194,255,0.3)" };
  if (v >= 70) return { label: "Destaque", color: "#7A5CFF", bg: "rgba(122,92,255,0.13)",  border: "rgba(122,92,255,0.3)" };
  if (v >= 62) return { label: "Regular",  color: "#FBBF24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)" };
  if (v >= 54) return { label: "Básico",   color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.25)" };
  return             { label: "Promessa",  color: "#C084FC", bg: "rgba(192,132,252,0.11)", border: "rgba(192,132,252,0.28)" };
}

export function PlayerLevelBadge({ overall }: { overall: number | null }) {
  const lvl = getPlayerLevel(overall);
  return (
    <span
      className="rounded-[8px] border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: lvl.color, background: lvl.bg, borderColor: lvl.border }}
    >
      {lvl.label}
    </span>
  );
}
