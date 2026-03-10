import type { PlayerExtended } from "../types/player";

export interface ApiPlayerLike {
  id?: string | null;
  name?: string | null;
  position?: string | null;
  positions?: string[] | null;
  team?: string | null;
  league?: string | null;
  nationality?: string | null;
  age?: number | null;
  overall?: number | null;
  potential?: number | null;
  marketValue?: number | string | null;
  image?: string | null;
  attributes?: Record<string, number | null | undefined> | null;
}

export interface PlayerCardModel {
  id: string;
  name: string;
  position: string;
  positions: string[];
  team: string;
  league: string;
  nationality: string;
  age: number;
  overall: number;
  potential: number;
  marketValue: string;
  image: string | null;
  attributes: Record<string, number>;
}

export interface PlayerProfileModel extends PlayerCardModel {
  playStyles: string[];
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  stats: {
    crossing: number;
    finishing: number;
    headingAccuracy: number;
    shortPassing: number;
    volleys: number;
    dribbling: number;
    curve: number;
    fkAccuracy: number;
    longPassing: number;
    ballControl: number;
    acceleration: number;
    sprintSpeed: number;
    agility: number;
    reactions: number;
    balance: number;
    shotPower: number;
    jumping: number;
    stamina: number;
    strength: number;
    longShots: number;
    aggression: number;
    interceptions: number;
    attackPosition: number;
    vision: number;
    penalties: number;
    composure: number;
    defensiveAwareness: number;
    standingTackle: number;
    slidingTackle: number;
    gkDiving: number;
    gkHandling: number;
    gkKicking: number;
    gkPositioning: number;
    gkReflexes: number;
  };
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function formatMarketValue(value: number | string | null | undefined) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  const numericValue = toNumber(value);
  if (!numericValue) {
    return "N/A";
  }
  if (numericValue >= 1_000_000) {
    return `€${(numericValue / 1_000_000).toFixed(1)}M`;
  }
  if (numericValue >= 1_000) {
    return `€${(numericValue / 1_000).toFixed(0)}K`;
  }
  return `€${numericValue.toFixed(0)}`;
}

function normalizedAttributes(attributes?: Record<string, number | null | undefined> | null) {
  const source = attributes || {};
  return {
    pace: toNumber(source.pace ?? source.sprintSpeed, 60),
    shooting: toNumber(source.shooting ?? source.finishing, 60),
    passing: toNumber(source.passing ?? source.shortPassing, 60),
    dribbling: toNumber(source.dribbling ?? source.ballControl, 60),
    defending: toNumber(source.defending ?? source.defensiveAwareness, 50),
    physical: toNumber(source.physical ?? source.strength, 60),
    crossing: toNumber(source.crossing, 60),
    finishing: toNumber(source.finishing, 60),
    headingAccuracy: toNumber(source.headingAccuracy, 50),
    shortPassing: toNumber(source.shortPassing ?? source.passing, 60),
    volleys: toNumber(source.volleys, 50),
    curve: toNumber(source.curve, 55),
    fkAccuracy: toNumber(source.fkAccuracy, 50),
    longPassing: toNumber(source.longPassing ?? source.passing, 60),
    ballControl: toNumber(source.ballControl ?? source.dribbling, 60),
    acceleration: toNumber(source.acceleration ?? source.pace, 60),
    sprintSpeed: toNumber(source.sprintSpeed ?? source.pace, 60),
    agility: toNumber(source.agility ?? source.dribbling, 60),
    reactions: toNumber(source.reactions ?? source.overall, 60),
    balance: toNumber(source.balance, 60),
    shotPower: toNumber(source.shotPower ?? source.shooting, 60),
    jumping: toNumber(source.jumping, 60),
    stamina: toNumber(source.stamina ?? source.physical, 60),
    strength: toNumber(source.strength ?? source.physical, 60),
    longShots: toNumber(source.longShots ?? source.shooting, 60),
    aggression: toNumber(source.aggression, 50),
    interceptions: toNumber(source.interceptions ?? source.defending, 50),
    attackPosition: toNumber(source.attackPosition ?? source.positioning, 60),
    vision: toNumber(source.vision ?? source.passing, 60),
    penalties: toNumber(source.penalties, 50),
    composure: toNumber(source.composure, 60),
    defensiveAwareness: toNumber(source.defensiveAwareness ?? source.defending, 50),
    standingTackle: toNumber(source.standingTackle ?? source.defending, 50),
    slidingTackle: toNumber(source.slidingTackle ?? source.defending, 50),
    gkDiving: toNumber(source.gkDiving, 10),
    gkHandling: toNumber(source.gkHandling, 10),
    gkKicking: toNumber(source.gkKicking, 10),
    gkPositioning: toNumber(source.gkPositioning, 10),
    gkReflexes: toNumber(source.gkReflexes, 10),
  };
}

export function mapApiPlayerToCard(player: ApiPlayerLike): PlayerCardModel {
  const positions = player.positions?.filter(Boolean) || [];
  const attributes = normalizedAttributes(player.attributes);

  return {
    id: player.id || player.name || "unknown-player",
    name: player.name || "Jogador sem nome",
    position: player.position || positions[0] || "N/A",
    positions,
    team: player.team || "Sem clube",
    league: player.league || "N/A",
    nationality: player.nationality || "N/A",
    age: toNumber(player.age, 0),
    overall: toNumber(player.overall, 0),
    potential: toNumber(player.potential, toNumber(player.overall, 0)),
    marketValue: formatMarketValue(player.marketValue),
    image: player.image || null,
    attributes,
  };
}

export function mapApiPlayerToProfile(player: ApiPlayerLike): PlayerProfileModel {
  const card = mapApiPlayerToCard(player);
  const attrs = card.attributes;

  return {
    ...card,
    playStyles: [],
    pac: attrs.pace,
    sho: attrs.shooting,
    pas: attrs.passing,
    dri: attrs.dribbling,
    def: attrs.defending,
    phy: attrs.physical,
    stats: {
      crossing: attrs.crossing,
      finishing: attrs.finishing,
      headingAccuracy: attrs.headingAccuracy,
      shortPassing: attrs.shortPassing,
      volleys: attrs.volleys,
      dribbling: attrs.dribbling,
      curve: attrs.curve,
      fkAccuracy: attrs.fkAccuracy,
      longPassing: attrs.longPassing,
      ballControl: attrs.ballControl,
      acceleration: attrs.acceleration,
      sprintSpeed: attrs.sprintSpeed,
      agility: attrs.agility,
      reactions: attrs.reactions,
      balance: attrs.balance,
      shotPower: attrs.shotPower,
      jumping: attrs.jumping,
      stamina: attrs.stamina,
      strength: attrs.strength,
      longShots: attrs.longShots,
      aggression: attrs.aggression,
      interceptions: attrs.interceptions,
      attackPosition: attrs.attackPosition,
      vision: attrs.vision,
      penalties: attrs.penalties,
      composure: attrs.composure,
      defensiveAwareness: attrs.defensiveAwareness,
      standingTackle: attrs.standingTackle,
      slidingTackle: attrs.slidingTackle,
      gkDiving: attrs.gkDiving,
      gkHandling: attrs.gkHandling,
      gkKicking: attrs.gkKicking,
      gkPositioning: attrs.gkPositioning,
      gkReflexes: attrs.gkReflexes,
    },
  };
}

export function mapApiPlayerToExtended(player: ApiPlayerLike): PlayerExtended {
  const card = mapApiPlayerToCard(player);
  const profile = mapApiPlayerToProfile(player);

  const age = card.age;
  const overall = card.overall || 70;
  const potential = card.potential || overall;
  const marketValueNumeric = toNumber(player.marketValue, 0);
  const capitalEfficiency = Math.max(0, Math.min(10, ((overall + potential) / 20) - age / 20 + 3));
  const riskLevel: PlayerExtended["riskLevel"] = age > 29 ? "HIGH" : potential - overall >= 5 ? "LOW" : "MEDIUM";

  return {
    id: card.id,
    name: card.name,
    position: card.position,
    age,
    nationality: card.nationality,
    club: card.team,
    overallRating: overall,
    tier: overall >= 85 ? "ELITE" : overall >= 80 ? "A" : overall >= 75 ? "B" : overall >= 70 ? "C" : "DEVELOPMENT",
    positionRank: 0,
    capitalEfficiency,
    riskLevel,
    photoUrl: card.image || undefined,
    stats: {
      pace: profile.pac,
      passing: profile.pas,
      physical: profile.phy,
      shooting: profile.sho,
      defending: profile.def,
      dribbling: profile.dri,
    },
    marketValue: card.marketValue,
    contract: "N/A",
    structuralRisk: {
      score: Math.max(0, Math.min(10, age > 30 ? 7 : age > 26 ? 5 : 3)),
      level: riskLevel,
      breakdown: "Gerado a partir de idade, overall e potencial disponíveis.",
    },
    antiFlopIndex: {
      flopProbability: Math.max(0, Math.min(100, 50 - (potential - overall) * 5 + (age > 28 ? 15 : 0))),
      safetyIndex: Math.max(0, Math.min(100, overall + Math.max(0, potential - overall))),
      classification: "Gerado a partir dos dados atuais da API.",
    },
    liquidity: {
      score: Math.max(0, Math.min(10, overall / 10)),
      resaleWindow: age < 24 ? "3-5 anos" : age < 28 ? "2-3 anos" : "1-2 anos",
      marketProfile: card.league !== "N/A" ? `Mercado ativo em ${card.league}` : "Mercado em avaliação",
    },
    financialRisk: {
      index: Math.max(0, Math.min(10, marketValueNumeric > 30_000_000 ? 7 : marketValueNumeric > 10_000_000 ? 5 : 3)),
      capitalExposure: marketValueNumeric > 30_000_000 ? "Alta" : marketValueNumeric > 10_000_000 ? "Média" : "Baixa",
      investmentProfile: "Baseado no valor de mercado retornado pela API.",
    },
  };
}
