import type { ApiEnvelope } from "../../app/services/api";
import { buildExecutiveReportData } from "../../adapters/reports";
import type { PlayerExtended } from "../../app/types/player";
import { isValidUUID } from "../../app/utils/uuid";
import { getCompareDataByIds, getCompareShortlist, type CompareViewModel } from "../compare";
import type { PlayerFilterOptions, PlayersFiltersParams } from "../players";

export type { CompareViewModel } from "../compare";
export type { PlayerFilterOptions, PlayersFiltersParams } from "../players";

export interface ExecutiveReportResponse {
  comparisonData: CompareViewModel;
  reportModel: ReturnType<typeof buildExecutiveReportData>;
}

export type ExecutiveReportModel = NonNullable<ExecutiveReportResponse["reportModel"]>;

export async function getReportShortlist(
  params: PlayersFiltersParams = {},
): Promise<ApiEnvelope<{ players: PlayerExtended[]; filterOptions: PlayerFilterOptions }>> {
  return getCompareShortlist(params);
}

export async function getExecutiveReportData(
  playerA: PlayerExtended,
  playerB: PlayerExtended,
  options?: {
    analyst?: string;
    generatedAt?: Date;
    status?: string;
  },
): Promise<ApiEnvelope<ExecutiveReportResponse | null>> {
  if (!isValidUUID(playerA.id) || !isValidUUID(playerB.id)) {
    return {
      success: true,
      data: null,
      error: null,
      meta: { source: "empty-selection" },
    };
  }

  const response = await getCompareDataByIds(playerA.id, playerB.id);

  return {
    ...response,
    data: response.data
      ? {
          comparisonData: response.data,
          reportModel: buildExecutiveReportData(response.data, playerA, playerB, options),
        }
      : null,
  };
}
