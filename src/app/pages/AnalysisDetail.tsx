import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Loader2,
  ShieldAlert,
  Target,
  Trash2,
  User,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { getAnalysisById, deleteAnalysisHubEntry, type AnalysisDetailViewModel } from "../services/analysis";
import { buildExecutiveReportData } from "../../adapters/reports";
import { downloadExecutiveReportPdf } from "../utils/executiveReportPdf";
import { downloadPlayerReportPdf } from "../utils/playerReportPdf";
import { getPlayerDisplayName, normalizeReportLiquidityScore } from "../utils/playerDisplay";

function formatMarketValue(value: number | null) {
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

function getRiskBadgeStyles(value: string) {
  switch (value) {
    case "LOW":
      return "border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.12)] text-[#B6FFD8]";
    case "HIGH":
      return "border-[rgba(255,77,79,0.28)] bg-[rgba(255,77,79,0.14)] text-[#FFB4B5]";
    default:
      return "border-[rgba(251,191,36,0.28)] bg-[rgba(251,191,36,0.12)] text-[#F8D98B]";
  }
}

function getTierStyles(tier: string) {
  switch (tier) {
    case "ELITE":
      return "border-transparent bg-[#00C2FF] text-[#07142A]";
    case "PREMIUM":
      return "border-transparent bg-[#A855F7] text-white";
    case "STANDARD":
      return "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.1)] text-white";
    default:
      return "border-[rgba(255,193,7,0.28)] bg-[rgba(255,193,7,0.2)] text-[#FACC15]";
  }
}

function formatMetaLine(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" · ");
}

function isRenderableRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatUnknownText(value: unknown, fallback = "N/A") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Nao";
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatUnknownText(item, ""))
      .filter((item) => item.trim().length > 0);

    return items.length > 0 ? items.join(", ") : fallback;
  }

  if (isRenderableRecord(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function formatUnknownNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatRiskSummary(value: unknown) {
  if (isRenderableRecord(value)) {
    return formatUnknownText(value.text, "");
  }

  return formatUnknownText(value, "");
}

function shortenText(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function compactBullets(values: Array<string | null | undefined>, maxItems = 4) {
  return values
    .map((value) => (typeof value === "string" ? shortenText(value, 160) : ""))
    .filter(Boolean)
    .slice(0, maxItems);
}

function CompactBulletList({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item}
          className="flex items-start gap-3 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-relaxed text-gray-300"
        >
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#00C2FF]" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function formatGrowthProjectionText(value: unknown) {
  if (isRenderableRecord(value)) {
    if (typeof value.expectedPeak === "number" && Number.isFinite(value.expectedPeak)) {
      return String(value.expectedPeak);
    }

    const timelineLabels = [
      typeof value.shortTerm !== "undefined" ? `Curto: ${formatUnknownText(value.shortTerm, "N/A")}` : null,
      typeof value.mediumTerm !== "undefined" ? `Medio: ${formatUnknownText(value.mediumTerm, "N/A")}` : null,
      typeof value.longTerm !== "undefined" ? `Longo: ${formatUnknownText(value.longTerm, "N/A")}` : null,
    ].filter((item): item is string => Boolean(item));

    if (timelineLabels.length > 0) {
      return timelineLabels.join(" | ");
    }
  }

  return formatUnknownText(value, "N/A");
}

function normalizeStringList(value: unknown, maxItems = 6) {
  if (Array.isArray(value)) {
    return value
      .map((item) => formatUnknownText(item, ""))
      .filter((item) => item.trim().length > 0)
      .slice(0, maxItems);
  }

  if (isRenderableRecord(value)) {
    return Object.entries(value)
      .map(([key, item]) => {
        const text = formatUnknownText(item, "");
        return text ? `${key}: ${text}` : "";
      })
      .filter(Boolean)
      .slice(0, maxItems);
  }

  const single = formatUnknownText(value, "");
  return single ? [single] : [];
}

function normalizeDecisionSummary(value: unknown) {
  if (!isRenderableRecord(value)) {
    return null;
  }

  return {
    decision: formatUnknownText(value.decision, ""),
    confidence: formatUnknownNumber(value.confidence, 0),
    riskLevel: formatUnknownText(value.riskLevel, "MEDIUM"),
    winner: formatUnknownText(value.winner, ""),
  };
}

function MetricCard({
  label,
  value,
  valueClassName,
  subtitle,
  badge,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  subtitle?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(255,255,255,0.5)]">{label}</p>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className={`text-4xl font-semibold leading-none text-white ${valueClassName ?? ""}`}>{value}</p>
          {subtitle ? <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[rgba(255,255,255,0.44)]">{subtitle}</p> : null}
        </div>
        {badge}
      </div>
    </div>
  );
}

function MetaCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Calendar;
  accent: string;
}) {
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ background: `${accent}20` }}>
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{label}</p>
          <p className="mt-1 text-sm font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function AnalysisDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisDetailViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAnalysis() {
      if (!id) {
        setError("Analise nao encontrada.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await getAnalysisById(id);
        if (!active) {
          return;
        }

        setAnalysis(response.data);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setAnalysis(null);
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o relatorio.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAnalysis();

    return () => {
      active = false;
    };
  }, [id]);

  const reportModel = useMemo(() => {
    const comparisonData = analysis?.reportContent?.comparisonData ?? null;

    if (!comparisonData) {
      return null;
    }

    return buildExecutiveReportData(comparisonData, comparisonData.playerA, comparisonData.playerB, {
      analyst: analysis.user,
      generatedAt: new Date(analysis.date),
      status: analysis.statusLabel,
    });
  }, [analysis]);

  const singleReportPdfModel = useMemo(() => {
    const singleReport = analysis?.reportContent?.playerReportData;

    if (!analysis || !singleReport) {
      return null;
    }

    const baseStats = {
      crossing: null,
      finishing: null,
      headingAccuracy: null,
      shortPassing: null,
      volleys: null,
      curve: null,
      fkAccuracy: null,
      longPassing: null,
      ballControl: null,
      acceleration: null,
      sprintSpeed: null,
      agility: null,
      reactions: null,
      balance: null,
      shotPower: null,
      jumping: null,
      stamina: null,
      strength: null,
      longShots: null,
      aggression: null,
      interceptions: null,
      attackPosition: null,
      vision: null,
      penalties: null,
      composure: null,
      defensiveAwareness: null,
      standingTackle: null,
      slidingTackle: null,
      gkDiving: null,
      gkHandling: null,
      gkKicking: null,
      gkPositioning: null,
      gkReflexes: null,
    };

    const profileStats = {
      pace: singleReport.player.pac,
      shooting: singleReport.player.sho,
      passing: singleReport.player.pas,
      dribbling: singleReport.player.dri,
      defending: singleReport.player.def,
      physical: singleReport.player.phy,
      ...baseStats,
    };

    return {
      analysisId: analysis.id,
      player: {
        id: singleReport.player.id,
        name: singleReport.player.name,
        position: singleReport.player.position ?? "",
        positions: singleReport.player.position ? [singleReport.player.position] : [],
        team: singleReport.player.club ?? "",
        league: singleReport.player.league ?? "",
        nationality: singleReport.player.nationality ?? "",
        age: singleReport.player.age ?? 0,
        overall: singleReport.metrics.overall,
        potential: singleReport.metrics.potential,
        marketValue: singleReport.metrics.marketValue,
        marketValueLabel: formatMarketValue(singleReport.metrics.marketValue),
        image: null,
        attributes: profileStats,
        playStyles: [],
        pac: singleReport.player.pac,
        sho: singleReport.player.sho,
        pas: singleReport.player.pas,
        dri: singleReport.player.dri,
        def: singleReport.player.def,
        phy: singleReport.player.phy,
        stats: profileStats,
      },
      metrics: {
        overall: singleReport.metrics.overall,
        potential: singleReport.metrics.potential,
        tier: singleReport.metrics.tier,
        archetype: singleReport.metrics.archetype,
        archetypeConfidence: null,
        riskScore: singleReport.metrics.riskScore,
        riskLevel: singleReport.metrics.riskLevel,
        riskSummary: singleReport.metrics.riskSummary,
        financialRisk: singleReport.metrics.financialRisk,
        liquidityScore: singleReport.metrics.liquidityScore,
        capitalEfficiency: singleReport.metrics.capitalEfficiency,
        marketValue: singleReport.metrics.marketValue,
        growthProjection: singleReport.metrics.growthProjection,
      },
      aiNarrative: singleReport.aiNarrative,
      recommendation: singleReport.metrics.recommendation,
      createdAt: analysis.date,
    };
  }, [analysis]);

  const playersLabel = Array.isArray(analysis?.players) ? analysis?.players.join(" vs ") : "";
  const reportContent = analysis?.reportContent ?? null;
  const rawBlocks = reportContent?.rawBlocks;
  const rawDecisionSummary = normalizeDecisionSummary(rawBlocks?.decisionSummary);
  const rawExplainabilityItems = normalizeStringList(rawBlocks?.explainability, 6);
  const rawInsights = normalizeStringList(rawBlocks?.insights, 6);
  const rawMetricLines = normalizeStringList(rawBlocks?.metrics, 6);
  const rawPlayers = normalizeStringList(rawBlocks?.players, 4);
  const isComparison = analysis?.type === "comparison";
  const isIndividual = analysis ? analysis.playerBId === null || analysis.playerBId === undefined : false;
  const isSingleReport = analysis?.type === "report" && isIndividual;
  const singleReport = reportContent?.playerReportData ?? null;
  const canExportComparisonPdf = reportContent?.canExportPdf === true && Boolean(reportModel);
  const canExportSinglePdf = reportContent?.canExportPdf === true && Boolean(singleReportPdfModel);
  const singleReportPlayerName = singleReport ? getPlayerDisplayName(singleReport.player.name) : null;
  const singleReportMetaLine = singleReport
    ? formatMetaLine([singleReport.player.position, singleReport.player.club, singleReport.player.league])
    : "";
  const headerTitle = isSingleReport && singleReportPlayerName ? singleReportPlayerName : analysis?.title;
  const headerDescription =
    isSingleReport && singleReport
      ? singleReportMetaLine || "Contexto do atleta indisponivel"
      : analysis?.description || "Leitura completa do relatorio salvo na central de analises.";
  const playersBadgeLabel = isSingleReport && singleReportPlayerName ? singleReportPlayerName : playersLabel || "Jogadores nao informados";
  const safeHeaderTitle = formatUnknownText(headerTitle, "Analise");
  const safeHeaderDescription = formatUnknownText(headerDescription, "Leitura completa do relatorio salvo na central de analises.");
  const safePlayersBadgeLabel = formatUnknownText(playersBadgeLabel, "Jogadores nao informados");
  const safeTypeLabel = formatUnknownText(analysis?.typeLabel, "Relatorio");
  const safeStatusLabel = formatUnknownText(analysis?.statusLabel, "Em andamento");
  const safeAnalystName = formatUnknownText(analysis?.user, "Analista SoccerMind");
  const safeSingleReportTier = formatUnknownText(singleReport?.metrics?.tier, "PROSPECT");
  const safeSingleReportArchetype = formatUnknownText(singleReport?.metrics?.archetype, "Nao classificado");
  const safeSingleReportRiskLevel = formatUnknownText(singleReport?.metrics?.riskLevel, rawDecisionSummary?.riskLevel || "MEDIUM");
  const safeSingleReportRecommendation = formatUnknownText(singleReport?.metrics?.recommendation, rawDecisionSummary?.decision || "Recomendacao indisponivel.");
  const safeSingleReportRiskSummary = formatRiskSummary(singleReport?.metrics?.riskSummary);
  const safeSingleReportGrowthProjection = formatGrowthProjectionText(singleReport?.metrics?.growthProjection);
  const safeSingleReportNarrative = formatUnknownText(
    singleReport?.aiNarrative ?? analysis?.description ?? "Narrativa de scouting indisponivel.",
    "Narrativa de scouting indisponivel.",
  );
  const safeSingleOverall = formatUnknownNumber(singleReport?.metrics?.overall, 0);
  const safeSinglePotential = formatUnknownNumber(singleReport?.metrics?.potential, 0);
  const safeSingleMarketValue = typeof singleReport?.metrics?.marketValue === "number" ? singleReport.metrics.marketValue : null;
  const safeSingleRiskScore = formatUnknownNumber(singleReport?.metrics?.riskScore, rawDecisionSummary?.confidence ? 10 - rawDecisionSummary.confidence / 10 : 0);
  const safeSingleLiquidity = normalizeReportLiquidityScore(singleReport?.metrics?.liquidityScore ?? 0);
  const safeSingleCapitalEfficiency = formatUnknownNumber(singleReport?.metrics?.capitalEfficiency, 0);
  const comparisonInsights = Array.isArray(reportModel?.insights) ? reportModel.insights : [];
  const comparisonTakeaways = Array.isArray(reportModel?.takeaways) ? reportModel.takeaways : [];
  const comparisonNarrative = Array.isArray(reportModel?.aiNarrative) ? reportModel.aiNarrative : [];

  useEffect(() => {
    document.title = `${safeHeaderTitle} | SoccerMind`;

    return () => {
      document.title = "SoccerMind";
    };
  }, [safeHeaderTitle]);

  useEffect(() => {
    if (!analysis) {
      return;
    }

    try {
      console.log("Analysis payload completo:", JSON.stringify(analysis, null, 2));
    } catch (serializationError) {
      console.log("Analysis payload completo:", analysis);
      console.error("Falha ao serializar analysis para diagnostico:", serializationError);
    }
  }, [analysis]);

  const handleDelete = async () => {
    if (!analysis || deleting) {
      return;
    }

    const confirmed = window.confirm("Deseja excluir este relatorio da central de analises?");
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await deleteAnalysisHubEntry(analysis);
      navigate("/history", { replace: true });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir o relatorio.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#00C2FF]" />
              <p className="mt-4 text-sm text-gray-500">Carregando relatorio salvo...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-xl rounded-[22px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-[#FFB4B5]" />
              <h1 className="mt-4 text-xl font-semibold text-white">Nao foi possivel abrir este relatorio</h1>
              <p className="mt-2 text-sm text-[#FFB4B5]">{error ?? "Relatorio indisponivel."}</p>
              <Button className="mt-6" variant="outline" onClick={() => navigate("/history")}>
                Voltar para Analises
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1480px] space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.18),transparent_68%)] blur-2xl" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-4xl">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/history")}
                    className="mb-4 h-10 rounded-[12px] px-0 text-gray-400 hover:bg-transparent hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para a central
                  </Button>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">
                    <FileText className="h-3.5 w-3.5" />
                    Analysis Detail
                  </div>
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <h1 className="text-4xl font-bold tracking-[-0.03em] text-white lg:text-[2.3rem]">{safeHeaderTitle}</h1>
                      {isSingleReport && singleReport ? (
                        <span className={`inline-flex items-center self-start rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${getTierStyles(safeSingleReportTier)}`}>
                          {safeSingleReportTier}
                        </span>
                      ) : null}
                    </div>
                    <p className="max-w-3xl text-sm leading-relaxed text-[rgba(255,255,255,0.6)]">
                      {safeHeaderDescription}
                    </p>
                    <div className="h-px w-full bg-[linear-gradient(90deg,rgba(0,194,255,0.7),rgba(0,194,255,0.08),transparent)]" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {safeTypeLabel}
                    </span>
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {safePlayersBadgeLabel}
                    </span>
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {safeStatusLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      if (isSingleReport && singleReportPdfModel) {
                        downloadPlayerReportPdf(singleReportPdfModel, { analyst: analysis.user });
                        return;
                      }

                      if (reportModel) {
                        downloadExecutiveReportPdf(reportModel);
                      }
                    }}
                    disabled={isSingleReport ? !canExportSinglePdf : !canExportComparisonPdf}
                    className="h-11 rounded-[14px] bg-[#00C2FF]/90 px-5 font-semibold text-[#07142A] shadow-[0_6px_18px_rgba(0,194,255,0.24)] hover:bg-[#00C2FF]"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                  {analysis.canDelete ? (
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="h-11 rounded-[14px] border-[rgba(255,77,79,0.28)] bg-[rgba(255,77,79,0.08)] px-5 text-[#FFB4B5] hover:bg-[rgba(255,77,79,0.14)]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleting ? "Excluindo..." : "Excluir"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              <MetaCard label="Analista" value={safeAnalystName} icon={User} accent="#00C2FF" />
              <MetaCard
                label="Data"
                value={new Date(analysis.date).toLocaleString("pt-BR")}
                icon={Calendar}
                accent="#7A5CFF"
              />
              <MetaCard label="Status" value={safeStatusLabel} icon={Target} accent="#00FF9C" />
            </div>

            {analysis.reportContent?.contentStatus === "partial" && !isSingleReport ? (
              <div className="rounded-[18px] border border-[rgba(251,191,36,0.28)] bg-[rgba(251,191,36,0.08)] px-5 py-4 text-sm text-[#F8D98B]">
                {analysis.reportContent.contentMessage || "O relatorio foi carregado parcialmente."}
              </div>
            ) : null}

            {!isComparison && !isSingleReport && (
              <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-gray-300">
                Esta tela foi preparada principalmente para relatorios do tipo REPORT. Esta analise foi carregada com seus metadados, mas nao possui leitura executiva detalhada.
              </div>
            )}

            {isSingleReport && singleReport ? (
              <>
                <section className="rounded-[24px] border border-[rgba(0,194,255,0.16)] bg-[linear-gradient(135deg,rgba(10,27,53,0.96),rgba(12,34,63,0.88))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Relatorio Individual</p>
                      <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">{formatUnknownText(singleReportPlayerName, "Jogador")}</h2>
                      <p className="mt-3 text-sm text-[rgba(255,255,255,0.6)]">
                        {[singleReport.player.position, singleReport.player.club, singleReport.player.league].filter(Boolean).join(" • ") || "Contexto do atleta indisponivel"}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${getTierStyles(safeSingleReportTier)}`}>
                      {safeSingleReportTier}
                    </span>
                  </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <MetricCard label="Overall" value={`${safeSingleOverall}`} valueClassName="text-[#00C2FF]" />
                  <MetricCard label="Potencial" value={`${safeSinglePotential}`} valueClassName="text-[#A855F7]" />
                  <MetricCard
                    label="Valor de mercado"
                    value={formatMarketValue(safeSingleMarketValue)}
                    valueClassName="text-[#00FF9C] text-[2rem]"
                  />
                  <MetricCard
                    label="Risco"
                    value={safeSingleRiskScore.toFixed(1)}
                    badge={
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getRiskBadgeStyles(safeSingleReportRiskLevel)}`}>
                        {safeSingleReportRiskLevel}
                      </span>
                    }
                  />
                  <MetricCard
                    label="Liquidez"
                    value={safeSingleLiquidity.toFixed(1)}
                    subtitle="score 0-10"
                  />
                  <MetricCard
                    label="Capital Efficiency"
                    value={safeSingleCapitalEfficiency.toFixed(1)}
                    subtitle="eficiencia de capital"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Contexto do atleta</p>
                    <div className="mt-4 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
                      <div>Clube: <span className="text-white">{singleReport.player.club ?? "N/A"}</span></div>
                      <div>Liga: <span className="text-white">{singleReport.player.league ?? "N/A"}</span></div>
                      <div>Nacionalidade: <span className="text-white">{singleReport.player.nationality ?? "N/A"}</span></div>
                      <div>Idade: <span className="text-white">{singleReport.player.age ?? "N/A"}</span></div>
                      <div>Arquetipo: <span className="text-white">{safeSingleReportArchetype}</span></div>
                      <div>Pico projetado: <span className="text-white">{safeSingleReportGrowthProjection}</span></div>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Atributos principais</p>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        ["PAC", singleReport.player.pac],
                        ["SHO", singleReport.player.sho],
                        ["PAS", singleReport.player.pas],
                        ["DRI", singleReport.player.dri],
                        ["DEF", singleReport.player.def],
                        ["PHY", singleReport.player.phy],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-4 text-center">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
                          <p className="mt-2 text-xl font-semibold text-white">{value ?? "-"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <section className="rounded-[22px] border border-[rgba(0,194,255,0.16)] bg-[rgba(0,194,255,0.04)] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="h-12 w-1 rounded-full bg-[#00C2FF]" />
                    <div>
                      <h3 className="text-xl font-semibold text-white">Narrativa de Scouting</h3>
                      <p className="mt-1 text-sm text-gray-500">Leitura executiva gerada pela IA para o atleta atual.</p>
                    </div>
                  </div>
                  <div className="space-y-6 border-l border-[#00C2FF] pl-5 text-[1.05rem] leading-[1.85] text-gray-300">
                    {safeSingleReportNarrative
                      .split(/\n{2,}/)
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                      ))}
                  </div>
                </section>

                <DetailSection title="Recomendacao Executiva" subtitle="Sintese objetiva para decisao de acompanhamento ou investimento.">
                  <div className="rounded-[18px] border border-[rgba(168,85,247,0.3)] bg-[rgba(168,85,247,0.08)] p-5 text-white">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#A855F7]">Recomendacao Executiva</p>
                    <div className="mt-4 flex items-start gap-3">
                      <Target className="mt-0.5 h-5 w-5 text-[#A855F7]" />
                      <p className="text-[15px] font-bold leading-[1.85] text-white">{safeSingleReportRecommendation}</p>
                    </div>
                    {safeSingleReportRiskSummary ? (
                      <p className="mt-4 text-sm leading-[1.8] text-[rgba(255,255,255,0.75)]">{safeSingleReportRiskSummary}</p>
                    ) : null}
                  </div>
                </DetailSection>

                {(rawDecisionSummary || rawExplainabilityItems.length > 0 || rawInsights.length > 0 || rawMetricLines.length > 0 || rawPlayers.length > 0) ? (
                  <DetailSection
                    title="Blocos salvos da Analysis"
                    subtitle="Fallback resiliente para registros parciais ou legados preservados na central Analysis."
                  >
                    <div className="grid gap-4 xl:grid-cols-2">
                      {rawDecisionSummary ? (
                        <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Decision Summary</p>
                          <div className="mt-4 space-y-2 text-sm text-gray-300">
                            <div>Decision: <span className="text-white">{formatUnknownText(rawDecisionSummary.decision, "N/A")}</span></div>
                            <div>Confidence: <span className="text-white">{formatUnknownNumber(rawDecisionSummary.confidence, 0)}%</span></div>
                            <div>Risk: <span className="text-white">{formatUnknownText(rawDecisionSummary.riskLevel, "MEDIUM")}</span></div>
                          </div>
                        </div>
                      ) : null}

                      {rawPlayers.length > 0 ? (
                        <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Players</p>
                          <div className="mt-4">
                            <CompactBulletList items={rawPlayers} />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-3">
                      {rawExplainabilityItems.length > 0 ? (
                        <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Explainability</p>
                          <div className="mt-4">
                            <CompactBulletList items={rawExplainabilityItems} />
                          </div>
                        </div>
                      ) : null}

                      {rawInsights.length > 0 ? (
                        <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Insights</p>
                          <div className="mt-4">
                            <CompactBulletList items={rawInsights} />
                          </div>
                        </div>
                      ) : null}

                      {rawMetricLines.length > 0 ? (
                        <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Metrics</p>
                          <div className="mt-4">
                            <CompactBulletList items={rawMetricLines} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </DetailSection>
                ) : null}
              </>
            ) : null}

            {isSingleReport && !singleReport ? (
              <DetailSection
                title="Conteudo do relatorio individual"
                subtitle="O item foi identificado como relatorio individual, mas os detalhes completos nao puderam ser reconstruidos."
              >
                <div className="flex items-start gap-3 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm text-gray-300">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-[#F8D98B]" />
                  <div>
                    <p>{analysis.description || "Sem descricao complementar."}</p>
                    {analysis.reportContent?.contentMessage ? (
                      <p className="mt-2 text-[#F8D98B]">{analysis.reportContent.contentMessage}</p>
                    ) : null}
                  </div>
                </div>
              </DetailSection>
            ) : null}

            {!isSingleReport && reportModel ? (
              <>
                <DetailSection
                  title={reportModel.recommendationLabel}
                  subtitle="Recomendacao executiva reconstruida a partir do backend da analise salva."
                >
                  <p className="text-sm leading-7 text-gray-300">{shortenText(reportModel.recommendationSummary, 220)}</p>
                </DetailSection>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <DetailSection title="Decision">
                    <CompactBulletList
                      items={compactBullets(
                        [
                          ...comparisonTakeaways,
                          reportModel.executiveSummary,
                        ],
                        4,
                      )}
                    />
                  </DetailSection>

                  <DetailSection title="Key Insights">
                    <CompactBulletList
                      items={compactBullets(
                        comparisonInsights.map((insight) => `${formatUnknownText(insight.title, "Insight")}: ${formatUnknownText(insight.content, "")}`),
                        4,
                      )}
                    />
                  </DetailSection>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                  <DetailSection title="Risk">
                    <CompactBulletList
                      items={compactBullets(
                        [
                          reportModel.riskOverview,
                          ...comparisonNarrative,
                        ],
                        4,
                      )}
                    />
                  </DetailSection>

                  <DetailSection title="Financial Summary">
                    <CompactBulletList
                      items={compactBullets(
                        [
                          ...comparisonInsights.map((insight) => formatUnknownText(insight.content, "")),
                          reportModel.comparativeAnalysis,
                        ],
                        4,
                      )}
                    />
                  </DetailSection>
                </div>
              </>
            ) : !isSingleReport ? (
              <DetailSection
                title="Conteudo do relatorio"
                subtitle="Nao foi possivel reconstruir a leitura executiva completa deste item com os dados atualmente disponiveis."
              >
                <div className="flex items-start gap-3 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm text-gray-300">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-[#F8D98B]" />
                  <div>
                    <p>{analysis.description || "Sem descricao complementar."}</p>
                    {analysis.reportContent?.contentMessage ? (
                      <p className="mt-2 text-[#F8D98B]">{analysis.reportContent.contentMessage}</p>
                    ) : null}
                  </div>
                </div>
              </DetailSection>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
