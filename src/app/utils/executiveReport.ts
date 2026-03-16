import type { PlayerExtended } from "../types/player";

type UnknownRecord = Record<string, unknown>;

export type ExecutiveReportWinner = "A" | "B" | "DRAW";

export interface ExecutiveReportMetric {
  label: string;
  a: number;
  b: number;
  winner: ExecutiveReportWinner;
  inverse?: boolean;
  format?: "decimal" | "integer" | "currency";
}

export interface ExecutiveReportInsight {
  title: string;
  content: string;
  tone: "cyan" | "violet" | "emerald";
}

export interface ExecutiveReportModel {
  title: string;
  subtitle: string;
  generatedAt: Date;
  generatedAtLabel: string;
  filename: string;
  winner: ExecutiveReportWinner;
  recommendedPlayer: PlayerExtended | null;
  secondaryPlayer: PlayerExtended | null;
  executiveSummary: string;
  comparativeAnalysis: string;
  riskOverview: string;
  aiNarrative: string[];
  recommendationLabel: string;
  recommendationSummary: string;
  metrics: ExecutiveReportMetric[];
  insights: ExecutiveReportInsight[];
  takeaways: string[];
}

interface BuildExecutiveReportParams {
  playerA: PlayerExtended;
  playerB: PlayerExtended;
  winner?: ExecutiveReportWinner;
  comparison?: unknown;
  generatedAt?: Date;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickRecord(source: unknown, key: string) {
  if (!isRecord(source)) {
    return null;
  }

  const value = source[key];
  return isRecord(value) ? value : null;
}

function toNumber(value: unknown, fallback = 0) {
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

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickVariant(seed: number, variants: string[], offset = 0) {
  if (variants.length === 0) {
    return "";
  }

  return variants[(seed + offset) % variants.length] ?? variants[0];
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCompactCurrency(value: number | null) {
  if (!value || !Number.isFinite(value)) {
    return "mercado nao informado";
  }

  if (value >= 1_000_000_000) {
    return `EUR ${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `EUR ${(value / 1_000).toFixed(0)}K`;
  }

  return `EUR ${value.toFixed(0)}`;
}

function parseMarketValue(label: string) {
  if (!label || label === "N/A") {
    return null;
  }

  const normalized = label.trim().toUpperCase();
  const base = Number.parseFloat(normalized.replace(/[^\d.,-]/g, "").replace(",", "."));
  if (!Number.isFinite(base)) {
    return null;
  }

  if (normalized.includes("B")) {
    return base * 1_000_000_000;
  }

  if (normalized.includes("M")) {
    return base * 1_000_000;
  }

  if (normalized.includes("K")) {
    return base * 1_000;
  }

  return base;
}

function getPlayerBranch(comparison: unknown, branch: string, playerKey: "playerA" | "playerB") {
  return pickRecord(pickRecord(comparison, branch), playerKey);
}

function getPotential(comparison: unknown, playerKey: "playerA" | "playerB", fallback: number) {
  return toNumber(getPlayerBranch(comparison, "overallRating", playerKey)?.potential, fallback);
}

function getGrowthIndex(comparison: unknown, playerKey: "playerA" | "playerB") {
  return toNumber(getPlayerBranch(comparison, "growthProjection", playerKey)?.growthIndex, 0);
}

function getExpectedPeak(comparison: unknown, playerKey: "playerA" | "playerB", fallback: number) {
  return toNumber(getPlayerBranch(comparison, "growthProjection", playerKey)?.expectedPeak, fallback);
}

function getExplainabilitySignals(comparison: unknown, playerKey: "playerA" | "playerB") {
  const explainability = getPlayerBranch(comparison, "explainability", playerKey);
  const topFactors = Array.isArray(explainability?.topFactors) ? explainability.topFactors.filter((item) => typeof item === "string") : [];
  const riskDrivers = Array.isArray(explainability?.riskDrivers) ? explainability.riskDrivers.filter((item) => typeof item === "string") : [];
  const positiveSignals = Array.isArray(explainability?.positiveSignals)
    ? explainability.positiveSignals.filter((item) => typeof item === "string")
    : [];

  return {
    topFactors,
    riskDrivers,
    positiveSignals,
  };
}

function getMetricWinner(a: number, b: number, inverse = false): ExecutiveReportWinner {
  if (Math.abs(a - b) < 0.001) {
    return "DRAW";
  }

  if (inverse) {
    return a < b ? "A" : "B";
  }

  return a > b ? "A" : "B";
}

function buildDecisionScore(
  player: PlayerExtended,
  potential: number,
  growthIndex: number,
  marketValue: number | null,
) {
  const ageCurveBonus = Math.max(0, 29 - player.age) * 0.8;
  const upsideGap = Math.max(0, potential - player.overallRating);
  const marketPenalty = marketValue ? Math.min(16, marketValue / 12_000_000) : 5;

  return (
    player.overallRating * 1.5 +
    player.capitalEfficiency * 7 +
    player.liquidity.score * 0.34 +
    growthIndex * 0.08 +
    upsideGap * 2.2 +
    ageCurveBonus -
    player.structuralRisk.score * 0.42 -
    player.financialRisk.index * 0.28 -
    marketPenalty
  );
}

function describeTimeHorizon(player: PlayerExtended, potential: number, growthIndex: number) {
  if (player.overallRating >= 84 && player.structuralRisk.score <= 35 && player.financialRisk.index <= 45) {
    return "reforco imediato";
  }

  if (player.age <= 23 || potential - player.overallRating >= 5 || growthIndex >= 65) {
    return "ativo de medio prazo";
  }

  return "solucao de equilibrio";
}

export function formatExecutiveMetric(metric: ExecutiveReportMetric, value: number) {
  if (metric.format === "integer") {
    return `${Math.round(value)}`;
  }

  if (metric.format === "currency") {
    return formatCompactCurrency(value);
  }

  return value.toFixed(1);
}

export function buildExecutiveReportModel({
  playerA,
  playerB,
  winner = "DRAW",
  comparison,
  generatedAt = new Date(),
}: BuildExecutiveReportParams): ExecutiveReportModel {
  const seed = hashText(
    [playerA.id, playerB.id, playerA.name, playerB.name, playerA.overallRating, playerB.overallRating].join("|"),
  );

  const potentialA = getPotential(comparison, "playerA", playerA.overallRating);
  const potentialB = getPotential(comparison, "playerB", playerB.overallRating);
  const growthA = getGrowthIndex(comparison, "playerA");
  const growthB = getGrowthIndex(comparison, "playerB");
  const peakA = getExpectedPeak(comparison, "playerA", potentialA);
  const peakB = getExpectedPeak(comparison, "playerB", potentialB);
  const explainabilityA = getExplainabilitySignals(comparison, "playerA");
  const explainabilityB = getExplainabilitySignals(comparison, "playerB");
  const marketValueA = parseMarketValue(playerA.marketValue);
  const marketValueB = parseMarketValue(playerB.marketValue);
  const decisionA = buildDecisionScore(playerA, potentialA, growthA, marketValueA);
  const decisionB = buildDecisionScore(playerB, potentialB, growthB, marketValueB);
  const recommendedSide: ExecutiveReportWinner =
    Math.abs(decisionA - decisionB) < 1.5 ? winner : decisionA > decisionB ? "A" : "B";

  const recommendedPlayer = recommendedSide === "A" ? playerA : recommendedSide === "B" ? playerB : null;
  const secondaryPlayer = recommendedSide === "A" ? playerB : recommendedSide === "B" ? playerA : null;

  const opener = pickVariant(
    seed,
    [
      "A leitura executiva do duelo aponta para um diferencial claro entre seguranca competitiva e potencial de valorizacao.",
      "O comparativo evidencia dois perfis viaveis, mas com relacoes diferentes entre retorno esportivo, risco e timing de investimento.",
      "A comparacao coloca em perspectiva um ativo mais pronto para entrega imediata e outro com maior elasticidade de desenvolvimento.",
    ],
  );

  const marketFrame = pickVariant(
    seed,
    [
      "Do ponto de vista de mercado, a decisao pede equilibrio entre performance ja monetizavel e flexibilidade futura de revenda.",
      "Sob a lente de alocacao de capital, o melhor nome nao e apenas o mais talentoso, mas o que protege caixa e preserva upside.",
      "Em termos de portfolio esportivo, o alvo ideal e aquele que combina impacto tecnico com risco absorvivel para a estrutura do clube.",
    ],
    1,
  );

  const recommendedHorizon = recommendedPlayer
    ? describeTimeHorizon(
        recommendedPlayer,
        recommendedPlayer.id === playerA.id ? potentialA : potentialB,
        recommendedPlayer.id === playerA.id ? growthA : growthB,
      )
    : "aposta condicionada";

  const executiveSummary = recommendedPlayer && secondaryPlayer
    ? `${opener} ${recommendedPlayer.name} fecha o recorte com melhor composicao entre overall (${recommendedPlayer.overallRating.toFixed(1)}), capital efficiency (${recommendedPlayer.capitalEfficiency.toFixed(1)}) e liquidez (${recommendedPlayer.liquidity.score.toFixed(1)}). ${marketFrame} ${secondaryPlayer.name} continua relevante, sobretudo quando o clube prioriza ${describeTimeHorizon(secondaryPlayer, secondaryPlayer.id === playerA.id ? potentialA : potentialB, secondaryPlayer.id === playerA.id ? growthA : growthB)} e aceita uma curva de maturacao menos linear.`
    : `${opener} O confronto permanece equilibrado, com diferencas pequenas entre entrega imediata, risco estrutural e liquidez de saida. ${marketFrame}`;

  const comparativeAnalysis = `${playerA.name} trabalha a comparacao com overall ${playerA.overallRating.toFixed(1)}, potencial estimado em ${potentialA.toFixed(1)} e pico projetado de ${peakA.toFixed(1)}, enquanto ${playerB.name} responde com overall ${playerB.overallRating.toFixed(1)}, potencial ${potentialB.toFixed(1)} e pico de ${peakB.toFixed(1)}. Em termos de capital allocation, a vantagem de ${
    getMetricWinner(playerA.capitalEfficiency, playerB.capitalEfficiency) === "A" ? playerA.name : getMetricWinner(playerA.capitalEfficiency, playerB.capitalEfficiency) === "B" ? playerB.name : "equilibrio"
  } em eficiencia de capital precisa ser lida ao lado da diferenca de liquidez e da pressao de risco financeiro, porque e nesse encaixe que o retorno total do investimento se torna mais previsivel.`;

  const riskOverview = `${playerA.name} carrega risco estrutural de ${playerA.structuralRisk.score.toFixed(1)} e risco financeiro de ${playerA.financialRisk.index.toFixed(1)}, com leitura dominante de "${playerA.financialRisk.investmentProfile}". ${playerB.name} aparece com risco estrutural de ${playerB.structuralRisk.score.toFixed(1)} e risco financeiro de ${playerB.financialRisk.index.toFixed(1)}, sustentado por "${playerB.financialRisk.investmentProfile}". A vantagem real nao esta apenas em quem corre menos risco absoluto, mas em quem apresenta risco melhor remunerado pelo pacote tecnico, pela janela de revenda e pela margem de crescimento ainda capturavel.`;

  const narrativeParagraphs = recommendedPlayer && secondaryPlayer
    ? [
        `${pickVariant(
          seed,
          [
            "O recorte de scouting internacional favorece o nome que oferece maior previsibilidade competitiva sem comprometer opcionalidade de mercado.",
            "Sob uma leitura de recrutamento mais madura, o ponto central nao e escolher o perfil mais vistoso, e sim o ativo que resiste melhor a mudancas de contexto competitivo.",
            "Quando a comparacao e filtrada pela logica de decisao executiva, fica claro que o melhor candidato e aquele que transforma boa performance em ativo sustentavel.",
          ],
          2,
        )} ${recommendedPlayer.name} se posiciona como ${recommendedHorizon} porque sustenta melhor o binomio entre impacto esportivo e seguranca de investimento. A soma de overall, liquidez e capital efficiency reduz friccao de entrada e tambem protege o clube em um eventual ciclo de saida.`,
        `${secondaryPlayer.name} nao deve ser descartado. O perfil dele permanece interessante quando a diretoria busca maior teto incremental, aceita uma janela de desenvolvimento mais longa ou enxerga sinergia tatico-financeira que justifique a exposicao adicional. Ainda assim, a comparacao atual sugere que a margem entre upside e risco esta mais bem calibrada em ${recommendedPlayer.name}.`,
        `Os sinais explicativos reforcam essa leitura: ${recommendedPlayer.id === playerA.id ? explainabilityA.positiveSignals[0] ?? "boa composicao estrutural" : explainabilityB.positiveSignals[0] ?? "boa composicao estrutural"}, ${recommendedPlayer.id === playerA.id ? explainabilityA.topFactors[0] ?? "controle de exposicao" : explainabilityB.topFactors[0] ?? "controle de exposicao"} e ${
          recommendedPlayer.id === playerA.id ? explainabilityA.riskDrivers[0] ?? "curva de risco administravel" : explainabilityB.riskDrivers[0] ?? "curva de risco administravel"
        } ajudam a explicar por que a recomendacao final pende para este nome sem depender de um argumento unico ou superficial.`,
      ]
    : [
        "A comparacao indica equilibrio real entre os dois ativos, sem uma ruptura grande o bastante para produzir recomendacao incontestavel.",
        "Nesse cenario, a decisao passa a depender mais do plano esportivo imediato, da tolerancia do clube a risco financeiro e da urgencia por liquidez futura.",
        "O parecer executivo e condicionar a escolha ao contexto tatico e ao envelope financeiro final da operacao.",
      ];

  const metrics: ExecutiveReportMetric[] = [
    {
      label: "Overall Rating",
      a: playerA.overallRating,
      b: playerB.overallRating,
      winner: getMetricWinner(playerA.overallRating, playerB.overallRating),
    },
    {
      label: "Capital Efficiency",
      a: playerA.capitalEfficiency,
      b: playerB.capitalEfficiency,
      winner: getMetricWinner(playerA.capitalEfficiency, playerB.capitalEfficiency),
    },
    {
      label: "Structural Risk",
      a: playerA.structuralRisk.score,
      b: playerB.structuralRisk.score,
      inverse: true,
      winner: getMetricWinner(playerA.structuralRisk.score, playerB.structuralRisk.score, true),
    },
    {
      label: "Liquidity Score",
      a: playerA.liquidity.score,
      b: playerB.liquidity.score,
      winner: getMetricWinner(playerA.liquidity.score, playerB.liquidity.score),
    },
    {
      label: "Financial Risk",
      a: playerA.financialRisk.index,
      b: playerB.financialRisk.index,
      inverse: true,
      winner: getMetricWinner(playerA.financialRisk.index, playerB.financialRisk.index, true),
    },
    {
      label: "Potential",
      a: potentialA,
      b: potentialB,
      winner: getMetricWinner(potentialA, potentialB),
    },
  ];

  const insights: ExecutiveReportInsight[] = [
    {
      title: "Primary Recommendation",
      tone: "cyan",
      content: recommendedPlayer
        ? `${recommendedPlayer.name} oferece a melhor relacao entre impacto atual, risco estrutural controlado e liquidez de revenda dentro do recorte selecionado.`
        : "O confronto permanece equilibrado e precisa ser condicionado ao contexto tatico e ao preco final da operacao.",
    },
    {
      title: "Market Read",
      tone: "violet",
      content: `${playerA.name} trabalha com ${formatCompactCurrency(marketValueA)} e ${playerB.name} com ${formatCompactCurrency(marketValueB)}. A diferenca de caixa so faz sentido quando o teto incremental compensa o risco absorvido.`,
    },
    {
      title: "Upside vs Safety",
      tone: "emerald",
      content: `${playerA.name} projeta crescimento de ${growthA.toFixed(1)} e ${playerB.name} de ${growthB.toFixed(1)}. O ganho marginal precisa ser lido junto da maturidade competitiva e da janela de revenda.`,
    },
  ];

  const takeaways = [
    `${playerA.name}: overall ${playerA.overallRating.toFixed(1)}, liquidez ${playerA.liquidity.score.toFixed(1)}, risco financeiro ${playerA.financialRisk.index.toFixed(1)}.`,
    `${playerB.name}: overall ${playerB.overallRating.toFixed(1)}, liquidez ${playerB.liquidity.score.toFixed(1)}, risco financeiro ${playerB.financialRisk.index.toFixed(1)}.`,
    recommendedPlayer
      ? `Parecer final: priorizar ${recommendedPlayer.name} como ${recommendedHorizon}, mantendo ${secondaryPlayer?.name ?? "a alternativa"} como plano B contextual.`
      : "Parecer final: sem vencedor absoluto; avancar apenas com validacao tatico-financeira complementar.",
  ];

  return {
    title: "Executive Report",
    subtitle: `${playerA.name} vs ${playerB.name}`,
    generatedAt,
    generatedAtLabel: formatDateTime(generatedAt),
    filename: `executive-report-${slugify(playerA.name)}-vs-${slugify(playerB.name)}.pdf`,
    winner: recommendedSide,
    recommendedPlayer,
    secondaryPlayer,
    executiveSummary,
    comparativeAnalysis,
    riskOverview,
    aiNarrative: narrativeParagraphs,
    recommendationLabel: recommendedPlayer ? `Prioritize ${recommendedPlayer.name}` : "Conditional decision",
    recommendationSummary: recommendedPlayer
      ? `${recommendedPlayer.name} e a opcao mais solida para este contexto, com melhor equilibrio entre retorno esportivo imediato, controle de risco e flexibilidade de revenda.`
      : "A decisao deve ser condicionada ao contexto tatico e ao preco final, pois o comparativo nao abre vantagem executiva clara.",
    metrics,
    insights,
    takeaways,
  };
}
