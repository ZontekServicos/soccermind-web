import { getDataSource } from "../config/data-source";
import { corinthiansSquad as defaultSquad } from "../data/corinthiansSquad";
import type { SquadLineup, SquadPlayer } from "../types/squad";

const SQUAD_STORAGE_KEY = "soccermind-squad";
const LINEUP_STORAGE_KEY = "soccermind-lineup";

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
