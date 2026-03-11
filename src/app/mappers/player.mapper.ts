import type { PlayerExtended } from "../types/player";

type NumericLike = number | string | null | undefined;
type UnknownRecord = Record<string, unknown>;

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

export interface PlayerCardModel {
  id: string;
  name: string;
  position: string;
  positions: string[];
  team: string;
  league: string;
  nationality: string;
  age: number;
  overall: number | null;
  potential: number | null;
  marketValue: number | null;
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

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: NumericLike, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.,-]/g, "").replace(/\.(?=.*\.)/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
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
    const nested =
      getTextCandidate(value.name) ??
      getTextCandidate(value.nome) ??
      getTextCandidate(value.label) ??
      getTextCandidate(value.title) ??
      getTextCandidate(value.shortName) ??
      getTextCandidate(value.value);
    return nested;
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
  const direct = getValue(source, ["overall", "overallRating", "rating"]);
  const fromAttributes = getValue(attributes, ["overall", "rating"]);
  const resolved = direct ?? fromAttributes;
  return resolved === undefined || resolved === null ? null : toNumber(resolved, 0);
}

function resolvePotential(source: UnknownRecord, attributes: UnknownRecord, overall: number | null) {
  const direct = getValue(source, ["potential", "potentialRating"]);
  const fromAttributes = getValue(attributes, ["potential"]);
  const resolved = direct ?? fromAttributes;
  return resolved === undefined || resolved === null ? overall : toNumber(resolved, overall ?? 0);
}

function resolveMarketValueNumber(source: UnknownRecord, attributes: UnknownRecord) {
  const value = getValue(source, [
    "marketValue",
    "market_value",
    "valueEur",
    "value_eur",
    "marketValueEur",
  ]);
  const fromAttributes = getValue(attributes, [
    "marketValue",
    "market_value",
    "valueEur",
    "value_eur",
  ]);
  return toNumber(value ?? fromAttributes, 0);
}

function normalizedAttributes(attributes?: Record<string, unknown> | null) {
  const source = isRecord(attributes) ? attributes : {};

  return {
    pace: toNumber(getValue(source, ["pace", "pac", "speed", "sprintSpeed"]), 0),
    shooting: toNumber(getValue(source, ["shooting", "sho", "finishing"]), 0),
    passing: toNumber(getValue(source, ["passing", "pas", "shortPassing"]), 0),
    dribbling: toNumber(getValue(source, ["dribbling", "dri", "ballControl"]), 0),
    defending: toNumber(getValue(source, ["defending", "def", "defensiveAwareness"]), 0),
    physical: toNumber(getValue(source, ["physical", "phy", "strength"]), 0),
    crossing: toNumber(getValue(source, ["crossing"]), 0),
    finishing: toNumber(getValue(source, ["finishing", "shooting"]), 0),
    headingAccuracy: toNumber(getValue(source, ["headingAccuracy", "heading", "heading_accuracy"]), 0),
    shortPassing: toNumber(getValue(source, ["shortPassing", "passing"]), 0),
    volleys: toNumber(getValue(source, ["volleys"]), 0),
    curve: toNumber(getValue(source, ["curve"]), 0),
    fkAccuracy: toNumber(getValue(source, ["fkAccuracy", "freeKickAccuracy", "free_kick_accuracy"]), 0),
    longPassing: toNumber(getValue(source, ["longPassing", "passing"]), 0),
    ballControl: toNumber(getValue(source, ["ballControl", "dribbling"]), 0),
    acceleration: toNumber(getValue(source, ["acceleration", "pace"]), 0),
    sprintSpeed: toNumber(getValue(source, ["sprintSpeed", "pace"]), 0),
    agility: toNumber(getValue(source, ["agility", "dribbling"]), 0),
    reactions: toNumber(getValue(source, ["reactions", "overall"]), 0),
    balance: toNumber(getValue(source, ["balance"]), 0),
    shotPower: toNumber(getValue(source, ["shotPower", "shooting"]), 0),
    jumping: toNumber(getValue(source, ["jumping"]), 0),
    stamina: toNumber(getValue(source, ["stamina", "physical"]), 0),
    strength: toNumber(getValue(source, ["strength", "physical"]), 0),
    longShots: toNumber(getValue(source, ["longShots", "shooting"]), 0),
    aggression: toNumber(getValue(source, ["aggression"]), 0),
    interceptions: toNumber(getValue(source, ["interceptions", "defending"]), 0),
    attackPosition: toNumber(getValue(source, ["attackPosition", "positioning"]), 0),
    vision: toNumber(getValue(source, ["vision", "passing"]), 0),
    penalties: toNumber(getValue(source, ["penalties"]), 0),
    composure: toNumber(getValue(source, ["composure"]), 0),
    defensiveAwareness: toNumber(getValue(source, ["defensiveAwareness", "marking", "defending"]), 0),
    standingTackle: toNumber(getValue(source, ["standingTackle", "tackling", "defending"]), 0),
    slidingTackle: toNumber(getValue(source, ["slidingTackle", "sliding_tackle", "defending"]), 0),
    gkDiving: toNumber(getValue(source, ["gkDiving", "goalkeeperDiving"]), 0),
    gkHandling: toNumber(getValue(source, ["gkHandling", "goalkeeperHandling"]), 0),
    gkKicking: toNumber(getValue(source, ["gkKicking", "goalkeeperKicking"]), 0),
    gkPositioning: toNumber(getValue(source, ["gkPositioning", "goalkeeperPositioning"]), 0),
    gkReflexes: toNumber(getValue(source, ["gkReflexes", "goalkeeperReflexes"]), 0),
  };
}

export function mapApiPlayerToCard(player: ApiPlayerLike | UnknownRecord): PlayerCardModel {
  const source = resolvePlayerSource(player);
  const attributeSource = resolveAttributeSources(player, source);
  const overall = resolveOverall(source, attributeSource);
  const potential = resolvePotential(source, attributeSource, overall);
  const position = getTextCandidate(getValue(source, ["position", "primaryPosition"]));
  const positions = normalizePositions(getValue(source, ["positions"]), position);
  const attributes = normalizedAttributes(attributeSource);
  const marketValue = resolveMarketValueNumber(source, attributeSource);

  return {
    id: getTextCandidate(getValue(source, ["id", "playerId", "playerKey"])) ?? "unknown-player",
    name: getTextCandidate(getValue(source, ["name", "nomeJogador", "playerName"])) ?? "Jogador sem nome",
    position: position ?? positions[0] ?? "N/A",
    positions,
    team: resolveTeam(source, attributeSource),
    league: resolveLeague(source, attributeSource),
    nationality:
      getTextCandidate(getValue(source, ["nationality", "country", "nation"])) ??
      getTextCandidate(getValue(attributeSource, ["nationality"])) ??
      "N/A",
    age: toNumber(getValue(source, ["age"]), 0),
    overall,
    potential,
    marketValue: marketValue > 0 ? marketValue : null,
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

export function mapApiPlayerToExtended(player: ApiPlayerLike | UnknownRecord): PlayerExtended {
  const source = resolvePlayerSource(player);
  const attributes = resolveAttributeSources(player, source);
  const card = mapApiPlayerToCard(source);
  const profile = mapApiPlayerToProfile({
    ...source,
    attributes,
  });

  const age = card.age;
  const overall = card.overall ?? (toNumber(getValue(attributes, ["overall"]), 70) || 70);
  const potential = card.potential ?? overall;
  const marketValueNumeric = resolveMarketValueNumber(source, attributes);
  const capitalEfficiency = Math.max(0, Math.min(10, (overall + potential) / 20 - age / 20 + 3));
  const riskLevel: PlayerExtended["riskLevel"] =
    age > 29 ? "HIGH" : potential - overall >= 5 ? "LOW" : "MEDIUM";

  return {
    id: card.id,
    name: card.name,
    position: card.position,
    age,
    nationality: card.nationality,
    club: card.team,
    overallRating: overall,
    tier:
      overall >= 85 ? "ELITE" : overall >= 80 ? "A" : overall >= 75 ? "B" : overall >= 70 ? "C" : "DEVELOPMENT",
    positionRank: toNumber(getValue(source, ["positionRank", "rank"]), 0),
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
    marketValue: marketValueNumeric ? `EUR ${marketValueNumeric.toFixed(0)}` : "N/A",
    contract: "N/A",
    structuralRisk: {
      score: Math.max(0, Math.min(10, age > 30 ? 7 : age > 26 ? 5 : 3)),
      level: riskLevel,
      breakdown: "Gerado a partir de idade, overall e potencial disponiveis.",
    },
    antiFlopIndex: {
      flopProbability: Math.max(0, Math.min(100, 50 - (potential - overall) * 5 + (age > 28 ? 15 : 0))),
      safetyIndex: Math.max(0, Math.min(100, overall + Math.max(0, potential - overall))),
      classification: "Gerado a partir dos dados atuais da API.",
    },
    liquidity: {
      score: Math.max(0, Math.min(10, overall / 10)),
      resaleWindow: age < 24 ? "3-5 anos" : age < 28 ? "2-3 anos" : "1-2 anos",
      marketProfile: card.league !== "N/A" ? `Mercado ativo em ${card.league}` : "Mercado em avaliacao",
    },
    financialRisk: {
      index: Math.max(
        0,
        Math.min(10, marketValueNumeric > 30_000_000 ? 7 : marketValueNumeric > 10_000_000 ? 5 : 3),
      ),
      capitalExposure:
        marketValueNumeric > 30_000_000 ? "Alta" : marketValueNumeric > 10_000_000 ? "Media" : "Baixa",
      investmentProfile: "Baseado no valor de mercado retornado pela API.",
    },
  };
}
