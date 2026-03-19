export type SquadRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type FieldPosition =
  | "GK"
  | "LB"
  | "CB1"
  | "CB2"
  | "CB3"
  | "RB"
  | "CDM"
  | "CDM1"
  | "CDM2"
  | "CM1"
  | "CM2"
  | "CM3"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "RW"
  | "LWB"
  | "RWB"
  | "ST"
  | "ST1"
  | "ST2";

export interface SquadPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  fieldPosition?: FieldPosition;
  age: number;
  nationality: string;
  overallRating: number;
  capitalEfficiency: number;
  riskLevel: SquadRiskLevel;
  contractUntil: string;
  marketValue: string;
  stats: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
}

export type SquadLineup = Record<string, SquadPlayer>;
