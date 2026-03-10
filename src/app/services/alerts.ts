import { apiFetch } from "./api";

export async function getAlerts() {
  return apiFetch<unknown[]>("/alerts");
}
