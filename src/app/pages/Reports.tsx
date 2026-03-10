import { memo, useCallback, useEffect, useState } from "react";
import { FileText, Download, CheckCircle, TrendingUp, Brain } from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getPlayers } from "../services/players";
import { getExplainabilityReport } from "../services/reports";
import { mapApiPlayerToExtended } from "../mappers/player.mapper";
import { EMPTY_PLAYER, type PlayerExtended } from "../types/player";

export default function Reports() {
  const [players, setPlayers] = useState<PlayerExtended[]>([]);
  const [playerA, setPlayerA] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [playerB, setPlayerB] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let active = true;

    async function loadNarrative() {
      if (!playerA.id || playerA.name === "Sem dados") {
        setNarrative(null);
        return;
      }

      try {
        const response = await getExplainabilityReport(playerA.id);
        if (!active) {
          return;
        }

        const data = (response.data || {}) as Record<string, unknown>;
        setNarrative(String(data.narrative || data.explanation || ""));
      } catch {
        if (active) {
          setNarrative(null);
        }
      }
    }

    loadNarrative();

    return () => {
      active = false;
    };
  }, [playerA.id, playerA.name]);

  const handlePlayerAChange = useCallback((value: string) => {
    const player = players.find((item) => item.id === value);
    if (player) {
      setPlayerA(player);
    }
  }, [players]);

  const handlePlayerBChange = useCallback((value: string) => {
    const player = players.find((item) => item.id === value);
    if (player) {
      setPlayerB(player);
    }
  }, [players]);

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
              <div className="flex-1">
                <h1 className="text-4xl font-semibold mb-3">Relatorio Executivo</h1>
                <p className="text-sm text-gray-500">Analise Comparativa: {playerA.name} vs {playerB.name}</p>
              </div>
              <Button className="bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] rounded-[12px] h-12 px-6 font-semibold shadow-[0_4px_16px_rgba(0,194,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,194,255,0.35)] transition-all" aria-label="Exportar relatorio em PDF">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <PlayerSelector label="Player A" value={playerA.name} onChange={handlePlayerAChange} variant="A" ariaLabel="Selecionar jogador A" players={players} />
              <PlayerSelector label="Player B" value={playerB.name} onChange={handlePlayerBChange} variant="B" ariaLabel="Selecionar jogador B" players={players} />
            </div>

            {loading && <div className="mb-6 text-sm text-gray-500">Carregando relatorio...</div>}

            <SectionCard icon={FileText} iconColor="#00C2FF" iconBg="rgba(0,194,255,0.15)" title="Executive Summary">
              <div className="max-w-[900px]">
                <p className="text-gray-300 leading-[1.8] mb-6 text-[15px]">
                  Esta analise compara dois perfis para decisao esportiva. <strong className="text-gray-100 font-semibold">{playerA.name}</strong> e <strong className="text-gray-100 font-semibold">{playerB.name}</strong> sao apresentados com foco em risco, liquidez e capital efficiency.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <InsightCard title="Recomendacao Principal" color="#00C2FF" content={`${playerA.name} oferece capital efficiency de ${playerA.capitalEfficiency.toFixed(1)}/10 e risco estrutural de ${playerA.structuralRisk.score.toFixed(1)}.`} />
                  <InsightCard title="Consideracoes Estrategicas" color="#7A5CFF" content={`${playerB.name} permanece como alternativa com liquidez de ${playerB.liquidity.score.toFixed(1)} e perfil financeiro ${playerB.financialRisk.capitalExposure}.`} />
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={TrendingUp} iconColor="#7A5CFF" iconBg="rgba(122,92,255,0.15)" title="Comparative Analysis">
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead className="sticky top-0 bg-[rgba(255,255,255,0.04)] backdrop-blur-sm z-10">
                    <tr>
                      <th className="text-left py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium" scope="col">Metrica</th>
                      <th className="text-center py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium" scope="col">{playerA.name}</th>
                      <th className="text-center py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium" scope="col">{playerB.name}</th>
                      <th className="text-center py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium" scope="col">Vencedor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {[
                      { name: "Overall Rating", a: playerA.overallRating, b: playerB.overallRating },
                      { name: "Capital Efficiency", a: playerA.capitalEfficiency, b: playerB.capitalEfficiency },
                      { name: "Structural Risk", a: playerA.structuralRisk.score, b: playerB.structuralRisk.score, inverse: true },
                      { name: "Liquidity Score", a: playerA.liquidity.score, b: playerB.liquidity.score },
                    ].map((metric, index) => (
                      <ComparisonRow key={`${metric.name}-${index}`} {...metric} />
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard icon={CheckCircle} iconColor="#FF4D4F" iconBg="rgba(255,77,79,0.15)" title="Risk Overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PlayerRiskBlock playerName={playerA.name} color="#00C2FF" risks={[{ label: "Structural Risk", value: playerA.structuralRisk.level, description: playerA.structuralRisk.breakdown }, { label: "Financial Risk", value: playerA.riskLevel, description: playerA.financialRisk.investmentProfile }]} />
                <PlayerRiskBlock playerName={playerB.name} color="#7A5CFF" risks={[{ label: "Structural Risk", value: playerB.structuralRisk.level, description: playerB.structuralRisk.breakdown }, { label: "Financial Risk", value: playerB.riskLevel, description: playerB.financialRisk.investmentProfile }]} />
              </div>
            </SectionCard>

            <section className="bg-gradient-to-br from-[rgba(0,194,255,0.03)] to-[rgba(122,92,255,0.03)] backdrop-blur-sm rounded-[20px] p-8 border border-[rgba(0,194,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-8" role="region" aria-label="AI Narrative">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[rgba(255,255,255,0.06)]">
                <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] flex items-center justify-center shadow-[0_4px_16px_rgba(0,194,255,0.25)]">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold tracking-wide">AI Narrative</h2>
              </div>

              <div className="max-w-[850px]">
                <div className="space-y-5">
                  <p className="text-gray-300 leading-[1.8] text-[15px]">
                    {narrative || `${playerA.name} aparece como opcao principal para reforco imediato, enquanto ${playerB.name} permanece como alternativa estrategica dependendo do contexto financeiro e tatico.`}
                  </p>
                  <p className="text-gray-300 leading-[1.8] text-[15px]">
                    O capital efficiency de <strong className="text-[#00FF9C] font-semibold">{playerA.capitalEfficiency.toFixed(1)}/10</strong> e a janela de revenda de {playerA.liquidity.resaleWindow} sustentam a recomendacao.
                  </p>
                </div>

                <div className="bg-[rgba(0,194,255,0.08)] border-l-4 border-[#00C2FF] rounded-r-[10px] p-5 mt-8">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    <strong className="text-[#00C2FF] font-semibold">Recomendacao Final:</strong> priorizar {playerA.name}, mantendo {playerB.name} como segunda opcao.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function PlayerSelector({ label, value, onChange, variant, ariaLabel, players }: { label: string; value: string; onChange: (value: string) => void; variant: "A" | "B"; ariaLabel: string; players: PlayerExtended[] }) {
  const borderColor = variant === "A" ? "rgba(0,194,255,0.3)" : "rgba(122,92,255,0.3)";
  const dotColor = variant === "A" ? "#00C2FF" : "#7A5CFF";

  return (
    <div className="space-y-3">
      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
        {label}
      </label>
      <Select value={players.find((player) => player.name === value)?.id ?? ""} onValueChange={onChange}>
        <SelectTrigger className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm border rounded-[14px] h-14 px-4 transition-all hover:border-opacity-60 focus:shadow-[0_0_0_3px_rgba(0,194,255,0.1)]" style={{ borderColor }} aria-label={ariaLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
          {players.map((player) => (
            <SelectItem key={player.id} value={player.id} className="hover:bg-[rgba(255,255,255,0.05)] focus:bg-[rgba(255,255,255,0.05)]">
              {player.name} • {player.club}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SectionCard({ icon: Icon, iconColor, iconBg, title, children }: { icon: React.ElementType; iconColor: string; iconBg: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-8" role="region" aria-label={title}>
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ background: iconBg }}>
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
        <h2 className="text-2xl font-semibold tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InsightCard({ title, color, content }: { title: string; color: string; content: string }) {
  return (
    <div className="bg-[rgba(255,255,255,0.03)] border rounded-[14px] p-5 hover:bg-[rgba(255,255,255,0.04)] transition-colors" style={{ borderColor: `${color}20` }}>
      <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color }}>
        <div className="w-1 h-4 rounded-full" style={{ background: color }} />
        {title}
      </h4>
      <p className="text-sm text-gray-400 leading-relaxed">{content}</p>
    </div>
  );
}

function ComparisonRow({ name, a, b, inverse = false }: { name: string; a: number; b: number; inverse?: boolean }) {
  const winner = inverse ? (a < b ? "A" : b < a ? "B" : "TIE") : a > b ? "A" : b > a ? "B" : "TIE";

  return (
    <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors" role="row">
      <td className="py-4 px-5 text-sm text-gray-300" role="cell">{name}</td>
      <td className="py-4 px-5 text-center tabular-nums" role="cell"><span className={`text-base font-bold ${winner === "A" ? "text-[#00C2FF]" : "text-gray-400"}`}>{a.toFixed(1)}</span></td>
      <td className="py-4 px-5 text-center tabular-nums" role="cell"><span className={`text-base font-bold ${winner === "B" ? "text-[#7A5CFF]" : "text-gray-400"}`}>{b.toFixed(1)}</span></td>
      <td className="py-4 px-5 text-center" role="cell">{winner === "TIE" ? <span className="text-gray-500 text-xs">Empate</span> : <CheckCircle className={`w-5 h-5 inline ${winner === "A" ? "text-[#00C2FF]" : "text-[#7A5CFF]"}`} />}</td>
    </tr>
  );
}

function PlayerRiskBlock({ playerName, color, risks }: { playerName: string; color: string; risks: Array<{ label: string; value: string; description: string }> }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: color }} />
        <span style={{ color }}>{playerName}</span>
      </h3>
      <div className="space-y-4">
        {risks.map((risk, index) => (
          <div key={`${risk.label}-${index}`} className="bg-[rgba(255,255,255,0.02)] border rounded-[12px] p-4 hover:bg-[rgba(255,255,255,0.03)] transition-colors" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{risk.label}</span>
              <span className="text-xs px-2.5 py-1 rounded-[6px] font-semibold bg-[rgba(255,255,255,0.06)] text-white">{risk.value}</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{risk.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
