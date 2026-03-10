import { apiFetch } from "./api";

export async function comparePlayers(idA: string, idB: string) {
  return apiFetch<unknown>(`/compare/${idA}/${idB}`);
}

export async function comparePlayersByName(nameA: string, nameB: string) {
  return apiFetch<unknown>(`/compare/by-name/${encodeURIComponent(nameA)}/${encodeURIComponent(nameB)}`);
}
