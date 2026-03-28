import type { PlayerCardModel, PlayerProfileModel } from "../mappers/player.mapper";

export type IntelligenceDataSource = "mock" | "hybrid" | "live";

export interface IntelligenceMetricBand {
  label: string;
  score: number;
  summary: string;
}

export interface ExecutiveSnapshot {
  recommendation: string;
  confidence: number;
  risk: IntelligenceMetricBand;
  upside: IntelligenceMetricBand;
  liquidity: IntelligenceMetricBand;
  tacticalFit: IntelligenceMetricBand;
  idealAcquisitionWindow: string;
}

export interface SoccerMindDnaTrait {
  key: string;
  label: string;
  value: number;
  emphasis: "elite" | "strong" | "stable" | "developing";
  note: string;
}

export interface SoccerMindDna {
  dominantTags: string[];
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
  outcome?: "success" | "fail" | "goal" | "saved" | "blocked";
  label?: string;
}

export interface FieldIntelligence {
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
  performance: number;
  market: number;
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
  playerId: string;
  playerName: string;
  executiveSnapshot: ExecutiveSnapshot;
  soccerMindDna: SoccerMindDna;
  fieldIntelligence: FieldIntelligence;
  marketRisk: MarketRiskProfile;
  contextSimilarity: ContextSimilarity;
  dataStatus: PlayerIntelligenceDataStatus;
}

export interface PlayerIntelligenceQuery {
  player: PlayerProfileModel;
  similarPlayers: PlayerCardModel[];
  projection?: Record<string, unknown> | null;
}

export interface PlayerIntelligenceGateway {
  getProfile(query: PlayerIntelligenceQuery): Promise<PlayerIntelligenceProfile>;
}
