import type { PlayerExtended } from "../types/player";

type NumericLike = number | string | null | undefined;
type UnknownRecord = Record<string, unknown>;
type NullableNumber = number | null;

export interface ApiPlayerLike {
  id?: string | null;
  name?: string | null;
  position?: string | null;
  positions?: string[] | string | null;
  team?: string | null;
  league?: string | null;
  nationality?: string | null;
  age?: number | null;
  overall?: number | string | null;
  potential?: number | string | null;
  marketValue?: number | string | null;
  image?: string | null;
  attributes?: Record<string, number | string | null | undefined> | null;
  player?: ApiPlayerLike | null;
  [key: string]: unknown;
}

interface ApiPlayerProfileLike extends ApiPlayerLike {
  technical?: Record<string, number | string | null | undefined> | null;
  physical?: Record<string, number | string | null | undefined> | null;
  mental?: Record<string, number | string | null | undefined> | null;
}

export interface PlayerAttributeModel {
  pace: NullableNumber;
  shooting: NullableNumber;
  passing: NullableNumber;
  dribbling: NullableNumber;
  defending: NullableNumber;
  physical: NullableNumber;
  crossing: NullableNumber;
  finishing: NullableNumber;
  headingAccuracy: NullableNumber;
  shortPassing: NullableNumber;
  volleys: NullableNumber;
  curve: NullableNumber;
  fkAccuracy: NullableNumber;
  longPassing: NullableNumber;
  ballControl: NullableNumber;
  acceleration: NullableNumber;
  sprintSpeed: NullableNumber;
  agility: NullableNumber;
  reactions: NullableNumber;
  balance: NullableNumber;
  shotPower: NullableNumber;
  jumping: NullableNumber;
  stamina: NullableNumber;
  strength: NullableNumber;
  longShots: NullableNumber;
  aggression: NullableNumber;
  interceptions: NullableNumber;
  attackPosition: NullableNumber;
  vision: NullableNumber;
  penalties: NullableNumber;
  composure: NullableNumber;
  defensiveAwareness: NullableNumber;
  standingTackle: NullableNumber;
  slidingTackle: NullableNumber;
  gkDiving: NullableNumber;
  gkHandling: NullableNumber;
  gkKicking: NullableNumber;
  gkPositioning: NullableNumber;
  gkReflexes: NullableNumber;
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
  overall: NullableNumber;
  potential: NullableNumber;
  marketValue: NullableNumber;
  marketValueLabel: string;
  image: string | null;
  attributes: PlayerAttributeModel;
}

export interface PlayerProfileModel extends PlayerCardModel {
  playStyles: string[];
  pac: NullableNumber;
  sho: NullableNumber;
  pas: NullableNumber;
  dri: NullableNumber;
  def: NullableNumber;
  phy: NullableNumber;
  stats: PlayerAttributeModel;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseNullableNumber(value: NumericLike): NullableNumber {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.,-]/g, "").replace(/\.(?=.*\.)/g, "").replace(",", ".");
    if (!normalized) {
      return null;
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toNumber(value: NumericLike, fallback = 0) {
  return parseNullableNumber(value) ?? fallback;
}

function pickFirstRecord(value: unknown, keys: string[]) {
  if (!isRecord(value)) {
    return null;
  }

  for (const key of keys) {
    const nested = value[key];
    if (isRecord(nested)) {
      return nested;
    }
  }

  return null;
}

function getTextCandidate(value: unknown): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (isRecord(value)) {
    return (
      getTextCandidate(value.name) ??
      getTextCandidate(value.nome) ??
      getTextCandidate(value.label) ??
      getTextCandidate(value.title) ??
      getTextCandidate(value.shortName) ??
      getTextCandidate(value.value)
    );
  }

  return null;
}

function getValue(source: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return undefined;
}

function resolvePlayerSource(player: ApiPlayerLike | ApiPlayerProfileLike | UnknownRecord) {
  const input = isRecord(player) ? player : {};
  const nestedPlayer = pickFirstRecord(input, ["player"]);
  return nestedPlayer ?? input;
}

function resolveAttributeSources(
  player: ApiPlayerLike | ApiPlayerProfileLike | UnknownRecord,
  source: UnknownRecord,
) {
  const input = isRecord(player) ? player : {};
  const sourceAttributes = isRecord(source.attributes) ? source.attributes : {};
  const inputAttributes = isRecord(input.attributes) ? input.attributes : {};
  const technical = isRecord(input.technical) ? input.technical : {};
  const physical = isRecord(input.physical) ? input.physical : {};
  const mental = isRecord(input.mental) ? input.mental : {};
  const fifaStyle = pickFirstRecord(input, ["fifaStyle"]) ?? pickFirstRecord(source, ["fifaStyle"]) ?? {};
  const fifaCore = pickFirstRecord(fifaStyle, ["core"]) ?? {};
  const fifaDetailedStats = pickFirstRecord(fifaStyle, ["detailedStats"]) ?? {};

  return {
    ...sourceAttributes,
    ...inputAttributes,
    ...technical,
    ...physical,
    ...mental,
    ...fifaDetailedStats,
    ...fifaCore,
  };
}

function normalizePositions(value: unknown, fallbackPosition?: string | null) {
  const positions = Array.isArray(value)
    ? value
        .map((item) => getTextCandidate(item))
        .filter((item): item is string => Boolean(item))
    : typeof value === "string"
      ? value
          .split(/[,\-/|]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  if (positions.length > 0) {
    return Array.from(new Set(positions));
  }

  const fallback = getTextCandidate(fallbackPosition);
  return fallback ? [fallback] : [];
}

function resolveImage(source: UnknownRecord) {
  const value = getTextCandidate(
    getValue(source, ["image", "imageUrl", "photoUrl", "photo", "avatar", "imagePath"]),
  );

  return value ?? null;
}

function resolveTeam(source: UnknownRecord, attributes: UnknownRecord) {
  return (
    getTextCandidate(getValue(source, ["team", "club", "clubName", "teamName"])) ??
    getTextCandidate(getValue(attributes, ["team", "club", "club_name", "teamName"])) ??
    ""
  );
}

function resolveLeague(source: UnknownRecord, attributes: UnknownRecord) {
  return (
    getTextCandidate(getValue(source, ["league", "leagueName", "competition"])) ??
    getTextCandidate(getValue(attributes, ["league", "clubLeague", "league_name"])) ??
    ""
  );
}

function resolveOverall(source: UnknownRecord, attributes: UnknownRecord) {
  return parseNullableNumber(getValue(source, ["overall", "overallRating", "rating"]) ?? getValue(attributes, ["overall", "rating"]));
}

function resolvePotential(source: UnknownRecord, attributes: UnknownRecord) {
  return parseNullableNumber(getValue(source, ["potential", "potentialRating"]) ?? getValue(attributes, ["potential"]));
}

function resolveMarketValueNumber(source: UnknownRecord, attributes: UnknownRecord) {
  return parseNullableNumber(
    getValue(source, ["marketValue", "market_value", "valueEur", "value_eur", "marketValueEur"]) ??
      getValue(attributes, ["marketValue", "market_value", "valueEur", "value_eur"]),
  );
}

function formatMarketValue(value: NullableNumber) {
  if (value === null) {
    return "N/A";
  }
  if (value >= 1_000_000) {
    return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `EUR ${(value / 1_000).toFixed(0)}K`;
  }
  return `EUR ${value.toFixed(0)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function deriveStructuralRisk(age: number, overall: number, potential: number) {
  const upside = Math.max(0, potential - overall);
  const ageRisk = age >= 31 ? 4.2 : age >= 28 ? 2.8 : age <= 20 ? 2 : 1.4;
  const performanceRisk = overall >= 85 ? 1.1 : overall >= 80 ? 1.8 : overall >= 75 ? 2.8 : 4;
  const upsideRelief = upside >= 6 ? 1.4 : upside >= 3 ? 0.7 : 0;

  return clamp(ageRisk + performanceRisk - upsideRelief, 1, 9.5);
}

function deriveLiquidityScore(age: number, overall: number, potential: number) {
  const upside = Math.max(0, potential - overall);
  const ageScore = age >= 21 && age <= 27 ? 2.6 : age >= 18 && age <= 20 ? 2.2 : age <= 30 ? 1.5 : 0.8;
  const qualityScore = overall >= 85 ? 2.8 : overall >= 80 ? 2.1 : overall >= 75 ? 1.5 : 0.9;
  const upsideScore = upside >= 6 ? 1.9 : upside >= 3 ? 1.1 : 0.4;

  return clamp(2.2 + ageScore + qualityScore + upsideScore, 2, 9.8);
}

function deriveFinancialRisk(
  age: number,
  overall: number,
  potential: number,
  marketValueNumeric: number,
  structuralRisk: number,
  liquidityScore: number,
) {
  const upside = Math.max(0, potential - overall);
  const marketPressure =
    marketValueNumeric >= 80_000_000
      ? 7.6
      : marketValueNumeric >= 50_000_000
        ? 6.6
        : marketValueNumeric >= 25_000_000
          ? 5.5
          : marketValueNumeric >= 10_000_000
            ? 4.5
            : marketValueNumeric >= 3_000_000
              ? 3.5
              : marketValueNumeric > 0
                ? 2.8
                : 4.1;
  const agePressure = age >= 31 ? 1.6 : age >= 28 ? 0.8 : age <= 22 ? -0.3 : 0;
  const structuralPressure = structuralRisk * 0.18;
  const liquidityRelief = Math.max(0, liquidityScore - 5) * 0.42;
  const upsideRelief = Math.min(1.3, upside * 0.18);
  const qualityRelief = overall >= 84 ? 0.4 : 0;

  return clamp(
    marketPressure + agePressure + structuralPressure - liquidityRelief - upsideRelief - qualityRelief,
    1.5,
    9.2,
  );
}

function deriveCompositeRisk(structuralRisk: number, financialRisk: number, liquidityScore: number) {
  return clamp(structuralRisk * 0.5 + financialRisk * 0.3 + (10 - liquidityScore) * 0.2, 0, 10);
}

function resolveRiskBucket(compositeRisk: number): PlayerExtended["riskLevel"] {
  if (compositeRisk >= 7.5) {
    return "HIGH";
  }

  if (compositeRisk >= 5) {
    return "MEDIUM";
  }

  return "LOW";
}

function normalizeRiskLevel(value: unknown): PlayerExtended["riskLevel"] | null {
  const normalized = getTextCandidate(value)?.toUpperCase();

  if (normalized === "LOW" || normalized === "MEDIUM" || normalized === "HIGH") {
    return normalized;
  }

  return null;
}

function pickNullableNumber(source: UnknownRecord, keys: string[]) {
  return parseNullableNumber(getValue(source, keys));
}

function normalizedAttributes(attributes?: Record<string, unknown> | null): PlayerAttributeModel {
  const source = isRecord(attributes) ? attributes : {};

  return {
    pace: pickNullableNumber(source, ["pace", "pac"]),
    shooting: pickNullableNumber(source, ["shooting", "sho"]),
    passing: pickNullableNumber(source, ["passing", "pas"]),
    dribbling: pickNullableNumber(source, ["dribbling", "dri"]),
    defending: pickNullableNumber(source, ["defending", "def"]),
    physical: pickNullableNumber(source, ["physical", "phy"]),
    crossing: pickNullableNumber(source, ["crossing"]),
    finishing: pickNullableNumber(source, ["finishing"]),
    headingAccuracy: pickNullableNumber(source, ["headingAccuracy", "heading_accuracy"]),
    shortPassing: pickNullableNumber(source, ["shortPassing", "short_passing"]),
    volleys: pickNullableNumber(source, ["volleys"]),
    curve: pickNullableNumber(source, ["curve"]),
    fkAccuracy: pickNullableNumber(source, ["fkAccuracy", "freeKickAccuracy", "free_kick_accuracy"]),
    longPassing: pickNullableNumber(source, ["longPassing", "long_passing"]),
    ballControl: pickNullableNumber(source, ["ballControl", "ball_control"]),
    acceleration: pickNullableNumber(source, ["acceleration"]),
    sprintSpeed: pickNullableNumber(source, ["sprintSpeed", "sprint_speed"]),
    agility: pickNullableNumber(source, ["agility"]),
    reactions: pickNullableNumber(source, ["reactions"]),
    balance: pickNullableNumber(source, ["balance"]),
    shotPower: pickNullableNumber(source, ["shotPower", "shot_power"]),
    jumping: pickNullableNumber(source, ["jumping"]),
    stamina: pickNullableNumber(source, ["stamina"]),
    strength: pickNullableNumber(source, ["strength"]),
    longShots: pickNullableNumber(source, ["longShots", "long_shots"]),
    aggression: pickNullableNumber(source, ["aggression"]),
    interceptions: pickNullableNumber(source, ["interceptions"]),
    attackPosition: pickNullableNumber(source, ["attackPosition", "positioning", "attack_position"]),
    vision: pickNullableNumber(source, ["vision"]),
    penalties: pickNullableNumber(source, ["penalties"]),
    composure: pickNullableNumber(source, ["composure"]),
    defensiveAwareness: pickNullableNumber(source, ["defensiveAwareness", "defensive_awareness"]),
    standingTackle: pickNullableNumber(source, ["standingTackle", "standing_tackle"]),
    slidingTackle: pickNullableNumber(source, ["slidingTackle", "sliding_tackle"]),
    gkDiving: pickNullableNumber(source, ["gkDiving", "goalkeeperDiving", "gk_diving"]),
    gkHandling: pickNullableNumber(source, ["gkHandling", "goalkeeperHandling", "gk_handling"]),
    gkKicking: pickNullableNumber(source, ["gkKicking", "goalkeeperKicking", "gk_kicking"]),
    gkPositioning: pickNullableNumber(source, ["gkPositioning", "goalkeeperPositioning", "gk_positioning"]),
    gkReflexes: pickNullableNumber(source, ["gkReflexes", "goalkeeperReflexes", "gk_reflexes"]),
  };
}

export function mapApiPlayerToCard(player: ApiPlayerLike | UnknownRecord): PlayerCardModel {
  const source = resolvePlayerSource(player);
  const attributeSource = resolveAttributeSources(player, source);
  const overall = resolveOverall(source, attributeSource);
  const potential = resolvePotential(source, attributeSource);
  const position = getTextCandidate(getValue(source, ["position", "primaryPosition"])) ?? "";
  const positions = normalizePositions(getValue(source, ["positions"]), position);
  const attributes = normalizedAttributes(attributeSource);
  const marketValue = resolveMarketValueNumber(source, attributeSource);

  return {
    id: getTextCandidate(getValue(source, ["id", "playerId", "playerKey"])) ?? "unknown-player",
    name: getTextCandidate(getValue(source, ["name", "nomeJogador", "playerName"])) ?? "",
    position: position || positions[0] || "",
    positions,
    team: resolveTeam(source, attributeSource),
    league: resolveLeague(source, attributeSource),
    nationality:
      getTextCandidate(getValue(source, ["nationality", "country", "nation"])) ??
      getTextCandidate(getValue(attributeSource, ["nationality"])) ??
      "",
    age: toNumber(getValue(source, ["age"]), 0),
    overall,
    potential,
    marketValue,
    marketValueLabel: formatMarketValue(marketValue),
    image: resolveImage(source),
    attributes,
  };
}

export function mapApiPlayerToProfile(
  player: ApiPlayerLike | ApiPlayerProfileLike | UnknownRecord,
): PlayerProfileModel {
  const source = resolvePlayerSource(player);
  const attributeSource = resolveAttributeSources(player, source);
  const attrs = normalizedAttributes(attributeSource);
  const card = mapApiPlayerToCard({
    ...source,
    attributes: attrs,
  });

  return {
    ...card,
    playStyles: [],
    pac: attrs.pace,
    sho: attrs.shooting,
    pas: attrs.passing,
    dri: attrs.dribbling,
    def: attrs.defending,
    phy: attrs.physical,
    stats: attrs,
  };
}

export function mapApiPlayerToExtended(player: ApiPlayerLike | UnknownRecord): PlayerExtended {
  const source = resolvePlayerSource(player);
  const attributes = resolveAttributeSources(player, source);
  const card = mapApiPlayerToCard({
    ...source,
    attributes,
  });
  const profile = mapApiPlayerToProfile({
    ...source,
    attributes,
  });

  const age = card.age;
  const overall = card.overall ?? 70;
  const potential = card.potential ?? overall;
  const marketValueNumeric = card.marketValue ?? 0;
  const riskSource = pickFirstRecord(source, ["risk"]);
  const structuralRiskSource = pickFirstRecord(source, ["structuralRisk"]);
  const liquiditySource = pickFirstRecord(source, ["liquidity"]);
  const financialRiskSource = pickFirstRecord(source, ["financialRisk"]);
  const capitalEfficiency = Math.max(0, Math.min(10, (overall + potential) / 20 - age / 20 + 3));
  const structuralRiskScore = deriveStructuralRisk(age, overall, potential);
  const liquidityScore = deriveLiquidityScore(age, overall, potential);
  const financialRiskIndex = deriveFinancialRisk(
    age,
    overall,
    potential,
    marketValueNumeric,
    structuralRiskScore,
    liquidityScore,
  );
  const compositeRisk = deriveCompositeRisk(structuralRiskScore, financialRiskIndex, liquidityScore);
  const riskLevel = resolveRiskBucket(compositeRisk);
  const providedRiskScore = pickNullableNumber(riskSource ?? {}, ["score", "riskScore", "compositeRisk"]);
  const providedRiskLevel = normalizeRiskLevel(riskSource?.level);
  const finalRiskScore = providedRiskScore ?? compositeRisk;
  const finalRiskLevel = providedRiskLevel ?? riskLevel;
  const finalRiskExplanation =
    getTextCandidate(riskSource?.explanation) ??
    `Composite risk ${finalRiskScore.toFixed(1)} construido a partir de exposicao estrutural, custo e liquidez.`;
  const finalStructuralRiskScore = pickNullableNumber(structuralRiskSource ?? {}, ["score"]) ?? structuralRiskScore;
  const finalStructuralRiskLevel = normalizeRiskLevel(structuralRiskSource?.level) ?? finalRiskLevel;
  const finalLiquidityScore = pickNullableNumber(liquiditySource ?? {}, ["score", "liquidityScore"]) ?? liquidityScore;
  const finalFinancialRiskIndex = pickNullableNumber(financialRiskSource ?? {}, ["index", "riskIndex"]) ?? financialRiskIndex;

  return {
    id: card.id,
    name: card.name || "Jogador sem nome",
    position: card.position || "N/A",
    age,
    nationality: card.nationality || "N/A",
    club: card.team || "N/A",
    overallRating: overall,
    potential,
    tier:
      overall >= 85 ? "ELITE" : overall >= 80 ? "A" : overall >= 75 ? "B" : overall >= 70 ? "C" : "DEVELOPMENT",
    positionRank: toNumber(getValue(source, ["positionRank", "rank"]), 0),
    capitalEfficiency,
    riskLevel: finalRiskLevel,
    risk: {
      score: finalRiskScore,
      level: finalRiskLevel,
      explanation: finalRiskExplanation,
    },
    photoUrl: card.image || undefined,
    stats: {
      pace: profile.pac ?? 0,
      passing: profile.pas ?? 0,
      physical: profile.phy ?? 0,
      shooting: profile.sho ?? 0,
      defending: profile.def ?? 0,
      dribbling: profile.dri ?? 0,
    },
    marketValue: card.marketValueLabel,
    contract: "N/A",
    structuralRisk: {
      score: finalStructuralRiskScore,
      level: finalStructuralRiskLevel,
      breakdown:
        getTextCandidate(structuralRiskSource?.breakdown) ??
        "Gerado a partir da curva etaria, consistencia tecnica e margem de evolucao do atleta.",
    },
    antiFlopIndex: {
      flopProbability: Math.max(0, Math.min(100, 50 - (potential - overall) * 5 + (age > 28 ? 15 : 0))),
      safetyIndex: Math.max(0, Math.min(100, overall + Math.max(0, potential - overall))),
      classification: "Gerado a partir dos dados atuais da API.",
    },
    liquidity: {
      score: finalLiquidityScore,
      resaleWindow:
        getTextCandidate(liquiditySource?.resaleWindow) ??
        (age < 24 ? "3-5 anos" : age < 28 ? "2-3 anos" : "1-2 anos"),
      marketProfile:
        getTextCandidate(liquiditySource?.marketProfile) ??
        (finalLiquidityScore >= 8
          ? "Alta liquidez e janela de saida favoravel."
          : finalLiquidityScore >= 6
            ? "Liquidez moderada, com mercado ativo para revenda."
            : "Liquidez mais restrita e ciclo de saida menos imediato."),
    },
    financialRisk: {
      index: finalFinancialRiskIndex,
      capitalExposure:
        getTextCandidate(financialRiskSource?.capitalExposure) ??
        (finalFinancialRiskIndex >= 7 ? "Alta" : finalFinancialRiskIndex >= 5 ? "Media" : "Baixa"),
      investmentProfile:
        getTextCandidate(financialRiskSource?.investmentProfile) ??
        `Composto por pressao de mercado, liquidez ${finalLiquidityScore.toFixed(1)} e risco agregado ${finalRiskScore.toFixed(1)}.`,
    },
  };
}
