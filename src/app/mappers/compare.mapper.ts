import { mapApiPlayerToExtended, type ApiPlayerLike } from "./player.mapper";
import { normalizePlayerIntelligenceProfile, type PlayerIntelligenceProfile } from "../types/player-intelligence";

type UnknownRecord = Record<string, unknown>;

type PositionContextKind = "same" | "related" | "cross";

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
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
    if (isRecord(value)) return value;
  }
  return null;
}

function buildRadarData(statsA: Record<string, number>, statsB: Record<string, number>) {
  return [
    { attribute: "Pace", A: toNumber(statsA.pace), B: toNumber(statsB.pace) },
    { attribute: "Shooting", A: toNumber(statsA.shooting), B: toNumber(statsB.shooting) },
    { attribute: "Passing", A: toNumber(statsA.passing), B: toNumber(statsB.passing) },
    { attribute: "Dribbling", A: toNumber(statsA.dribbling), B: toNumber(statsB.dribbling) },
    { attribute: "Defending", A: toNumber(statsA.defending), B: toNumber(statsB.defending) },
    { attribute: "Physical", A: toNumber(statsA.physical), B: toNumber(statsB.physical) },
  ];
}

const POSITION_GROUPS: Record<string, string> = {
  ST: "attack", CF: "attack", RW: "attack", LW: "attack",
  CAM: "midfield", CM: "midfield", CDM: "midfield",
  RB: "wide-defense", LB: "wide-defense", RWB: "wide-defense", LWB: "wide-defense",
  CB: "central-defense", GK: "goalkeeper",
};

function getPositionGroup(position: string) {
  return POSITION_GROUPS[position] ?? "hybrid";
}

function normalizePositionContextKind(value: unknown): PositionContextKind {
  const normalized = toText(value, "cross").toLowerCase();
  if (normalized === "same" || normalized === "related" || normalized === "cross") return normalized;
  return "cross";
}

function normalizeRiskLevel(value: unknown) {
  const normalized = toText(value, "").toUpperCase();
  if (normalized === "LOW" || normalized === "MEDIUM" || normalized === "HIGH") return normalized;
  return null;
}

function normalizeWinner(value: unknown) {
  const normalized = toText(value, "DRAW").toUpperCase();
  if (normalized === "PLAYERA" || normalized === "A") return "A" as const;
  if (normalized === "PLAYERB" || normalized === "B") return "B" as const;
  return "DRAW" as const;
}

function buildFallbackPositionContext(positionA: string, positionB: string) {
  const groupA = getPositionGroup(positionA);
  const groupB = getPositionGroup(positionB);

  if (positionA === positionB) {
    return {
      kind: "same" as const, label: "Comparacao posicional direta", tone: "neutral",
      message: "Os dois jogadores compartilham a mesma posicao primaria.",
      positionA, positionB, groupA, groupB,
    };
  }

  if (groupA === groupB) {
    return {
      kind: "related" as const, label: "Comparacao compativel", tone: "info",
      message: "As posicoes sao diferentes, mas pertencem ao mesmo grupo funcional.",
      positionA, positionB, groupA, groupB,
    };
  }

  return {
    kind: "cross" as const, label: "Comparacao cruzada", tone: "warning",
    message: "A leitura deve considerar contextos taticos distintos entre as funcoes.",
    positionA, positionB, groupA, groupB,
  };
}

/**
 * Build an ApiPlayerLike payload from a PlayerIntelligenceProfile identity block.
 * Used when the API returns playerAProfile/playerBProfile (new format) instead of
 * legacy playerA/playerB flat objects.
 */
function playerFromIntelligenceIdentity(identity: UnknownRecord): ApiPlayerLike & UnknownRecord {
  return {
    id: toText(identity.id, ""),
    name: toText(identity.name, ""),
    position: toText(identity.primaryPosition, "") || null,
    positions: identity.secondaryPositions ?? identity.primaryPosition ?? null,
    age: typeof identity.age === "number" ? identity.age : null,
    nationality: toText(identity.nationality, "") || null,
    team: toText(identity.club, "") || null,
    league: toText(identity.league, "") || null,
    marketValue: null,
    overall: null,
    potential: null,
    attributes: {},
  } as ApiPlayerLike & UnknownRecord;
}

export function mapCompareResponse(response: unknown) {
  const payload = unwrapData(response);
  const source = isRecord(payload) ? payload : {};

  // New format: { playerAProfile, playerBProfile, comparison }
  const playerAProfileSource = pickRecord(source, ["playerAProfile"]);
  const playerBProfileSource = pickRecord(source, ["playerBProfile"]);
  const profileIdentityA = playerAProfileSource ? pickRecord(playerAProfileSource, ["identity"]) : null;
  const profileIdentityB = playerBProfileSource ? pickRecord(playerBProfileSource, ["identity"]) : null;

  // Resolve player payload — prefer direct playerA/B (legacy), fall back to identity from profile (new)
  const rawPlayerA =
    pickRecord(source, ["playerA"]) ??
    (profileIdentityA !== null ? playerFromIntelligenceIdentity(profileIdentityA) : null) ??
    ({} as UnknownRecord);

  const rawPlayerB =
    pickRecord(source, ["playerB"]) ??
    (profileIdentityB !== null ? playerFromIntelligenceIdentity(profileIdentityB) : null) ??
    ({} as UnknownRecord);

  const playerA = mapApiPlayerToExtended(rawPlayerA);
  const playerB = mapApiPlayerToExtended(rawPlayerB);

  // Intelligence profiles — support both legacy intelligenceProfiles.playerA and new playerAProfile
  const intelligenceProfiles = pickRecord(source, ["intelligenceProfiles"]);
  const intelligenceProfileA = normalizePlayerIntelligenceProfile(
    pickRecord(intelligenceProfiles ?? {}, ["playerA"]) ??
      playerAProfileSource ??
      pickRecord(rawPlayerA, ["intelligenceProfile"]),
  ) as PlayerIntelligenceProfile | null;
  const intelligenceProfileB = normalizePlayerIntelligenceProfile(
    pickRecord(intelligenceProfiles ?? {}, ["playerB"]) ??
      playerBProfileSource ??
      pickRecord(rawPlayerB, ["intelligenceProfile"]),
  ) as PlayerIntelligenceProfile | null;

  // Enrich playerA/B from intelligence profile if available
  if (intelligenceProfileA) {
    if (!playerA.name) playerA.name = intelligenceProfileA.identity.name;
    if (!playerA.position) playerA.position = intelligenceProfileA.identity.primaryPosition ?? "";
    if (!playerA.club) playerA.club = intelligenceProfileA.identity.club ?? "";
  }
  if (intelligenceProfileB) {
    if (!playerB.name) playerB.name = intelligenceProfileB.identity.name;
    if (!playerB.position) playerB.position = intelligenceProfileB.identity.primaryPosition ?? "";
    if (!playerB.club) playerB.club = intelligenceProfileB.identity.club ?? "";
  }

  const comparisonRecord = pickRecord(source, ["comparison"]) ?? source;
  const winnersByBlock = pickRecord(comparisonRecord, ["winnersByBlock"]);
  const positionContextSource = pickRecord(source, ["positionContext"]);

  // Winner resolution — handle new "A"|"B" string format and legacy name-based format
  const finalDecisionRecord = pickRecord(comparisonRecord, ["finalDecision"]);
  const betterPlayerRaw = finalDecisionRecord?.betterPlayer;

  let winner: "A" | "B" | "DRAW";
  if (typeof betterPlayerRaw === "string" && (betterPlayerRaw === "A" || betterPlayerRaw === "B")) {
    winner = betterPlayerRaw;
  } else if (isRecord(betterPlayerRaw)) {
    const betterName = toText(betterPlayerRaw.playerName);
    winner = normalizeWinner(
      betterName === playerA.name ? "A" : betterName === playerB.name ? "B" : source.winner,
    );
  } else {
    winner = normalizeWinner(source.winner);
  }

  // Normalize block winners — support both "A"|"B" string (new) and { winner } object (legacy)
  function extractBlockWinner(key: string): { winner: "A" | "B" | "DRAW" } | null {
    const raw = winnersByBlock?.[key];
    if (typeof raw === "string") return { winner: normalizeWinner(raw) };
    if (isRecord(raw)) return { winner: normalizeWinner(raw.winner), ...raw };
    return null;
  }

  // Enrich risk from intelligence profile (no longer from legacy antiFlop/riskProfile fields)
  if (intelligenceProfileA) {
    const riskScore = intelligenceProfileA.risk.overall.score;
    playerA.structuralRisk = {
      score: riskScore,
      level: riskScore >= 60 ? "HIGH" : riskScore >= 20 ? "MEDIUM" : "LOW",
      breakdown: intelligenceProfileA.risk.overall.summary,
    };
    playerA.liquidity = {
      score: intelligenceProfileA.market.liquidity.score,
      resaleWindow: playerA.liquidity.resaleWindow,
      marketProfile: playerA.liquidity.marketProfile,
    };
    playerA.financialRisk = {
      index: intelligenceProfileA.risk.financial.score,
      capitalExposure: playerA.financialRisk.capitalExposure,
      investmentProfile: playerA.financialRisk.investmentProfile,
    };
  }

  if (intelligenceProfileB) {
    const riskScore = intelligenceProfileB.risk.overall.score;
    playerB.structuralRisk = {
      score: riskScore,
      level: riskScore >= 60 ? "HIGH" : riskScore >= 20 ? "MEDIUM" : "LOW",
      breakdown: intelligenceProfileB.risk.overall.summary,
    };
    playerB.liquidity = {
      score: intelligenceProfileB.market.liquidity.score,
      resaleWindow: playerB.liquidity.resaleWindow,
      marketProfile: playerB.liquidity.marketProfile,
    };
    playerB.financialRisk = {
      index: intelligenceProfileB.risk.financial.score,
      capitalExposure: playerB.financialRisk.capitalExposure,
      investmentProfile: playerB.financialRisk.investmentProfile,
    };
  }

  playerA.riskLevel = playerA.risk.level;
  playerB.riskLevel = playerB.risk.level;

  const radarData = buildRadarData(playerA.stats, playerB.stats);
  const fallbackPositionContext = buildFallbackPositionContext(playerA.position, playerB.position);
  const positionContext = {
    ...fallbackPositionContext,
    ...(positionContextSource
      ? {
          kind: normalizePositionContextKind(positionContextSource.kind),
          label: toText(positionContextSource.label, fallbackPositionContext.label),
          tone: toText(positionContextSource.tone, fallbackPositionContext.tone),
          message: toText(positionContextSource.message, fallbackPositionContext.message),
          positionA: toText(positionContextSource.positionA, fallbackPositionContext.positionA),
          positionB: toText(positionContextSource.positionB, fallbackPositionContext.positionB),
          groupA: toText(positionContextSource.groupA, fallbackPositionContext.groupA),
          groupB: toText(positionContextSource.groupB, fallbackPositionContext.groupB),
        }
      : {}),
  };

  return {
    playerA,
    playerB,
    winner,
    comparison: comparisonRecord,
    intelligenceProfiles: {
      playerA: intelligenceProfileA,
      playerB: intelligenceProfileB,
    },
    blockWinners: {
      technical: extractBlockWinner("technical"),
      physical: extractBlockWinner("physical"),
      tactical: extractBlockWinner("tactical"),
      market: extractBlockWinner("market"),
      risk: extractBlockWinner("risk"),
      dna: extractBlockWinner("dna"),
      projection: extractBlockWinner("projection") ?? extractBlockWinner("upside"),
      upside: extractBlockWinner("upside"),
      tacticalDna: extractBlockWinner("tacticalDna") ?? extractBlockWinner("tactical"),
    },
    executiveRecommendation: null,
    radarData,
    comparisonStats: radarData.map((item) => ({ name: item.attribute, a: item.A, b: item.B })),
    positionContext,
  };
}
