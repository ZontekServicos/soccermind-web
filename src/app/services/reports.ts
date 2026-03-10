import { apiFetch } from "./api";

export async function getExplainabilityReport(id: string) {
  return apiFetch<unknown>(`/reports/${id}/explainability`);
}
