import { mapAnalysisResponse, type AnalysisViewModel } from "../../adapters/analysis";
import { apiFetch, type ApiEnvelope } from "../../app/services/api";
import { getDataSource } from "../../config/dataSource";

export type { AnalysisViewModel };

export interface CreateComparisonAnalysisPayload {
  playerIds: string[];
  title?: string;
  description?: string;
  analyst?: string;
}

const ANALYSIS_HUB_UPDATED_EVENT = "soccermind:analysis-hub-updated";

type AnalysisHubUpdateDetail = {
  action: "created" | "deleted";
  id: string;
};

const MOCK_ANALYSES: AnalysisViewModel[] = [
  {
    id: "AN-001",
    title: "Comparacao - Gabriel Barbosa vs Pedro Guilherme",
    description: "",
    date: "2026-02-26T14:35:00",
    type: "comparison",
    typeLabel: "Comparacao",
    players: ["Gabriel Barbosa", "Pedro Guilherme"],
    playerDetails: [],
    user: "Joao Silva",
    club: "Corinthians",
    status: "completed",
    statusLabel: "Concluido",
    canDelete: true,
    isLegacy: false,
    sourceOrigin: "analysis",
    sourceLabel: "Central Analysis",
    deleteManagedBy: "analysis",
    deleteHint: "Entrada persistida em Analysis; exclusao disponivel.",
  },
  {
    id: "AN-002",
    title: "Relatorio - Vitor Roque",
    description: "",
    date: "2026-02-25T11:20:00",
    type: "report",
    typeLabel: "Relatorio",
    players: ["Vitor Roque"],
    playerDetails: [],
    user: "Maria Oliveira",
    club: "Flamengo",
    status: "completed",
    statusLabel: "Concluido",
    canDelete: false,
    isLegacy: true,
    sourceOrigin: "scout_report",
    sourceLabel: "Legado ScoutReport",
    deleteManagedBy: "scout_report",
    deleteHint: "Entrada legada protegida; exclusao disponivel apenas no fluxo ScoutReport.",
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

function notifyAnalysisHubUpdated(detail: AnalysisHubUpdateDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<AnalysisHubUpdateDetail>(ANALYSIS_HUB_UPDATED_EVENT, { detail }));
}

export function subscribeToAnalysisHubUpdates(listener: (detail: AnalysisHubUpdateDetail) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<AnalysisHubUpdateDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(ANALYSIS_HUB_UPDATED_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(ANALYSIS_HUB_UPDATED_EVENT, handler as EventListener);
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

  const response = await getAnalysesFromApi();
  return {
    ...response,
    meta: { ...(response.meta ?? {}), source: "api" as const },
  };
}

export async function createComparisonAnalysis(payload: CreateComparisonAnalysisPayload) {
  const response = await apiFetch<unknown>("/analysis/comparison", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const analysis = mapAnalysisResponse(response.data);
  notifyAnalysisHubUpdated({ action: "created", id: analysis.id });

  return {
    ...response,
    data: analysis,
  };
}

export async function deleteAnalysis(id: string) {
  const response = await apiFetch<{ id: string; message: string }>(`/analysis/${id}`, {
    method: "DELETE",
  });

  notifyAnalysisHubUpdated({ action: "deleted", id });

  return response;
}
