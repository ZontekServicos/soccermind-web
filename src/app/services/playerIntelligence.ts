import type { PlayerCardModel, PlayerProfileModel } from "../mappers/player.mapper";
import type {
  ContextSimilarity,
  ExecutiveSnapshot,
  FieldIntelligence,
  IntelligenceMetricBand,
  MarketRiskProfile,
  PlayerIntelligenceGateway,
  PlayerIntelligenceProfile,
  PlayerIntelligenceQuery,
  SalaryRange,
  SeasonTrendPoint,
  SimilarityProfile,
  SoccerMindDna,
  SoccerMindDnaTrait,
  SpatialEventPoint,
  SpatialZone,
} from "../types/player-intelligence";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: Array<number | null | undefined>) {
  const normalized = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (normalized.length === 0) {
    return 0;
  }
  return normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
}

function createSeededRandom(seedInput: string) {
  let seed = 0;

  for (let index = 0; index < seedInput.length; index += 1) {
    seed = (seed * 31 + seedInput.charCodeAt(index)) >>> 0;
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function toBand(label: string, score: number, summary: string): IntelligenceMetricBand {
  return { label, score: clamp(Math.round(score), 0, 100), summary };
}

function resolvePositionFamily(position: string) {
  const normalized = position.toUpperCase();

  if (["ST", "CF", "LW", "RW", "LF", "RF"].includes(normalized)) {
    return "attack";
  }
  if (["CAM", "CM", "CDM", "LM", "RM"].includes(normalized)) {
    return "midfield";
  }
  if (["LB", "RB", "CB", "LWB", "RWB"].includes(normalized)) {
    return "defense";
  }

  return "goalkeeper";
}

function getOverall(player: PlayerProfileModel) {
  return player.overall ?? 68;
}

function getPotential(player: PlayerProfileModel) {
  return player.potential ?? getOverall(player) + 3;
}

function getUpside(player: PlayerProfileModel) {
  return Math.max(0, getPotential(player) - getOverall(player));
}

function getMarketValue(player: PlayerProfileModel) {
  return player.marketValue ?? null;
}

function buildExecutiveSnapshot(player: PlayerProfileModel): ExecutiveSnapshot {
  const overall = getOverall(player);
  const upsideGap = getUpside(player);
  const age = player.age || 24;
  const positionFamily = resolvePositionFamily(player.position || "");
  const confidence = clamp(58 + overall * 0.32 + upsideGap * 2.5, 55, 96);
  const riskScore = clamp(42 + Math.max(0, age - 27) * 5 - upsideGap * 3, 18, 88);
  const upsideScore = clamp(46 + upsideGap * 8 + Math.max(0, 24 - age) * 1.4, 20, 97);
  const liquidityScore = clamp(40 + overall * 0.45 + Math.max(0, 27 - age) * 2.5, 28, 94);
  const tacticalFitScore = clamp(
    average([player.pas, player.dri, player.def, player.phy, player.stats.vision, player.stats.reactions]) +
      (positionFamily === "midfield" ? 6 : positionFamily === "attack" ? 3 : 0),
    32,
    96,
  );

  let recommendation = "Monitor";
  if (overall >= 82 || (upsideGap >= 6 && age <= 24)) {
    recommendation = "Target Now";
  } else if (overall >= 76 || upsideGap >= 4) {
    recommendation = "Priority Watch";
  }

  return {
    recommendation,
    confidence: Math.round(confidence),
    risk: toBand(
      riskScore >= 67 ? "Elevated" : riskScore >= 45 ? "Managed" : "Controlled",
      riskScore,
      "Composite view of age curve, current output stability and adaptation exposure.",
    ),
    upside: toBand(
      upsideScore >= 75 ? "High Growth" : upsideScore >= 55 ? "Expandable" : "Near Ceiling",
      upsideScore,
      "Projected ceiling based on age, current level and room above present output.",
    ),
    liquidity: toBand(
      liquidityScore >= 75 ? "Liquid Asset" : liquidityScore >= 55 ? "Tradable" : "Specialist Market",
      liquidityScore,
      "Estimated market portability across leagues with similar competitive and financial tiers.",
    ),
    tacticalFit: toBand(
      tacticalFitScore >= 78 ? "System Ready" : tacticalFitScore >= 60 ? "Context Dependent" : "Scheme Risk",
      tacticalFitScore,
      "Blend of technical security, transition value and positional suitability for structured football.",
    ),
    idealAcquisitionWindow:
      age <= 22
        ? "Move before breakout pricing accelerates."
        : age <= 26
          ? "Acquire inside the next two windows while performance is scalable."
          : "Short-term opportunity only if the fee remains disciplined.",
  };
}

function traitEmphasis(value: number): SoccerMindDnaTrait["emphasis"] {
  if (value >= 82) return "elite";
  if (value >= 70) return "strong";
  if (value >= 58) return "stable";
  return "developing";
}

function buildSoccerMindDna(player: PlayerProfileModel): SoccerMindDna {
  const traits: SoccerMindDnaTrait[] = [
    ["verticality", "Verticality", average([player.pac, player.stats.acceleration, player.stats.attackPosition]), "Speed and direct carry threat into attacking space."],
    ["progressive-threat", "Progressive Threat", average([player.pas, player.dri, player.stats.vision, player.sho]), "Ability to move possession toward decisive zones."],
    ["ball-security", "Ball Security", average([player.stats.ballControl, player.stats.shortPassing, player.stats.composure, player.dri]), "Retention quality under pressure and clean continuation value."],
    ["tactical-maturity", "Tactical Maturity", average([player.stats.reactions, player.stats.vision, player.stats.composure, player.def]), "Decision quality, timing and positional discipline."],
    ["pressing-intensity", "Pressing Intensity", average([player.phy, player.stats.stamina, player.stats.aggression, player.def]), "Energy and confrontation profile without the ball."],
    ["final-third-creation", "Final-Third Creation", average([player.pas, player.stats.crossing, player.stats.curve, player.stats.longPassing]), "Creation volume in advanced areas."],
    ["depth-attack", "Depth Attack", average([player.pac, player.stats.sprintSpeed, player.stats.attackPosition, player.sho]), "Threat behind the line and access to the penalty box."],
    ["transition-impact", "Transition Impact", average([player.pac, player.pas, player.dri, player.stats.reactions]), "Value added when phases accelerate."],
  ].map(([key, label, value, note]) => ({
    key: key as string,
    label: label as string,
    value: Math.round(clamp(value as number, 20, 98)),
    emphasis: traitEmphasis(value as number),
    note: note as string,
  }));

  const dominantTags = traits
    .filter((trait) => trait.value >= 72)
    .sort((left, right) => right.value - left.value)
    .slice(0, 4)
    .map((trait) => trait.label);

  return {
    dominantTags: dominantTags.length > 0 ? dominantTags : ["Developmental Profile"],
    traits,
  };
}

function buildHeatZones(player: PlayerProfileModel, random: () => number): SpatialZone[] {
  const positionFamily = resolvePositionFamily(player.position || "");
  const zones: SpatialZone[] = [];

  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      const centerBias =
        positionFamily === "attack"
          ? column >= 3
            ? 24
            : 8
          : positionFamily === "midfield"
            ? column >= 2 && column <= 4
              ? 18
              : 10
            : positionFamily === "defense"
              ? column <= 2
                ? 20
                : 8
              : column <= 1
                ? 26
                : 4;
      const lateralBias = row === 1 || row === 2 ? 8 : 0;

      zones.push({
        x: column * (100 / 6),
        y: row * 25,
        width: 100 / 6,
        height: 25,
        intensity: Math.round(clamp(centerBias + lateralBias + random() * 26, 10, 100)),
      });
    }
  }

  return zones;
}

function buildShotMap(player: PlayerProfileModel, random: () => number): SpatialEventPoint[] {
  const family = resolvePositionFamily(player.position || "");
  const shots = family === "defense" ? 7 : family === "midfield" ? 9 : 11;

  return Array.from({ length: shots }, (_, index) => {
    const xBase = family === "attack" ? 72 : family === "midfield" ? 63 : 54;
    const x = clamp(xBase + random() * 24, 48, 96);
    const y = clamp(22 + random() * 56, 10, 90);
    const quality = clamp(0.06 + random() * 0.34 + ((player.sho ?? 50) - 50) / 200, 0.04, 0.62);
    const outcomeChance = random();

    return {
      x,
      y,
      value: Number(quality.toFixed(2)),
      outcome: outcomeChance > 0.84 ? "goal" : outcomeChance > 0.5 ? "saved" : "blocked",
      label: `Shot ${index + 1}`,
    };
  });
}

function buildPassMap(player: PlayerProfileModel, random: () => number): SpatialEventPoint[] {
  const family = resolvePositionFamily(player.position || "");
  const count = family === "midfield" ? 14 : family === "attack" ? 10 : 12;

  return Array.from({ length: count }, (_, index) => {
    const startX = family === "attack" ? 40 + random() * 28 : family === "midfield" ? 28 + random() * 34 : 18 + random() * 28;
    const endX = clamp(startX + 8 + random() * 28, startX + 4, 98);
    const startY = 14 + random() * 72;
    const endY = clamp(startY + (random() - 0.5) * 28, 6, 94);

    return {
      x: startX,
      y: startY,
      endX,
      endY,
      outcome: random() > 0.18 ? "success" : "fail",
      label: `Pass ${index + 1}`,
    };
  });
}

function buildDefensiveActions(player: PlayerProfileModel, random: () => number): SpatialEventPoint[] {
  const family = resolvePositionFamily(player.position || "");
  const count = family === "defense" ? 12 : family === "midfield" ? 10 : 6;

  return Array.from({ length: count }, (_, index) => ({
    x: clamp((family === "defense" ? 34 : family === "midfield" ? 44 : 58) + (random() - 0.5) * 24, 12, 88),
    y: clamp(10 + random() * 80, 8, 92),
    outcome: random() > 0.22 ? "success" : "fail",
    label: `Action ${index + 1}`,
  }));
}

function buildFieldIntelligence(player: PlayerProfileModel): FieldIntelligence {
  const random = createSeededRandom(`${player.id}:${player.position}:${player.name}`);

  return {
    heatmap: buildHeatZones(player, random),
    shots: buildShotMap(player, random),
    passes: buildPassMap(player, random),
    defensiveActions: buildDefensiveActions(player, random),
  };
}

function formatCurrencyCompact(value: number) {
  if (value >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `EUR ${(value / 1_000).toFixed(0)}K`;
  return `EUR ${value.toFixed(0)}`;
}

function buildSalaryRange(player: PlayerProfileModel): SalaryRange {
  const marketValue = getMarketValue(player) ?? Math.max(500_000, getOverall(player) * 110_000);
  const yearlyMin = Math.round(marketValue * 0.07);
  const yearlyMax = Math.round(marketValue * 0.12);

  return {
    min: yearlyMin,
    max: yearlyMax,
    currency: "EUR",
    period: "yearly",
    label: `${formatCurrencyCompact(yearlyMin)} - ${formatCurrencyCompact(yearlyMax)} / year`,
  };
}

function buildMarketRisk(player: PlayerProfileModel, executiveSnapshot: ExecutiveSnapshot): MarketRiskProfile {
  const marketValue = getMarketValue(player);
  const age = player.age || 24;
  const physicalRiskScore = clamp(32 + Math.max(0, age - 28) * 6 + (100 - (player.phy ?? 60)) * 0.24, 18, 92);
  const tacticalRiskScore = clamp(100 - executiveSnapshot.tacticalFit.score + 12, 18, 90);
  const financialRiskScore = clamp(24 + (marketValue ? marketValue / 1_500_000 : 18) - executiveSnapshot.liquidity.score * 0.18, 20, 94);
  const resalePotentialScore = clamp(34 + executiveSnapshot.upside.score * 0.52 + executiveSnapshot.liquidity.score * 0.22 - Math.max(0, age - 26) * 4, 18, 96);

  return {
    marketValue,
    salaryRange: buildSalaryRange(player),
    liquidity: executiveSnapshot.liquidity,
    physicalRisk: toBand(
      physicalRiskScore >= 68 ? "Monitor Body Load" : physicalRiskScore >= 45 ? "Manageable" : "Stable",
      physicalRiskScore,
      "Mock proxy until medical and load-history feeds are wired into the intelligence layer.",
    ),
    tacticalAdaptationRisk: toBand(
      tacticalRiskScore >= 68 ? "High Context Risk" : tacticalRiskScore >= 48 ? "Needs Structure" : "Plug-In Ready",
      tacticalRiskScore,
      "Rates how much coaching structure is needed before the player reaches expected output.",
    ),
    financialRisk: toBand(
      financialRiskScore >= 68 ? "Capital Sensitive" : financialRiskScore >= 46 ? "Disciplined Deal" : "Efficient Entry",
      financialRiskScore,
      "Blends estimated fee pressure, salary load and expected exit optionality.",
    ),
    resalePotential: toBand(
      resalePotentialScore >= 76 ? "Strong Exit" : resalePotentialScore >= 55 ? "Protected" : "Limited Exit",
      resalePotentialScore,
      "Forward-looking resale optionality based on age, liquidity and growth headroom.",
    ),
  };
}

function buildSimilarityProfiles(player: PlayerProfileModel, similarPlayers: PlayerCardModel[]): SimilarityProfile[] {
  return similarPlayers.slice(0, 4).map((similarPlayer, index) => ({
    id: similarPlayer.id,
    name: similarPlayer.name,
    position: similarPlayer.position,
    team: similarPlayer.team || "Open Market",
    fitScore: clamp(
      64 +
        Math.max(0, 12 - Math.abs((similarPlayer.overall ?? getOverall(player)) - getOverall(player))) +
        Math.max(0, 8 - Math.abs((similarPlayer.potential ?? getPotential(player)) - getPotential(player))) -
        index * 2,
      55,
      95,
    ),
    rationale: "Comparable role profile, market tier and output shape for shortlist triangulation.",
  }));
}

function buildIdealSystems(player: PlayerProfileModel) {
  const family = resolvePositionFamily(player.position || "");

  if (family === "attack") return ["4-3-3 vertical press", "4-2-3-1 transition attack", "3-4-2-1 box occupation"];
  if (family === "midfield") return ["4-3-3 control-possession", "3-2-4-1 hybrid build", "4-4-2 diamond progression"];
  if (family === "defense") return ["4-3-3 high line", "3-4-3 aggressive rest defense", "4-2-2-2 compact press"];
  return ["4-3-3 build-first", "3-2 rest defense", "4-4-2 medium block"];
}

function buildIdealClubs(player: PlayerProfileModel, executiveSnapshot: ExecutiveSnapshot) {
  const family = resolvePositionFamily(player.position || "");
  const liquidity = executiveSnapshot.liquidity.score;

  if (family === "attack") return liquidity >= 70 ? ["Brighton", "Benfica", "Atalanta"] : ["Real Sociedad", "Lille", "Bologna"];
  if (family === "midfield") return liquidity >= 70 ? ["RB Leipzig", "Girona", "Feyenoord"] : ["Torino", "Braga", "Toulouse"];
  if (family === "defense") return liquidity >= 70 ? ["Leverkusen", "Sporting CP", "Bologna"] : ["Getafe", "Lens", "Freiburg"];
  return ["PSV", "Lazio", "Real Betis"];
}

function buildSeasonTrends(player: PlayerProfileModel, projection?: Record<string, unknown> | null): SeasonTrendPoint[] {
  const overall = getOverall(player);
  const peak =
    typeof projection?.projectedPeak === "number"
      ? projection.projectedPeak
      : typeof projection?.potential === "number"
        ? projection.potential
        : getPotential(player);
  const currentSeason = new Date().getFullYear();
  const baseMarket = getMarketValue(player) ?? 6_000_000;

  return [
    { season: `${currentSeason - 2}/${String(currentSeason - 1).slice(-2)}`, performance: clamp(overall - 6, 40, 99), market: clamp(baseMarket * 0.72, 500_000, 120_000_000) },
    { season: `${currentSeason - 1}/${String(currentSeason).slice(-2)}`, performance: clamp(overall - 3, 40, 99), market: clamp(baseMarket * 0.86, 500_000, 120_000_000) },
    { season: `${currentSeason}/${String(currentSeason + 1).slice(-2)}`, performance: overall, market: clamp(baseMarket, 500_000, 120_000_000) },
    { season: `${currentSeason + 1}/${String(currentSeason + 2).slice(-2)}`, performance: clamp(Math.round((overall + peak) / 2), 40, 99), market: clamp(baseMarket * 1.12, 500_000, 140_000_000) },
    { season: `${currentSeason + 2}/${String(currentSeason + 3).slice(-2)}`, performance: clamp(peak, 40, 99), market: clamp(baseMarket * 1.26, 500_000, 150_000_000) },
  ];
}

function buildContextSimilarity(
  player: PlayerProfileModel,
  similarPlayers: PlayerCardModel[],
  executiveSnapshot: ExecutiveSnapshot,
  projection?: Record<string, unknown> | null,
): ContextSimilarity {
  return {
    similarPlayers: buildSimilarityProfiles(player, similarPlayers),
    idealSystems: buildIdealSystems(player),
    idealClubs: buildIdealClubs(player, executiveSnapshot),
    seasonTrends: buildSeasonTrends(player, projection),
  };
}

class MockPlayerIntelligenceGateway implements PlayerIntelligenceGateway {
  async getProfile(query: PlayerIntelligenceQuery): Promise<PlayerIntelligenceProfile> {
    const executiveSnapshot = buildExecutiveSnapshot(query.player);

    return {
      playerId: query.player.id,
      playerName: query.player.name,
      executiveSnapshot,
      soccerMindDna: buildSoccerMindDna(query.player),
      fieldIntelligence: buildFieldIntelligence(query.player),
      marketRisk: buildMarketRisk(query.player, executiveSnapshot),
      contextSimilarity: buildContextSimilarity(query.player, query.similarPlayers, executiveSnapshot, query.projection),
      dataStatus: {
        source: "mock",
        eventDataReady: true,
        shotLocationsReady: true,
        passLocationsReady: true,
        heatZonesReady: true,
        seasonTrendReady: true,
      },
    };
  }
}

const intelligenceGateway: PlayerIntelligenceGateway = new MockPlayerIntelligenceGateway();

export async function getPlayerIntelligenceProfile(query: PlayerIntelligenceQuery) {
  return intelligenceGateway.getProfile(query);
}
