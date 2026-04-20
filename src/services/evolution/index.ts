import { apiFetch } from "../../app/services/api";
import type { ApiEnvelope } from "../../app/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeasonPoint {
  seasonYear:  number;
  seasonLabel: string | null;
  overall:     number | null;
  goals:       number | null;
  assists:     number | null;
  minutes:     number | null;
  rating:      number | null;
  marketValue: number | null;
  leagueName:  string | null;
  teamName:    string | null;
}

export interface PlayerTrend {
  direction:    "rising" | "stable" | "declining";
  overallDelta: number;
  slopePerYear: number;
  trendScore:   number;
  seasonCount:  number;
  seasons:      SeasonPoint[];
}

export interface ScoutingScoreBreakdown {
  overallScore:  number;
  trendScore:    number;
  valueScore:    number;
  ceilingScore:  number;
}

export interface ScoutingScore {
  total:     number;
  label:     string;
  breakdown: ScoutingScoreBreakdown;
}

export interface PlayerEvolutionResult {
  playerId:       string;
  playerName:     string;
  age:            number | null;
  positions:      string[];
  currentOverall: number | null;
  trend:          PlayerTrend;
  scoutingScore:  ScoutingScore;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getPlayerEvolution(
  playerId: string,
): Promise<ApiEnvelope<PlayerEvolutionResult>> {
  return apiFetch<PlayerEvolutionResult>(`/player/${playerId}/evolution`);
}
