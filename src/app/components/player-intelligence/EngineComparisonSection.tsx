import { Cpu, TrendingUp, Shield, Target, Zap } from "lucide-react";
import { ComparisonRadarChart, type RadarDimension } from "./ComparisonRadarChart";

// ---------------------------------------------------------------------------
// Types — mirrors PlayerComparisonOutput from analysis-engine
// ---------------------------------------------------------------------------

export interface DimensionResult {
  winner: "A" | "B" | "tie";
  valueA: number;
  valueB: number;
  delta: number;
  label: string;
}

export interface EngineComparisonOutput {
  playerA: { playerName: string; position: string | null };
  playerB: { playerName: string; position: string | null };
  dimensions: {
    scoring: DimensionResult;
    creation: DimensionResult;
    defending: DimensionResult;
    passing: DimensionResult;
    physicality: DimensionResult;
    efficiency: DimensionResult;
    involvement: DimensionResult;
  };
  betterScorer: "A" | "B" | "tie";
  betterCreator: "A" | "B" | "tie";
  betterOverall: "A" | "B" | "tie";
  scoreA: number;
  scoreB: number;
  analysis: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type Winner = "A" | "B" | "tie";

function winnerColor(winner: Winner, side: "A" | "B"): string {
  if (winner === "tie") return "text-gray-300";
  return winner === side ? (side === "A" ? "text-[#38BDF8]" : "text-[#C084FC]") : "text-gray-500";
}

function winnerBg(winner: Winner): string {
  if (winner === "tie") return "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-gray-300";
  if (winner === "A") return "border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.08)] text-[#38BDF8]";
  return "border-[rgba(192,132,252,0.3)] bg-[rgba(192,132,252,0.08)] text-[#C084FC]";
}

function DimensionRow({ dim, nameA, nameB }: { dim: DimensionResult; nameA: string; nameB: string }) {
  const maxVal = Math.max(dim.valueA, dim.valueB, 1);
  const widthA = Math.max(6, Math.round((dim.valueA / maxVal) * 100));
  const widthB = Math.max(6, Math.round((dim.valueB / maxVal) * 100));

  return (
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,20,42,0.6)] px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{dim.label}</span>
        <span className={`text-[11px] font-medium ${winnerBg(dim.winner)} rounded-full border px-2.5 py-0.5`}>
          {dim.winner === "tie" ? "Empate" : dim.winner === "A" ? nameA : nameB}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2">
        {/* Player A */}
        <div>
          <p className={`mb-1 text-sm font-bold ${winnerColor(dim.winner, "A")}`}>
            {dim.valueA.toFixed(1)}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0EA5E9,#38BDF8)]"
              style={{ width: `${widthA}%` }}
            />
          </div>
        </div>
        <span className="text-center text-[9px] uppercase tracking-widest text-gray-600">vs</span>
        {/* Player B */}
        <div>
          <p className={`mb-1 text-right text-sm font-bold ${winnerColor(dim.winner, "B")}`}>
            {dim.valueB.toFixed(1)}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
            <div
              className="ml-auto h-full rounded-full bg-[linear-gradient(90deg,#A855F7,#C084FC)]"
              style={{ width: `${widthB}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VerdictCard({
  icon: Icon,
  label,
  winner,
  nameA,
  nameB,
}: {
  icon: React.ElementType;
  label: string;
  winner: Winner;
  nameA: string;
  nameB: string;
}) {
  const name = winner === "tie" ? "Equivalente" : winner === "A" ? nameA : nameB;
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{label}</span>
      </div>
      <p className={`text-base font-semibold ${winner === "A" ? "text-[#9BE7FF]" : winner === "B" ? "text-[#D8B4FE]" : "text-gray-300"}`}>
        {name}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

interface Props {
  nameA: string;
  nameB: string;
  data: EngineComparisonOutput;
}

export function EngineComparisonSection({ nameA, nameB, data }: Props) {
  const { dimensions, betterScorer, betterCreator, betterOverall, scoreA, scoreB, analysis } = data;

  const radarDimensions: RadarDimension[] = [
    { label: "Gol", valueA: dimensions.scoring.valueA, valueB: dimensions.scoring.valueB },
    { label: "Criação", valueA: dimensions.creation.valueA, valueB: dimensions.creation.valueB },
    { label: "Passe", valueA: dimensions.passing.valueA, valueB: dimensions.passing.valueB },
    { label: "Defesa", valueA: dimensions.defending.valueA, valueB: dimensions.defending.valueB },
    { label: "Físico", valueA: dimensions.physicality.valueA, valueB: dimensions.physicality.valueB },
    { label: "Eficiência", valueA: dimensions.efficiency.valueA, valueB: dimensions.efficiency.valueB },
    { label: "Envolvimento", valueA: dimensions.involvement.valueA, valueB: dimensions.involvement.valueB },
  ];

  const dimList = Object.values(dimensions);

  return (
    <section className="rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.06)] px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[rgba(0,194,255,0.2)] bg-[rgba(0,194,255,0.08)]">
              <Cpu className="h-4 w-4 text-[#9BE7FF]" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Engine de Análise</p>
              <h2 className="text-lg font-semibold text-white">{nameA} vs {nameB}</h2>
            </div>
          </div>
          {/* Score pills */}
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[rgba(56,189,248,0.28)] bg-[rgba(56,189,248,0.08)] px-4 py-1.5">
              <span className="text-xs font-semibold text-[#38BDF8]">{nameA}</span>
              <span className="ml-2 text-sm font-bold text-white">{scoreA.toFixed(1)}</span>
            </div>
            <span className="text-xs text-gray-600">—</span>
            <div className="rounded-full border border-[rgba(192,132,252,0.28)] bg-[rgba(192,132,252,0.08)] px-4 py-1.5">
              <span className="text-sm font-bold text-white">{scoreB.toFixed(1)}</span>
              <span className="ml-2 text-xs font-semibold text-[#C084FC]">{nameB}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left — radar */}
          <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,20,42,0.5)] p-5">
            <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gray-500">Perfil multidimensional</p>
            <ComparisonRadarChart nameA={nameA} nameB={nameB} dimensions={radarDimensions} />
          </div>

          {/* Right — dimensions list */}
          <div className="space-y-2.5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-gray-500">Dimensões detalhadas</p>
            {dimList.map((dim) => (
              <DimensionRow key={dim.label} dim={dim} nameA={nameA} nameB={nameB} />
            ))}
          </div>
        </div>

        {/* Verdict cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <VerdictCard icon={Target}    label="Melhor Finalizador" winner={betterScorer}  nameA={nameA} nameB={nameB} />
          <VerdictCard icon={TrendingUp} label="Melhor Criador"     winner={betterCreator} nameA={nameA} nameB={nameB} />
          <VerdictCard icon={Zap}       label="Melhor no Geral"     winner={betterOverall} nameA={nameA} nameB={nameB} />
        </div>

        {/* Narrative */}
        {analysis ? (
          <div className="mt-5 rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,20,42,0.6)] px-5 py-4">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[#9BE7FF]" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#9BE7FF]">Análise Narrativa</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">{analysis}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
