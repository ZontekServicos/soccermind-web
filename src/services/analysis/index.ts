import {
  mapAnalysisDetailResponse,
  mapAnalysisResponse,
  type AnalysisDetailViewModel,
  type AnalysisViewModel,
} from "../../adapters/analysis";
import { apiFetch, type ApiEnvelope } from "../../app/services/api";
import { getDataSource } from "../../config/dataSource";

export type { AnalysisViewModel };
export type { AnalysisDetailViewModel };

export interface CreateComparisonAnalysisPayload {
  playerIds: string[];
  title?: string;
  description?: string;
  analyst?: string;
}

export interface CreateReportAnalysisPayload {
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

async function deleteAnalysisEntry(id: string) {
  return apiFetch<{ id: string; message: string }>(`/analysis/${id}`, {
    method: "DELETE",
  });
}

// Session cache key — persists while the browser tab is open
const SESSION_HISTORY_KEY = "soccermind:history:session";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

const MOCK_ANALYSES: AnalysisViewModel[] = [
  {
    id: "AN-001",
    title: "Comparacao - Gabriel Barbosa vs Pedro Guilherme",
    description: "Análise comparativa de perfil ofensivo e eficiência de capital.",
    date: daysAgo(2),
    type: "comparison",
    typeLabel: "Comparacao",
    players: ["Gabriel Barbosa", "Pedro Guilherme"],
    playerDetails: [],
    playerAId: null,
    playerBId: null,
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
    description: "Relatório de scouting com DNA Score e projeção de mercado.",
    date: daysAgo(5),
    type: "report",
    typeLabel: "Relatorio",
    players: ["Vitor Roque"],
    playerDetails: [],
    playerAId: null,
    playerBId: null,
    user: "Maria Oliveira",
    club: "Flamengo",
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
    id: "AN-003",
    title: "Relatorio - Estevao Willian",
    description: "Perfil detalhado — DNA Impact + potencial de revenda.",
    date: daysAgo(8),
    type: "report",
    typeLabel: "Relatorio",
    players: ["Estevao Willian"],
    playerDetails: [],
    playerAId: null,
    playerBId: null,
    user: "Joao Silva",
    club: "Palmeiras",
    status: "completed",
    statusLabel: "Concluido",
    canDelete: true,
    isLegacy: false,
    sourceOrigin: "analysis",
    sourceLabel: "Central Analysis",
    deleteManagedBy: "analysis",
    deleteHint: "Entrada persistida em Analysis; exclusao disponivel.",
  },
];

// ─── Session cache ─────────────────────────────────────────────────────────

function getSessionCache(): AnalysisViewModel[] {
  try {
    const raw = sessionStorage.getItem(SESSION_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AnalysisViewModel[]) : [];
  } catch {
    return [];
  }
}

export function addToSessionCache(entry: AnalysisViewModel): void {
  try {
    const cache = getSessionCache();
    const idx = cache.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      cache[idx] = entry;
    } else {
      cache.unshift(entry);
    }
    sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(cache));
    notifyAnalysisHubUpdated({ action: "created", id: entry.id });
  } catch {
    // sessionStorage not available
  }
}

function findInSession(id: string): AnalysisViewModel | null {
  return getSessionCache().find((e) => e.id === id) ?? null;
}

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
  const sessionEntries = getSessionCache();

  if (source === "mock") {
    const merged = dedupeById([...sessionEntries, ...MOCK_ANALYSES]);
    return {
      success: true,
      data: merged,
      error: null,
      meta: { source: "mock" as const },
    };
  }

  try {
    const response = await getAnalysesFromApi();
    const apiData = Array.isArray(response.data) ? response.data : [];
    // Only show data the user actually saved — no demo injection in production mode
    const merged = dedupeById([...sessionEntries, ...apiData]);

    return {
      ...response,
      data: merged,
      meta: { ...(response.meta ?? {}), source: "api" as const },
    };
  } catch {
    // API unavailable — show only what was saved in this session
    return {
      success: true,
      data: sessionEntries,
      error: null,
      meta: { source: "session" as const },
    };
  }
}

function dedupeById(entries: AnalysisViewModel[]): AnalysisViewModel[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export async function createComparisonAnalysis(payload: CreateComparisonAnalysisPayload) {
  // Build a local entry immediately (used as fallback or when API is unavailable)
  const localEntry: AnalysisViewModel = {
    id: `CMP-${Date.now()}`,
    title: payload.title ?? `Comparação — ${payload.playerIds.join(" vs ")}`,
    description: payload.description ?? "",
    date: new Date().toISOString(),
    type: "comparison",
    typeLabel: "Comparação",
    players: payload.playerIds,
    playerDetails: [],
    playerAId: payload.playerIds[0] ?? null,
    playerBId: payload.playerIds[1] ?? null,
    user: payload.analyst ?? "Scout",
    club: "",
    status: "completed",
    statusLabel: "Concluído",
    canDelete: true,
    isLegacy: false,
    sourceOrigin: "analysis",
    sourceLabel: "Central Analysis",
    deleteManagedBy: "analysis",
    deleteHint: "Salvo localmente nesta sessão.",
  };

  try {
    const response = await apiFetch<unknown>("/analysis/comparison", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const analysis = mapAnalysisResponse(response.data);
    addToSessionCache(analysis);

    return { ...response, data: analysis };
  } catch {
    // API unavailable — persist locally so History still shows it
    addToSessionCache(localEntry);
    return { success: true, data: localEntry, error: null, meta: { source: "mock" as const } };
  }
}

export async function createReportAnalysis(payload: CreateReportAnalysisPayload) {
  const localEntry: AnalysisViewModel = {
    id: `RPT-${Date.now()}`,
    title: payload.title ?? `Relatório — ${payload.playerIds.join(", ")}`,
    description: payload.description ?? "",
    date: new Date().toISOString(),
    type: "report",
    typeLabel: "Relatório",
    players: payload.playerIds,
    playerDetails: [],
    playerAId: payload.playerIds[0] ?? null,
    playerBId: null,
    user: payload.analyst ?? "Scout",
    club: "",
    status: "completed",
    statusLabel: "Concluído",
    canDelete: true,
    isLegacy: false,
    sourceOrigin: "analysis",
    sourceLabel: "Central Analysis",
    deleteManagedBy: "analysis",
    deleteHint: "Salvo localmente nesta sessão.",
  };

  try {
    const response = await apiFetch<unknown>("/analysis/report", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const analysis = mapAnalysisResponse(response.data);
    addToSessionCache(analysis);

    return { ...response, data: analysis };
  } catch {
    addToSessionCache(localEntry);
    return { success: true, data: localEntry, error: null, meta: { source: "mock" as const } };
  }
}

export async function getAnalysisById(id: string) {
  try {
    const response = await apiFetch<unknown>(`/analysis/${id}`);
    return {
      ...response,
      data: mapAnalysisDetailResponse(response.data),
    };
  } catch {
    // API failed — try to reconstruct from session cache or mock list
    const sessionEntry = findInSession(id);
    const mockEntry = MOCK_ANALYSES.find((m) => m.id === id) ?? null;
    const listEntry = sessionEntry ?? mockEntry;

    if (listEntry) {
      return {
        success: true,
        data: mapAnalysisDetailResponse(listEntry),
        error: null,
        meta: { source: "mock" as const },
      };
    }

    // Nothing found — re-throw so callers can handle
    throw new Error(`Análise ${id} não encontrada.`);
  }
}

export async function deleteAnalysisHubEntry(entry: Pick<AnalysisViewModel, "id" | "deleteManagedBy">) {
  const response = await deleteAnalysisEntry(entry.id);

  notifyAnalysisHubUpdated({ action: "deleted", id: entry.id });

  return response;
}
