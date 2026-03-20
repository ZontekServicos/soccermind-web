import { apiFetch, type ApiEnvelope } from "./api";
import { getDataSource } from "../config/data-source";

type UnknownRecord = Record<string, unknown>;

export type AnalysisHistoryType = "comparison" | "report" | "dashboard";
export type AnalysisHistoryStatus = "completed" | "in_progress" | "archived";

export interface AnalysisHistoryEntry {
  id: string;
  date: string;
  type: AnalysisHistoryType;
  typeLabel: string;
  players: string[];
  user: string;
  club: string;
  status: AnalysisHistoryStatus;
  statusLabel: string;
}

const MOCK_HISTORY: AnalysisHistoryEntry[] = [
  {
    id: "AH-001",
    date: "2026-02-26T14:35:00",
    type: "comparison",
    typeLabel: "Comparacao",
    players: ["Gabriel Barbosa", "Pedro Guilherme"],
    user: "Joao Silva",
    club: "Corinthians",
    status: "completed",
    statusLabel: "Concluido",
  },
  {
    id: "AH-002",
    date: "2026-02-25T11:20:00",
    type: "report",
    typeLabel: "Relatorio",
    players: ["Vitor Roque"],
    user: "Maria Oliveira",
    club: "Flamengo",
    status: "completed",
    statusLabel: "Concluido",
  },
  {
    id: "AH-003",
    date: "2026-02-24T16:45:00",
    type: "comparison",
    typeLabel: "Comparacao",
    players: ["Luiz Henrique", "Gabriel Barbosa"],
    user: "Joao Silva",
    club: "Corinthians",
    status: "completed",
    statusLabel: "Concluido",
  },
  {
    id: "AH-004",
    date: "2026-02-23T09:15:00",
    type: "dashboard",
    typeLabel: "Dashboard",
    players: ["Elenco Completo"],
    user: "Carlos Mendes",
    club: "Palmeiras",
    status: "in_progress",
    statusLabel: "Em andamento",
  },
  {
    id: "AH-005",
    date: "2026-02-22T13:30:00",
    type: "report",
    typeLabel: "Relatorio",
    players: ["Pedro Guilherme"],
    user: "Maria Oliveira",
    club: "Flamengo",
    status: "completed",
    statusLabel: "Concluido",
  },
];

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeKey(value: unknown) {
  return toText(value, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
}

function getHistoryTypeLabel(type: AnalysisHistoryType) {
  switch (type) {
    case "comparison":
      return "Comparacao";
    case "report":
      return "Relatorio";
    case "dashboard":
      return "Dashboard";
  }
}

function getHistoryStatusLabel(status: AnalysisHistoryStatus) {
  switch (status) {
    case "completed":
      return "Concluido";
    case "in_progress":
      return "Em andamento";
    case "archived":
      return "Arquivado";
  }
}

function normalizeHistoryType(value: unknown): AnalysisHistoryType {
  const normalized = normalizeKey(value);

  if (
    normalized === "comparison" ||
    normalized === "compare" ||
    normalized === "comparacao" ||
    normalized === "comparaao"
  ) {
    return "comparison";
  }

  if (
    normalized === "report" ||
    normalized === "single" ||
    normalized === "relatorio" ||
    normalized === "relatrio"
  ) {
    return "report";
  }

  return "dashboard";
}

function normalizeHistoryStatus(value: unknown): AnalysisHistoryStatus {
  const normalized = normalizeKey(value);

  if (
    normalized === "approved" ||
    normalized === "done" ||
    normalized === "completed" ||
    normalized === "concluido" ||
    normalized === "concludo"
  ) {
    return "completed";
  }

  if (
    normalized === "rejected" ||
    normalized === "archived" ||
    normalized === "arquivado"
  ) {
    return "archived";
  }

  return "in_progress";
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
  return deduped.length > 0 ? deduped : ["Analise estrategica"];
}

function mapReportToHistory(report: unknown): AnalysisHistoryEntry {
  const source = isRecord(report) ? report : {};
  const type = normalizeHistoryType(source.type);
  const status = normalizeHistoryStatus(source.decisionStatus);

  return {
    id: toText(source.id, "N/A"),
    date: toText(source.createdAt, new Date().toISOString()),
    type,
    typeLabel: getHistoryTypeLabel(type),
    players: extractPlayers(source),
    user: toText(source.requestedBy, "Sistema SoccerMind"),
    club: toText(source.clubName ?? source.club ?? source.clube, "SoccerMind"),
    status,
    statusLabel: getHistoryStatusLabel(status),
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
