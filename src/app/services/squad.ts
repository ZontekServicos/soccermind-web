import { getDataSource } from "../config/data-source";
import { corinthiansSquad as defaultSquad } from "../data/corinthiansSquad";
import { searchPlayers } from "../../services/players";
import type { PlayerCardModel } from "../mappers/player.mapper";
import type { DnaScore, SquadLineup, SquadPlayer, SquadRiskLevel } from "../types/squad";

const SQUAD_STORAGE_KEY = "soccermind-squad";
const LINEUP_STORAGE_KEY = "soccermind-lineup";
const SPORTMONKS_PLACEHOLDER = "placeholder.png";

// ─── Position normalisation ────────────────────────────────────────────────
// Maps Sportmonks / API English position strings to the squad module's
// internal Portuguese vocabulary, which must match the `compatiblePositions`
// arrays defined in the formations object in Squad.tsx.

const API_TO_SQUAD_POSITION: Record<string, string> = {
  // ── Generic roles ──────────────────────────────────────────────────────────
  GOALKEEPER:                   "Goleiro",
  DEFENDER:                     "Zagueiro",
  MIDFIELDER:                   "Volante",     // ← Sportmonks generic
  MIDFIELD:                     "Volante",
  ATTACKER:                     "Atacante",
  FORWARD:                      "Atacante",
  STRIKER:                      "Atacante",
  WINGER:                       "Atacante",

  // ── Defenders (space variants) ─────────────────────────────────────────────
  "CENTRE BACK":                "Zagueiro",
  "CENTER BACK":                "Zagueiro",
  "CENTRAL DEFENDER":           "Zagueiro",
  "LEFT BACK":                  "Lateral Esquerdo",
  "RIGHT BACK":                 "Lateral Direito",
  "LEFT WING BACK":             "Lateral Esquerdo",
  "RIGHT WING BACK":            "Lateral Direito",
  WINGBACK:                     "Lateral Esquerdo",

  // ── Defenders (hyphen variants — Sportmonks returns these) ─────────────────
  "CENTRE-BACK":                "Zagueiro",
  "CENTER-BACK":                "Zagueiro",
  "LEFT-BACK":                  "Lateral Esquerdo",
  "RIGHT-BACK":                 "Lateral Direito",
  "LEFT WING-BACK":             "Lateral Esquerdo",
  "RIGHT WING-BACK":            "Lateral Direito",
  "WING-BACK":                  "Lateral Esquerdo",

  // ── Midfielders (space + -ER variants) ────────────────────────────────────
  "DEFENSIVE MIDFIELD":         "Volante",
  "DEFENSIVE MIDFIELDER":       "Volante",
  "CENTRAL MIDFIELD":           "Volante",
  "CENTRAL MIDFIELDER":         "Volante",
  "CENTRE MIDFIELD":            "Volante",
  "CENTRE MIDFIELDER":          "Volante",
  "CENTER MIDFIELD":            "Volante",
  "CENTER MIDFIELDER":          "Volante",
  "ATTACKING MIDFIELD":         "Meia Atacante",
  "ATTACKING MIDFIELDER":       "Meia Atacante",
  "LEFT MIDFIELD":              "Meia Atacante",
  "LEFT MIDFIELDER":            "Meia Atacante",
  "RIGHT MIDFIELD":             "Meia Atacante",
  "RIGHT MIDFIELDER":           "Meia Atacante",

  // ── Midfielders (hyphen variants) ─────────────────────────────────────────
  "DEFENSIVE-MIDFIELDER":       "Volante",
  "CENTRAL-MIDFIELDER":         "Volante",
  "ATTACKING-MIDFIELDER":       "Meia Atacante",

  // ── Forwards ──────────────────────────────────────────────────────────────
  "LEFT WINGER":                "Atacante",
  "RIGHT WINGER":               "Atacante",
  "LEFT-WINGER":                "Atacante",
  "RIGHT-WINGER":               "Atacante",
  "CENTRE FORWARD":             "Atacante",
  "CENTRE-FORWARD":             "Atacante",
  "CENTER FORWARD":             "Atacante",
  "SECOND STRIKER":             "Meia Atacante",

  // ── Short codes ────────────────────────────────────────────────────────────
  GK:  "Goleiro",
  CB:  "Zagueiro",
  LB:  "Lateral Esquerdo",
  RB:  "Lateral Direito",
  LWB: "Lateral Esquerdo",
  RWB: "Lateral Direito",
  CDM: "Volante",
  DM:  "Volante",
  CM:  "Volante",
  LM:  "Meia Atacante",
  RM:  "Meia Atacante",
  CAM: "Meia Atacante",
  AM:  "Meia Atacante",
  LW:  "Atacante",
  RW:  "Atacante",
  SS:  "Meia Atacante",
  CF:  "Atacante",
  ST:  "Atacante",
  FW:  "Atacante",
};

function toSquadPosition(apiPosition: string): string {
  if (!apiPosition) return apiPosition;

  // Normalise: strip diacritics, collapse whitespace, uppercase
  const key = apiPosition.trim().toUpperCase().replace(/\s+/g, " ");

  if (API_TO_SQUAD_POSITION[key]) return API_TO_SQUAD_POSITION[key];

  // Fuzzy keyword fallback for unexpected API strings
  if (key.includes("GOAL"))                                       return "Goleiro";
  if (key.includes("ATTACK") && key.includes("MID"))             return "Meia Atacante";
  if (key.includes("LEFT")   && key.includes("MID"))             return "Meia Atacante";
  if (key.includes("RIGHT")  && key.includes("MID"))             return "Meia Atacante";
  if (key.includes("MID"))                                        return "Volante";
  if (key.includes("LEFT")   && key.includes("BACK"))            return "Lateral Esquerdo";
  if (key.includes("RIGHT")  && key.includes("BACK"))            return "Lateral Direito";
  if (key.includes("LEFT")   && (key.includes("WING") || key.includes("FLANK"))) return "Lateral Esquerdo";
  if (key.includes("RIGHT")  && (key.includes("WING") || key.includes("FLANK"))) return "Lateral Direito";
  if (key.includes("BACK") || key.includes("DEFEND"))            return "Zagueiro";
  if (key.includes("WING") || key.includes("WINGER"))            return "Atacante";
  if (key.includes("FORWARD") || key.includes("STRIKER"))        return "Atacante";
  if (key.includes("ATTACK"))                                     return "Atacante";

  // Unknown — return as-is and let the validation catch it
  return apiPosition;
}

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
    position: toSquadPosition(apiPlayer.position),
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

/** Re-normalise cached players so old localStorage entries with raw API positions
 *  (e.g. "Midfielder", "Centre-Back") are correctly mapped to Portuguese vocab. */
function normalizeSquad(players: SquadPlayer[]): SquadPlayer[] {
  return players.map((p) => ({ ...p, position: toSquadPosition(p.position) }));
}

export function getSquadSnapshot() {
  const storedSquad = readStorage<SquadPlayer[]>(SQUAD_STORAGE_KEY);
  const raw = storedSquad ?? defaultSquad;
  return normalizeSquad(raw);
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
 * Load any team's squad from the API.
 * Falls back to Corinthians mock data only when the requested team is Corinthians.
 */
export async function loadTeamSquad(team: string): Promise<{ players: SquadPlayer[]; fromApi: boolean }> {
  try {
    const response = await searchPlayers({ team, limit: 100 });
    if (response.success && Array.isArray(response.data) && response.data.length > 0) {
      return { players: response.data.map(mapApiPlayerToSquad), fromApi: true };
    }
  } catch {
    // fall through
  }

  // Only use Corinthians mock data as fallback for Corinthians
  if (team.toLowerCase().includes("corinthians")) {
    const enriched = defaultSquad.map((p) => ({
      ...p,
      dna: approximateDNA(p.stats, p.position, p.age, p.overallRating),
    }));
    return { players: enriched, fromApi: false };
  }

  return { players: [], fromApi: false };
}

/** @deprecated Use loadTeamSquad("Corinthians") */
export async function loadCorinthiansSquad(): Promise<{ players: SquadPlayer[]; fromApi: boolean }> {
  return loadTeamSquad("Corinthians");
}
