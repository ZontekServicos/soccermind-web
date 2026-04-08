import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  AlertTriangle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { TierBadge } from "../components/TierBadge";
import { RiskBadge } from "../components/RiskBadge";
import { CapitalGauge } from "../components/CapitalGauge";
import { useLanguage } from "../contexts/LanguageContext";
import {
  type RiskBucket,
  type StrategicAsset,
  type StrategicAssetTier,
  getDashboardData,
} from "../services/dashboard";
import type { PlayerExtended } from "../types/player";
import { t as translate } from "../../i18n";

type RiskTab = "ALL" | RiskBucket;

const RISK_PAGE_SIZE = 8;

const TIER_ORDER: StrategicAssetTier[] = [
  "Elite Asset",
  "Growth Asset",
  "Stable Asset",
  "Opportunity Asset",
];

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function getAssetTierColor(tier: StrategicAsset["tier"]): string {
  switch (tier) {
    case "Elite Asset": return "#A855F7";
    case "Growth Asset": return "#00C2FF";
    case "Stable Asset": return "#00FF9C";
    case "Opportunity Asset": return "#FBBF24";
  }
}

function getRiskCount(players: PlayerExtended[], bucket: RiskBucket) {
  return players.filter((p) => p.risk.level === bucket).length;
}

function getRiskSectionColor(bucket: RiskBucket) {
  switch (bucket) {
    case "HIGH":   return { text: "#FF8B8D", border: "rgba(255,77,79,0.24)",   bg: "rgba(255,77,79,0.07)" };
    case "MEDIUM": return { text: "#FFD66B", border: "rgba(251,191,36,0.18)",  bg: "rgba(251,191,36,0.06)" };
    case "LOW":    return { text: "#7DFFD0", border: "rgba(0,255,156,0.18)",   bg: "rgba(0,255,156,0.06)" };
  }
}

function getShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name.length > 18 ? `${name.slice(0, 18)}…` : name;
  const compact = `${parts[0]} ${parts[parts.length - 1]}`;
  return compact.length > 18 ? `${compact.slice(0, 18)}…` : compact;
}

function getVisibleRange(total: number, page: number, pageSize: number, currentCount: number) {
  if (total === 0 || currentCount === 0) return "0–0";
  const start = (page - 1) * pageSize + 1;
  return `${start}–${start + currentCount - 1}`;
}

// ---------------------------------------------------------------------------
export default function Dashboard() {
  const { t, language } = useLanguage();

  const [players,              setPlayers]              = useState<PlayerExtended[]>([]);
  const [averageEfficiency,    setAverageEfficiency]    = useState(0);
  const [totalMarketValue,     setTotalMarketValue]     = useState("N/A");
  const [riskCounts,           setRiskCounts]           = useState<Record<RiskBucket, number>>({ LOW: 0, MEDIUM: 0, HIGH: 0 });
  const [topEfficiencyPlayers, setTopEfficiencyPlayers] = useState<PlayerExtended[]>([]);
  const [riskTaggedPlayers,    setRiskTaggedPlayers]    = useState<Array<{ player: PlayerExtended; riskBucket: RiskBucket; explanation: string }>>([]);
  const [strategicAssets,      setStrategicAssets]      = useState<StrategicAsset[]>([]);
  const [error,                setError]                = useState<string | null>(null);
  const [loading,              setLoading]              = useState(true);

  const [riskTab,  setRiskTab]  = useState<RiskTab>("ALL");
  const [riskPage, setRiskPage] = useState(1);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await getDashboardData(80);
        if (!active) return;
        const d = response.data;
        setPlayers(Array.isArray(d.players) ? d.players : []);
        setAverageEfficiency(d.averageEfficiency ?? 0);
        setTotalMarketValue(d.totalMarketValue ?? "N/A");
        setRiskCounts(d.riskCounts ?? { LOW: 0, MEDIUM: 0, HIGH: 0 });
        setTopEfficiencyPlayers(d.topEfficiencyPlayers ?? []);
        setRiskTaggedPlayers(d.riskTaggedPlayers ?? []);
        setStrategicAssets(d.strategicAssets ?? []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setPlayers([]); setAverageEfficiency(0); setTotalMarketValue("N/A");
        setRiskCounts({ LOW: 0, MEDIUM: 0, HIGH: 0 });
        setTopEfficiencyPlayers([]); setRiskTaggedPlayers([]); setStrategicAssets([]);
        setError(err instanceof Error ? err.message : "API request failed");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  // Risk filter
  const filteredRiskPlayers = useMemo(() =>
    riskTab === "ALL" ? riskTaggedPlayers : riskTaggedPlayers.filter((e) => e.riskBucket === riskTab),
    [riskTab, riskTaggedPlayers],
  );
  const riskTotalPages = Math.max(1, Math.ceil(filteredRiskPlayers.length / RISK_PAGE_SIZE));
  const pagedRiskPlayers = useMemo(
    () => paginate(filteredRiskPlayers, riskPage, RISK_PAGE_SIZE),
    [filteredRiskPlayers, riskPage],
  );

  // Portfolio tier breakdown
  const tierDistribution = useMemo(() =>
    TIER_ORDER.map((tier) => {
      const count = strategicAssets.filter((a) => a.tier === tier).length;
      const pct = strategicAssets.length > 0 ? Math.round((count / strategicAssets.length) * 100) : 0;
      const top = strategicAssets.find((a) => a.tier === tier);
      return { tier, count, pct, top, color: getAssetTierColor(tier) };
    }),
    [strategicAssets],
  );

  // Scouting signals
  const topRiskSignal = useMemo(
    () => riskTaggedPlayers.find((e) => e.riskBucket === "HIGH") ?? riskTaggedPlayers.find((e) => e.riskBucket === "MEDIUM"),
    [riskTaggedPlayers],
  );
  const topGrowthAsset = useMemo(
    () => strategicAssets.find((a) => a.tier === "Growth Asset"),
    [strategicAssets],
  );

  // Sync pages
  useEffect(() => setRiskPage(1), [riskTab]);
  useEffect(() => setRiskPage((p) => Math.min(p, riskTotalPages)), [riskTotalPages]);

  return (
    <div className="flex h-screen bg-[var(--background)]" key={language}>
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-[1600px] space-y-10">

            {/* ── Header ── */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">{t("dashboard.title")}</h1>
              <p className="max-w-3xl text-sm leading-7 text-gray-400">{t("dashboard.subtitle")}</p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title={t("dashboard.players_analyzed")}  value={players.length.toString()}   icon={Users}         trend={t("dashboard.baseLoaded")}                                                        trendUp={true}             color="#00C2FF" />
              <MetricCard title={t("dashboard.avg_efficiency")}    value={averageEfficiency.toFixed(1)} icon={Target}        trend={t("dashboard.rankingLimited")}                                                   trendUp={true}             color="#00FF9C" />
              <MetricCard title={t("dashboard.high_risk_players")} value={riskCounts.HIGH.toString()}  icon={AlertTriangle} trend={t("dashboard.safeZone", { count: riskCounts.LOW })}                             trendUp={riskCounts.LOW >= riskCounts.HIGH} color="#FF4D4F" />
              <MetricCard title={t("dashboard.total_market_value")} value={totalMarketValue}           icon={DollarSign}    trend={error ? t("dashboard.apiUnavailable") : t("dashboard.portfolioLoaded")}         trendUp={!error}           color="#7A5CFF" />
            </div>

            {error && (
              <div className="rounded-2xl border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {error}
              </div>
            )}
            {loading && (
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-gray-400">
                {t("dashboard.loading")}
              </div>
            )}

            {/* ── Portfolio Intelligence ── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

              {/* Portfolio Breakdown */}
              <section className="rounded-[20px] bg-[rgba(255,255,255,0.02)] p-7 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                <h2 className="mb-7 flex items-center gap-2.5 text-lg font-semibold">
                  <BarChart2 className="h-5 w-5 text-[#00C2FF]" />
                  Composição do portfólio
                </h2>

                <div className="space-y-5">
                  {tierDistribution.map(({ tier, count, pct, top, color }) => (
                    <div key={tier}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color }}>
                            {tier.replace(" Asset", "")}
                          </span>
                          {top && (
                            <span className="truncate text-[11px] text-gray-500">
                              · {getShortName(top.player.name)}
                            </span>
                          )}
                        </div>
                        <span className="ml-4 flex-shrink-0 text-sm font-semibold text-white">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: color }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-gray-600">{pct}% dos ativos classificados</p>
                    </div>
                  ))}
                </div>

                {/* Market value footer */}
                <div className="mt-7 flex items-center justify-between rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] px-5 py-4">
                  <div>
                    <p className="mb-0.5 text-[10px] uppercase tracking-wider text-gray-500">Valor total monitorado</p>
                    <p className="text-xl font-bold text-[#7A5CFF]">{totalMarketValue}</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 text-[10px] uppercase tracking-wider text-gray-500">Ativos classificados</p>
                    <p className="text-xl font-bold text-white">{strategicAssets.length}</p>
                  </div>
                </div>
              </section>

              {/* Scouting Signals */}
              <section className="rounded-[20px] bg-[rgba(255,255,255,0.02)] p-7 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                <h2 className="mb-7 flex items-center gap-2.5 text-lg font-semibold">
                  <Zap className="h-5 w-5 text-[#FBBF24]" />
                  Sinais de scouting
                </h2>

                <div className="space-y-4">
                  {topEfficiencyPlayers[0] && (
                    <SignalCard
                      label="Alvo prioritário"
                      tag="FECHAR"
                      tagColor="#00FF9C"
                      name={topEfficiencyPlayers[0].name}
                      meta={`${topEfficiencyPlayers[0].position} · ${topEfficiencyPlayers[0].club}`}
                      metric={`Eficiência ${topEfficiencyPlayers[0].capitalEfficiency.toFixed(1)} · Overall ${topEfficiencyPlayers[0].overallRating}`}
                      icon={Target}
                    />
                  )}
                  {topGrowthAsset && (
                    <SignalCard
                      label="Upside identificado"
                      tag="MONITORAR"
                      tagColor="#00C2FF"
                      name={topGrowthAsset.player.name}
                      meta={`${topGrowthAsset.player.position} · ${topGrowthAsset.player.club}`}
                      metric={`Potencial ${topGrowthAsset.player.potential} · Liquidez ${topGrowthAsset.player.liquidity.score.toFixed(1)}`}
                      icon={TrendingUp}
                    />
                  )}
                  {topRiskSignal && (
                    <SignalCard
                      label="Risco elevado"
                      tag="ATENÇÃO"
                      tagColor="#FF4D4F"
                      name={topRiskSignal.player.name}
                      meta={`${topRiskSignal.player.position} · ${topRiskSignal.player.club}`}
                      metric={topRiskSignal.explanation.length > 90 ? `${topRiskSignal.explanation.slice(0, 90)}…` : topRiskSignal.explanation}
                      icon={AlertTriangle}
                    />
                  )}

                  {/* Top Efficiency mini-list */}
                  {topEfficiencyPlayers.length > 0 && (
                    <div className="mt-2 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-5 py-4">
                      <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#00FF9C]" />
                        Top eficiência de capital
                      </p>
                      <div className="space-y-3">
                        {topEfficiencyPlayers.slice(0, 3).map((player, i) => (
                          <div key={player.id ?? player.name} className="flex items-center gap-3">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.07)] text-[10px] font-semibold text-gray-400">
                              {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">{player.name}</p>
                              <p className="text-[11px] text-gray-500">{player.position} · {player.club}</p>
                            </div>
                            <div className="flex-shrink-0">
                              <CapitalGauge value={player.capitalEfficiency} size="xs" showLabel={false} />
                            </div>
                            <TierBadge tier={player.tier} className="!px-2 !py-0.5 !text-[9px]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ── Risk Overview ── */}
            <section className="rounded-[20px] bg-[rgba(255,255,255,0.02)] p-7 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
              <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1.5">
                  <h2 className="flex items-center gap-2.5 text-lg font-semibold">
                    <AlertTriangle className="h-5 w-5 text-[#FF4D4F]" />
                    {t("dashboard.riskOverviewTitle")}
                  </h2>
                  <p className="text-sm text-gray-400">{t("dashboard.riskOverviewSubtitle")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["ALL", "LOW", "MEDIUM", "HIGH"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setRiskTab(tab)}
                      className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${
                        riskTab === tab
                          ? "border-[rgba(0,194,255,0.32)] bg-[rgba(0,194,255,0.1)] text-[#9BE7FF]"
                          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {tab === "ALL" ? `${t("dashboard.riskTabAll")} (${riskTaggedPlayers.length})` : `${tab} (${riskCounts[tab]})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk summary cards */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <RiskSummaryCard bucket="LOW"    count={riskCounts.LOW}    label={t("dashboard.riskLowLabel")}    detail={t("dashboard.riskLowDetail")} />
                <RiskSummaryCard bucket="MEDIUM" count={riskCounts.MEDIUM} label={t("dashboard.riskMediumLabel")} detail={t("dashboard.riskMediumDetail")} />
                <RiskSummaryCard bucket="HIGH"   count={riskCounts.HIGH}   label={t("dashboard.riskHighLabel")}   detail={t("dashboard.riskHighDetail")} />
              </div>

              <div className="space-y-3">
                {pagedRiskPlayers.length === 0
                  ? <EmptyState message={t("dashboard.riskEmpty")} />
                  : pagedRiskPlayers.map(({ player, riskBucket, explanation }) => (
                    <RiskDecisionCard key={player.id} player={player} riskBucket={riskBucket} explanation={explanation} />
                  ))
                }
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  {t("dashboard.riskShowing", {
                    range: getVisibleRange(filteredRiskPlayers.length, riskPage, RISK_PAGE_SIZE, pagedRiskPlayers.length),
                    total: filteredRiskPlayers.length,
                  })}
                </p>
                <PaginationControls page={riskPage} totalPages={riskTotalPages} onPageChange={setRiskPage} />
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MetricCardProps {
  title: string;
  value: string;
  icon: ElementType;
  trend: string;
  trendUp: boolean;
  color: string;
}
function MetricCard({ title, value, icon: Icon, trend, trendUp, color }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-[rgba(255,255,255,0.02)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(0,0,0,0.38)]">
      <div className="absolute right-0 top-0 h-28 w-28 blur-3xl opacity-[0.09]" style={{ background: color }} />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</h3>
          <Icon className="h-4 w-4 flex-shrink-0" style={{ color }} />
        </div>
        <p className="mb-2.5 text-3xl font-bold leading-none" style={{ color }}>{value}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          {trendUp
            ? <TrendingUp className="h-3 w-3 text-[#00FF9C]" />
            : <TrendingDown className="h-3 w-3 text-[#FF4D4F]" />}
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

function SignalCard({
  label, tag, tagColor, name, meta, metric, icon: Icon,
}: {
  label: string; tag: string; tagColor: string;
  name: string; meta: string; metric: string;
  icon: ElementType;
}) {
  return (
    <div className="flex items-start gap-4 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3.5 transition-all hover:bg-[rgba(255,255,255,0.05)]">
      <div
        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: `${tagColor}18`, border: `1px solid ${tagColor}30` }}
      >
        <Icon className="h-4 w-4" style={{ color: tagColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</span>
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: `${tagColor}18`, color: tagColor }}
          >
            {tag}
          </span>
        </div>
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        <p className="truncate text-[11px] text-gray-500">{meta}</p>
        <p className="mt-1 truncate text-[11px] text-gray-400">{metric}</p>
      </div>
    </div>
  );
}

function RiskSummaryCard({ bucket, count, label, detail }: { bucket: RiskBucket; count: number; label: string; detail: string }) {
  const p = getRiskSectionColor(bucket);
  return (
    <div className="rounded-[16px] border p-5" style={{ borderColor: p.border, background: p.bg }}>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: p.text }}>{label}</p>
      <div className="mb-2 text-3xl font-bold text-white">{count}</div>
      <p className="text-sm leading-6 text-gray-400">{detail}</p>
    </div>
  );
}

function RiskDecisionCard({ player, riskBucket, explanation }: { player: PlayerExtended; riskBucket: RiskBucket; explanation: string }) {
  const p = getRiskSectionColor(riskBucket);
  return (
    <div className="rounded-[16px] border px-5 py-4 transition-all duration-200" style={{ borderColor: p.border, background: p.bg }}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h4 className="text-base font-semibold text-white">{player.name}</h4>
            <RiskBadge level={riskBucket} />
          </div>
          <p className="text-xs text-gray-500">
            {player.position} · {player.club} · Overall {player.overallRating} · Potential {player.potential}
          </p>
          <p className="text-sm leading-6 text-gray-300">{explanation}</p>
        </div>
        <div className="grid grid-cols-4 gap-3 xl:flex-shrink-0">
          <RiskMetric label={translate("dashboard.structuralRisk")} value={player.structuralRisk.score.toFixed(1)} />
          <RiskMetric label={translate("dashboard.financialRisk")}  value={player.financialRisk.index.toFixed(1)} />
          <RiskMetric label={translate("dashboard.liquidity")}       value={player.liquidity.score.toFixed(1)} />
          <RiskMetric label={translate("dashboard.compositeRisk")}   value={player.risk.score.toFixed(1)} />
        </div>
      </div>
    </div>
  );
}

function RiskMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-[rgba(255,255,255,0.03)] px-3 py-2.5 text-right">
      <p className="mb-1 text-[9px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}


function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-2 rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-5 py-6 text-sm text-gray-400">
      {message}
    </div>
  );
}

function PaginationControls({ page, totalPages, onPageChange, compact = false }: {
  page: number; totalPages: number; onPageChange: (p: number) => void; compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-300 transition-all hover:border-[rgba(255,255,255,0.18)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className={`text-gray-400 ${compact ? "text-xs" : "text-sm"}`}>
        {translate("dashboard.pageLabel", { page, totalPages })}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-300 transition-all hover:border-[rgba(255,255,255,0.18)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
