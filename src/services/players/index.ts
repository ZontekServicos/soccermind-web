import { apiFetch, type ApiEnvelope } from "../../app/services/api";
import { playersData } from "../../app/data/playersData";
import { getDataSource } from "../../config/dataSource";
import {
  mapApiPlayerToCard,
  mapApiPlayerToExtended,
  mapApiPlayerToProfile,
  type ApiPlayerLike,
  type PlayerCardModel,
  type PlayerProfileModel,
} from "../../adapters/players";
import type { PlayerExtended } from "../../app/types/player";

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

function buildMockExtendedPlayers(): PlayerExtended[] {
  return playersData.map((player, index) =>
    mapApiPlayerToExtended({
      id: player.id,
      name: player.name,
      position: player.position,
      positions: [player.position],
      team: player.club,
      nationality: player.nationality,
      age: player.age,
      overall: player.overall,
      potential: player.potential,
      marketValue: player.marketValue,
      attributes: {
        pace: player.pac,
        shooting: player.sho,
        passing: player.pas,
        dribbling: player.dri,
        defending: player.def,
        physical: player.phy,
        ...player.stats,
      },
      structuralRisk: {
        score: 3 + (index % 4),
        level: index % 5 === 0 ? "HIGH" : index % 3 === 0 ? "MEDIUM" : "LOW",
        breakdown: "Mock snapshot for local UI validation.",
      },
      liquidity: {
        score: 6 + (index % 3),
        resaleWindow: index % 2 === 0 ? "2-3 anos" : "3-5 anos",
        marketProfile: "Mock liquidity profile.",
      },
      financialRisk: {
        index: 4 + (index % 4),
        capitalExposure: index % 4 === 0 ? "Alta" : "Media",
        investmentProfile: "Mock financial profile.",
      },
      risk: {
        score: 4 + (index % 4),
        level: index % 5 === 0 ? "HIGH" : index % 3 === 0 ? "MEDIUM" : "LOW",
        explanation: "Mock composite risk prepared inside players service.",
      },
    }),
  );
}

function applyMockFilters(players: PlayerExtended[], params: PlayersFiltersParams = {}) {
  const search = typeof params.search === "string" ? params.search.toLowerCase() : "";

  return players.filter((player) => {
    if (search) {
      const haystack = [player.name, player.club, player.position, player.nationality].join(" ").toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (params.positions?.length && !params.positions.includes(player.position)) {
      return false;
    }

    if (params.nationality && player.nationality !== String(params.nationality)) {
      return false;
    }

    if (params.team && player.club !== String(params.team)) {
      return false;
    }

    if (params.minAge && player.age < Number(params.minAge)) {
      return false;
    }

    if (params.maxAge && player.age > Number(params.maxAge)) {
      return false;
    }

    if (params.minOverall && player.overallRating < Number(params.minOverall)) {
      return false;
    }

    if (params.maxOverall && player.overallRating > Number(params.maxOverall)) {
      return false;
    }

    if (params.minPotential && player.potential < Number(params.minPotential)) {
      return false;
    }

    if (params.maxPotential && player.potential > Number(params.maxPotential)) {
      return false;
    }

    return true;
  });
}

function buildMockFilterOptions(players: PlayerExtended[]): PlayerFilterOptions {
  return {
    positions: Array.from(new Set(players.map((player) => player.position))).sort(),
    nationalities: Array.from(new Set(players.map((player) => player.nationality))).sort(),
    teams: Array.from(new Set(players.map((player) => player.club))).sort(),
    leagues: [],
    sources: ["mock"],
  };
}

function buildMockPlayersEnvelope(params: PlayersFiltersParams = {}): ApiEnvelope<PlayerCardModel[]> {
  const allPlayers = buildMockExtendedPlayers();
  const filteredPlayers = applyMockFilters(allPlayers, params);
  const page = Math.max(1, Number(params.page ?? 1));
  const limit = Math.max(1, Number(params.limit ?? filteredPlayers.length ?? 20));
  const start = (page - 1) * limit;
  const paged = filteredPlayers.slice(start, start + limit);

  return {
    success: true,
    data: paged.map((player) =>
      mapApiPlayerToCard({
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.club,
        nationality: player.nationality,
        age: player.age,
        overall: player.overallRating,
        potential: player.potential,
        marketValue: player.marketValue,
        attributes: player.stats,
      }),
    ),
    error: null,
    meta: {
      page,
      limit,
      total: filteredPlayers.length,
      totalPages: Math.max(1, Math.ceil(filteredPlayers.length / limit)),
      filterOptions: buildMockFilterOptions(allPlayers),
      source: "mock",
    },
  };
}

async function fetchPlayersFromApi(params: PlayersFiltersParams = {}) {
  const searchParams = buildPlayersSearchParams(params);
  const query = searchParams.toString();
  return apiFetch<unknown>(`/players${query ? `?${query}` : ""}`);
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

export async function getPlayers(
  page = 1,
  limit = 20,
  search?: string,
): Promise<ApiEnvelope<PlayerCardModel[]>> {
  return searchPlayers({ page, limit, search });
}

export async function searchPlayers(
  params: PlayersFiltersParams = {},
): Promise<ApiEnvelope<PlayerCardModel[]>> {
  if (getDataSource("players") === "mock") {
    return buildMockPlayersEnvelope(params);
  }

  try {
    const response = await fetchPlayersFromApi(params);
    return mapPlayersEnvelope(response, mapApiPlayerToCard);
  } catch (error) {
    const fallback = buildMockPlayersEnvelope(params);
    return {
      ...fallback,
      meta: { ...(fallback.meta ?? {}), source: "mock-fallback", apiError: error instanceof Error ? error.message : "API request failed" },
    };
  }
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
  const mockPlayers = buildMockExtendedPlayers();
  const fallbackPlayer = mockPlayers.find((player) => player.id === id) ?? mockPlayers[0];

  if (getDataSource("players") === "mock") {
    return {
      success: true,
      data: mapApiPlayerToProfile({
        id: fallbackPlayer.id,
        name: fallbackPlayer.name,
        position: fallbackPlayer.position,
        team: fallbackPlayer.club,
        nationality: fallbackPlayer.nationality,
        age: fallbackPlayer.age,
        overall: fallbackPlayer.overallRating,
        potential: fallbackPlayer.potential,
        marketValue: fallbackPlayer.marketValue,
        attributes: fallbackPlayer.stats,
      }),
      error: null,
      meta: { source: "mock" },
    };
  }

  try {
    const response = await apiFetch<unknown>(`/player/${id}`);

    return {
      ...response,
      data: mapApiPlayerToProfile(extractSinglePlayerPayload(response.data) as ApiPlayerLike | UnknownRecord),
    } satisfies ApiEnvelope<PlayerProfileModel>;
  } catch (error) {
    return {
      success: true,
      data: mapApiPlayerToProfile({
        id: fallbackPlayer.id,
        name: fallbackPlayer.name,
        position: fallbackPlayer.position,
        team: fallbackPlayer.club,
        nationality: fallbackPlayer.nationality,
        age: fallbackPlayer.age,
        overall: fallbackPlayer.overallRating,
        potential: fallbackPlayer.potential,
        marketValue: fallbackPlayer.marketValue,
        attributes: fallbackPlayer.stats,
      }),
      error: null,
      meta: { source: "mock-fallback", apiError: error instanceof Error ? error.message : "API request failed" },
    };
  }
}

export async function getPlayerProjection(id: string) {
  if (getDataSource("players") === "mock") {
    const mockPlayer = buildMockExtendedPlayers().find((player) => player.id === id) ?? buildMockExtendedPlayers()[0];
    return {
      success: true,
      data: {
        projectedPeak: mockPlayer?.potential ?? 0,
        potential: mockPlayer?.potential ?? 0,
        projections: [{ overall: mockPlayer?.potential ?? 0 }],
      },
      error: null,
      meta: { source: "mock" },
    };
  }

  return apiFetch<unknown>(`/player/${id}/projection`);
}

export async function getSimilarPlayers(id: string): Promise<ApiEnvelope<PlayerCardModel[]>> {
  if (getDataSource("players") === "mock") {
    const mockPlayers = buildMockExtendedPlayers()
      .filter((player) => player.id !== id)
      .slice(0, 6)
      .map((player) =>
        mapApiPlayerToCard({
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.club,
          nationality: player.nationality,
          age: player.age,
          overall: player.overallRating,
          potential: player.potential,
          marketValue: player.marketValue,
          attributes: player.stats,
        }),
      );

    return {
      success: true,
      data: mockPlayers,
      error: null,
      meta: { source: "mock" },
    };
  }

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
