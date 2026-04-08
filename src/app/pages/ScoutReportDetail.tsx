import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BookmarkCheck,
  Brain,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  LoaderCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { getScoutReportById, type ExplainabilityItem, type StoredScoutReport } from "../../services/scoutReports";
import { createReportAnalysis } from "../../services/analysis";

function stringifyBlock(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Nao foi possivel serializar este bloco.";
  }
}

function isRenderableRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRiskTone(value: string) {
  switch (value) {
    case "LOW":
      return {
        badge: "border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.12)] text-[#B6FFD8]",
        panel: "border-[rgba(0,255,156,0.2)] bg-[rgba(0,255,156,0.08)]",
        bar: "#00FF9C",
      };
    case "HIGH":
      return {
        badge: "border-[rgba(255,77,79,0.28)] bg-[rgba(255,77,79,0.14)] text-[#FFB4B5]",
        panel: "border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)]",
        bar: "#FF4D4F",
      };
    default:
      return {
        badge: "border-[rgba(255,184,0,0.28)] bg-[rgba(255,184,0,0.12)] text-[#F8D98B]",
        panel: "border-[rgba(255,184,0,0.2)] bg-[rgba(255,184,0,0.08)]",
        bar: "#FFB800",
      };
  }
}

function formatReadableLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function MetadataCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={
        tone === "accent"
          ? "rounded-[18px] border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.08)] p-4 backdrop-blur-sm"
          : "rounded-[18px] border border-white/8 bg-white/5 p-4 backdrop-blur-sm"
      }
    >
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Section({ title, children, subtitle }: { title: string; children: ReactNode; subtitle?: string }) {
  return (
    <section className="rounded-[22px] border border-white/8 bg-white/5 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-400">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ loading, status }: { loading: boolean; status: "COMPLETED" | "IN_PROGRESS" }) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,184,0,0.2)] bg-[rgba(255,184,0,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#F8D98B]">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        Loading
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,255,156,0.2)] bg-[rgba(0,255,156,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9CFFD1]">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {status === "COMPLETED" ? "Completed" : "In Progress"}
    </div>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

function normalizeExplainability(report: StoredScoutReport | null): ExplainabilityItem[] {
  const value = report?.content.explainability;

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is ExplainabilityItem =>
        isRenderableRecord(item) && typeof item.metric === "string" && typeof item.impact === "string",
    );
  }

  if (isRenderableRecord(value)) {
    const entries = Object.entries(value);

    if ("playerA" in value || "playerB" in value) {
      const items: ExplainabilityItem[] = [];

      for (const [playerKey, node] of entries) {
        if (!isRenderableRecord(node)) {
          continue;
        }

        for (const [bucket, rawSignals] of Object.entries(node)) {
          if (!Array.isArray(rawSignals)) {
            continue;
          }

          const signals = rawSignals.filter((signal): signal is string => typeof signal === "string");
          if (signals.length === 0) {
            continue;
          }

          items.push({
            metric: `${formatReadableLabel(playerKey)} - ${formatReadableLabel(bucket)}`,
            impact: signals.join(". "),
          });
        }
      }

      if (items.length > 0) {
        return items;
      }
    }

    return entries
      .map(([metric, rawImpact]) => {
        if (typeof rawImpact === "string") {
          return { metric: formatReadableLabel(metric), impact: rawImpact };
        }

        if (Array.isArray(rawImpact)) {
          const values = rawImpact.filter((item): item is string => typeof item === "string");
          return values.length > 0 ? { metric: formatReadableLabel(metric), impact: values.join(". ") } : null;
        }

        return isRenderableRecord(rawImpact)
          ? { metric: formatReadableLabel(metric), impact: stringifyBlock(rawImpact) }
          : null;
      })
      .filter((item): item is ExplainabilityItem => Boolean(item));
  }

  return [];
}

function normalizeInsights(report: StoredScoutReport | null) {
  const directInsights = Array.isArray(report?.content.insights)
    ? report.content.insights.filter((item): item is string => typeof item === "string")
    : [];

  if (directInsights.length > 0) {
    return directInsights;
  }

  const reportModelInsights = report?.content.reportModel?.takeaways ?? [];
  if (reportModelInsights.length > 0) {
    return reportModelInsights;
  }

  return [];
}

function getSmartMatchPlayer(report: StoredScoutReport | null) {
  if (!report) {
    return null;
  }

  const winner = report.content.decisionSummary?.winner;
  const players = Array.isArray(report.players) ? report.players : [];
  const fallback = players.find((player) => typeof player.id === "string");

  if (winner === "A" && typeof players[0]?.id === "string") {
    return players[0];
  }

  if (winner === "B" && typeof players[1]?.id === "string") {
    return players[1];
  }

  return fallback ?? null;
}

export default function ScoutReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<StoredScoutReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ msg: string; tone: "success" | "error" } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleSaveToHistory = async () => {
    if (!report || saveLoading) return;
    setSaveLoading(true);
    setSaveFeedback(null);
    try {
      const playerIds = Array.isArray(report.players)
        ? report.players.map((p: any) => String(p.id ?? p)).filter(Boolean)
        : [];
      const persisted = await createReportAnalysis({
        playerIds,
        title: report.title,
        description: report.description ?? undefined,
        analyst: report.analyst ?? undefined,
      });
      setSavedId(persisted.data.id);
      setSaveFeedback({ msg: `Salvo no histórico: "${persisted.data.title}"`, tone: "success" });
    } catch (err) {
      setSaveFeedback({ msg: err instanceof Error ? err.message : "Não foi possível salvar.", tone: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadReport() {
      if (!id) {
        setError("Relatorio nao encontrado.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await getScoutReportById(id);
        if (!active) {
          return;
        }

        setReport(response.data);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setReport(null);
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o relatorio.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, [id]);

  const decisionSummary = useMemo(() => report?.content.decisionSummary ?? null, [report]);
  const reportModel = useMemo(() => report?.content.reportModel ?? null, [report]);
  const generatedInMs = useMemo(() => report?.content.meta?.generatedInMs ?? null, [report]);
  const aiNarrativeParagraphs = useMemo(() => {
    const content = report?.content.aiNarrative ?? "";
    return content.split(/\n{2,}/).filter(Boolean);
  }, [report]);
  const explainabilityItems = useMemo(() => normalizeExplainability(report), [report]);
  const insights = useMemo(() => normalizeInsights(report), [report]);
  const smartMatchPlayer = useMemo(() => getSmartMatchPlayer(report), [report]);
  const riskTone = getRiskTone(decisionSummary?.riskLevel ?? "MEDIUM");

  if (loading) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-[1560px] space-y-6">
              <Skeleton className="h-40 rounded-[28px] bg-white/10" />
              <Skeleton className="h-56 rounded-[28px] bg-white/10" />
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24 rounded-[18px] bg-white/10" />
                <Skeleton className="h-24 rounded-[18px] bg-white/10" />
                <Skeleton className="h-24 rounded-[18px] bg-white/10" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-xl rounded-[22px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] p-8 text-center text-[#FFB4B5]">
              {error ?? "Relatorio indisponivel."}
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
          <div className="mx-auto max-w-[1560px] space-y-6">
            <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
              <Button
                variant="ghost"
                onClick={() => navigate("/reports")}
                className="mb-5 h-10 rounded-[12px] px-0 text-gray-400 hover:bg-transparent hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para reports
              </Button>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">
                <FileText className="h-3.5 w-3.5" />
                ScoutReport Detail
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusPill loading={loading} status={report.status} />
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                  {new Date(report.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-semibold text-white">{report.title}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-400">
                {report.description || "Leitura persistida a partir do motor executivo do SoccerMind."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => void handleSaveToHistory()}
                  disabled={saveLoading || !!savedId}
                  className="h-10 rounded-[12px] border border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.12)] px-5 text-sm font-semibold text-[#B6FFD8] hover:bg-[rgba(0,255,156,0.2)] disabled:opacity-60"
                >
                  {saveLoading ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                  )}
                  {savedId ? "Salvo no Histórico ✓" : "Salvar no Histórico"}
                </Button>
                {savedId && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/analysis/${savedId}`)}
                    className="h-10 rounded-[12px] border border-white/10 px-4 text-xs text-gray-400 hover:text-white"
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Abrir no Histórico
                  </Button>
                )}
              </div>

              {saveFeedback && (
                <div
                  className={`mt-4 rounded-[12px] border px-4 py-3 text-sm ${
                    saveFeedback.tone === "success"
                      ? "border-[rgba(0,255,156,0.2)] bg-[rgba(0,255,156,0.08)] text-[#9CFFD1]"
                      : "border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] text-[#FFB4B5]"
                  }`}
                >
                  {saveFeedback.msg}
                </div>
              )}
            </section>

            {decisionSummary ? (
              <section className={`rounded-[28px] border ${riskTone.panel} p-7 shadow-[0_24px_80px_rgba(0,0,0,0.34)]`}>
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-4xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                      Decision Summary
                    </div>
                    <p className="mt-5 text-[1.1rem] font-bold leading-[1.85] text-white">{decisionSummary.decision}</p>
                  </div>

                  <div className="grid min-w-[320px] gap-3 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
                    <div className="rounded-[18px] border border-white/10 bg-black/10 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-300">Confidence</p>
                        <p className="text-lg font-semibold text-white">{decisionSummary.confidence}%</p>
                      </div>
                      <div className="mt-4">
                        <ScoreBar value={decisionSummary.confidence} color="#00C2FF" />
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-black/10 p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-300">Risk</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${riskTone.badge}`}>
                          {decisionSummary.riskLevel}
                        </span>
                        {generatedInMs ? <span className="text-xs text-gray-300">{generatedInMs} ms</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetadataCard label="Analista" value={report.analyst} />
              <MetadataCard label="Criado em" value={new Date(report.createdAt).toLocaleString("pt-BR")} />
              <MetadataCard label="Status" value={report.status === "COMPLETED" ? "Completed" : "In Progress"} />
              <MetadataCard label="Generation Time" value={generatedInMs ? `${generatedInMs} ms` : "Nao informado"} tone="accent" />
            </div>

            {smartMatchPlayer && typeof smartMatchPlayer.id === "string" ? (
              <div className="rounded-[20px] border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.08)] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#9BE7FF]">Smart Match Integration</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-200">
                      Abrir encaixes recomendados para {String(smartMatchPlayer.name ?? "o jogador selecionado")} usando a decisao atual como ponto de partida.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/smart-match/${smartMatchPlayer.id}`)}
                    className="h-11 rounded-[14px] bg-[#00C2FF]/90 px-5 font-semibold text-[#07142A] hover:bg-[#00C2FF]"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Smart Match
                  </Button>
                </div>
              </div>
            ) : null}

            {explainabilityItems.length > 0 ? (
              <Section title="Explainability" subtitle="Por que o sistema chegou a esta decisao.">
                <div className="grid gap-4 lg:grid-cols-2">
                  {explainabilityItems.map((item, index) => (
                    <div key={`${item.metric}-${index}`} className="rounded-[18px] border border-white/8 bg-[#081625] p-5">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-[#9BE7FF]">{item.metric}</p>
                      <p className="mt-3 text-sm leading-[1.85] text-gray-300">{item.impact}</p>
                    </div>
                  ))}
                </div>
              </Section>
            ) : (
              <Section title="Explainability">
                <pre className="overflow-x-auto rounded-[18px] border border-white/8 bg-[#081625] p-5 text-xs leading-6 text-[#C7D6EA]">
                  {stringifyBlock(report.content.explainability ?? {})}
                </pre>
              </Section>
            )}

            {insights.length > 0 ? (
              <Section title="Insights" subtitle="Leituras curtas para a mesa de decisao.">
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div
                      key={`${index}-${insight.slice(0, 18)}`}
                      className="rounded-[16px] border border-white/8 bg-white/5 px-4 py-3 text-sm leading-[1.8] text-gray-200"
                    >
                      <span className="mr-3 text-[#00C2FF]">•</span>
                      {insight}
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {reportModel ? (
              <>
                <Section title="Metrics">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {reportModel.metrics.map((metric) => (
                      <div key={metric.label} className="rounded-[18px] border border-white/8 bg-white/5 p-5">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{metric.label}</p>
                        <div className="mt-3 grid gap-2 text-sm text-gray-300">
                          <p>A: {String(metric.a)}</p>
                          <p>B: {String(metric.b)}</p>
                          <p className="text-white">Winner: {metric.winner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Player Comparison">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {report.players.map((player) => (
                      <div key={String(player.id ?? player.name)} className="rounded-[18px] border border-white/8 bg-white/5 p-5">
                        <p className="text-lg font-semibold text-white">{String(player.name ?? "Jogador")}</p>
                        <p className="mt-2 text-sm text-gray-400">
                          {[player.position, player.club, player.nationality].filter(Boolean).join(" | ") || "Contexto indisponivel"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-[15px] leading-[1.9] text-gray-300">{reportModel.comparativeAnalysis}</p>
                </Section>
              </>
            ) : (
              <>
                <Section title="Metrics">
                  <pre className="overflow-x-auto rounded-[18px] border border-white/8 bg-[#081625] p-5 text-xs leading-6 text-[#C7D6EA]">
                    {stringifyBlock(report.content.metrics ?? {})}
                  </pre>
                </Section>

                <Section title="Player Context">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {report.players.map((player) => (
                      <div key={String(player.id ?? player.name)} className="rounded-[18px] border border-white/8 bg-white/5 p-5">
                        <p className="text-lg font-semibold text-white">{String(player.name ?? "Jogador")}</p>
                        <p className="mt-2 text-sm text-gray-400">
                          {[player.position, player.club, player.nationality].filter(Boolean).join(" | ") || "Contexto indisponivel"}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {aiNarrativeParagraphs.length > 0 ? (
              <Section title="AI Narrative">
                <div className="rounded-[20px] border border-[rgba(122,92,255,0.18)] bg-[rgba(122,92,255,0.08)] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(122,92,255,0.16)]">
                      <Brain className="h-5 w-5 text-[#D3B9FF]" />
                    </div>
                    <p className="text-sm text-gray-300">Leitura contextualizada gerada com apoio do motor de IA.</p>
                  </div>
                  <div className="space-y-4 text-[15px] leading-[1.9] text-gray-300">
                    {aiNarrativeParagraphs.map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 18)}`}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </Section>
            ) : (
              <Section title="Explainability Notes">
                <div className="flex items-start gap-3 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-white/5 p-5 text-sm text-gray-300">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-[#F8D98B]" />
                  <p>Este ScoutReport nao possui narrativa textual salva, mas as metricas e blocos de explainability permanecem preservados.</p>
                </div>
              </Section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
