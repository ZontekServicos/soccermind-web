import { getDataSource } from "../config/data-source";
import { corinthiansSquad as defaultSquad } from "../data/corinthiansSquad";
import { searchPlayers } from "../../services/players";
import type { PlayerCardModel } from "../mappers/player.mapper";
import type { DnaScore, SquadLineup, SquadPlayer, SquadRiskLevel } from "../types/squad";

const SQUAD_STORAGE_KEY = "soccermind-squad";
const LINEUP_STORAGE_KEY = "soccermind-lineup";
const SPORTMONKS_PLACEHOLDER = "placeholder.png";

// ─── DNA approximation from FIFA-style stats ───────────────────────────────

export function approximateDNA(
  stats: SquadPlayer["stats"],
  position: string,
  age: number,
  overall: number,
): DnaScore {
  const { pace, shooting, passing, dribbling, defending, physical } = stats;
  const isGK = position === "Goleiro";

  const impact = isGK
    ? Math.round(defending * 0.7 + physical * 0.3)
    : Math.round(shooting * 0.45 + dribbling * 0.35 + pace * 0.2);

  const intelligence = Math.round(
    passing * 0.55 + dribbling * 0.3 + (isGK ? defending : shooting) * 0.15,
  );

  const defensiveIQ = Math.round(defending * 0.6 + physical * 0.4);

  const consistency = Math.round((passing + defending + physical) / 3);

  let boost = 0;
  if (age <= 18) boost = 22;
  else if (age <= 20) boost = 17;
  else if (age <= 22) boost = 11;
  else if (age <= 24) boost = 7;
  else if (age <= 26) boost = 3;
  else if (age <= 28) boost = 1;
  else if (age <= 30) boost = 0;
  else boost = -(age - 30) * 4;

  return {
    impact,
    intelligence,
    defensiveIQ,
    consistency,
    potential: Math.min(99, Math.max(1, overall + boost)),
  };
}

// ─── Map API PlayerCardModel → SquadPlayer ─────────────────────────────────

function mapApiPlayerToSquad(apiPlayer: PlayerCardModel): SquadPlayer {
  const stats = {
    pace: apiPlayer.attributes.pace ?? 65,
    shooting: apiPlayer.attributes.shooting ?? 65,
    passing: apiPlayer.attributes.passing ?? 65,
    dribbling: apiPlayer.attributes.dribbling ?? 65,
    defending: apiPlayer.attributes.defending ?? 65,
    physical: apiPlayer.attributes.physical ?? 65,
  };

  const overall = apiPlayer.overall ?? 65;
  const age = apiPlayer.age ?? 25;
  const dna = approximateDNA(stats, apiPlayer.position, age, overall);

  const rawImage = apiPlayer.image;
  const hasRealImage =
    typeof rawImage === "string" && rawImage.length > 0 && !rawImage.includes(SPORTMONKS_PLACEHOLDER);

  return {
    id: apiPlayer.id,
    name: apiPlayer.name,
    number: 0,
    position: apiPlayer.position,
    age,
    nationality: apiPlayer.nationality,
    overallRating: overall,
    capitalEfficiency: 7.0,
    riskLevel: "MEDIUM" as SquadRiskLevel,
    contractUntil: "2026-12",
    marketValue: apiPlayer.marketValueLabel || "N/D",
    image: hasRealImage ? rawImage : null,
    potential: typeof apiPlayer.potential === "number" ? apiPlayer.potential : undefined,
    dna,
    stats,
  };
}

// ─── Storage helpers ────────────────────────────────────────────────────────

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function buildInitialLineup(squad: SquadPlayer[]): SquadLineup {
  const lineup: SquadLineup = {};

  squad.forEach((player) => {
    if (player.fieldPosition && !lineup[player.fieldPosition]) {
      lineup[player.fieldPosition] = player;
    }
  });

  return lineup;
}

function sanitizeLineup(lineup: SquadLineup | null, squad: SquadPlayer[]) {
  if (!lineup) {
    return buildInitialLineup(squad);
  }

  const squadById = new Map(squad.map((player) => [player.id, player]));
  const sanitized: SquadLineup = {};

  Object.entries(lineup).forEach(([position, player]) => {
    const currentPlayer = squadById.get(player.id);
    if (currentPlayer) {
      sanitized[position] = currentPlayer;
    }
  });

  return sanitized;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getSquadSnapshot() {
  const source = getDataSource("squad");
  const storedSquad = readStorage<SquadPlayer[]>(SQUAD_STORAGE_KEY);
  const squad = source === "mock" ? storedSquad ?? defaultSquad : storedSquad ?? defaultSquad;

  return squad;
}

export function getLineupSnapshot(squad = getSquadSnapshot()) {
  const storedLineup = readStorage<SquadLineup>(LINEUP_STORAGE_KEY);
  return sanitizeLineup(storedLineup, squad);
}

export async function getSquadData() {
  const squad = getSquadSnapshot();
  const lineup = getLineupSnapshot(squad);

  return {
    data: { squad, lineup },
    meta: { source: getDataSource("squad") },
  };
}

export function persistSquad(squad: SquadPlayer[]) {
  writeStorage(SQUAD_STORAGE_KEY, squad);
}

export function persistLineup(lineup: SquadLineup) {
  writeStorage(LINEUP_STORAGE_KEY, lineup);
}

/**
 * Load Corinthians squad from the API, enriching each player with DNA scores
 * derived from their attributes. Falls back to local mock data on failure.
 */
export async function loadCorinthiansSquad(): Promise<{ players: SquadPlayer[]; fromApi: boolean }> {
  try {
    const response = await searchPlayers({ team: "Corinthians", limit: 100 });

    if (response.success && Array.isArray(response.data) && response.data.length > 0) {
      const players = response.data.map(mapApiPlayerToSquad);
      return { players, fromApi: true };
    }
  } catch {
    // fall through to mock
  }

  // Enrich the mock squad with approximate DNA too
  const enrichedMock = defaultSquad.map((p) => ({
    ...p,
    dna: approximateDNA(p.stats, p.position, p.age, p.overallRating),
  }));

  return { players: enrichedMock, fromApi: false };
}
