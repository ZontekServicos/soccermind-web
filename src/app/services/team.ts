import { apiFetch } from "./api";

export async function getTeamAnalysis(params: Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return apiFetch<unknown>(`/team/analysis${query ? `?${query}` : ""}`);
}

// ---------------------------------------------------------------------------
// Team Profile
// ---------------------------------------------------------------------------

export interface TeamSquadPlayer {
  id: string;
  name: string;
  positions: string[];
  age: number;
  nationality: string;
  image: string | null;
  overall: number | null;
  potential: number | null;
  marketValue: number | null;
  attributes: {
    pace: number | null;
    shooting: number | null;
    passing: number | null;
    dribbling: number | null;
    defending: number | null;
    physical: number | null;
  };
  dna: {
    impact: number;
    intelligence: number;
    defensiveIQ: number;
    consistency: number;
    potential: number;
  } | null;
}

export interface TeamProfile {
  team: {
    id: string;
    externalId: number;
    name: string;
    shortCode: string | null;
    logoPath: string | null;
    country: string | null;
    latestSeason: string | null;
  };
  squad: TeamSquadPlayer[];
  stats: {
    totalPlayers: number;
    scoredPlayers: number;
    avgOverall: number;
    avgPotential: number;
    avgPace: number;
    avgShooting: number;
    avgPassing: number;
    avgDribbling: number;
    avgDefending: number;
    avgPhysical: number;
    dnaAvg: {
      impact: number;
      intelligence: number;
      defensiveIQ: number;
      consistency: number;
      potential: number;
    };
    positionDistribution: Array<{
      position: string;
      count: number;
      avgOverall: number | null;
    }>;
  };
}

export async function getTeamProfile(name: string) {
  return apiFetch<TeamProfile>(`/teams/profile?name=${encodeURIComponent(name)}`);
}
