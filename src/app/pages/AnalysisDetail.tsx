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
      return "border-[rgba(168,85,247,0.34)] bg-[rgba(168,85,247,0.16)] text-[#E9D5FF]";
    case "PREMIUM":
      return "border-[rgba(0,194,255,0.28)] bg-[rgba(0,194,255,0.14)] text-[#9BE7FF]";
    case "STANDARD":
      return "border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.12)] text-[#B6FFD8]";
    default:
      return "border-[rgba(244,201,93,0.28)] bg-[rgba(244,201,93,0.14)] text-[#FBE7A1]";
  }
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

  const playersLabel = analysis.players.join(" vs ");
  const isComparison = analysis.type === "comparison";
  const isIndividual = analysis.playerBId === null || analysis.playerBId === undefined;
  const isSingleReport = analysis.type === "report" && isIndividual;
  const singleReport = analysis.reportContent?.playerReportData ?? null;
  const canExportComparisonPdf = analysis.reportContent?.canExportPdf === true && Boolean(reportModel);
  const canExportSinglePdf = analysis.reportContent?.canExportPdf === true && Boolean(singleReportPdfModel);

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
                  <h1 className="mt-4 text-4xl font-semibold text-white">{analysis.title}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
                    {analysis.description || "Leitura completa do relatorio salvo na central de analises."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {analysis.typeLabel}
                    </span>
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {playersLabel || "Jogadores nao informados"}
                    </span>
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {analysis.statusLabel}
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
              <MetaCard label="Analista" value={analysis.user} icon={User} accent="#00C2FF" />
              <MetaCard
                label="Data"
                value={new Date(analysis.date).toLocaleString("pt-BR")}
                icon={Calendar}
                accent="#7A5CFF"
              />
              <MetaCard label="Status" value={analysis.statusLabel} icon={Target} accent="#00FF9C" />
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
                      <h2 className="mt-3 text-3xl font-semibold text-white">{singleReport.player.name}</h2>
                      <p className="mt-3 text-sm text-gray-400">
                        {[singleReport.player.position, singleReport.player.club, singleReport.player.league].filter(Boolean).join(" • ") || "Contexto do atleta indisponivel"}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${getTierStyles(singleReport.metrics.tier)}`}>
                      {singleReport.metrics.tier}
                    </span>
                  </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <MetaCard label="Overall" value={`${singleReport.metrics.overall}`} icon={Target} accent="#00C2FF" />
                  <MetaCard label="Potencial" value={`${singleReport.metrics.potential}`} icon={Target} accent="#00FF9C" />
                  <MetaCard label="Valor de Mercado" value={formatMarketValue(singleReport.metrics.marketValue)} icon={Calendar} accent="#7A5CFF" />
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Risco</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-2xl font-semibold text-white">{singleReport.metrics.riskScore.toFixed(1)}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getRiskBadgeStyles(singleReport.metrics.riskLevel)}`}>
                        {singleReport.metrics.riskLevel}
                      </span>
                    </div>
                  </div>
                  <MetaCard label="Liquidez" value={singleReport.metrics.liquidityScore.toFixed(1)} icon={User} accent="#00FF9C" />
                  <MetaCard label="Capital Efficiency" value={singleReport.metrics.capitalEfficiency.toFixed(1)} icon={FileText} accent="#A855F7" />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Contexto do atleta</p>
                    <div className="mt-4 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
                      <div>Clube: <span className="text-white">{singleReport.player.club ?? "N/A"}</span></div>
                      <div>Liga: <span className="text-white">{singleReport.player.league ?? "N/A"}</span></div>
                      <div>Nacionalidade: <span className="text-white">{singleReport.player.nationality ?? "N/A"}</span></div>
                      <div>Idade: <span className="text-white">{singleReport.player.age ?? "N/A"}</span></div>
                      <div>Arquetipo: <span className="text-white">{singleReport.metrics.archetype}</span></div>
                      <div>Pico projetado: <span className="text-white">{singleReport.metrics.growthProjection.expectedPeak}</span></div>
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

                <section className="rounded-[22px] border border-[rgba(0,194,255,0.16)] bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="h-12 w-1 rounded-full bg-[#00C2FF]" />
                    <div>
                      <h3 className="text-xl font-semibold text-white">Narrativa de Scouting</h3>
                      <p className="mt-1 text-sm text-gray-500">Leitura executiva gerada pela IA para o atleta atual.</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-[15px] leading-[1.9] text-gray-300">
                    {(singleReport.aiNarrative || analysis.description || "Narrativa de scouting indisponivel.")
                      .split(/\n{2,}/)
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                      ))}
                  </div>
                </section>

                <DetailSection title="Recomendacao Executiva" subtitle="Sintese objetiva para decisao de acompanhamento ou investimento.">
                  <div className="rounded-[18px] border border-[rgba(168,85,247,0.24)] bg-[rgba(168,85,247,0.10)] p-5 text-[15px] leading-[1.9] text-white">
                    {singleReport.metrics.recommendation}
                  </div>
                </DetailSection>
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
                  <p className="text-[15px] leading-[1.9] text-gray-300">{reportModel.recommendationSummary}</p>
                </DetailSection>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <DetailSection title="Executive Summary">
                    <p className="text-[15px] leading-[1.9] text-gray-300">{reportModel.executiveSummary}</p>
                  </DetailSection>

                  <DetailSection title="Risk Overview">
                    <p className="text-[15px] leading-[1.9] text-gray-300">{reportModel.riskOverview}</p>
                  </DetailSection>
                </div>

                <DetailSection title="Financial and Strategic Context">
                  <div className="grid gap-4 md:grid-cols-3">
                    {reportModel.insights.map((insight) => (
                      <div
                        key={insight.title}
                        className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4"
                      >
                        <p className="text-sm font-semibold text-white">{insight.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-400">{insight.content}</p>
                      </div>
                    ))}
                  </div>
                </DetailSection>

                <DetailSection title="Comparative Analysis">
                  <p className="text-[15px] leading-[1.9] text-gray-300">{reportModel.comparativeAnalysis}</p>
                </DetailSection>

                <DetailSection title="Narrative">
                  <div className="space-y-4">
                    {reportModel.aiNarrative.map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 24)}`} className="text-[15px] leading-[1.9] text-gray-300">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </DetailSection>

                <DetailSection title="Takeaways">
                  <div className="space-y-3">
                    {reportModel.takeaways.map((takeaway) => (
                      <div
                        key={takeaway}
                        className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-gray-300"
                      >
                        {takeaway}
                      </div>
                    ))}
                  </div>
                </DetailSection>
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
