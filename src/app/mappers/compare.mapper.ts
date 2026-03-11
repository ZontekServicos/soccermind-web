import { mapApiPlayerToExtended, type ApiPlayerLike } from "./player.mapper";

type UnknownRecord = Record<string, unknown>;

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

function buildRadarData(
  statsA: Record<string, number>,
  statsB: Record<string, number>,
) {
  return [
    { attribute: "Pace", A: toNumber(statsA.pace), B: toNumber(statsB.pace) },
    { attribute: "Shooting", A: toNumber(statsA.shooting), B: toNumber(statsB.shooting) },
    { attribute: "Passing", A: toNumber(statsA.passing), B: toNumber(statsB.passing) },
    { attribute: "Dribbling", A: toNumber(statsA.dribbling), B: toNumber(statsB.dribbling) },
    { attribute: "Defending", A: toNumber(statsA.defending), B: toNumber(statsB.defending) },
    { attribute: "Physical", A: toNumber(statsA.physical), B: toNumber(statsB.physical) },
  ];
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

  playerA.capitalEfficiency = toNumber(capitalA?.index, playerA.capitalEfficiency);
  playerB.capitalEfficiency = toNumber(capitalB?.index, playerB.capitalEfficiency);
  playerA.overallRating = toNumber(overallA?.overall, playerA.overallRating);
  playerB.overallRating = toNumber(overallB?.overall, playerB.overallRating);
  playerA.positionRank = toNumber(overallA?.positionRank, playerA.positionRank);
  playerB.positionRank = toNumber(overallB?.positionRank, playerB.positionRank);

  playerA.structuralRisk = {
    score: toNumber(riskA?.totalRisk, playerA.structuralRisk.score),
    level:
      toNumber(riskA?.totalRisk, playerA.structuralRisk.score) >= 60
        ? "HIGH"
        : toNumber(riskA?.totalRisk, playerA.structuralRisk.score) >= 20
          ? "MEDIUM"
          : "LOW",
    breakdown: toText(riskA?.executiveSummary, playerA.structuralRisk.breakdown),
  };
  playerB.structuralRisk = {
    score: toNumber(riskB?.totalRisk, playerB.structuralRisk.score),
    level:
      toNumber(riskB?.totalRisk, playerB.structuralRisk.score) >= 60
        ? "HIGH"
        : toNumber(riskB?.totalRisk, playerB.structuralRisk.score) >= 20
          ? "MEDIUM"
          : "LOW",
    breakdown: toText(riskB?.executiveSummary, playerB.structuralRisk.breakdown),
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
    score: toNumber(liquidityA?.liquidityScore, playerA.liquidity.score),
    resaleWindow: toText(liquidityA?.resaleWindow, playerA.liquidity.resaleWindow),
    marketProfile: toText(liquidityA?.marketProfile, playerA.liquidity.marketProfile),
  };
  playerB.liquidity = {
    score: toNumber(liquidityB?.liquidityScore, playerB.liquidity.score),
    resaleWindow: toText(liquidityB?.resaleWindow, playerB.liquidity.resaleWindow),
    marketProfile: toText(liquidityB?.marketProfile, playerB.liquidity.marketProfile),
  };

  playerA.financialRisk = {
    index: toNumber(financialA?.riskIndex, playerA.financialRisk.index),
    capitalExposure: toText(financialA?.capitalExposure, playerA.financialRisk.capitalExposure),
    investmentProfile: toText(financialA?.investmentProfile, playerA.financialRisk.investmentProfile),
  };
  playerB.financialRisk = {
    index: toNumber(financialB?.riskIndex, playerB.financialRisk.index),
    capitalExposure: toText(financialB?.capitalExposure, playerB.financialRisk.capitalExposure),
    investmentProfile: toText(financialB?.investmentProfile, playerB.financialRisk.investmentProfile),
  };

  playerA.riskLevel = playerA.structuralRisk.level;
  playerB.riskLevel = playerB.structuralRisk.level;

  const radarData = buildRadarData(playerA.stats, playerB.stats);
  const winner = normalizeWinner(
    source.winner ?? pickRecord(source, ["quantitative"])?.winner,
  );

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
  };
}
