import { type ApiEnvelope, apiFetch } from "./api";
import {
  mapApiPlayerToCard,
  mapApiPlayerToProfile,
  type ApiPlayerLike,
  type PlayerCardModel,
  type PlayerProfileModel,
} from "../mappers/player.mapper";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapData(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  if ("data" in value && value.data !== undefined) {
    return unwrapData(value.data);
  }

  return value;
}

function extractPlayersPayload(payload: unknown): unknown[] {
  const unwrapped = unwrapData(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }

  if (!isRecord(unwrapped)) {
    return [];
  }

  const candidates = [unwrapped.players, unwrapped.items, unwrapped.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (isRecord(unwrapped.player)) {
    return [unwrapped.player];
  }

  return [];
}

function extractSinglePlayerPayload(payload: unknown): unknown {
  const unwrapped = unwrapData(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped[0] ?? {};
  }

  if (isRecord(unwrapped) && isRecord(unwrapped.player)) {
    return unwrapped.player;
  }

  return unwrapped;
}

function mapPlayersEnvelope(
  response: ApiEnvelope<unknown>,
  mapper: (player: ApiPlayerLike | UnknownRecord) => PlayerCardModel,
): ApiEnvelope<PlayerCardModel[]> {
  return {
    ...response,
    data: extractPlayersPayload(response.data).map((item) => mapper(item as ApiPlayerLike | UnknownRecord)),
  };
}

export async function getPlayers(page = 1, limit = 20) {
  const response = await apiFetch<unknown>(`/players?page=${page}&limit=${limit}`);
  return mapPlayersEnvelope(response, mapApiPlayerToCard);
}

export async function searchPlayers(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  const keyMap: Record<string, string> = {
    minAge: "ageMin",
    maxAge: "ageMax",
    minOverall: "overallMin",
    maxOverall: "overallMax",
  };

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      const targetKey = keyMap[key] || key;
      if (targetKey !== "query") {
        searchParams.set(targetKey, String(value));
      }
    }
  });

  const query = searchParams.toString();
  const response = await apiFetch<unknown>(`/players/search${query ? `?${query}` : ""}`);
  return mapPlayersEnvelope(response, mapApiPlayerToCard);
}

export async function getPlayer(id: string) {
  const response = await apiFetch<unknown>(`/player/${id}`);

  return {
    ...response,
    data: mapApiPlayerToProfile(extractSinglePlayerPayload(response.data) as ApiPlayerLike | UnknownRecord),
  } satisfies ApiEnvelope<PlayerProfileModel>;
}

export async function getPlayerProjection(id: string) {
  return apiFetch<unknown>(`/player/${id}/projection`);
}

export async function getSimilarPlayers(id: string) {
  const response = await apiFetch<unknown>(`/player/${id}/similar`);
  return mapPlayersEnvelope(response, mapApiPlayerToCard);
}

export async function getPlayerNotes(id: string) {
  return apiFetch<unknown[]>(`/player/${id}/notes`);
}

export async function createPlayerNote(id: string, payload: { content: string }) {
  return apiFetch<unknown>(`/player/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ note: payload.content }),
  });
}
