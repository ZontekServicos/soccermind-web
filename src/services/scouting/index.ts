import { apiFetch } from "../../app/services/api";
import type { ApiEnvelope } from "../../app/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScoutingLabel =
  | "ELITE_PROSPECT"
  | "RISING_STAR"
  | "VALUE_PICK"
  | "STABLE"
  | "DECLINING";

export interface ScoutingRankingEntry {
  rank:           number;
  playerId:       string;
  name:           string;
  age:            number | null;
  positions:      string[];
  team:           string | null;
  league:         string | null;
  nationality:    string | null;
  imagePath:      string | null;
  overall:        number | null;
  potential:      number | null;
  marketValue:    number | null;
  scoutingTotal:  number;
  scoutingLabel:  ScoutingLabel;
  trendDirection: "rising" | "stable" | "declining";
  trendDelta:     number;
  slopePerYear:   number;
  seasonCount:    number;
  breakdown: {
    overallScore:  number;
    trendScore:    number;
    valueScore:    number;
    ceilingScore:  number;
  };
}

export interface ScoutingRankingParams {
  position?:   string;
  leagueId?:   string;
  ageMin?:     number;
  ageMax?:     number;
  overallMin?: number;
  label?:      ScoutingLabel;
  limit?:      number;
}

interface ScoutingRankingResponse {
  data:  ScoutingRankingEntry[];
  meta?: { total?: number };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getScoutingRanking(
  params: ScoutingRankingParams = {},
): Promise<ApiEnvelope<ScoutingRankingEntry[]>> {
  const qs = new URLSearchParams();

  if (params.position)            qs.set("position",   params.position);
  if (params.leagueId)            qs.set("leagueId",   params.leagueId);
  if (params.ageMin   != null)    qs.set("ageMin",     String(params.ageMin));
  if (params.ageMax   != null)    qs.set("ageMax",     String(params.ageMax));
  if (params.overallMin != null)  qs.set("overallMin", String(params.overallMin));
  if (params.label)               qs.set("label",      params.label);
  if (params.limit    != null)    qs.set("limit",      String(params.limit));

  const query = qs.toString();
  const url   = `/scouting/ranking${query ? `?${query}` : ""}`;

  const envelope = await apiFetch<ScoutingRankingResponse | ScoutingRankingEntry[]>(url);

  // The backend wraps results in { data: [...], meta: { total } }
  // apiFetch already unwraps one level (envelope.data) — handle both shapes
  const raw = envelope.data;
  const players: ScoutingRankingEntry[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as ScoutingRankingResponse).data)
      ? (raw as ScoutingRankingResponse).data
      : [];

  const total = Array.isArray(raw)
    ? undefined
    : (raw as ScoutingRankingResponse).meta?.total;

  return {
    ...envelope,
    data: players,
    meta: { ...envelope.meta, total },
  } as ApiEnvelope<ScoutingRankingEntry[]>;
}
