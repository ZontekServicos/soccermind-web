import { mapApiPlayerToExtended, type ApiPlayerLike } from "./player.mapper";

type UnknownRecord = Record<string, unknown>;

type PositionContextKind = "same" | "related" | "cross";

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toText(value: unknown, fallback = "") {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || fallback;
  }

  return fallback;
}

function unwrapData(value: unknown): unknown {
  if (isRecord(value) && "data" in value && value.data !== undefined) {
    return unwrapData(value.data);
  }

  return value;
}

function pickRecord(source: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (isRecord(value)) {
      return value;
    }
  }

  return null;
}

function mergePlayerPayload(
  direct: UnknownRecord | null,
  summary: UnknownRecord | null,
  fifaCard: UnknownRecord | null,
  overallData: UnknownRecord | null,
) {
  const fifaPlayer = pickRecord(fifaCard ?? {}, ["player"]);
  const fifaCore = pickRecord(fifaCard ?? {}, ["core"]);
  const fifaDetailedStats = pickRecord(fifaCard ?? {}, ["detailedStats"]);
  const fifaStyle = isRecord(fifaCard)
    ? {
        core: fifaCore ?? {},
        detailedStats: fifaDetailedStats ?? {},
      }
    : undefined;

  return {
    ...(summary ?? {}),
    ...(fifaPlayer ?? {}),
    ...(direct ?? {}),
    position: direct?.position ?? fifaPlayer?.position ?? summary?.position ?? null,
    positions:
      direct?.positions ??
      fifaPlayer?.positions ??
      summary?.positions ??
      (direct?.position ?? fifaPlayer?.position ?? summary?.position ?? null),
    overall:
      direct?.overall ??
      overallData?.overall ??
      fifaCard?.overall ??
      summary?.overall ??
      null,
    potential:
      direct?.potential ??
      overallData?.potential ??
      fifaCard?.potential ??
      summary?.potential ??
      overallData?.overall ??
      fifaCard?.overall ??
      null,
    team: direct?.team ?? fifaCard?.team ?? fifaPlayer?.team ?? summary?.team ?? null,
    league: direct?.league ?? fifaCard?.league ?? fifaPlayer?.league ?? summary?.league ?? null,
    marketValue:
      direct?.marketValue ??
      fifaCard?.marketValue ??
      fifaPlayer?.marketValue ??
      summary?.marketValue ??
      null,
    attributes: {
      ...(fifaDetailedStats ?? {}),
      ...(fifaCore ?? {}),
      ...(fifaCard?.attributes && isRecord(fifaCard.attributes) ? fifaCard.attributes : {}),
      ...(direct?.attributes && isRecord(direct.attributes) ? direct.attributes : {}),
    },
    fifaStyle,
  } satisfies ApiPlayerLike & UnknownRecord;
}

function normalizeWinner(value: unknown) {
  const normalized = toText(value, "DRAW").toUpperCase();
  if (normalized === "PLAYERA" || normalized === "A") {
    return "A" as const;
  }
  if (normalized === "PLAYERB" || normalized === "B") {
    return "B" as const;
  }
  return "DRAW" as const;
}

function buildRadarData(statsA: Record<string, number>, statsB: Record<string, number>) {
  return [
    { attribute: "Pace", A: toNumber(statsA.pace), B: toNumber(statsB.pace) },
    { attribute: "Shooting", A: toNumber(statsA.shooting), B: toNumber(statsB.shooting) },
    { attribute: "Passing", A: toNumber(statsA.passing), B: toNumber(statsB.passing) },
    { attribute: "Dribbling", A: toNumber(statsA.dribbling), B: toNumber(statsB.dribbling) },
    { attribute: "Defending", A: toNumber(statsA.defending), B: toNumber(statsB.defending) },
    { attribute: "Physical", A: toNumber(statsA.physical), B: toNumber(statsB.physical) },
  ];
}

const POSITION_GROUPS: Record<string, string> = {
  ST: "attack",
  CF: "attack",
  RW: "attack",
  LW: "attack",
  CAM: "midfield",
  CM: "midfield",
  CDM: "midfield",
  RB: "wide-defense",
  LB: "wide-defense",
  RWB: "wide-defense",
  LWB: "wide-defense",
  CB: "central-defense",
  GK: "goalkeeper",
};

function getPositionGroup(position: string) {
  return POSITION_GROUPS[position] ?? "hybrid";
}

function normalizePositionContextKind(value: unknown): PositionContextKind {
  const normalized = toText(value, "cross").toLowerCase();
  if (normalized === "same" || normalized === "related" || normalized === "cross") {
    return normalized;
  }
  return "cross";
}

function normalizeRiskLevel(value: unknown) {
  const normalized = toText(value, "").toUpperCase();
  if (normalized === "LOW" || normalized === "MEDIUM" || normalized === "HIGH") {
    return normalized;
  }
  return null;
}

function buildFallbackPositionContext(positionA: string, positionB: string) {
  const groupA = getPositionGroup(positionA);
  const groupB = getPositionGroup(positionB);

  if (positionA === positionB) {
    return {
      kind: "same" as const,
      label: "Comparacao posicional direta",
      tone: "neutral",
      message: "Os dois jogadores compartilham a mesma posicao primaria.",
      positionA,
      positionB,
      groupA,
      groupB,
    };
  }

  if (groupA === groupB) {
    return {
      kind: "related" as const,
      label: "Comparacao compativel",
      tone: "info",
      message: "As posicoes sao diferentes, mas pertencem ao mesmo grupo funcional.",
      positionA,
      positionB,
      groupA,
      groupB,
    };
  }

  return {
    kind: "cross" as const,
    label: "Comparacao cruzada",
    tone: "warning",
    message: "A leitura deve considerar contextos taticos distintos entre as funcoes.",
    positionA,
    positionB,
    groupA,
    groupB,
  };
}

export function mapCompareResponse(response: unknown) {
  const payload = unwrapData(response);
  const source = isRecord(payload) ? payload : {};

  const normalizedPlayerA =
    pickRecord(source, ["playerA"]) ??
    mergePlayerPayload(
      pickRecord(pickRecord(source, ["players"]) ?? {}, ["playerA"]),
      pickRecord(pickRecord(source, ["summary"]) ?? {}, ["playerA"]),
      pickRecord(pickRecord(source, ["fifaCards"]) ?? {}, ["playerA"]),
      pickRecord(pickRecord(source, ["overallRating"]) ?? {}, ["playerA"]),
    );

  const normalizedPlayerB =
    pickRecord(source, ["playerB"]) ??
    mergePlayerPayload(
      pickRecord(pickRecord(source, ["players"]) ?? {}, ["playerB"]),
      pickRecord(pickRecord(source, ["summary"]) ?? {}, ["playerB"]),
      pickRecord(pickRecord(source, ["fifaCards"]) ?? {}, ["playerB"]),
      pickRecord(pickRecord(source, ["overallRating"]) ?? {}, ["playerB"]),
    );

  const playerA = mapApiPlayerToExtended(normalizedPlayerA);
  const playerB = mapApiPlayerToExtended(normalizedPlayerB);
  const normalizedStructuralA = pickRecord(normalizedPlayerA, ["structuralRisk"]);
  const normalizedStructuralB = pickRecord(normalizedPlayerB, ["structuralRisk"]);
  const normalizedLiquidityA = pickRecord(normalizedPlayerA, ["liquidity"]);
  const normalizedLiquidityB = pickRecord(normalizedPlayerB, ["liquidity"]);
  const normalizedFinancialA = pickRecord(normalizedPlayerA, ["financialRisk"]);
  const normalizedFinancialB = pickRecord(normalizedPlayerB, ["financialRisk"]);

  const overallA = pickRecord(pickRecord(source, ["overallRating"]) ?? {}, ["playerA"]);
  const overallB = pickRecord(pickRecord(source, ["overallRating"]) ?? {}, ["playerB"]);
  const capitalA = pickRecord(pickRecord(source, ["capitalEfficiency"]) ?? {}, ["playerA"]);
  const capitalB = pickRecord(pickRecord(source, ["capitalEfficiency"]) ?? {}, ["playerB"]);
  const liquidityA = pickRecord(pickRecord(source, ["liquidity"]) ?? {}, ["playerA"]);
  const liquidityB = pickRecord(pickRecord(source, ["liquidity"]) ?? {}, ["playerB"]);
  const financialA = pickRecord(pickRecord(source, ["financialRisk"]) ?? {}, ["playerA"]);
  const financialB = pickRecord(pickRecord(source, ["financialRisk"]) ?? {}, ["playerB"]);
  const riskA = pickRecord(pickRecord(source, ["risk"]) ?? {}, ["playerA"]);
  const riskB = pickRecord(pickRecord(source, ["risk"]) ?? {}, ["playerB"]);
  const antiFlopA = pickRecord(pickRecord(source, ["antiFlop"]) ?? {}, ["playerA"]);
  const antiFlopB = pickRecord(pickRecord(source, ["antiFlop"]) ?? {}, ["playerB"]);
  const riskProfileA = pickRecord(pickRecord(source, ["riskProfile"]) ?? {}, ["playerA"]);
  const riskProfileB = pickRecord(pickRecord(source, ["riskProfile"]) ?? {}, ["playerB"]);
  const positionContextSource = pickRecord(source, ["positionContext"]);

  playerA.capitalEfficiency = toNumber(capitalA?.index, playerA.capitalEfficiency);
  playerB.capitalEfficiency = toNumber(capitalB?.index, playerB.capitalEfficiency);
  playerA.overallRating = toNumber(overallA?.overall, playerA.overallRating);
  playerB.overallRating = toNumber(overallB?.overall, playerB.overallRating);
  playerA.positionRank = toNumber(overallA?.positionRank, playerA.positionRank);
  playerB.positionRank = toNumber(overallB?.positionRank, playerB.positionRank);

  playerA.structuralRisk = {
    score: normalizedStructuralA ? playerA.structuralRisk.score : toNumber(riskA?.totalRisk, playerA.structuralRisk.score),
    level: normalizedStructuralA
      ? playerA.structuralRisk.level
      : toNumber(riskA?.totalRisk, playerA.structuralRisk.score) >= 60
        ? "HIGH"
        : toNumber(riskA?.totalRisk, playerA.structuralRisk.score) >= 20
          ? "MEDIUM"
          : "LOW",
    breakdown: normalizedStructuralA
      ? playerA.structuralRisk.breakdown
      : toText(riskA?.executiveSummary, playerA.structuralRisk.breakdown),
  };
  playerB.structuralRisk = {
    score: normalizedStructuralB ? playerB.structuralRisk.score : toNumber(riskB?.totalRisk, playerB.structuralRisk.score),
    level: normalizedStructuralB
      ? playerB.structuralRisk.level
      : toNumber(riskB?.totalRisk, playerB.structuralRisk.score) >= 60
        ? "HIGH"
        : toNumber(riskB?.totalRisk, playerB.structuralRisk.score) >= 20
          ? "MEDIUM"
          : "LOW",
    breakdown: normalizedStructuralB
      ? playerB.structuralRisk.breakdown
      : toText(riskB?.executiveSummary, playerB.structuralRisk.breakdown),
  };

  playerA.antiFlopIndex = {
    flopProbability: toNumber(antiFlopA?.flopProbability, playerA.antiFlopIndex.flopProbability),
    safetyIndex: toNumber(antiFlopA?.safetyIndex, playerA.antiFlopIndex.safetyIndex),
    classification: toText(antiFlopA?.classification, playerA.antiFlopIndex.classification),
  };
  playerB.antiFlopIndex = {
    flopProbability: toNumber(antiFlopB?.flopProbability, playerB.antiFlopIndex.flopProbability),
    safetyIndex: toNumber(antiFlopB?.safetyIndex, playerB.antiFlopIndex.safetyIndex),
    classification: toText(antiFlopB?.classification, playerB.antiFlopIndex.classification),
  };

  playerA.liquidity = {
    score: normalizedLiquidityA ? playerA.liquidity.score : toNumber(liquidityA?.liquidityScore, playerA.liquidity.score),
    resaleWindow: toText(liquidityA?.resaleWindow, playerA.liquidity.resaleWindow),
    marketProfile: toText(liquidityA?.marketProfile, playerA.liquidity.marketProfile),
  };
  playerB.liquidity = {
    score: normalizedLiquidityB ? playerB.liquidity.score : toNumber(liquidityB?.liquidityScore, playerB.liquidity.score),
    resaleWindow: toText(liquidityB?.resaleWindow, playerB.liquidity.resaleWindow),
    marketProfile: toText(liquidityB?.marketProfile, playerB.liquidity.marketProfile),
  };

  playerA.financialRisk = {
    index: normalizedFinancialA ? playerA.financialRisk.index : toNumber(financialA?.riskIndex, playerA.financialRisk.index),
    capitalExposure: toText(financialA?.capitalExposure, playerA.financialRisk.capitalExposure),
    investmentProfile: toText(financialA?.investmentProfile, playerA.financialRisk.investmentProfile),
  };
  playerB.financialRisk = {
    index: normalizedFinancialB ? playerB.financialRisk.index : toNumber(financialB?.riskIndex, playerB.financialRisk.index),
    capitalExposure: toText(financialB?.capitalExposure, playerB.financialRisk.capitalExposure),
    investmentProfile: toText(financialB?.investmentProfile, playerB.financialRisk.investmentProfile),
  };

  if (riskProfileA) {
    playerA.risk = {
      score: toNumber(riskProfileA.score, playerA.risk.score),
      level: normalizeRiskLevel(riskProfileA.level) ?? playerA.risk.level,
      explanation: toText(riskProfileA.explanation, playerA.risk.explanation),
    };
  }

  if (riskProfileB) {
    playerB.risk = {
      score: toNumber(riskProfileB.score, playerB.risk.score),
      level: normalizeRiskLevel(riskProfileB.level) ?? playerB.risk.level,
      explanation: toText(riskProfileB.explanation, playerB.risk.explanation),
    };
  }

  playerA.riskLevel = playerA.risk.level;
  playerB.riskLevel = playerB.risk.level;

  const radarData = buildRadarData(playerA.stats, playerB.stats);
  const winner = normalizeWinner(source.winner ?? pickRecord(source, ["quantitative"])?.winner);
  const fallbackPositionContext = buildFallbackPositionContext(playerA.position, playerB.position);
  const positionContext = {
    ...fallbackPositionContext,
    ...(positionContextSource
      ? {
          kind: normalizePositionContextKind(positionContextSource.kind),
          label: toText(positionContextSource.label, fallbackPositionContext.label),
          tone: toText(positionContextSource.tone, fallbackPositionContext.tone),
          message: toText(positionContextSource.message, fallbackPositionContext.message),
          positionA: toText(positionContextSource.positionA, fallbackPositionContext.positionA),
          positionB: toText(positionContextSource.positionB, fallbackPositionContext.positionB),
          groupA: toText(positionContextSource.groupA, fallbackPositionContext.groupA),
          groupB: toText(positionContextSource.groupB, fallbackPositionContext.groupB),
        }
      : {}),
  };

  return {
    playerA,
    playerB,
    winner,
    comparison: source.comparison ?? source,
    radarData,
    comparisonStats: radarData.map((item) => ({
      name: item.attribute,
      a: item.A,
      b: item.B,
    })),
    positionContext,
  };
}
