import { mapApiPlayerToExtended, type ApiPlayerLike } from "./player.mapper";

function toPlayerPayload(
  player: Record<string, unknown> | undefined,
  fifaCard: Record<string, unknown> | undefined,
  overallData: Record<string, unknown> | undefined,
): ApiPlayerLike {
  const fifaPlayer = (fifaCard?.player || {}) as Record<string, unknown>;
  const core = (fifaCard?.core || {}) as Record<string, unknown>;

  return {
    id: String(player?.id ?? fifaPlayer.id ?? ""),
    name: String(player?.name ?? fifaPlayer.name ?? "Sem dados"),
    position: String(player?.position ?? fifaPlayer.position ?? "N/A"),
    positions: [String(player?.position ?? fifaPlayer.position ?? "N/A")],
    nationality: String(player?.nationality ?? fifaPlayer.nationality ?? "N/A"),
    age: Number(player?.age ?? 0),
    overall: Number(overallData?.overall ?? fifaCard?.overall ?? 0),
    potential: Number(overallData?.overall ?? fifaCard?.overall ?? 0),
    attributes: {
      pace: Number(core.pace ?? 0),
      shooting: Number(core.shooting ?? 0),
      passing: Number(core.passing ?? 0),
      dribbling: Number(core.dribbling ?? 0),
      defending: Number(core.defending ?? 0),
      physical: Number(core.physical ?? 0),
    },
  };
}

export function mapCompareResponse(response: any) {
  const players = (response?.players || {}) as Record<string, Record<string, unknown>>;
  const fifaCards = (response?.fifaCards || {}) as Record<string, Record<string, unknown>>;
  const overallRating = (response?.overallRating || {}) as Record<string, Record<string, unknown>>;
  const capitalEfficiency = (response?.capitalEfficiency || {}) as Record<string, Record<string, unknown>>;
  const liquidity = (response?.liquidity || {}) as Record<string, Record<string, unknown>>;
  const financialRisk = (response?.financialRisk || {}) as Record<string, Record<string, unknown>>;
  const risk = (response?.risk || {}) as Record<string, Record<string, unknown>>;
  const antiFlop = (response?.antiFlop || {}) as Record<string, Record<string, unknown>>;

  const playerA = mapApiPlayerToExtended(
    toPlayerPayload(players.playerA, fifaCards.playerA, overallRating.playerA),
  );
  const playerB = mapApiPlayerToExtended(
    toPlayerPayload(players.playerB, fifaCards.playerB, overallRating.playerB),
  );

  playerA.capitalEfficiency = Number(capitalEfficiency.playerA?.index ?? playerA.capitalEfficiency);
  playerB.capitalEfficiency = Number(capitalEfficiency.playerB?.index ?? playerB.capitalEfficiency);
  playerA.overallRating = Number(overallRating.playerA?.overall ?? playerA.overallRating);
  playerB.overallRating = Number(overallRating.playerB?.overall ?? playerB.overallRating);
  playerA.positionRank = Number.parseInt(String(overallRating.playerA?.positionRank ?? "0"), 10) || 0;
  playerB.positionRank = Number.parseInt(String(overallRating.playerB?.positionRank ?? "0"), 10) || 0;
  playerA.structuralRisk = {
    score: Number(risk.playerA?.totalRisk ?? playerA.structuralRisk.score),
    level:
      Number(risk.playerA?.totalRisk ?? playerA.structuralRisk.score) >= 60
        ? "HIGH"
        : Number(risk.playerA?.totalRisk ?? playerA.structuralRisk.score) >= 20
          ? "MEDIUM"
          : "LOW",
    breakdown: String(risk.playerA?.executiveSummary ?? playerA.structuralRisk.breakdown),
  };
  playerB.structuralRisk = {
    score: Number(risk.playerB?.totalRisk ?? playerB.structuralRisk.score),
    level:
      Number(risk.playerB?.totalRisk ?? playerB.structuralRisk.score) >= 60
        ? "HIGH"
        : Number(risk.playerB?.totalRisk ?? playerB.structuralRisk.score) >= 20
          ? "MEDIUM"
          : "LOW",
    breakdown: String(risk.playerB?.executiveSummary ?? playerB.structuralRisk.breakdown),
  };
  playerA.antiFlopIndex = {
    flopProbability: Number(antiFlop.playerA?.flopProbability ?? playerA.antiFlopIndex.flopProbability),
    safetyIndex: Number(antiFlop.playerA?.safetyIndex ?? playerA.antiFlopIndex.safetyIndex),
    classification: String(antiFlop.playerA?.classification ?? playerA.antiFlopIndex.classification),
  };
  playerB.antiFlopIndex = {
    flopProbability: Number(antiFlop.playerB?.flopProbability ?? playerB.antiFlopIndex.flopProbability),
    safetyIndex: Number(antiFlop.playerB?.safetyIndex ?? playerB.antiFlopIndex.safetyIndex),
    classification: String(antiFlop.playerB?.classification ?? playerB.antiFlopIndex.classification),
  };
  playerA.liquidity = {
    score: Number(liquidity.playerA?.liquidityScore ?? playerA.liquidity.score),
    resaleWindow: String(liquidity.playerA?.resaleWindow ?? playerA.liquidity.resaleWindow),
    marketProfile: String(liquidity.playerA?.marketProfile ?? playerA.liquidity.marketProfile),
  };
  playerB.liquidity = {
    score: Number(liquidity.playerB?.liquidityScore ?? playerB.liquidity.score),
    resaleWindow: String(liquidity.playerB?.resaleWindow ?? playerB.liquidity.resaleWindow),
    marketProfile: String(liquidity.playerB?.marketProfile ?? playerB.liquidity.marketProfile),
  };
  playerA.financialRisk = {
    index: Number(financialRisk.playerA?.riskIndex ?? playerA.financialRisk.index),
    capitalExposure: String(
      financialRisk.playerA?.capitalExposure ?? playerA.financialRisk.capitalExposure,
    ),
    investmentProfile: String(
      financialRisk.playerA?.investmentProfile ?? playerA.financialRisk.investmentProfile,
    ),
  };
  playerB.financialRisk = {
    index: Number(financialRisk.playerB?.riskIndex ?? playerB.financialRisk.index),
    capitalExposure: String(
      financialRisk.playerB?.capitalExposure ?? playerB.financialRisk.capitalExposure,
    ),
    investmentProfile: String(
      financialRisk.playerB?.investmentProfile ?? playerB.financialRisk.investmentProfile,
    ),
  };
  playerA.riskLevel = playerA.structuralRisk.level;
  playerB.riskLevel = playerB.structuralRisk.level;

  const fifaA = (response?.fifaAttributes?.playerA || {}) as Record<string, number>;
  const fifaB = (response?.fifaAttributes?.playerB || {}) as Record<string, number>;

  return {
    playerA,
    playerB,
    comparison: response,
    radarData: [
      { attribute: "Pace", A: Number(fifaA.pace ?? playerA.stats.pace), B: Number(fifaB.pace ?? playerB.stats.pace) },
      { attribute: "Shooting", A: Number(fifaA.shooting ?? playerA.stats.shooting), B: Number(fifaB.shooting ?? playerB.stats.shooting) },
      { attribute: "Passing", A: Number(fifaA.passing ?? playerA.stats.passing), B: Number(fifaB.passing ?? playerB.stats.passing) },
      { attribute: "Dribbling", A: Number(fifaA.dribbling ?? playerA.stats.dribbling), B: Number(fifaB.dribbling ?? playerB.stats.dribbling) },
      { attribute: "Defending", A: Number(fifaA.defending ?? playerA.stats.defending), B: Number(fifaB.defending ?? playerB.stats.defending) },
      { attribute: "Physical", A: Number(fifaA.physical ?? playerA.stats.physical), B: Number(fifaB.physical ?? playerB.stats.physical) },
    ],
    comparisonStats: [
      { name: "Pace", a: Number(fifaA.pace ?? playerA.stats.pace), b: Number(fifaB.pace ?? playerB.stats.pace) },
      { name: "Shooting", a: Number(fifaA.shooting ?? playerA.stats.shooting), b: Number(fifaB.shooting ?? playerB.stats.shooting) },
      { name: "Passing", a: Number(fifaA.passing ?? playerA.stats.passing), b: Number(fifaB.passing ?? playerB.stats.passing) },
      { name: "Dribbling", a: Number(fifaA.dribbling ?? playerA.stats.dribbling), b: Number(fifaB.dribbling ?? playerB.stats.dribbling) },
      { name: "Defending", a: Number(fifaA.defending ?? playerA.stats.defending), b: Number(fifaB.defending ?? playerB.stats.defending) },
      { name: "Physical", a: Number(fifaA.physical ?? playerA.stats.physical), b: Number(fifaB.physical ?? playerB.stats.physical) },
    ],
  };
}
