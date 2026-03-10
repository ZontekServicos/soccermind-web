import { apiFetch } from "./api";

export async function getPlayers(page = 1, limit = 20) {
  return apiFetch<unknown[]>(`/players?page=${page}&limit=${limit}`);
}

export async function searchPlayers(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return apiFetch<unknown[]>(`/players/search${query ? `?${query}` : ""}`);
}

export async function getPlayer(id: string) {
  return apiFetch<unknown>(`/player/${id}`);
}

export async function getPlayerProjection(id: string) {
  return apiFetch<unknown>(`/player/${id}/projection`);
}

export async function getSimilarPlayers(id: string) {
  return apiFetch<unknown[]>(`/player/${id}/similar`);
}

export async function getPlayerNotes(id: string) {
  return apiFetch<unknown[]>(`/player/${id}/notes`);
}

export async function createPlayerNote(id: string, payload: { content: string }) {
  return apiFetch<unknown>(`/player/${id}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
