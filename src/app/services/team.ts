import { apiFetch } from "./api";

export async function getTeamAnalysis(params: Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return apiFetch<unknown>(`/team/analysis${query ? `?${query}` : ""}`);
}
