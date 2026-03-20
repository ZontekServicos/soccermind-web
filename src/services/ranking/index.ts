import type { ApiEnvelope } from "../../app/services/api";
import type { PlayerCardModel } from "../../adapters/players";
import { searchPlayers, type PlayerFilterOptions, type PlayersFiltersParams, type PlayersResponseMeta } from "../players";

export interface RankingResponse {
  players: PlayerCardModel[];
  meta: PlayersResponseMeta;
  filterOptions: PlayerFilterOptions;
}

export async function getRankingData(
  params: PlayersFiltersParams = {},
): Promise<ApiEnvelope<RankingResponse>> {
  const response = await searchPlayers(params);
  const meta = (response.meta || {}) as PlayersResponseMeta;

  return {
    ...response,
    data: {
      players: Array.isArray(response.data) ? response.data : [],
      meta,
      filterOptions: meta.filterOptions ?? {
        positions: [],
        nationalities: [],
        teams: [],
        leagues: [],
        sources: [],
      },
    },
  };
}
