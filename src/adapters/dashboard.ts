import type { PlayerExtended } from "../app/types/player";

export type RiskBucket = "LOW" | "MEDIUM" | "HIGH";
export type StrategicAssetTier = "Elite Asset" | "Growth Asset" | "Stable Asset" | "Opportunity Asset";

export type ChartDatum = {
  name: string;
  shortName: string;
  value: number;
  metricLabel: string;
  accent: string;
};

export type StrategicAsset = {
  player: PlayerExtended;
  tier: StrategicAssetTier;
  description: string;
  score: number;
  summary: string;
};

export type RiskPlayerEntry = {
  player: PlayerExtended;
  riskBucket: RiskBucket;
  explanation: string;
};

export interface DashboardViewModel {
  players: PlayerExtended[];
  averageEfficiency: number;
  totalMarketValue: string;
  riskCounts: Record<RiskBucket, number>;
  topEfficiencyPlayers: PlayerExtended[];
  efficiencyChartData: ChartDatum[];
  ratingChartData: ChartDatum[];
  riskTaggedPlayers: RiskPlayerEntry[];
  strategicAssets: StrategicAsset[];
}

const CHART_DATA_LIMIT = 20;

function parseMarketValueLabel(label: string) {
  if (!label || label === "N/A") {
    return 0;
  }

  const normalized = label.toUpperCase().replace(",", ".");
  const parsed = Number.parseFloat(normalized.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  if (normalized.includes("B")) return parsed * 1_000_000_000;
  if (normalized.includes("M")) return parsed * 1_000_000;
  if (normalized.includes("K")) return parsed * 1_000;
  return parsed;
}

function formatTotalMarketValue(players: PlayerExtended[]) {
  const total = players.reduce((sum, player) => sum + parseMarketValueLabel(player.marketValue), 0);
  if (!total) {
    return "N/A";
  }

  if (total >= 1_000_000_000) {
    return `EUR ${(total / 1_000_000_000).toFixed(2)}B`;
  }

  return `EUR ${(total / 1_000_000).toFixed(1)}M`;
}

function getShortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) {
    return name.length > 18 ? `${name.slice(0, 18)}...` : name;
  }

  const compact = `${parts[0]} ${parts[parts.length - 1]}`;
  return compact.length > 18 ? `${compact.slice(0, 18)}...` : compact;
}

function buildChartData(players: PlayerExtended[], metric: "capitalEfficiency" | "overallRating", metricLabel: string, accent: string) {
  return [...players]
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, CHART_DATA_LIMIT)
    .map((player) => ({
      name: player.name,
      shortName: getShortName(player.name),
      value: player[metric],
      metricLabel,
      accent,
    }));
}

function buildRiskEntry(player: PlayerExtended): RiskPlayerEntry {
  return {
    player,
    riskBucket: player.risk.level,
    explanation: player.risk.explanation,
  };
}

function buildStrategicAsset(player: PlayerExtended): StrategicAsset | null {
  const marketValue = parseMarketValueLabel(player.marketValue);
  const liquidity = player.liquidity.score;
  const risk = player.risk.level;
  const upside = player.potential - player.overallRating;
  const valueEfficiency = marketValue > 0 ? (player.overallRating + player.potential) / (marketValue / 1_000_000) : 0;
  const immediateImpact = player.overallRating >= 86 && liquidity >= 7.5;

  if (player.overallRating >= 90 && liquidity >= 8 && marketValue >= 60_000_000) {
    return {
      player,
      tier: "Elite Asset",
      description: "Jogador com alta liquidez e impacto imediato, ideal para reforco de curto prazo com baixa friccao de mercado.",
      summary: "Impacto imediato",
      score: player.overallRating * 2.6 + liquidity * 7 + player.capitalEfficiency * 4,
    };
  }

  if (player.age <= 23 && player.potential >= 86 && upside >= 4 && liquidity >= 6.5) {
    return {
      player,
      tier: "Growth Asset",
      description: "Ativo jovem com upside real de performance e valorizacao, adequado para ciclo de desenvolvimento com revenda futura.",
      summary: "Upside e valorizacao",
      score: player.potential * 2.1 + upside * 8 + liquidity * 5 + Math.max(0, 25 - player.age) * 2,
    };
  }

  if (risk === "LOW" && player.overallRating >= 80 && liquidity >= 6) {
    return {
      player,
      tier: "Stable Asset",
      description: "Perfil consistente, de baixo risco e retorno esportivo previsivel, indicado para compor base competitiva com estabilidade.",
      summary: "Base segura",
      score: player.overallRating * 2 + player.capitalEfficiency * 5 + liquidity * 5,
    };
  }

  if ((valueEfficiency >= 5.5 || upside >= 6 || immediateImpact) && marketValue > 0 && marketValue <= 45_000_000) {
    return {
      player,
      tier: "Opportunity Asset",
      description: "Ativo com leitura favoravel de custo-beneficio, interessante para capturar desempenho acima do preco de entrada.",
      summary: "Custo-beneficio",
      score: player.capitalEfficiency * 8 + upside * 5 + liquidity * 4 + Math.max(0, 50 - marketValue / 1_000_000),
    };
  }

  return null;
}

function getRiskCount(players: PlayerExtended[], bucket: RiskBucket) {
  return players.filter((player) => player.risk.level === bucket).length;
}

export function buildDashboardViewModel(players: PlayerExtended[]): DashboardViewModel {
  return {
    players,
    averageEfficiency: players.length
      ? players.reduce((sum, player) => sum + player.capitalEfficiency, 0) / players.length
      : 0,
    totalMarketValue: formatTotalMarketValue(players),
    riskCounts: {
      LOW: getRiskCount(players, "LOW"),
      MEDIUM: getRiskCount(players, "MEDIUM"),
      HIGH: getRiskCount(players, "HIGH"),
    },
    topEfficiencyPlayers: [...players].sort((a, b) => b.capitalEfficiency - a.capitalEfficiency).slice(0, 3),
    efficiencyChartData: buildChartData(players, "capitalEfficiency", "Capital Efficiency", "#00C2FF"),
    ratingChartData: buildChartData(players, "overallRating", "Overall Rating", "#7A5CFF"),
    riskTaggedPlayers: players.map(buildRiskEntry),
    strategicAssets: players
      .map((player) => buildStrategicAsset(player))
      .filter((asset): asset is StrategicAsset => Boolean(asset))
      .sort((a, b) => b.score - a.score),
  };
}
