import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { CapitalGauge } from "../components/CapitalGauge";
import { RiskBadge } from "../components/RiskBadge";
import { TierBadge } from "../components/TierBadge";
import { Shield, TrendingUp, DollarSign, AlertTriangle, Target, Award, GitCompareArrows } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { getPlayers } from "../services/players";
import { comparePlayers, comparePlayersByName } from "../services/compare";
import { mapCompareResponse } from "../mappers/compare.mapper";
import { mapApiPlayerToExtended } from "../mappers/player.mapper";
import { EMPTY_PLAYER, type PlayerExtended } from "../types/player";

export default function Compare() {
  const [players, setPlayers] = useState<PlayerExtended[]>([]);
  const [playerA, setPlayerA] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [playerB, setPlayerB] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [selectAOpen, setSelectAOpen] = useState(false);
  const [selectBOpen, setSelectBOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ReturnType<typeof mapCompareResponse> | null>(null);

  const playersById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      try {
        const response = await getPlayers(1, 100);
        if (!active) {
          return;
        }

        const mappedPlayers = Array.isArray(response.data)
          ? response.data.map((player) => mapApiPlayerToExtended(player as Record<string, unknown>))
          : [];

        setPlayers(mappedPlayers);
        setPlayerA(mappedPlayers[0] ?? EMPTY_PLAYER);
        setPlayerB(mappedPlayers[1] ?? mappedPlayers[0] ?? EMPTY_PLAYER);
      } catch (error) {
        if (!active) {
          return;
        }

        setPlayers([]);
        setPlayerA(EMPTY_PLAYER);
        setPlayerB(EMPTY_PLAYER);
        setCompareError(error instanceof Error ? error.message : "Erro ao carregar jogadores");
      }
    }

    loadPlayers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadComparison() {
      if (!playerA.name || !playerB.name || playerA.name === "Sem dados" || playerB.name === "Sem dados") {
        setComparisonData(null);
        return;
      }

      setCompareLoading(true);
      try {
        const response =
          playerA.id && playerB.id && playerA.id !== "empty-player" && playerB.id !== "empty-player"
            ? await comparePlayers(playerA.id, playerB.id)
            : await comparePlayersByName(playerA.name, playerB.name);
        if (!active) {
          return;
        }

        setComparisonData(response.data);
        setCompareError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        setComparisonData(null);
        setCompareError(error instanceof Error ? error.message : "Erro ao comparar jogadores");
      } finally {
        if (active) {
          setCompareLoading(false);
        }
      }
    }

    loadComparison();

    return () => {
      active = false;
    };
  }, [playerA.id, playerB.id, playerA.name, playerB.name]);

  const displayPlayerA = comparisonData?.playerA ?? playerA;
  const displayPlayerB = comparisonData?.playerB ?? playerB;
  const positionContext = comparisonData?.positionContext ?? null;

  const radarData = comparisonData?.radarData || [
    { attribute: "Pace", A: displayPlayerA.stats.pace, B: displayPlayerB.stats.pace },
    { attribute: "Shooting", A: displayPlayerA.stats.shooting, B: displayPlayerB.stats.shooting },
    { attribute: "Passing", A: displayPlayerA.stats.passing, B: displayPlayerB.stats.passing },
    { attribute: "Dribbling", A: displayPlayerA.stats.dribbling, B: displayPlayerB.stats.dribbling },
    { attribute: "Defending", A: displayPlayerA.stats.defending, B: displayPlayerB.stats.defending },
    { attribute: "Physical", A: displayPlayerA.stats.physical, B: displayPlayerB.stats.physical },
  ];

  const comparisonStats = comparisonData?.comparisonStats || [
    { name: "Pace", a: displayPlayerA.stats.pace, b: displayPlayerB.stats.pace },
    { name: "Shooting", a: displayPlayerA.stats.shooting, b: displayPlayerB.stats.shooting },
    { name: "Passing", a: displayPlayerA.stats.passing, b: displayPlayerB.stats.passing },
    { name: "Dribbling", a: displayPlayerA.stats.dribbling, b: displayPlayerB.stats.dribbling },
    { name: "Defending", a: displayPlayerA.stats.defending, b: displayPlayerB.stats.defending },
    { name: "Physical", a: displayPlayerA.stats.physical, b: displayPlayerB.stats.physical },
  ];

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl mb-3">Player vs Player</h1>
              <p className="text-sm text-gray-500">Analise comparativa estrategica para decisoes baseadas em dados</p>
            </div>

            {compareError && (
              <div className="mb-6 rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {compareError}
              </div>
            )}
            {positionContext && (
              <PositionContextBanner
                kind={positionContext.kind}
                label={positionContext.label}
                message={positionContext.message}
                positionA={positionContext.positionA}
                positionB={positionContext.positionB}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00C2FF]" />
                  Jogador A
                </label>
                <Select
                  value={playerA.id}
                  onValueChange={(value) => setPlayerA(playersById.get(value) ?? EMPTY_PLAYER)}
                  open={selectAOpen}
                  onOpenChange={setSelectAOpen}
                >
                  <SelectTrigger className={`bg-[rgba(255,255,255,0.02)] backdrop-blur-sm border rounded-[14px] h-14 px-4 transition-all ${selectAOpen ? "border-[#00C2FF] shadow-[0_0_0_3px_rgba(0,194,255,0.1)]" : "border-[rgba(0,194,255,0.3)] hover:border-[rgba(0,194,255,0.5)]"}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1B35] border-[rgba(0,194,255,0.3)]">
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id} className="hover:bg-[rgba(0,194,255,0.1)] focus:bg-[rgba(0,194,255,0.1)]">
                        {player.name} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ {player.club}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7A5CFF]" />
                  Jogador B
                </label>
                <Select
                  value={playerB.id}
                  onValueChange={(value) => setPlayerB(playersById.get(value) ?? EMPTY_PLAYER)}
                  open={selectBOpen}
                  onOpenChange={setSelectBOpen}
                >
                  <SelectTrigger className={`bg-[rgba(255,255,255,0.02)] backdrop-blur-sm border rounded-[14px] h-14 px-4 transition-all ${selectBOpen ? "border-[#7A5CFF] shadow-[0_0_0_3px_rgba(122,92,255,0.1)]" : "border-[rgba(122,92,255,0.3)] hover:border-[rgba(122,92,255,0.5)]"}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1B35] border-[rgba(122,92,255,0.3)]">
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id} className="hover:bg-[rgba(122,92,255,0.1)] focus:bg-[rgba(122,92,255,0.1)]">
                        {player.name} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ {player.club}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <PlayerComparisonCard player={displayPlayerA} variant="A" />
              <PlayerComparisonCard player={displayPlayerB} variant="B" />
            </div>

            <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-10">
              <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
                <Target className="w-6 h-6 text-[#00C2FF]" />
                Performance Tecnica
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <ResponsiveContainer width="100%" height={340}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                      <PolarAngleAxis dataKey="attribute" stroke="#94a3b8" style={{ fontSize: "13px", fontWeight: 500 }} />
                      <Radar name={displayPlayerA.name} dataKey="A" stroke="#00C2FF" fill="#00C2FF" fillOpacity={0.2} strokeWidth={2.5} />
                      <Radar name={displayPlayerB.name} dataKey="B" stroke="#7A5CFF" fill="#7A5CFF" fillOpacity={0.2} strokeWidth={2.5} />
                      <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "20px" }} iconType="circle" />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-5">
                  {compareLoading && <p className="text-sm text-gray-500">Carregando comparacao...</p>}
                  {comparisonStats.map((stat) => (
                    <ComparisonBar key={`${stat.name}-${stat.a}-${stat.b}`} label={stat.name} valueA={stat.a} valueB={stat.b} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-8">Analise Estrategica</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StrategicComparisonCard title="Capital Efficiency" icon={Target} iconColor="#00C2FF">
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Jogador A</p>
                      <CapitalGauge value={displayPlayerA.capitalEfficiency} size="xs" showLabel />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Jogador B</p>
                      <CapitalGauge value={displayPlayerB.capitalEfficiency} size="xs" showLabel />
                    </div>
                  </div>
                  <WinnerIndicator winner={displayPlayerA.capitalEfficiency > displayPlayerB.capitalEfficiency ? "A" : "B"} label={displayPlayerA.capitalEfficiency > displayPlayerB.capitalEfficiency ? displayPlayerA.name.split(" ")[0] : displayPlayerB.name.split(" ")[0]} />
                </StrategicComparisonCard>

                <StrategicComparisonCard title="Risco Estrutural" icon={Shield} iconColor="#FF4D4F">
                  <div className="space-y-4">
                    <MetricRow label="Jogador A" value={displayPlayerA.structuralRisk.score.toFixed(1)} badge={<RiskBadge level={displayPlayerA.structuralRisk.level} />} variant="A" />
                    <div className="border-t border-[rgba(255,255,255,0.06)]" />
                    <MetricRow label="Jogador B" value={displayPlayerB.structuralRisk.score.toFixed(1)} badge={<RiskBadge level={displayPlayerB.structuralRisk.level} />} variant="B" />
                  </div>
                  <WinnerIndicator winner={displayPlayerA.structuralRisk.score < displayPlayerB.structuralRisk.score ? "A" : "B"} label="Menor risco" />
                </StrategicComparisonCard>

                <StrategicComparisonCard title="Anti-Flop Index" icon={AlertTriangle} iconColor="#fbbf24">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Jogador A</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Flop Probability</span>
                        <span className="text-sm font-bold text-[#FF4D4F]">{displayPlayerA.antiFlopIndex.flopProbability}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Safety Index</span>
                        <span className="text-sm font-bold text-[#00FF9C]">{displayPlayerA.antiFlopIndex.safetyIndex}</span>
                      </div>
                    </div>
                    <div className="border-t border-[rgba(255,255,255,0.06)]" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Jogador B</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Flop Probability</span>
                        <span className="text-sm font-bold text-[#FF4D4F]">{displayPlayerB.antiFlopIndex.flopProbability}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Safety Index</span>
                        <span className="text-sm font-bold text-[#00FF9C]">{displayPlayerB.antiFlopIndex.safetyIndex}</span>
                      </div>
                    </div>
                  </div>
                  <WinnerIndicator winner={displayPlayerA.antiFlopIndex.flopProbability < displayPlayerB.antiFlopIndex.flopProbability ? "A" : "B"} label="Menor probabilidade de flop" />
                </StrategicComparisonCard>

                <StrategicComparisonCard title="Liquidez" icon={TrendingUp} iconColor="#00FF9C">
                  <div className="space-y-4">
                    <MetricRow label="Jogador A" value={displayPlayerA.liquidity.score.toFixed(1)} subtitle={displayPlayerA.liquidity.resaleWindow} variant="A" />
                    <div className="border-t border-[rgba(255,255,255,0.06)]" />
                    <MetricRow label="Jogador B" value={displayPlayerB.liquidity.score.toFixed(1)} subtitle={displayPlayerB.liquidity.resaleWindow} variant="B" />
                  </div>
                  <WinnerIndicator winner={displayPlayerA.liquidity.score > displayPlayerB.liquidity.score ? "A" : "B"} label="Maior liquidez" />
                </StrategicComparisonCard>

                <StrategicComparisonCard title="Risco Financeiro" icon={DollarSign} iconColor="#FF4D4F">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Jogador A</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Risk Index</span>
                        <span className="text-lg font-bold">{displayPlayerA.financialRisk.index.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Capital Exposure</span>
                        <span className="text-xs text-[#00C2FF]">{displayPlayerA.financialRisk.capitalExposure}</span>
                      </div>
                    </div>
                    <div className="border-t border-[rgba(255,255,255,0.06)]" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Jogador B</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Risk Index</span>
                        <span className="text-lg font-bold">{displayPlayerB.financialRisk.index.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Capital Exposure</span>
                        <span className="text-xs text-[#00C2FF]">{displayPlayerB.financialRisk.capitalExposure}</span>
                      </div>
                    </div>
                  </div>
                  <WinnerIndicator winner={displayPlayerA.financialRisk.index < displayPlayerB.financialRisk.index ? "A" : "B"} label="Menor risco financeiro" />
                </StrategicComparisonCard>

                <StrategicComparisonCard title="Overall Rating" icon={Award} iconColor="#7A5CFF">
                  <div className="space-y-4">
                    <MetricRow label="Jogador A" value={displayPlayerA.overallRating.toString()} subtitle={`${displayPlayerA.position} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ ${displayPlayerA.club}`} variant="A" />
                    <div className="border-t border-[rgba(255,255,255,0.06)]" />
                    <MetricRow label="Jogador B" value={displayPlayerB.overallRating.toString()} subtitle={`${displayPlayerB.position} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ ${displayPlayerB.club}`} variant="B" />
                  </div>
                  <WinnerIndicator winner={displayPlayerA.overallRating > displayPlayerB.overallRating ? "A" : "B"} label="Maior rating" />
                </StrategicComparisonCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function PlayerComparisonCard({ player, variant }: { player: PlayerExtended; variant: "A" | "B" }) {
  const borderColor = variant === "A" ? "rgba(0,194,255,0.2)" : "rgba(122,92,255,0.2)";
  const glowColor = variant === "A" ? "rgba(0,194,255,0.08)" : "rgba(122,92,255,0.08)";
  const accentColor = variant === "A" ? "#00C2FF" : "#7A5CFF";

  return (
    <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-sm rounded-[20px] p-7 relative overflow-hidden transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]" style={{ border: `1px solid ${borderColor}`, boxShadow: `0 4px 24px ${glowColor}` }}>
      <div className="absolute top-0 right-0 w-48 h-48 blur-3xl opacity-5 pointer-events-none" style={{ background: accentColor }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[14px] flex items-center justify-center text-xl font-bold shadow-[0_4px_12px_rgba(0,0,0,0.3)] relative overflow-hidden" style={{ background: variant === "A" ? "linear-gradient(135deg, rgba(0,194,255,0.25) 0%, rgba(0,194,255,0.1) 100%)" : "linear-gradient(135deg, rgba(122,92,255,0.25) 0%, rgba(122,92,255,0.1) 100%)", border: `1.5px solid ${variant === "A" ? "rgba(0,194,255,0.3)" : "rgba(122,92,255,0.3)"}` }}>
              <span className="relative z-10 text-white">{player.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1 text-gray-100">{player.name}</h3>
              <p className="text-xs text-gray-500">{player.club} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ {player.position}</p>
            </div>
          </div>
          <TierBadge tier={player.tier} className="!px-2.5 !py-1 !text-[10px] !shadow-[0_2px_8px_rgba(0,0,0,0.2)]" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Overall</p>
            <p className="text-2xl font-bold" style={{ color: accentColor }}>{player.overallRating}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Position Rank</p>
            <p className="text-2xl font-bold text-gray-300">#{player.positionRank || 0}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Risk Level</p>
            <RiskBadge level={player.riskLevel} />
          </div>
        </div>

        <div className="flex items-center justify-center pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Capital Efficiency</p>
            <CapitalGauge value={player.capitalEfficiency} size="xs" showLabel />
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonBar({ label, valueA, valueB }: { label: string; valueA: number; valueB: number }) {
  const percentA = valueA;
  const percentB = valueB;
  const delta = Math.abs(valueA - valueB);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        {delta >= 5 && <span className="text-[10px] text-gray-600">delta {delta}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-[#00C2FF] w-8 text-right tabular-nums">{valueA}</span>
        <div className="flex-1 flex items-center gap-1.5">
          <div className="flex-1 h-2 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden">
            <div className="h-full bg-[#00C2FF] rounded-full transition-all duration-300" style={{ width: `${percentA}%` }} />
          </div>
          <div className="flex-1 h-2 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden">
            <div className="h-full bg-[#7A5CFF] rounded-full transition-all duration-300" style={{ width: `${percentB}%` }} />
          </div>
        </div>
        <span className="text-sm font-bold text-[#7A5CFF] w-8 text-left tabular-nums">{valueB}</span>
      </div>
    </div>
  );
}

function StrategicComparisonCard({ title, icon: Icon, iconColor, children }: { title: string; icon: React.ElementType; iconColor: string; children: ReactNode }) {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-all duration-200">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: `${iconColor}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
        </div>
        <h3 className="text-base font-semibold text-gray-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MetricRow({ label, value, subtitle, badge, variant }: { label: string; value: string; subtitle?: string; badge?: ReactNode; variant: "A" | "B" }) {
  const color = variant === "A" ? "#00C2FF" : "#7A5CFF";

  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        {badge}
      </div>
      {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}

function WinnerIndicator({ winner, label }: { winner: "A" | "B"; label: string }) {
  const color = winner === "A" ? "#00C2FF" : "#7A5CFF";

  return (
    <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}
