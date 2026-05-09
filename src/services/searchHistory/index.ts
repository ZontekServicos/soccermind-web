import { apiFetch }       from "../../app/services/api";
import type { ApiEnvelope } from "../../app/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecencyGroup = "Hoje" | "Ontem" | "Esta semana" | "Este mês" | "Mais antigo";

export interface SearchHistoryFilters {
  position?:    string;
  leagueId?:    string;
  nationality?: string;
  ageMin?:      number;
  ageMax?:      number;
  overallMin?:  number;
}

export interface SearchHistoryEntry {
  id:             string;
  query:          string;
  filters:        SearchHistoryFilters | null;
  searchCount:    number;
  resultCount:    number | null;
  lastSearchedAt: string;
  createdAt:      string;
  group:          RecencyGroup;
}

export interface SearchHistoryMeta {
  total:   number;
  page:    number;
  limit:   number;
  hasMore: boolean;
}

export interface GetSearchHistoryParams {
  page?:  number;
  limit?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getSearchHistory(
  params: GetSearchHistoryParams = {},
): Promise<ApiEnvelope<SearchHistoryEntry[]>> {
  const qs = new URLSearchParams();
  if (params.page  != null) qs.set("page",  String(params.page));
  if (params.limit != null) qs.set("limit", String(params.limit));

  const query = qs.toString();
  const url   = `/search-history${query ? `?${query}` : ""}`;
  return apiFetch<SearchHistoryEntry[]>(url);
}

export async function deleteSearchHistoryEntry(id: string): Promise<void> {
  await apiFetch(`/search-history/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function clearSearchHistory(): Promise<void> {
  await apiFetch("/search-history", { method: "DELETE" });
}
