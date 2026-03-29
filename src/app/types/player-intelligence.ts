import type { PlayerCardModel, PlayerProfileModel } from "../mappers/player.mapper";

export type IntelligenceDataSource = "mock" | "hybrid" | "live";

export interface IntelligenceMetricBand {
  label: string;
  score: number;
  summary: string;
}

export interface PlayerIdentity {
  id: string;
  slug?: string | null;
  name: string;
  age: number | null;
  nationality: string | null;
  club: string | null;
  league: string | null;
  primaryPosition: string | null;
  secondaryPositions: string[];
  preferredFoot?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  imagePath?: string | null;
}

export interface ExecutiveSnapshot {
  status: "elite_target" | "priority_watch" | "monitor" | "data_gap";
  recommendation: string;
  confidence: number;
  summary: string;
  decisionWindow: string;
  currentLevel: IntelligenceMetricBand;
  upside: IntelligenceMetricBand;
  risk: IntelligenceMetricBand;
  marketOpportunity: IntelligenceMetricBand;
}

export interface SoccerMindDnaTrait {
  key: string;
  label: string;
  value: number;
  interpretation: string;
  emphasis?: "elite" | "strong" | "stable" | "developing";
  note?: string;
}

export interface SoccerMindDna {
  archetype: string;
  profileLabel: string;
  dominantTraits: string[];
  traits: SoccerMindDnaTrait[];
}

export interface SpatialZone {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

export interface SpatialEventPoint {
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  value?: number;
  outcome?: "success" | "fail" | "goal" | "saved" | "blocked" | "won" | "lost";
  label?: string;
}

export interface FieldIntelligence {
  isMocked?: boolean;
  heatmap: SpatialZone[];
  shots: SpatialEventPoint[];
  passes: SpatialEventPoint[];
  defensiveActions: SpatialEventPoint[];
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: "weekly" | "monthly" | "yearly";
  label: string;
}

export interface MarketRiskProfile {
  marketValue: number | null;
  salaryRange: SalaryRange;
  liquidity: IntelligenceMetricBand;
  physicalRisk: IntelligenceMetricBand;
  tacticalAdaptationRisk: IntelligenceMetricBand;
  financialRisk: IntelligenceMetricBand;
  resalePotential: IntelligenceMetricBand;
}

export interface SimilarityProfile {
  id: string;
  name: string;
  position: string;
  team: string;
  fitScore: number;
  rationale: string;
}

export interface SeasonTrendPoint {
  season: string;
  overall: number;
  marketValue: number | null;
  riskScore: number;
}

export interface ContextSimilarity {
  similarPlayers: SimilarityProfile[];
  idealSystems: string[];
  idealClubs: string[];
  seasonTrends: SeasonTrendPoint[];
}

export interface PlayerIntelligenceDataStatus {
  source: IntelligenceDataSource;
  eventDataReady: boolean;
  shotLocationsReady: boolean;
  passLocationsReady: boolean;
  heatZonesReady: boolean;
  seasonTrendReady: boolean;
}

export interface PlayerIntelligenceProfile {
  generatedAt?: string;
  identity: PlayerIdentity;
  summary: ExecutiveSnapshot;
  technical: {
    overall: number;
    ballStriking: number;
    passing: number;
    carrying: number;
    firstTouch: number;
    creativity: number;
    defending: number;
    breakdown: Record<string, number>;
  };
  physical: {
    overall: number;
    acceleration: number;
    sprintSpeed: number;
    agility: number;
    balance: number;
    strength: number;
    stamina: number;
    aerial: number;
  };
  tactical: {
    overall: number;
    positioning: number;
    decisionMaking: number;
    defensiveAwareness: number;
    transitionImpact: number;
    tacticalFlexibility: number;
    roleDiscipline: number;
    bestRole: string;
    bestSystem: string;
  };
  market: {
    currentValue: number | null;
    estimatedTransferValue: number | null;
    salaryEstimateAnnual: number | null;
    liquidity: IntelligenceMetricBand;
    valueRetention: IntelligenceMetricBand;
    contractPressure: IntelligenceMetricBand;
  };
  risk: {
    overall: IntelligenceMetricBand;
    physical: IntelligenceMetricBand;
    tactical: IntelligenceMetricBand;
    financial: IntelligenceMetricBand;
    availability: IntelligenceMetricBand;
    volatility: IntelligenceMetricBand;
  };
  projection: {
    currentOverall: number;
    nextSeasonOverall: number;
    expectedPeakOverall: number;
    growthIndex: number;
    ceilingLabel: string;
    developmentCurve: "accelerating" | "steady" | "plateau";
    resaleOutlook: IntelligenceMetricBand;
  };
  dna: SoccerMindDna;
  fieldIntelligence: FieldIntelligence;
  context: {
    sourceAnalysisId: string | null;
    sourceAnalysisType: string | null;
    sourceUpdatedAt: string | null;
    competitionLevel: string;
    sampleConfidence: number;
    seasonTrend: SeasonTrendPoint[];
  };
  narrative: {
    headline: string;
    executiveSummary: string;
    strengths: string[];
    concerns: string[];
    developmentFocus: string[];
    aiInsights: string[];
  };
  executiveSnapshot: ExecutiveSnapshot;
  soccerMindDna: SoccerMindDna;
  soccerMindDNA?: SoccerMindDna;
  playerId?: string;
  playerName?: string;
  marketRisk?: MarketRiskProfile;
  contextSimilarity?: ContextSimilarity;
  dataStatus?: PlayerIntelligenceDataStatus;
}

export interface PlayerIntelligenceQuery {
  player: PlayerProfileModel;
  similarPlayers: PlayerCardModel[];
  projection?: Record<string, unknown> | null;
}

export interface PlayerIntelligenceGateway {
  getProfile(query: PlayerIntelligenceQuery): Promise<PlayerIntelligenceProfile>;
}

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
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  return fallback;
}

function toBand(
  value: unknown,
  fallbackLabel: string,
  fallbackScore = 0,
  fallbackSummary = "",
): IntelligenceMetricBand {
  if (isRecord(value)) {
    return {
      label: toText(value.label, fallbackLabel),
      score: toNumber(value.score, fallbackScore),
      summary: toText(value.summary, fallbackSummary),
    };
  }

  if (typeof value === "number") {
    return {
      label: fallbackLabel,
      score: value,
      summary: fallbackSummary,
    };
  }

  return {
    label: fallbackLabel,
    score: fallbackScore,
    summary: fallbackSummary,
  };
}

function toStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function toTraits(value: unknown): SoccerMindDnaTrait[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((trait) => {
      const score = toNumber(trait.value, 0);
      return {
        key: toText(trait.key, "trait"),
        label: toText(trait.label, "Trait"),
        value: score,
        interpretation: toText(trait.interpretation ?? trait.note, "Profile signal."),
        note: toText(trait.note ?? trait.interpretation, "Profile signal."),
        emphasis: score >= 80 ? "elite" : score >= 68 ? "strong" : score >= 52 ? "stable" : "developing",
      } satisfies SoccerMindDnaTrait;
    });
}

function buildSalaryRange(baseValue: number | null): SalaryRange {
  const annual = baseValue && baseValue > 0 ? Math.round(baseValue * 0.08) : 0;
  return {
    min: annual > 0 ? Math.round(annual * 0.8) : 0,
    max: annual > 0 ? Math.round(annual * 1.2) : 0,
    currency: "EUR",
    period: "yearly",
    label: annual > 0 ? `EUR ${(annual / 1_000_000).toFixed(1)}M / year` : "N/A",
  };
}

export function normalizePlayerIntelligenceProfile(input: unknown): PlayerIntelligenceProfile | null {
  if (!isRecord(input)) {
    return null;
  }

  const identitySource = isRecord(input.identity) ? input.identity : {};
  const summarySource =
    isRecord(input.summary) && isRecord(input.summary.currentLevel)
      ? input.summary
      : isRecord(input.executiveSnapshot)
        ? input.executiveSnapshot
        : isRecord(input.summary)
          ? input.summary
          : {};
  const technicalSource = isRecord(input.technical) ? input.technical : {};
  const physicalSource = isRecord(input.physical) ? input.physical : {};
  const tacticalSource = isRecord(input.tactical) ? input.tactical : {};
  const marketSource = isRecord(input.market) ? input.market : {};
  const riskSource = isRecord(input.risk) ? input.risk : {};
  const projectionSource = isRecord(input.projection) ? input.projection : {};
  const dnaSource = isRecord(input.dna)
    ? input.dna
    : isRecord(input.soccerMindDna)
      ? input.soccerMindDna
      : isRecord(input.soccerMindDNA)
        ? input.soccerMindDNA
        : {};
  const contextSource = isRecord(input.context) ? input.context : {};
  const contextSimilaritySource = isRecord(input.contextSimilarity) ? input.contextSimilarity : {};
  const narrativeSource = isRecord(input.narrative) ? input.narrative : {};
  const fieldSource = isRecord(input.fieldIntelligence) ? input.fieldIntelligence : {};
  const marketRiskSource = isRecord(input.marketRisk) ? input.marketRisk : {};

  const currentLevelBand = toBand(
    isRecord(summarySource.currentLevel) ? summarySource.currentLevel : summarySource.currentLevel,
    "current_level",
    toNumber(summarySource.currentLevel, toNumber(summarySource.overall, 0)),
    "Current level.",
  );
  const upsideBand = toBand(
    summarySource.upside,
    "upside",
    toNumber(summarySource.growthIndex, toNumber(summarySource.confidence, 0)),
    "Modeled upside.",
  );
  const riskBand = toBand(
    summarySource.risk ?? riskSource.overall ?? riskSource.composite,
    "risk",
    toNumber(summarySource.riskScore, 0),
    "Risk profile.",
  );
  const marketOpportunityBand = toBand(
    summarySource.marketOpportunity ?? summarySource.value ?? marketSource.valueRetention,
    "market_opportunity",
    toNumber(summarySource.valueScore, 0),
    "Transaction quality.",
  );

  const dnaTraits = toTraits(dnaSource.traits);
  const dominantTraits =
    toStringArray(dnaSource.dominantTraits).length > 0
      ? toStringArray(dnaSource.dominantTraits)
      : toStringArray(dnaSource.dominantTags);

  const marketValue =
    typeof marketSource.currentValue === "number"
      ? marketSource.currentValue
      : typeof marketSource.marketValue === "number"
        ? marketSource.marketValue
        : typeof marketRiskSource.marketValue === "number"
          ? marketRiskSource.marketValue
          : null;

  const normalized: PlayerIntelligenceProfile = {
    generatedAt: toText(input.generatedAt, ""),
    identity: {
      id: toText(identitySource.id ?? input.playerId, ""),
      slug: toText(identitySource.slug, "") || null,
      name: toText(identitySource.name ?? input.playerName, "Unknown Player"),
      age: typeof identitySource.age === "number" ? identitySource.age : null,
      nationality: toText(identitySource.nationality, "") || null,
      club: toText(identitySource.club, "") || null,
      league: toText(identitySource.league, "") || null,
      primaryPosition:
        toText(identitySource.primaryPosition ?? identitySource.dominantPosition, "") || null,
      secondaryPositions: toStringArray(identitySource.secondaryPositions ?? identitySource.positions),
      preferredFoot: toText(identitySource.preferredFoot, "") || null,
      heightCm: typeof identitySource.heightCm === "number" ? identitySource.heightCm : null,
      weightKg: typeof identitySource.weightKg === "number" ? identitySource.weightKg : null,
      imagePath: toText(identitySource.imagePath, "") || null,
    },
    summary: {
      status:
        toText(summarySource.status, "monitor") === "elite_target" ||
        toText(summarySource.status, "monitor") === "priority_watch" ||
        toText(summarySource.status, "monitor") === "data_gap"
          ? (toText(summarySource.status, "monitor") as ExecutiveSnapshot["status"])
          : "monitor",
      recommendation: toText(summarySource.recommendation, "Monitor"),
      confidence: toNumber(summarySource.confidence, 0),
      summary: toText(
        summarySource.summary,
        toText(narrativeSource.executiveSummary, "Decision-first profile available."),
      ),
      decisionWindow: toText(summarySource.decisionWindow ?? summarySource.idealAcquisitionWindow, "opportunistic"),
      currentLevel: currentLevelBand,
      upside: upsideBand,
      risk: riskBand,
      marketOpportunity: marketOpportunityBand,
    },
    technical: {
      overall: toNumber(technicalSource.overall, averageNumbers([
        toNumber(technicalSource.ballStriking, 0),
        toNumber(technicalSource.passing, 0),
        toNumber(technicalSource.carrying, 0),
      ])),
      ballStriking: toNumber(technicalSource.ballStriking, toNumber(technicalSource.coreAttributes && isRecord(technicalSource.coreAttributes) ? technicalSource.coreAttributes.shooting : 0)),
      passing: toNumber(technicalSource.passing, toNumber(technicalSource.coreAttributes && isRecord(technicalSource.coreAttributes) ? technicalSource.coreAttributes.passing : 0)),
      carrying: toNumber(technicalSource.carrying, toNumber(technicalSource.coreAttributes && isRecord(technicalSource.coreAttributes) ? technicalSource.coreAttributes.dribbling : 0)),
      firstTouch: toNumber(technicalSource.firstTouch, toNumber(technicalSource.coreAttributes && isRecord(technicalSource.coreAttributes) ? technicalSource.coreAttributes.dribbling : 0)),
      creativity: toNumber(technicalSource.creativity, toNumber(technicalSource.passing, 0)),
      defending: toNumber(technicalSource.defending, toNumber(technicalSource.coreAttributes && isRecord(technicalSource.coreAttributes) ? technicalSource.coreAttributes.defending : 0)),
      breakdown: isRecord(technicalSource.breakdown)
        ? Object.fromEntries(
            Object.entries(technicalSource.breakdown).map(([key, value]) => [key, toNumber(value, 0)]),
          )
        : isRecord(technicalSource.detailedMetrics)
          ? Object.fromEntries(
              Object.entries(technicalSource.detailedMetrics).map(([key, value]) => [key, toNumber(value, 0)]),
            )
          : {},
    },
    physical: {
      overall: toNumber(physicalSource.overall, averageNumbers([
        toNumber(physicalSource.acceleration, 0),
        toNumber(physicalSource.sprintSpeed, 0),
        toNumber(physicalSource.stamina, 0),
      ])),
      acceleration: toNumber(physicalSource.acceleration, 0),
      sprintSpeed: toNumber(physicalSource.sprintSpeed, 0),
      agility: toNumber(physicalSource.agility, 0),
      balance: toNumber(physicalSource.balance, 0),
      strength: toNumber(physicalSource.strength, 0),
      stamina: toNumber(physicalSource.stamina, 0),
      aerial: toNumber(physicalSource.aerial ?? physicalSource.jumping, 0),
    },
    tactical: {
      overall: toNumber(tacticalSource.overall, averageNumbers([
        toNumber(tacticalSource.positioning, 0),
        toNumber(tacticalSource.decisionMaking, 0),
        toNumber(tacticalSource.roleDiscipline, 0),
      ])),
      positioning: toNumber(tacticalSource.positioning, 0),
      decisionMaking: toNumber(tacticalSource.decisionMaking, toBand(tacticalSource.tacticalMaturity, "tactical", 0).score),
      defensiveAwareness: toNumber(tacticalSource.defensiveAwareness, 0),
      transitionImpact: toNumber(tacticalSource.transitionImpact, 0),
      tacticalFlexibility: toNumber(tacticalSource.tacticalFlexibility, 0),
      roleDiscipline: toNumber(tacticalSource.roleDiscipline, 0),
      bestRole: toText(tacticalSource.bestRole ?? tacticalSource.idealRole, "Flexible role"),
      bestSystem: toText(tacticalSource.bestSystem ?? tacticalSource.idealSystem, "4-3-3"),
    },
    market: {
      currentValue: marketValue,
      estimatedTransferValue:
        typeof marketSource.estimatedTransferValue === "number" ? marketSource.estimatedTransferValue : marketValue,
      salaryEstimateAnnual:
        typeof marketSource.salaryEstimateAnnual === "number"
          ? marketSource.salaryEstimateAnnual
          : buildSalaryRange(marketValue).max,
      liquidity: toBand(marketSource.liquidity ?? marketRiskSource.liquidity, "liquidity", 0, "Liquidity."),
      valueRetention: toBand(marketSource.valueRetention ?? summarySource.value, "value_retention", 0, "Value retention."),
      contractPressure: toBand(marketSource.contractPressure, "contract_pressure", 0, "Contract pressure."),
    },
    risk: {
      overall: toBand(riskSource.overall ?? riskSource.composite, "overall_risk", riskBand.score, riskBand.summary),
      physical: toBand(riskSource.physical ?? marketRiskSource.physicalRisk, "physical_risk", 0, "Physical risk."),
      tactical: toBand(riskSource.tactical ?? riskSource.tacticalAdaptation ?? marketRiskSource.tacticalAdaptationRisk, "tactical_risk", 0, "Tactical risk."),
      financial: toBand(riskSource.financial ?? marketRiskSource.financialRisk, "financial_risk", 0, "Financial risk."),
      availability: toBand(riskSource.availability ?? riskSource.medical, "availability_risk", 0, "Availability risk."),
      volatility: toBand(riskSource.volatility, "volatility_risk", 0, "Volatility risk."),
    },
    projection: {
      currentOverall: toNumber(projectionSource.currentOverall ?? projectionSource.currentLevel, currentLevelBand.score),
      nextSeasonOverall: toNumber(projectionSource.nextSeasonOverall ?? projectionSource.expectedOverallNextSeason, currentLevelBand.score),
      expectedPeakOverall: toNumber(projectionSource.expectedPeakOverall ?? projectionSource.expectedPeak, currentLevelBand.score),
      growthIndex: toNumber(projectionSource.growthIndex, upsideBand.score),
      ceilingLabel: toText(projectionSource.ceilingLabel ?? projectionSource.growthOutlook, "ceiling"),
      developmentCurve:
        toText(projectionSource.developmentCurve, "steady") === "accelerating" ||
        toText(projectionSource.developmentCurve, "steady") === "plateau"
          ? (toText(projectionSource.developmentCurve, "steady") as "accelerating" | "steady" | "plateau")
          : "steady",
      resaleOutlook: toBand(
        projectionSource.resaleOutlook ?? projectionSource.resalePotential,
        "resale_outlook",
        0,
        "Resale outlook.",
      ),
    },
    dna: {
      archetype: toText(dnaSource.archetype, toText(summarySource.archetype, "Profile")),
      profileLabel: toText(dnaSource.profileLabel ?? dnaSource.profile, "player-intelligence"),
      dominantTraits,
      traits: dnaTraits,
    },
    fieldIntelligence: {
      isMocked: typeof fieldSource.isMocked === "boolean" ? fieldSource.isMocked : undefined,
      heatmap: Array.isArray(fieldSource.heatmap) ? (fieldSource.heatmap as SpatialZone[]) : [],
      shots: Array.isArray(fieldSource.shots) ? (fieldSource.shots as SpatialEventPoint[]) : [],
      passes: Array.isArray(fieldSource.passes) ? (fieldSource.passes as SpatialEventPoint[]) : [],
      defensiveActions: Array.isArray(fieldSource.defensiveActions) ? (fieldSource.defensiveActions as SpatialEventPoint[]) : [],
    },
    context: {
      sourceAnalysisId: toText(contextSource.sourceAnalysisId, "") || null,
      sourceAnalysisType: toText(contextSource.sourceAnalysisType, "") || null,
      sourceUpdatedAt: toText(contextSource.sourceUpdatedAt, "") || null,
      competitionLevel: toText(contextSource.competitionLevel, toText(identitySource.league, "unknown")),
      sampleConfidence: toNumber(contextSource.sampleConfidence, toNumber(summarySource.confidence, 0)),
      seasonTrend: Array.isArray(contextSource.seasonTrend)
        ? (contextSource.seasonTrend as SeasonTrendPoint[])
        : Array.isArray(contextSimilaritySource.seasonTrends)
          ? (contextSimilaritySource.seasonTrends as SeasonTrendPoint[]).map((item) => ({
              season: toText(item.season, "N/A"),
              overall: toNumber(item.performance, 0),
              marketValue: toNumber(item.market, 0),
              riskScore: riskBand.score,
            }))
          : [],
    },
    narrative: {
      headline: toText(narrativeSource.headline, `${toText(identitySource.name, "Player")} intelligence summary`),
      executiveSummary: toText(narrativeSource.executiveSummary, toText(summarySource.recommendation, "Monitor")),
      strengths: toStringArray(narrativeSource.strengths).slice(0, 5),
      concerns: toStringArray(narrativeSource.concerns).slice(0, 5),
      developmentFocus: toStringArray(narrativeSource.developmentFocus).slice(0, 5),
      aiInsights: toStringArray(narrativeSource.aiInsights).slice(0, 5),
    },
    executiveSnapshot: undefined as never,
    soccerMindDna: undefined as never,
    soccerMindDNA: undefined,
    playerId: toText(input.playerId ?? identitySource.id, ""),
    playerName: toText(input.playerName ?? identitySource.name, ""),
    marketRisk: {
      marketValue,
      salaryRange: buildSalaryRange(marketValue),
      liquidity: toBand(marketSource.liquidity ?? marketRiskSource.liquidity, "liquidity", 0, "Liquidity."),
      physicalRisk: toBand(riskSource.physical ?? marketRiskSource.physicalRisk, "physical_risk", 0, "Physical risk."),
      tacticalAdaptationRisk: toBand(riskSource.tactical ?? marketRiskSource.tacticalAdaptationRisk, "tactical_risk", 0, "Tactical risk."),
      financialRisk: toBand(riskSource.financial ?? marketRiskSource.financialRisk, "financial_risk", 0, "Financial risk."),
      resalePotential: toBand(projectionSource.resaleOutlook ?? projectionSource.resalePotential, "resale", 0, "Resale potential."),
    },
    contextSimilarity: {
      similarPlayers: Array.isArray(contextSimilaritySource.similarPlayers)
        ? (contextSimilaritySource.similarPlayers as SimilarityProfile[]).slice(0, 5)
        : [],
      idealSystems: toStringArray(contextSimilaritySource.idealSystems).slice(0, 5),
      idealClubs: toStringArray(contextSimilaritySource.idealClubs).slice(0, 5),
      seasonTrends: Array.isArray(contextSimilaritySource.seasonTrends)
        ? (contextSimilaritySource.seasonTrends as SeasonTrendPoint[])
        : [],
    },
    dataStatus: isRecord(input.dataStatus)
      ? {
          source: toText(input.dataStatus.source, "live") as IntelligenceDataSource,
          eventDataReady: Boolean(input.dataStatus.eventDataReady),
          shotLocationsReady: Boolean(input.dataStatus.shotLocationsReady),
          passLocationsReady: Boolean(input.dataStatus.passLocationsReady),
          heatZonesReady: Boolean(input.dataStatus.heatZonesReady),
          seasonTrendReady: Boolean(input.dataStatus.seasonTrendReady),
        }
      : {
          source: "live",
          eventDataReady: true,
          shotLocationsReady: true,
          passLocationsReady: true,
          heatZonesReady: true,
          seasonTrendReady: true,
        },
  };

  normalized.executiveSnapshot = normalized.summary;
  normalized.soccerMindDna = normalized.dna;
  normalized.soccerMindDNA = normalized.dna;

  return normalized;
}

function averageNumbers(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  if (valid.length === 0) {
    return 0;
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}
