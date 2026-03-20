import { mapAnalysisResponse, type AnalysisViewModel } from "../../adapters/analysis";
import { apiFetch, type ApiEnvelope } from "../../app/services/api";
import { getDataSource } from "../../config/dataSource";

export type { AnalysisViewModel };

export interface CreateComparisonAnalysisPayload {
  playerIds: string[];
  title?: string;
  analyst?: string;
}

const MOCK_ANALYSES: AnalysisViewModel[] = [
  {
    id: "AN-001",
    title: "Comparacao - Gabriel Barbosa vs Pedro Guilherme",
    date: "2026-02-26T14:35:00",
    type: "comparison",
    typeLabel: "Comparacao",
    players: ["Gabriel Barbosa", "Pedro Guilherme"],
    playerDetails: [],
    user: "Joao Silva",
    club: "Corinthians",
    status: "completed",
    statusLabel: "Concluido",
  },
  {
    id: "AN-002",
    title: "Relatorio - Vitor Roque",
    date: "2026-02-25T11:20:00",
    type: "report",
    typeLabel: "Relatorio",
    players: ["Vitor Roque"],
    playerDetails: [],
    user: "Maria Oliveira",
    club: "Flamengo",
    status: "completed",
    statusLabel: "Concluido",
  },
];

async function getAnalysesFromApi(): Promise<ApiEnvelope<AnalysisViewModel[]>> {
  const response = await apiFetch<unknown>("/analysis");
  const payload = Array.isArray(response.data) ? response.data : [];

  return {
    ...response,
    data: payload.map(mapAnalysisResponse),
  };
}

export async function getAnalyses() {
  const source = getDataSource("history");

  if (source === "mock") {
    return {
      success: true,
      data: MOCK_ANALYSES,
      error: null,
      meta: { source: "mock" as const },
    };
  }

  try {
    const response = await getAnalysesFromApi();
    return {
      ...response,
      meta: { ...(response.meta ?? {}), source: "api" as const },
    };
  } catch {
    return {
      success: true,
      data: MOCK_ANALYSES,
      error: null,
      meta: { source: "mock-fallback" as const },
    };
  }
}

export async function createComparisonAnalysis(payload: CreateComparisonAnalysisPayload) {
  const response = await apiFetch<unknown>("/analysis/comparison", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    ...response,
    data: mapAnalysisResponse(response.data),
  };
}
