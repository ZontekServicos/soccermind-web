import type { ApiEnvelope } from "../../app/services/api";
import {
  buildDashboardViewModel,
  type ChartDatum,
  type DashboardViewModel,
  type RiskBucket,
  type StrategicAsset,
} from "../../adapters/dashboard";
import { getDataSource } from "../../config/dataSource";
import { getExtendedPlayers } from "../players";

export type { ChartDatum, DashboardViewModel, RiskBucket, StrategicAsset };

export async function getDashboardData(limit = 80): Promise<ApiEnvelope<DashboardViewModel>> {
  const playersResponse = await getExtendedPlayers(1, limit);
  const source = getDataSource("dashboard") === "mock" ? "mock" : ((playersResponse.meta?.source as string | undefined) ?? "api");

  return {
    ...playersResponse,
    data: buildDashboardViewModel(playersResponse.data ?? []),
    meta: { ...(playersResponse.meta ?? {}), source },
  };
}
