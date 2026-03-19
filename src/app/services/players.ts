import { type ApiEnvelope, apiFetch } from "./api";
import {
  mapApiPlayerToCard,
  mapApiPlayerToExtended,
  mapApiPlayerToProfile,
  type ApiPlayerLike,
  type PlayerCardModel,
  type PlayerExtended,
  type PlayerProfileModel,
} from "../mappers/player.mapper";

type UnknownRecord = Record<string, unknown>;

type PrimitiveFilterValue = string | number | undefined;

export interface PlayerFilterOptions {
  positions: string[];
  nationalities: string[];
  teams: string[];
  leagues: string[];
  sources: string[];
}

export interface PlayersFiltersParams {
  search?: PrimitiveFilterValue;
  positions?: string[];
  nationality?: PrimitiveFilterValue;
  team?: PrimitiveFilterValue;
  league?: PrimitiveFilterValue;
  source?: PrimitiveFilterValue;
  minAge?: PrimitiveFilterValue;
  maxAge?: PrimitiveFilterValue;
  minOverall?: PrimitiveFilterValue;
  maxOverall?: PrimitiveFilterValue;
  minPotential?: PrimitiveFilterValue;
  maxPotential?: PrimitiveFilterValue;
  minValue?: PrimitiveFilterValue;
  maxValue?: PrimitiveFilterValue;
  page?: PrimitiveFilterValue;
  limit?: PrimitiveFilterValue;
}

export interface PlayersResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  filters?: Record<string, unknown>;
  filterOptions?: PlayerFilterOptions;
}

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
    data: extractPlayersPayload(response.data).map((item) => ({
      ...(item as Record<string, unknown>),
      ...mapper(item as ApiPlayerLike | UnknownRecord),
    })),
  };
}

function appendParam(searchParams: URLSearchParams, key: string, value: PrimitiveFilterValue) {
  if (value === undefined || value === "") {
    return;
  }

  searchParams.set(key, String(value));
}

function buildPlayersSearchParams(params: PlayersFiltersParams) {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "search", params.search);
  if (params.positions && params.positions.length > 0) {
    searchParams.set("positions", params.positions.join(","));
  }
  appendParam(searchParams, "nationality", params.nationality);
  appendParam(searchParams, "team", params.team);
  appendParam(searchParams, "league", params.league);
  appendParam(searchParams, "source", params.source);
  appendParam(searchParams, "minAge", params.minAge);
  appendParam(searchParams, "maxAge", params.maxAge);
  appendParam(searchParams, "minOverall", params.minOverall);
  appendParam(searchParams, "maxOverall", params.maxOverall);
  appendParam(searchParams, "minPotential", params.minPotential);
  appendParam(searchParams, "maxPotential", params.maxPotential);
  appendParam(searchParams, "minValue", params.minValue);
  appendParam(searchParams, "maxValue", params.maxValue);
  appendParam(searchParams, "page", params.page);
  appendParam(searchParams, "limit", params.limit);

  return searchParams;
}

export async function getPlayers(
  page = 1,
  limit = 20,
  search?: string,
): Promise<ApiEnvelope<PlayerCardModel[]>> {
  const searchParams = buildPlayersSearchParams({ page, limit, search });
  const response = await apiFetch<unknown>(`/players?${searchParams.toString()}`);
  return mapPlayersEnvelope(response, mapApiPlayerToCard);
}

export async function searchPlayers(
  params: PlayersFiltersParams = {},
): Promise<ApiEnvelope<PlayerCardModel[]>> {
  const searchParams = buildPlayersSearchParams(params);
  const query = searchParams.toString();
  const response = await apiFetch<unknown>(`/players${query ? `?${query}` : ""}`);
  return mapPlayersEnvelope(response, mapApiPlayerToCard);
}

function mapExtendedPlayersEnvelope(
  response: ApiEnvelope<PlayerCardModel[]>,
): ApiEnvelope<PlayerExtended[]> {
  return {
    ...response,
    data: Array.isArray(response.data)
      ? response.data.map((player) => mapApiPlayerToExtended(player as ApiPlayerLike | UnknownRecord))
      : [],
  };
}

export async function getExtendedPlayers(
  page = 1,
  limit = 20,
  search?: string,
): Promise<ApiEnvelope<PlayerExtended[]>> {
  const response = await getPlayers(page, limit, search);
  return mapExtendedPlayersEnvelope(response);
}

export async function searchExtendedPlayers(
  params: PlayersFiltersParams = {},
): Promise<ApiEnvelope<PlayerExtended[]>> {
  const response = await searchPlayers(params);
  return mapExtendedPlayersEnvelope(response);
}

export async function getPlayer(id: string): Promise<ApiEnvelope<PlayerProfileModel>> {
  const response = await apiFetch<unknown>(`/player/${id}`);

  return {
    ...response,
    data: mapApiPlayerToProfile(extractSinglePlayerPayload(response.data) as ApiPlayerLike | UnknownRecord),
  } satisfies ApiEnvelope<PlayerProfileModel>;
}

export async function getPlayerProjection(id: string) {
  return apiFetch<unknown>(`/player/${id}/projection`);
}

export async function getSimilarPlayers(id: string): Promise<ApiEnvelope<PlayerCardModel[]>> {
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
