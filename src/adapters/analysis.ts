type UnknownRecord = Record<string, unknown>;

export interface AnalysisPlayerViewModel {
  id: string;
  name: string;
  club: string;
  positions: string[];
  order: number;
}

export interface AnalysisViewModel {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "comparison" | "report";
  typeLabel: string;
  players: string[];
  playerDetails: AnalysisPlayerViewModel[];
  user: string;
  club: string;
  status: "completed" | "in_progress" | "archived";
  statusLabel: string;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function mapType(value: unknown): AnalysisViewModel["type"] {
  return value === "COMPARISON" ? "comparison" : "report";
}

function mapStatus(value: unknown): AnalysisViewModel["status"] {
  switch (value) {
    case "COMPLETED":
      return "completed";
    case "ARCHIVED":
      return "archived";
    default:
      return "in_progress";
  }
}

function mapPlayers(value: unknown): AnalysisPlayerViewModel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((player, index) => ({
      id: toText(player.id, `player-${index}`),
      name: toText(player.name, "Jogador"),
      club: toText(player.club, ""),
      positions: Array.isArray(player.positions) ? player.positions.filter((item): item is string => typeof item === "string") : [],
      order: typeof player.order === "number" ? player.order : index,
    }))
    .sort((a, b) => a.order - b.order);
}

export function mapAnalysisResponse(source: unknown): AnalysisViewModel {
  const record = isRecord(source) ? source : {};
  const players = mapPlayers(record.players);

  return {
    id: toText(record.id, "N/A"),
    title: toText(record.title, "Analise"),
    description: toText(record.description, ""),
    date: toText(record.createdAt, new Date().toISOString()),
    type: mapType(record.type),
    typeLabel: toText(record.typeLabel, record.type === "COMPARISON" ? "Comparacao" : "Relatorio"),
    players: players.map((player) => player.name),
    playerDetails: players,
    user: toText(record.analyst, "Sistema SoccerMind"),
    club: players.map((player) => player.club).find(Boolean) ?? "SoccerMind",
    status: mapStatus(record.status),
    statusLabel: toText(record.statusLabel, "Em andamento"),
  };
}
