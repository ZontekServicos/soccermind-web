import { buildExecutiveReportModel } from "../app/utils/executiveReport";
import type { CompareViewModel } from "./compare";
import type { PlayerExtended } from "../app/types/player";

export function buildExecutiveReportData(
  comparisonData: CompareViewModel | null,
  playerA: PlayerExtended,
  playerB: PlayerExtended,
  options?: {
    analyst?: string;
    generatedAt?: Date;
    status?: string;
  },
) {
  const displayPlayerA = comparisonData?.playerA ?? playerA;
  const displayPlayerB = comparisonData?.playerB ?? playerB;

  if (!displayPlayerA.id || !displayPlayerB.id) {
    return null;
  }

  return buildExecutiveReportModel({
    playerA: displayPlayerA,
    playerB: displayPlayerB,
    winner: comparisonData?.winner ?? "DRAW",
    comparison: comparisonData?.comparison,
    analyst: options?.analyst,
    generatedAt: options?.generatedAt,
    status: options?.status,
  });
}
