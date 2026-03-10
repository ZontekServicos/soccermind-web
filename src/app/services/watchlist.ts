import { apiFetch } from "./api";

export async function getWatchlist() {
  return apiFetch<unknown[]>("/watchlist");
}

export async function addToWatchlist(payload: { playerId: string }) {
  return apiFetch<unknown>("/watchlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeFromWatchlist(id: string) {
  return apiFetch<unknown>(`/watchlist/${id}`, {
    method: "DELETE",
  });
}
