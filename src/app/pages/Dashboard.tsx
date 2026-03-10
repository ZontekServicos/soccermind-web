import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Users } from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { TierBadge } from "../components/TierBadge";
import { RiskBadge } from "../components/RiskBadge";
import { CapitalGauge } from "../components/CapitalGauge";
import { useLanguage } from "../contexts/LanguageContext";
import { getPlayers } from "../services/players";
import { mapApiPlayerToExtended } from "../mappers/player.mapper";
import type { PlayerExtended } from "../types/player";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const [players, setPlayers] = useState<PlayerExtended[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      try {
        const response = await getPlayers(1, 100);
        if (!active) {
          return;
        }

        setPlayers(
          Array.isArray(response.data)
            ? response.data.map((player) => mapApiPlayerToExtended(player as Record<string, unknown>))
            : [],
        );
        setError(null);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        setPlayers([]);
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

  const highRiskPlayers = players.filter((player) => player.riskLevel === "HIGH");
  const topEfficiencyPlayers = [...players].sort((a, b) => b.capitalEfficiency - a.capitalEfficiency).slice(0, 3);
  const averageEfficiency = players.length
    ? players.reduce((sum, player) => sum + player.capitalEfficiency, 0) / players.length
    : 0;
  const totalMarketValue = useMemo(() => {
    const total = players.reduce((sum, player) => {
      const normalized = player.marketValue.replace(/[^0-9.,MKmk]/g, "").replace(",", ".");
      const parsed = Number.parseFloat(normalized);
      if (!Number.isFinite(parsed)) {
        return sum;
      }

      if (/[Kk]$/.test(normalized)) {
        return sum + parsed / 1000;
      }

      return sum + parsed;
    }, 0);

    return total > 0 ? `€ ${total.toFixed(1)}M` : "N/A";
  }, [players]);

  const efficiencyChartData = useMemo(
    () =>
      players.map((player, index) => {
        const shortName = `${player.name.split(" ")[0]} ${player.name.split(" ")[1]?.[0] || ""}.`.trim();
        return {
          name: shortName,
          uniqueKey: player.id || `${player.name}-${index}`,
          fullName: player.name,
          efficiency: player.capitalEfficiency,
        };
      }),
    [players],
  );

  const ratingChartData = useMemo(
    () =>
      players.map((player, index) => {
        const shortName = `${player.name.split(" ")[0]} ${player.name.split(" ")[1]?.[0] || ""}.`.trim();
        return {
          name: shortName,
          uniqueKey: player.id || `${player.name}-${index}`,
          fullName: player.name,
          rating: player.overallRating,
        };
      }),
    [players],
  );

  return (
    <div className="flex h-screen bg-[var(--background)]" key={language}>
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto space-y-8">
            <div className="mb-10">
              <h1 className="text-4xl mb-2">{t("dashboard.title")}</h1>
              <p className="text-gray-400">{t("dashboard.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              <MetricCard
                title={t("dashboard.players_analyzed")}
                value={players.length.toString()}
                icon={Users}
                trend={`+2 ${t("dashboard.this_month")}`}
                trendUp={true}
                color="#00C2FF"
              />
              <MetricCard
                title={t("dashboard.avg_efficiency")}
                value={averageEfficiency.toFixed(1)}
                icon={Target}
                trend={`+0.3 ${t("dashboard.vs_last_month")}`}
                trendUp={true}
                color="#00FF9C"
              />
              <MetricCard
                title={t("dashboard.high_risk_players")}
                value={highRiskPlayers.length.toString()}
                icon={AlertTriangle}
                trend={t("dashboard.attention_needed")}
                trendUp={false}
                color="#FF4D4F"
              />
              <MetricCard
                title={t("dashboard.total_market_value")}
                value={totalMarketValue}
                icon={DollarSign}
                trend={error ? "API unavailable" : `Live ${t("dashboard.this_year")}`}
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <Target className="w-6 h-6 text-[#00C2FF]" />
                  Capital Efficiency por Jogador
                </h2>
                <ResponsiveContainer width="100%" height={300} key="efficiency-chart-container">
                  <BarChart data={efficiencyChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="uniqueKey"
                      stroke="rgba(148,163,184,0.6)"
                      style={{ fontSize: "12px" }}
                      tickFormatter={(_, index) => efficiencyChartData[index]?.name || ""}
                      interval={0}
                    />
                    <YAxis stroke="rgba(148,163,184,0.6)" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10,27,53,0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                      }}
                      formatter={(value: number, name: string, props: { payload?: { fullName?: string } }) => {
                        return [value, props.payload?.fullName || name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "13px" }} />
                    <Bar dataKey="efficiency" fill="#00C2FF" name="Capital Efficiency" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-[#7A5CFF]" />
                  Overall Rating por Jogador
                </h2>
                <ResponsiveContainer width="100%" height={300} key="rating-chart-container">
                  <BarChart data={ratingChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="uniqueKey"
                      stroke="rgba(148,163,184,0.6)"
                      style={{ fontSize: "12px" }}
                      tickFormatter={(_, index) => ratingChartData[index]?.name || ""}
                      interval={0}
                    />
                    <YAxis stroke="rgba(148,163,184,0.6)" domain={[70, 90]} style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10,27,53,0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                      }}
                      formatter={(value: number, name: string, props: { payload?: { fullName?: string } }) => {
                        return [value, props.payload?.fullName || name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "13px" }} />
                    <Bar dataKey="rating" fill="#7A5CFF" name="Overall Rating" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
                <Target className="w-6 h-6 text-[#00FF9C]" />
                Top Capital Efficiency
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {topEfficiencyPlayers.map((player, index) => (
                  <div
                    key={player.id || `${player.name}-${index}`}
                    className={`bg-[rgba(255,255,255,0.03)] rounded-[18px] p-7 relative transition-all duration-200 ${
                      index === 0
                        ? "shadow-[0_0_20px_rgba(0,255,156,0.08)] hover:shadow-[0_0_24px_rgba(0,255,156,0.12)]"
                        : "shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:-translate-y-1"
                    }`}
                  >
                    <div
                      className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        index === 0
                          ? "bg-[#00FF9C] text-[#07142A] text-sm shadow-[0_0_12px_rgba(0,255,156,0.3)]"
                          : "bg-[rgba(255,255,255,0.08)] text-gray-400 text-xs"
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="mb-6 pr-10">
                      <h3 className="text-base font-semibold mb-2 truncate text-gray-100">{player.name}</h3>
                      <p className="text-xs text-gray-500 mb-4 truncate">
                        {player.position} • {player.club}
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
            </div>

            <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-[#FF4D4F]" />
                Visão Geral de Risco
              </h2>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.id || `${player.name}-${index}`}
                    className={`flex items-center justify-between p-5 bg-[rgba(255,255,255,0.03)] rounded-[18px] transition-all duration-200 ${
                      player.riskLevel === "HIGH"
                        ? "shadow-[0_0_20px_rgba(255,77,79,0.12)] hover:shadow-[0_0_28px_rgba(255,77,79,0.2)]"
                        : "shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="text-lg font-semibold">{player.name}</h4>
                        <p className="text-sm text-gray-400">
                          {player.position} • Overall {player.overallRating}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Structural Risk</p>
                        <p className="text-lg font-semibold">{player.structuralRisk.score.toFixed(1)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Financial Risk</p>
                        <p className="text-lg font-semibold">{player.financialRisk.index.toFixed(1)}</p>
                      </div>
                      <RiskBadge level={player.riskLevel} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-[#7A5CFF]" />
                Ativos Estratégicos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {players
                  .filter((player) => player.liquidity.score >= 8.5)
                  .map((player, index) => (
                    <div
                      key={player.id || `${player.name}-${index}`}
                      className="bg-[rgba(255,255,255,0.03)] rounded-[18px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{player.name}</h3>
                          <p className="text-sm text-gray-400 mb-1">{player.position}</p>
                          <p className="text-xs text-gray-500">{player.marketValue}</p>
                        </div>
                        <TierBadge tier={player.tier} />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400 uppercase tracking-wider">Liquidity Score</span>
                          <span className="text-sm font-semibold text-[#00FF9C]">{player.liquidity.score.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400 uppercase tracking-wider">Resale Window</span>
                          <span className="text-sm font-semibold text-white">{player.liquidity.resaleWindow}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed">{player.liquidity.marketProfile}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
  color: string;
}

function MetricCard({ title, value, icon: Icon, trend, trendUp, color }: MetricCardProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10" style={{ background: color }} />
      <div className="relative z-10">
        <div className="mb-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider font-medium">{title}</h3>
        </div>
        <p className="text-3xl font-bold mb-2" style={{ color }}>
          {value}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {trendUp ? <TrendingUp className="w-3 h-3 text-[#00FF9C]" /> : <TrendingDown className="w-3 h-3 text-[#FF4D4F]" />}
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}
