import { apiFetch } from "../../app/services/api";
import type { ApiEnvelope } from "../../app/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScoutingLabel =
  | "ELITE_PROSPECT"
  | "RISING_STAR"
  | "VALUE_PICK"
  | "STABLE"
  | "DECLINING";

export type TrendDirection = "rising" | "stable" | "declining";

export interface HiddenGemScoutingScore {
  total:    number;
  label:    ScoutingLabel;
  breakdown: {
    overallScore:  number;
    trendScore:    number;
    valueScore:    number;
    ceilingScore:  number;
  };
}

export interface HiddenGemEntry {
  id:             string;
  name:           string;
  team:           string | null;
  league:         string | null;
  nationality:    string | null;
  age:            number | null;
  positions:      string[];
  overall:        number | null;
  potential:      number | null;
  marketValue:    number | null;
  imagePath:      string | null;
  dnaScore:       Record<string, unknown> | null;
  valueScore:     number | null;
  scoutingScore:  HiddenGemScoutingScore;
  trendDirection: TrendDirection;
  trendDelta:     number;
  seasonCount:    number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getHiddenGems(limit = 20): Promise<ApiEnvelope<HiddenGemEntry[]>> {
  const url = `/players/hidden-gems?limit=${Math.min(limit, 50)}`;
  return apiFetch<HiddenGemEntry[]>(url);
}
