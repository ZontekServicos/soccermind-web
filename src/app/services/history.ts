import { apiFetch, type ApiEnvelope } from "./api";
import { getDataSource } from "../config/data-source";

type UnknownRecord = Record<string, unknown>;

export interface AnalysisHistoryEntry {
  id: string;
  date: string;
  type: "Comparação" | "Relatório" | "Dashboard";
  players: string[];
  user: string;
  club: string;
  status: "Concluído" | "Em andamento" | "Arquivado";
}

const MOCK_HISTORY: AnalysisHistoryEntry[] = [
  {
    id: "AH-001",
    date: "2026-02-26T14:35:00",
    type: "Comparação",
    players: ["Gabriel Barbosa", "Pedro Guilherme"],
    user: "João Silva",
    club: "Corinthians",
    status: "Concluído",
  },
  {
    id: "AH-002",
    date: "2026-02-25T11:20:00",
    type: "Relatório",
    players: ["Vitor Roque"],
    user: "Maria Oliveira",
    club: "Flamengo",
    status: "Concluído",
  },
  {
    id: "AH-003",
    date: "2026-02-24T16:45:00",
    type: "Comparação",
    players: ["Luiz Henrique", "Gabriel Barbosa"],
    user: "João Silva",
    club: "Corinthians",
    status: "Concluído",
  },
  {
    id: "AH-004",
    date: "2026-02-23T09:15:00",
    type: "Dashboard",
    players: ["Elenco Completo"],
    user: "Carlos Mendes",
    club: "Palmeiras",
    status: "Em andamento",
  },
  {
    id: "AH-005",
    date: "2026-02-22T13:30:00",
    type: "Relatório",
    players: ["Pedro Guilherme"],
    user: "Maria Oliveira",
    club: "Flamengo",
    status: "Concluído",
  },
];

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeHistoryType(value: unknown): AnalysisHistoryEntry["type"] {
  const normalized = toText(value, "COMPARE").toUpperCase();
  if (normalized === "SINGLE") {
    return "Relatório";
  }
  if (normalized === "COMPARE") {
    return "Comparação";
  }
  return "Dashboard";
}

function normalizeHistoryStatus(value: unknown): AnalysisHistoryEntry["status"] {
  const normalized = toText(value, "PENDING").toUpperCase();
  if (normalized === "APPROVED" || normalized === "DONE") {
    return "Concluído";
  }
  if (normalized === "REJECTED" || normalized === "ARCHIVED") {
    return "Arquivado";
  }
  return "Em andamento";
}

function extractPlayers(report: UnknownRecord) {
  const output = isRecord(report.output) ? report.output : {};
  const playersSource = isRecord(output.players) ? output.players : {};
  const playerDetails = isRecord(output.playerDetails) ? output.playerDetails : {};

  const names = [
    isRecord(playersSource.playerA) ? toText(playersSource.playerA.nomeJogador ?? playersSource.playerA.name, "") : "",
    isRecord(playersSource.playerB) ? toText(playersSource.playerB.nomeJogador ?? playersSource.playerB.name, "") : "",
    isRecord(playerDetails.playerA) ? toText(playerDetails.playerA.nomeJogador ?? playerDetails.playerA.name, "") : "",
    isRecord(playerDetails.playerB) ? toText(playerDetails.playerB.nomeJogador ?? playerDetails.playerB.name, "") : "",
    toText(report.nomeJogador, ""),
  ].filter(Boolean);

  const deduped = Array.from(new Set(names));
  return deduped.length > 0 ? deduped : ["Análise estratégica"];
}

function mapReportToHistory(report: unknown): AnalysisHistoryEntry {
  const source = isRecord(report) ? report : {};

  return {
    id: toText(source.id, "N/A"),
    date: toText(source.createdAt, new Date().toISOString()),
    type: normalizeHistoryType(source.type),
    players: extractPlayers(source),
    user: toText(source.requestedBy, "Sistema SoccerMind"),
    club: "SoccerMind",
    status: normalizeHistoryStatus(source.decisionStatus),
  };
}

async function getHistoryFromApi(): Promise<ApiEnvelope<AnalysisHistoryEntry[]>> {
  const response = await apiFetch<unknown>("/reports?page=1&limit=50");
  const payload = Array.isArray(response.data)
    ? response.data
    : isRecord(response.data) && Array.isArray(response.data.data)
      ? response.data.data
      : [];

  return {
    ...response,
    data: payload.map(mapReportToHistory),
  };
}

export async function getAnalysisHistory() {
  const source = getDataSource("history");

  if (source === "mock") {
    return {
      success: true,
      data: MOCK_HISTORY,
      error: null,
      meta: { source: "mock" as const },
    };
  }

  try {
    const response = await getHistoryFromApi();
    return {
      ...response,
      meta: { ...(response.meta ?? {}), source: "api" as const },
    };
  } catch {
    return {
      success: true,
      data: MOCK_HISTORY,
      error: null,
      meta: { source: "mock-fallback" as const },
    };
  }
}
