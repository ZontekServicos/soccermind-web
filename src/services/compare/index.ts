import { apiFetch, type ApiEnvelope } from "../../app/services/api";
import { isValidUUID } from "../../app/utils/uuid";
import { mapCompareResponse, type CompareViewModel } from "../../adapters/compare";
import { getDataSource } from "../../config/dataSource";
import { searchExtendedPlayers, type PlayerFilterOptions, type PlayersFiltersParams } from "../players";

export type { CompareViewModel } from "../../adapters/compare";
export type { PlayerFilterOptions, PlayersFiltersParams } from "../players";

export async function getCompareShortlist(
  params: PlayersFiltersParams = {},
): Promise<ApiEnvelope<{ players: ReturnType<typeof mapCompareResponse>["playerA"][]; filterOptions: PlayerFilterOptions }>> {
  const response = await searchExtendedPlayers(params);
  const nextMeta = (response.meta || {}) as { filterOptions?: PlayerFilterOptions };
  const players = Array.isArray(response.data)
    ? response.data.filter((player) => isValidUUID(player.id))
    : [];

  return {
    ...response,
    data: {
      players,
      filterOptions: nextMeta.filterOptions ?? {
        positions: [],
        nationalities: [],
        teams: [],
        leagues: [],
        sources: [],
      },
    },
  };
}

async function comparePlayersByEndpoint(endpoint: string): Promise<ApiEnvelope<CompareViewModel>> {
  const response = await apiFetch<unknown>(endpoint);

  return {
    ...response,
    data: mapCompareResponse(response.data),
  };
}

export async function getCompareDataByIds(idA: string, idB: string) {
  const playerAId = idA.trim();
  const playerBId = idB.trim();
  if (!isValidUUID(playerAId) || !isValidUUID(playerBId)) {
    throw new Error("Selecione dois jogadores validos antes de comparar.");
  }
  return comparePlayersByEndpoint(`/compare/${playerAId}/${playerBId}`);
}

export async function getCompareEngineData(idA: string, idB: string) {
  const playerAId = idA.trim();
  const playerBId = idB.trim();
  if (!isValidUUID(playerAId) || !isValidUUID(playerBId)) {
    throw new Error("Selecione dois jogadores validos antes de comparar.");
  }
  return apiFetch<unknown>(`/compare/engine/${playerAId}/${playerBId}`);
}

export async function getCompareDataByNames(nameA: string, nameB: string) {
  if (getDataSource("compare") === "mock") {
    const shortlist = await getCompareShortlist({ search: nameA || nameB, limit: 2 });
    const [playerA, playerB] = shortlist.data.players;
    return {
      success: true,
      data: mapCompareResponse({
        playerA,
        playerB: playerB ?? playerA,
      }),
      error: null,
      meta: { source: "mock" },
    } satisfies ApiEnvelope<CompareViewModel>;
  }

  return comparePlayersByEndpoint(`/compare/by-name/${encodeURIComponent(nameA)}/${encodeURIComponent(nameB)}`);
}
