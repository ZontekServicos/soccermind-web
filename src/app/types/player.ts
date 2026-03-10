import type { PlayerProfile } from "../components/PlayerProfileCard";

export interface PlayerStats {
  pace: number;
  passing: number;
  physical: number;
  shooting: number;
  defending: number;
  dribbling: number;
}

export interface PlayerExtended extends PlayerProfile {
  stats: PlayerStats;
  marketValue: string;
  contract: string;
  structuralRisk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH";
    breakdown: string;
  };
  antiFlopIndex: {
    flopProbability: number;
    safetyIndex: number;
    classification: string;
  };
  liquidity: {
    score: number;
    resaleWindow: string;
    marketProfile: string;
  };
  financialRisk: {
    index: number;
    capitalExposure: string;
    investmentProfile: string;
  };
}

export const EMPTY_PLAYER: PlayerExtended = {
  id: "empty-player",
  name: "Sem dados",
  position: "N/A",
  age: 0,
  nationality: "N/A",
  club: "N/A",
  overallRating: 0,
  tier: "C",
  positionRank: 0,
  capitalEfficiency: 0,
  riskLevel: "MEDIUM",
  marketValue: "N/A",
  contract: "N/A",
  stats: {
    pace: 0,
    passing: 0,
    physical: 0,
    shooting: 0,
    defending: 0,
    dribbling: 0,
  },
  structuralRisk: {
    score: 0,
    level: "MEDIUM",
    breakdown: "Sem dados suficientes para calcular o risco estrutural.",
  },
  antiFlopIndex: {
    flopProbability: 0,
    safetyIndex: 0,
    classification: "Sem dados",
  },
  liquidity: {
    score: 0,
    resaleWindow: "N/A",
    marketProfile: "Sem dados",
  },
  financialRisk: {
    index: 0,
    capitalExposure: "N/A",
    investmentProfile: "Sem dados",
  },
};
