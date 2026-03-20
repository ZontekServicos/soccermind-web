import { useEffect, useMemo, useState, type ElementType } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { TierBadge } from "../components/TierBadge";
import { RiskBadge } from "../components/RiskBadge";
import { CapitalGauge } from "../components/CapitalGauge";
import { useLanguage } from "../contexts/LanguageContext";
import { type ChartDatum, type RiskBucket, type StrategicAsset, type StrategicAssetTier, getDashboardData } from "../services/dashboard";
import type { PlayerExtended } from "../types/player";

type RiskTab = "ALL" | RiskBucket;

const CHART_PAGE_SIZE = 10;
const RISK_PAGE_SIZE = 10;
const ASSET_PAGE_SIZE = 4;

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function getAssetTierColor(tier: StrategicAsset["tier"]) {
  switch (tier) {
    case "Elite Asset":
      return "#A855F7";
    case "Growth Asset":
      return "#00C2FF";
    case "Stable Asset":
      return "#00FF9C";
    case "Opportunity Asset":
      return "#FBBF24";
  }
}

function getRiskCount(players: PlayerExtended[], bucket: RiskBucket) {
  return players.filter((player) => player.risk.level === bucket).length;
}

function getRiskSectionColor(bucket: RiskBucket) {
  switch (bucket) {
    case "HIGH":
      return {
        text: "#FF8B8D",
        border: "rgba(255,77,79,0.24)",
        background: "rgba(255,77,79,0.07)",
      };
    case "MEDIUM":
      return {
        text: "#FFD66B",
        border: "rgba(251,191,36,0.18)",
        background: "rgba(251,191,36,0.06)",
      };
    case "LOW":
      return {
        text: "#7DFFD0",
        border: "rgba(0,255,156,0.18)",
        background: "rgba(0,255,156,0.06)",
      };
  }
}

function getVisibleRange(total: number, page: number, pageSize: number, currentCount: number) {
  if (total === 0 || currentCount === 0) {
    return "0-0";
  }

  const start = (page - 1) * pageSize + 1;
  const end = start + currentCount - 1;
  return `${start}-${end}`;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const [players, setPlayers] = useState<PlayerExtended[]>([]);
  const [averageEfficiency, setAverageEfficiency] = useState(0);
  const [totalMarketValue, setTotalMarketValue] = useState("N/A");
  const [riskCounts, setRiskCounts] = useState<Record<RiskBucket, number>>({ LOW: 0, MEDIUM: 0, HIGH: 0 });
  const [topEfficiencyPlayers, setTopEfficiencyPlayers] = useState<PlayerExtended[]>([]);
  const [efficiencyChartData, setEfficiencyChartData] = useState<ChartDatum[]>([]);
  const [ratingChartData, setRatingChartData] = useState<ChartDatum[]>([]);
  const [riskTaggedPlayers, setRiskTaggedPlayers] = useState<Array<{ player: PlayerExtended; riskBucket: RiskBucket; explanation: string }>>([]);
  const [strategicAssets, setStrategicAssets] = useState<StrategicAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [efficiencyPage, setEfficiencyPage] = useState(1);
  const [ratingPage, setRatingPage] = useState(1);
  const [riskPage, setRiskPage] = useState(1);
  const [assetPage, setAssetPage] = useState(1);
  const [riskTab, setRiskTab] = useState<RiskTab>("ALL");

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      try {
        const response = await getDashboardData(80);
        if (!active) {
          return;
        }

        const dashboardData = response.data;

        setPlayers(Array.isArray(dashboardData.players) ? dashboardData.players : []);
        setAverageEfficiency(dashboardData.averageEfficiency ?? 0);
        setTotalMarketValue(dashboardData.totalMarketValue ?? "N/A");
        setRiskCounts(dashboardData.riskCounts ?? { LOW: 0, MEDIUM: 0, HIGH: 0 });
        setTopEfficiencyPlayers(dashboardData.topEfficiencyPlayers ?? []);
        setEfficiencyChartData(dashboardData.efficiencyChartData ?? []);
        setRatingChartData(dashboardData.ratingChartData ?? []);
        setRiskTaggedPlayers(dashboardData.riskTaggedPlayers ?? []);
        setStrategicAssets(dashboardData.strategicAssets ?? []);
        setError(null);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        setPlayers([]);
        setAverageEfficiency(0);
        setTotalMarketValue("N/A");
        setRiskCounts({ LOW: 0, MEDIUM: 0, HIGH: 0 });
        setTopEfficiencyPlayers([]);
        setEfficiencyChartData([]);
        setRatingChartData([]);
        setRiskTaggedPlayers([]);
        setStrategicAssets([]);
        setError(fetchError instanceof Error ? fetchError.message : "API request failed");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPlayers();

    return () => {
      active = false;
    };
  }, []);

  const efficiencyTotalPages = Math.max(1, Math.ceil(efficiencyChartData.length / CHART_PAGE_SIZE));
  const ratingTotalPages = Math.max(1, Math.ceil(ratingChartData.length / CHART_PAGE_SIZE));

  const pagedEfficiencyData = useMemo(
    () => paginate(efficiencyChartData, efficiencyPage, CHART_PAGE_SIZE),
    [efficiencyChartData, efficiencyPage],
  );

  const pagedRatingData = useMemo(
    () => paginate(ratingChartData, ratingPage, CHART_PAGE_SIZE),
    [ratingChartData, ratingPage],
  );

  const filteredRiskPlayers = useMemo(() => {
    if (riskTab === "ALL") {
      return riskTaggedPlayers;
    }

    return riskTaggedPlayers.filter((entry) => entry.riskBucket === riskTab);
  }, [riskTab, riskTaggedPlayers]);

  const riskTotalPages = Math.max(1, Math.ceil(filteredRiskPlayers.length / RISK_PAGE_SIZE));

  const pagedRiskPlayers = useMemo(
    () => paginate(filteredRiskPlayers, riskPage, RISK_PAGE_SIZE),
    [filteredRiskPlayers, riskPage],
  );
  const assetTotalPages = Math.max(1, Math.ceil(strategicAssets.length / ASSET_PAGE_SIZE));

  const pagedAssets = useMemo(
    () => paginate(strategicAssets, assetPage, ASSET_PAGE_SIZE),
    [strategicAssets, assetPage],
  );

  useEffect(() => {
    setRiskPage(1);
  }, [riskTab]);

  useEffect(() => {
    setEfficiencyPage((current) => Math.min(current, efficiencyTotalPages));
  }, [efficiencyTotalPages]);

  useEffect(() => {
    setRatingPage((current) => Math.min(current, ratingTotalPages));
  }, [ratingTotalPages]);

  useEffect(() => {
    setRiskPage((current) => Math.min(current, riskTotalPages));
  }, [riskTotalPages]);

  useEffect(() => {
    setAssetPage((current) => Math.min(current, assetTotalPages));
  }, [assetTotalPages]);

  return (
    <div className="flex h-screen bg-[var(--background)]" key={language}>
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-[1600px] space-y-12">
            <div className="space-y-3">
              <h1 className="text-4xl">{t("dashboard.title")}</h1>
              <p className="max-w-4xl text-base leading-7 text-gray-400">
                Painel executivo desenhado para leitura rapida de valor esportivo, risco de investimento e prioridade de ativos no elenco.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title={t("dashboard.players_analyzed")}
                value={players.length.toString()}
                icon={Users}
                trend={`Base carregada para analise`}
                trendUp={true}
                color="#00C2FF"
              />
              <MetricCard
                title={t("dashboard.avg_efficiency")}
                value={averageEfficiency.toFixed(1)}
                icon={Target}
                trend={`Ranking limitado aos 20 mais relevantes`}
                trendUp={true}
                color="#00FF9C"
              />
              <MetricCard
                title={t("dashboard.high_risk_players")}
                value={riskCounts.HIGH.toString()}
                icon={AlertTriangle}
                trend={`${riskCounts.LOW} ativos em zona segura`}
                trendUp={riskCounts.LOW >= riskCounts.HIGH}
                color="#FF4D4F"
              />
              <MetricCard
                title={t("dashboard.total_market_value")}
                value={totalMarketValue}
                icon={DollarSign}
                trend={error ? "API indisponivel" : "Carteira atual carregada"}
                trendUp={!error}
                color="#7A5CFF"
              />
            </div>

            {error && (
              <div className="rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {error}
              </div>
            )}

            {loading && (
              <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-gray-400">
                Carregando dashboard...
              </div>
            )}

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <ChartCard
                title="Capital Efficiency Ranking"
                icon={Target}
                iconColor="#00C2FF"
                subtitle="Mostra os jogadores com melhor relacao entre desempenho e custo de investimento."
                summary="Valores mais altos indicam melhor retorno esportivo por capital alocado."
                data={pagedEfficiencyData}
                page={efficiencyPage}
                totalPages={efficiencyTotalPages}
                totalItems={efficiencyChartData.length}
                onPageChange={setEfficiencyPage}
                barColor="#00C2FF"
                domain={[0, 10]}
              />

              <ChartCard
                title="Overall Rating Ranking"
                icon={TrendingUp}
                iconColor="#7A5CFF"
                subtitle="Mostra os jogadores com maior nivel tecnico geral no elenco analisado."
                summary="Representa qualidade esportiva pura, sem considerar custo de mercado."
                data={pagedRatingData}
                page={ratingPage}
                totalPages={ratingTotalPages}
                totalItems={ratingChartData.length}
                onPageChange={setRatingPage}
                barColor="#7A5CFF"
                domain={[60, 99]}
              />
            </div>

            <section className="rounded-[20px] bg-[rgba(255,255,255,0.02)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
              <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <h2 className="flex items-center gap-3 text-2xl font-semibold">
                    <ShieldCheck className="h-6 w-6 text-[#00FF9C]" />
                    Top Capital Efficiency
                  </h2>
                  <p className="max-w-3xl text-sm leading-6 text-gray-400">
                    Bloco de destaque com leitura direta dos perfis mais eficientes para scouting, investimento e composicao de curto prazo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {topEfficiencyPlayers.map((player, index) => (
                  <div
                    key={player.id || `${player.name}-${index}`}
                    className={`relative rounded-[18px] bg-[rgba(255,255,255,0.03)] p-7 transition-all duration-200 ${
                      index === 0
                        ? "shadow-[0_0_20px_rgba(0,255,156,0.08)] hover:shadow-[0_0_24px_rgba(0,255,156,0.12)]"
                        : "shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
                    }`}
                  >
                    <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-xs font-semibold text-gray-300">
                      #{index + 1}
                    </div>

                    <div className="mb-6 pr-10">
                      <h3 className="mb-2 truncate text-base font-semibold text-gray-100">{player.name}</h3>
                      <p className="mb-4 truncate text-xs text-gray-500">
                        {player.position} - {player.club}
                      </p>
                      <div className="inline-block">
                        <TierBadge tier={player.tier} className="!px-3 !py-1 !text-xs !shadow-[0_0_12px_rgba(122,92,255,0.35)]" />
                      </div>
                    </div>

                    <div className="flex items-center justify-center pt-2">
                      <CapitalGauge value={player.capitalEfficiency} size="xs" showLabel={true} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[20px] bg-[rgba(255,255,255,0.02)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
              <div className="mb-8 flex flex-col gap-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <h2 className="flex items-center gap-3 text-2xl font-semibold">
                      <AlertTriangle className="h-6 w-6 text-[#FF4D4F]" />
                      Visao Geral de Risco
                    </h2>
                    <p className="max-w-3xl text-sm leading-6 text-gray-400">
                      Classificacao baseada em risco estrutural e financeiro para separar quem pede aceleracao, monitoramento ou prudencia.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(["ALL", "LOW", "MEDIUM", "HIGH"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setRiskTab(tab)}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${
                          riskTab === tab
                            ? "border-[rgba(0,194,255,0.32)] bg-[rgba(0,194,255,0.12)] text-[#9BE7FF]"
                            : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {tab === "ALL" ? `All (${riskTaggedPlayers.length})` : `${tab} (${riskCounts[tab]})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <RiskSummaryCard bucket="LOW" count={riskCounts.LOW} label="Baixo risco" detail="Perfis com melhor equilibrio para decisao imediata." />
                  <RiskSummaryCard bucket="MEDIUM" count={riskCounts.MEDIUM} label="Risco medio" detail="Demandam acompanhamento e contexto de encaixe." />
                  <RiskSummaryCard bucket="HIGH" count={riskCounts.HIGH} label="Alto risco" detail="Precisam de maior diligencia esportiva e financeira." />
                </div>
              </div>

              <div className="space-y-4">
                {pagedRiskPlayers.length === 0 ? (
                  <EmptyState message="Nenhum atleta encontrado neste filtro de risco." />
                ) : (
                  pagedRiskPlayers.map(({ player, riskBucket, explanation }) => (
                    <RiskDecisionCard key={player.id} player={player} riskBucket={riskBucket} explanation={explanation} />
                  ))
                )}
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  Mostrando {getVisibleRange(filteredRiskPlayers.length, riskPage, RISK_PAGE_SIZE, pagedRiskPlayers.length)} de {filteredRiskPlayers.length} atletas neste recorte.
                </p>
                <PaginationControls page={riskPage} totalPages={riskTotalPages} onPageChange={setRiskPage} />
              </div>
            </section>

            <section className="rounded-[20px] bg-[rgba(255,255,255,0.02)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
              <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <h2 className="flex items-center gap-3 text-2xl font-semibold">
                    <DollarSign className="h-6 w-6 text-[#7A5CFF]" />
                    Ativos Estrategicos
                  </h2>
                  <p className="max-w-3xl text-sm leading-6 text-gray-400">
                    Tiers redesenhados para diferenciar impacto imediato, upside, estabilidade e oportunidade de mercado com base em idade, overall, potencial, liquidez e valor.
                  </p>
                </div>

                <PaginationControls page={assetPage} totalPages={assetTotalPages} onPageChange={setAssetPage} />
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
                <TierInsightCard tier="Elite Asset" detail="Premium assets para impacto esportivo direto e liquidez alta." />
                <TierInsightCard tier="Growth Asset" detail="Jogadores jovens com trajetoria de valorizacao e desenvolvimento." />
                <TierInsightCard tier="Stable Asset" detail="Perfis confiaveis para manter consistencia competitiva." />
                <TierInsightCard tier="Opportunity Asset" detail="Leituras de mercado favoraveis para capturar valor." />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {pagedAssets.length === 0 ? (
                  <EmptyState message="Nenhum ativo estrategico identificado no recorte atual." />
                ) : (
                  pagedAssets.map((asset) => <StrategicAssetCard key={`${asset.player.id}-${asset.tier}`} asset={asset} />)
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

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
    <div className="relative overflow-hidden rounded-[20px] bg-[rgba(255,255,255,0.02)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-32 w-32 blur-3xl opacity-10" style={{ background: color }} />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</h3>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <p className="mb-2 text-3xl font-bold" style={{ color }}>
          {value}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {trendUp ? <TrendingUp className="h-3 w-3 text-[#00FF9C]" /> : <TrendingDown className="h-3 w-3 text-[#FF4D4F]" />}
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  summary,
  icon: Icon,
  iconColor,
  data,
  page,
  totalPages,
  totalItems,
  onPageChange,
  barColor,
  domain,
}: {
  title: string;
  subtitle: string;
  summary: string;
  icon: ElementType;
  iconColor: string;
  data: ChartDatum[];
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  barColor: string;
  domain: [number, number];
}) {
  return (
    <section className="rounded-[20px] bg-[rgba(255,255,255,0.02)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h2 className="flex items-center gap-3 text-2xl font-semibold">
            <Icon className="h-6 w-6" style={{ color: iconColor }} />
            {title}
          </h2>
          <p className="text-sm text-gray-400">{subtitle}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{summary}</p>
        </div>
        <PaginationControls page={page} totalPages={totalPages} onPageChange={onPageChange} compact />
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
        <span>Somente nomes e metricas relevantes no tooltip</span>
        <span>{totalItems} atletas no ranking visivel</span>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }} barCategoryGap={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
          <XAxis type="number" stroke="rgba(148,163,184,0.6)" domain={domain} style={{ fontSize: "12px" }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="shortName"
            width={110}
            stroke="rgba(148,163,184,0.72)"
            style={{ fontSize: "12px" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              backgroundColor: "rgba(10,27,53,0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.38)",
            }}
            formatter={(value: number, _name: string, props: { payload?: ChartDatum }) => [
              `${props.payload?.name ?? ""} - ${props.payload?.metricLabel ?? ""}: ${Number(value).toFixed(1)}`,
              "",
            ]}
            labelFormatter={() => ""}
          />
          <Bar dataKey="value" fill={barColor} radius={[0, 10, 10, 0]} maxBarSize={18}>
            {data.map((entry) => (
              <Cell key={`${entry.name}-${entry.metricLabel}`} fill={entry.accent} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

function RiskSummaryCard({
  bucket,
  count,
  label,
  detail,
}: {
  bucket: RiskBucket;
  count: number;
  label: string;
  detail: string;
}) {
  const palette = getRiskSectionColor(bucket);

  return (
    <div
      className="rounded-[18px] border p-5"
      style={{
        borderColor: palette.border,
        background: palette.background,
      }}
    >
      <p className="mb-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: palette.text }}>
        {label}
      </p>
      <div className="mb-2 text-3xl font-semibold text-white">{count}</div>
      <p className="text-sm leading-6 text-gray-400">{detail}</p>
    </div>
  );
}

function RiskDecisionCard({
  player,
  riskBucket,
  explanation,
}: {
  player: PlayerExtended;
  riskBucket: RiskBucket;
  explanation: string;
}) {
  const palette = getRiskSectionColor(riskBucket);
  const compositeRisk = player.risk.score;

  return (
    <div
      className="rounded-[18px] border p-5 transition-all duration-200"
      style={{
        borderColor: palette.border,
        background: palette.background,
      }}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-semibold text-white">{player.name}</h4>
            <RiskBadge level={riskBucket} />
          </div>
          <p className="text-sm text-gray-400">
            {player.position} - {player.club} - Overall {player.overallRating} - Potential {player.potential}
          </p>
          <p className="text-sm leading-6 text-gray-300">{explanation}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <RiskMetric label="Structural Risk" value={player.structuralRisk.score.toFixed(1)} />
          <RiskMetric label="Financial Risk" value={player.financialRisk.index.toFixed(1)} />
          <RiskMetric label="Liquidity" value={player.liquidity.score.toFixed(1)} />
          <RiskMetric label="Composite Risk" value={compositeRisk.toFixed(1)} />
        </div>
      </div>
    </div>
  );
}

function RiskMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-right">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function TierInsightCard({ tier, detail }: { tier: StrategicAssetTier; detail: string }) {
  const color = getAssetTierColor(tier);

  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color }}>
        {tier}
      </p>
      <p className="text-sm leading-6 text-gray-400">{detail}</p>
    </div>
  );
}

function StrategicAssetCard({ asset }: { asset: StrategicAsset }) {
  const { player, tier, description, summary, marketValueLabel, liquidityLabel, potentialLabel, outlookLabel } = asset;
  const color = getAssetTierColor(tier);

  return (
    <div className="rounded-[18px] bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-white">{player.name}</h3>
            <TierBadge tier={player.tier} className="!px-3 !py-1 !text-xs" />
          </div>
          <p className="text-sm text-gray-400">
            {player.position} - {player.club}
          </p>
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color }}>
            {summary}
          </p>
        </div>
        <div
          className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color, borderColor: `${color}66`, background: `${color}14` }}
        >
          {tier}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4">
        <AssetMetric label="Market Value" value={marketValueLabel} />
        <AssetMetric label="Liquidity Score" value={liquidityLabel} highlight="#00FF9C" />
        <AssetMetric label="Resale Window" value={player.liquidity.resaleWindow} />
        <AssetMetric label="Potential" value={potentialLabel} highlight="#00C2FF" />
      </div>

      <p className="mb-4 text-sm leading-7 text-gray-300">{description}</p>
      <p className="rounded-[14px] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-6 text-gray-400">
        {outlookLabel}
      </p>
    </div>
  );
}

function AssetMetric({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-sm font-semibold" style={{ color: highlight ?? "#FFFFFF" }}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-5 py-6 text-sm text-gray-400">
      {message}
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
  compact = false,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-300 transition-all hover:border-[rgba(255,255,255,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className={`text-gray-400 ${compact ? "text-xs" : "text-sm"}`}>
        Pagina {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-300 transition-all hover:border-[rgba(255,255,255,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
