import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  Crosshair,
  DollarSign,
  ExternalLink,
  Gem,
  Minus,
  RotateCcw,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { getPlayerEvolution, type PlayerEvolutionResult, type SeasonPoint } from "../../services/evolution";

// ─── Nav-state types ──────────────────────────────────────────────────────────

type ScoutingLabel =
  | "ELITE_PROSPECT"
  | "RISING_STAR"
  | "VALUE_PICK"
  | "STABLE"
  | "DECLINING";

interface ScoutBreakdown {
  overallScore:  number;
  trendScore:    number;
  valueScore:    number;
  ceilingScore:  number;
}

interface GemNavCtx {
  scoutingLabel:  ScoutingLabel;
  overall:        number | null;
  potential:      number | null;
  marketValue:    number | null;
  valueScore:     number | null;
  trendDirection: "rising" | "stable" | "declining";
  trendDelta:     number;
  seasonCount:    number;
  nationality:    string | null;
  positions:      string[];
  breakdown:      ScoutBreakdown;
  dnaScore:       Record<string, unknown> | null;
}

interface RankingNavCtx {
  rank:           number;
  scoutingLabel:  ScoutingLabel;
  overall:        number | null;
  potential:      number | null;
  marketValue:    number | null;
  trendDirection: "rising" | "stable" | "declining";
  slopePerYear:   number;
  trendDelta:     number;
  scoutingTotal:  number;
  seasonCount:    number;
  positions:      string[];
  nationality:    string | null;
  breakdown:      ScoutBreakdown;
}

interface PlayerNavState {
  source: "hidden-gems" | "scouting-ranking";
  gem?:   GemNavCtx;
  entry?: RankingNavCtx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMV(v: number | null): string | null {
  if (v == null) return null;
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `€${(v / 1_000).toFixed(0)}K`;
  return `€${v}`;
}

function formatMarketValue(v: number | null) {
  return fmtMV(v) ?? "N/A";
}

function overallColor(overall: number | null): string {
  const o = overall ?? 0;
  if (o >= 85) return "#00FF9C";
  if (o >= 78) return "#00C2FF";
  if (o >= 70) return "#7A5CFF";
  if (o >= 62) return "#FBBF24";
  return "#FF4D4F";
}

function overallBarWidth(overall: number | null, maxOverall: number): string {
  if (overall == null || maxOverall <= 0) return "0%";
  return `${Math.round((overall / Math.max(maxOverall, 85)) * 100)}%`;
}

// ─── Trend config ─────────────────────────────────────────────────────────────

const TREND_CONFIG = {
  rising: {
    icon:    ArrowUpRight,
    color:   "#00FF9C",
    bg:      "rgba(0,255,156,0.1)",
    border:  "rgba(0,255,156,0.3)",
    label:   "Em Alta",
    summary: "Jogador em forte ascensão nas últimas temporadas",
    Icon:    TrendingUp,
  },
  stable: {
    icon:    ArrowRight,
    color:   "#94a3b8",
    bg:      "rgba(148,163,184,0.08)",
    border:  "rgba(148,163,184,0.22)",
    label:   "Estável",
    summary: "Perfil consistente ao longo dos anos",
    Icon:    Minus,
  },
  declining: {
    icon:    ArrowDownRight,
    color:   "#FF4D4F",
    bg:      "rgba(255,77,79,0.1)",
    border:  "rgba(255,77,79,0.28)",
    label:   "Em Queda",
    summary: "Queda recente de performance",
    Icon:    TrendingDown,
  },
} as const;

const LABEL_NAMES: Record<ScoutingLabel, string> = {
  ELITE_PROSPECT: "Elite Prospect",
  RISING_STAR:    "Rising Star",
  VALUE_PICK:     "Value Pick",
  STABLE:         "Estável",
  DECLINING:      "Em Queda",
};

const LABEL_COLORS: Record<ScoutingLabel, string> = {
  ELITE_PROSPECT: "#FFD700",
  RISING_STAR:    "#00C2FF",
  VALUE_PICK:     "#7A5CFF",
  STABLE:         "#94a3b8",
  DECLINING:      "#FF4D4F",
};

// ─── Intelligence narrative ───────────────────────────────────────────────────

interface InsightLine {
  text:  string;
  Icon:  React.ElementType;
  color: string;
}

function buildRankingInsights(entry: RankingNavCtx, evolution: PlayerEvolutionResult | null): InsightLine[] {
  const insights: InsightLine[] = [];
  const overall = evolution?.currentOverall ?? entry.overall;
  const bd = entry.breakdown;

  // 1 — scout score + overall quality
  const quality =
    (overall ?? 0) >= 85 ? "elite"
    : (overall ?? 0) >= 78 ? "premium"
    : (overall ?? 0) >= 70 ? "acima da média"
    : "regular";

  insights.push({
    text: `Posição #${entry.rank} no Ranking Inteligente com Scout Score ${entry.scoutingTotal}. Overall ${overall ?? "—"} representa desempenho ${quality} no banco de dados.`,
    Icon: Star,
    color: "#00C2FF",
  });

  // 2 — dominant dimension
  const dims = [
    { key: "value",   val: bd.valueScore,   label: "eficiência de valor",   color: "#7A5CFF" },
    { key: "trend",   val: bd.trendScore,   label: "crescimento",           color: "#00FF9C" },
    { key: "ceiling", val: bd.ceilingScore, label: "teto de crescimento",   color: "#FBBF24" },
  ].sort((a, b) => b.val - a.val)[0];

  if (dims.val >= 70) {
    if (dims.key === "value") {
      const mv = fmtMV(entry.marketValue);
      insights.push({
        text: mv
          ? `Valor de mercado de ${mv} é excepcionalmente eficiente para o nível de desempenho (score de valor: ${bd.valueScore}/100) — custo-benefício superior ao mercado.`
          : `Eficiência de valor de mercado alta (${bd.valueScore}/100) — custo-benefício acima da média para o nível de overall.`,
        Icon: DollarSign,
        color: "#7A5CFF",
      });
    } else if (dims.key === "trend") {
      const slope = evolution?.trend.slopePerYear ?? entry.slopePerYear;
      insights.push({
        text: `Crescimento de +${slope} pts/ano — trajetória ascendente consistente verificada nas últimas ${entry.seasonCount} temporada${entry.seasonCount !== 1 ? "s" : ""}.`,
        Icon: TrendingUp,
        color: "#00FF9C",
      });
    } else if (dims.key === "ceiling" && entry.potential != null && overall != null) {
      const gap = entry.potential - overall;
      insights.push({
        text: `Potencial estimado em ${entry.potential}${gap > 0 ? ` — ${gap} pontos acima do overall atual` : ""}. Score de teto de ${bd.ceilingScore}/100 indica margem real de valorização.`,
        Icon: Zap,
        color: "#FBBF24",
      });
    }
  }

  // 3 — trend context
  if (entry.trendDirection === "rising") {
    const slope = evolution?.trend.slopePerYear ?? entry.slopePerYear;
    insights.push({
      text: `Em alta com +${slope} pts/ano. Momento estratégico para contratação antes de nova valorização de mercado.`,
      Icon: TrendingUp,
      color: "#00FF9C",
    });
  } else if (entry.trendDirection === "stable") {
    insights.push({
      text: `Perfil estável e confiável — consistência garantida ao longo das temporadas analisadas. Baixo risco operacional.`,
      Icon: Minus,
      color: "#94a3b8",
    });
  } else {
    insights.push({
      text: `Atenção: tendência de queda recente identificada. Avalie principalmente para uso de curto prazo ou oportunidades pontuais.`,
      Icon: TrendingDown,
      color: "#FF4D4F",
    });
  }

  return insights.slice(0, 3);
}

function buildGemInsights(gem: GemNavCtx, evolution: PlayerEvolutionResult | null): InsightLine[] {
  const insights: InsightLine[] = [];
  const overall = evolution?.currentOverall ?? gem.overall;
  const slope   = evolution?.trend.slopePerYear ?? gem.trendDelta;
  const potGap  = gem.potential != null && overall != null ? gem.potential - overall : null;
  const mv      = fmtMV(gem.marketValue);

  // 1 — why it's a gem
  if (gem.scoutingLabel === "VALUE_PICK") {
    insights.push({
      text: mv
        ? `Value Pick identificado por IA: valor de mercado de ${mv} é subvalorizado para um overall ${overall ?? "—"} — retorno superior ao investimento no perfil atual.`
        : `Value Pick: talento subvalorizado em relação ao desempenho real. Oportunidade de mercado confirmada por múltiplos indicadores de eficiência.`,
      Icon: Gem,
      color: "#7A5CFF",
    });
  } else if (gem.scoutingLabel === "RISING_STAR") {
    insights.push({
      text: `Rising Star em ascensão consistente — evolução de +${slope} pts/ano verificada nas temporadas recentes. Perfil ideal para investimento antecipado antes da valorização.`,
      Icon: TrendingUp,
      color: "#00C2FF",
    });
  } else if (gem.scoutingLabel === "ELITE_PROSPECT") {
    insights.push({
      text: `Elite Prospect: combinação rara de overall ${overall ?? "—"} com tendência positiva — qualidade superior aliada a crescimento sustentado.`,
      Icon: Trophy,
      color: "#FFD700",
    });
  } else {
    insights.push({
      text: `Identificado pela IA como oportunidade subvalorizada com custo-benefício superior à média do mercado atual.`,
      Icon: Gem,
      color: "#7A5CFF",
    });
  }

  // 2 — potential upside or ceiling
  if (potGap != null && potGap >= 5) {
    insights.push({
      text: `Potencial de ${gem.potential} — ${potGap} pontos acima do overall atual. Teto real de valorização para médio e longo prazo.`,
      Icon: Zap,
      color: "#FBBF24",
    });
  } else if (gem.breakdown.ceilingScore >= 60) {
    insights.push({
      text: `Score de teto de ${gem.breakdown.ceilingScore}/100 — perfil com margem de crescimento acima da média entre os jogadores analisados.`,
      Icon: Zap,
      color: "#FBBF24",
    });
  }

  // 3 — trend + value context
  if (gem.trendDirection === "rising") {
    const count = gem.seasonCount;
    insights.push({
      text: slope > 3
        ? `Em alta com +${slope} pts/ano${count > 1 ? ` ao longo de ${count} temporadas` : ""}. Crescimento consistente confirma a trajetória ascendente.`
        : `Trajetória ascendente nas últimas temporadas — momento favorável para contratação.`,
      Icon: TrendingUp,
      color: "#00FF9C",
    });
  } else if (gem.trendDirection === "stable") {
    insights.push({
      text: `Perfil estável com alta eficiência de valor — consistência garantida e custo competitivo em relação ao desempenho entregue.`,
      Icon: Minus,
      color: "#94a3b8",
    });
  } else {
    insights.push({
      text: `Tendência de queda recente. Considerar em contexto de curto prazo ou negociação com deságio no valor de mercado.`,
      Icon: TrendingDown,
      color: "#FF4D4F",
    });
  }

  return insights.slice(0, 3);
}

// ─── Intelligence panel ───────────────────────────────────────────────────────

function IntelligencePanel({
  source,
  gem,
  entry,
  evolution,
}: {
  source:    "hidden-gems" | "scouting-ranking";
  gem?:      GemNavCtx;
  entry?:    RankingNavCtx;
  evolution: PlayerEvolutionResult | null;
}) {
  const isGem     = source === "hidden-gems";
  const ctx       = isGem ? gem! : entry!;
  const label     = ctx.scoutingLabel;
  const breakdown = ctx.breakdown;
  const accentColor = isGem ? "#7A5CFF" : "#00C2FF";

  const insights = isGem
    ? buildGemInsights(gem!, evolution)
    : buildRankingInsights(entry!, evolution);

  const metrics = [
    { label: "Overall",   value: breakdown.overallScore,  color: "#00C2FF" },
    { label: "Tendência", value: breakdown.trendScore,    color: "#00FF9C" },
    { label: "Valor",     value: breakdown.valueScore,    color: "#7A5CFF" },
    { label: "Potencial", value: breakdown.ceilingScore,  color: "#FBBF24" },
  ];

  return (
    <section
      className="rounded-[22px] border p-5"
      style={{
        borderColor: `${accentColor}28`,
        background: `linear-gradient(135deg, ${accentColor}0a 0%, rgba(7,20,42,0.99) 100%)`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 0 60px ${accentColor}07`,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-[10px]"
            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}35` }}
          >
            {isGem
              ? <Gem   className="h-4 w-4" style={{ color: accentColor }} />
              : <Target className="h-4 w-4" style={{ color: accentColor }} />
            }
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
              {isGem ? "Por que esta Gem?" : `Por que este Jogador?`}
            </p>
            <p className="text-[10px] text-gray-500">
              {isGem ? "Análise de inteligência de scouting" : `Ranking Inteligente · Posição #${(entry!).rank}`}
            </p>
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: LABEL_COLORS[label], background: `${LABEL_COLORS[label]}15`, border: `1px solid ${LABEL_COLORS[label]}35` }}
        >
          {LABEL_NAMES[label]}
        </span>
      </div>

      {/* ── Insight bullets ─────────────────────────────────────────── */}
      <div className="mb-5 space-y-3">
        {insights.map((insight, i) => {
          const { Icon: InsightIcon } = insight;
          return (
            <div key={i} className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: `${insight.color}18`, border: `1px solid ${insight.color}30` }}
              >
                <InsightIcon className="h-3.5 w-3.5" style={{ color: insight.color }} />
              </div>
              <p className="text-sm leading-relaxed text-gray-300">{insight.text}</p>
            </div>
          );
        })}
      </div>

      {/* ── Score metrics grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        {metrics.map(({ label: lbl, value, color }) => (
          <div
            key={lbl}
            className="flex flex-col items-center gap-1 rounded-[12px] py-2.5"
            style={{ background: `${color}09`, border: `1px solid ${color}22` }}
          >
            <span className="text-xl font-black tabular-nums" style={{ color }}>
              {value}
            </span>
            <span className="text-[9px] uppercase tracking-[0.15em] text-gray-500">{lbl}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Career summary ───────────────────────────────────────────────────────────

function CareerSummary({ seasons }: { seasons: SeasonPoint[] }) {
  if (seasons.length === 0) return null;

  const total = seasons.reduce(
    (acc, s) => ({
      goals:   acc.goals   + (s.goals   ?? 0),
      assists: acc.assists + (s.assists ?? 0),
      minutes: acc.minutes + (s.minutes ?? 0),
    }),
    { goals: 0, assists: 0, minutes: 0 },
  );

  const ratings = seasons.filter((s) => s.rating != null).map((s) => s.rating!);
  const avgRating = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  const stats = [
    { label: "Gols",    value: total.goals,   color: "#00FF9C" },
    { label: "Assist.", value: total.assists,  color: "#00C2FF" },
    { label: "Minutos", value: total.minutes.toLocaleString("pt-BR"), color: "#94a3b8" },
    ...(avgRating ? [{ label: "Rating Méd.", value: avgRating, color: "#FBBF24" }] : []),
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-4 rounded-[14px] px-4 py-3"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-500">
        <Users className="h-3.5 w-3.5" />
        <span>Carreira · {seasons.length} temp.</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {stats.map(({ label, value, color }) => (
          <span key={label} className="flex items-baseline gap-1">
            <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
            <span className="text-[10px] text-gray-600">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── DNA block ────────────────────────────────────────────────────────────────

function DnaBlock({ dna }: { dna: Record<string, number> | null }) {
  if (!dna || Object.keys(dna).length === 0) return null;

  const entries = Object.entries(dna)
    .filter(([, v]) => typeof v === "number")
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-2">
      {entries.map(([key, val]) => {
        const pct = Math.min(100, Math.max(0, Number(val)));
        const color = pct >= 80 ? "#00FF9C" : pct >= 65 ? "#00C2FF" : pct >= 50 ? "#7A5CFF" : "#FBBF24";
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[11px] capitalize text-gray-400">{key}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]" style={{ height: 5 }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
              />
            </div>
            <span className="w-7 shrink-0 text-right text-xs font-bold tabular-nums" style={{ color }}>{pct}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Season row ───────────────────────────────────────────────────────────────

function SeasonRow({
  season,
  isCurrent,
  maxOverall,
  prevOverall,
  index,
}: {
  season:      SeasonPoint;
  isCurrent:   boolean;
  maxOverall:  number;
  prevOverall: number | null;
  index:       number;
}) {
  const color    = overallColor(season.overall);
  const barWidth = overallBarWidth(season.overall, maxOverall);
  const delta    = season.overall != null && prevOverall != null ? season.overall - prevOverall : null;
  const mv       = fmtMV(season.marketValue);

  return (
    <div
      className={`group relative flex flex-col gap-3 rounded-[16px] border p-4 transition-all ${
        isCurrent
          ? "border-[rgba(0,194,255,0.35)] bg-[rgba(0,194,255,0.06)]"
          : "border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.1)]"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {isCurrent && (
        <span className="absolute -top-2.5 right-4 rounded-full border border-[rgba(0,194,255,0.4)] bg-[rgba(0,194,255,0.15)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00C2FF]">
          Atual
        </span>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
          <span className="font-semibold text-gray-200">
            {season.seasonLabel ?? String(season.seasonYear)}
          </span>
          {delta != null && delta !== 0 && (
            <span
              className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={
                delta > 0
                  ? { color: "#00FF9C", background: "rgba(0,255,156,0.12)" }
                  : { color: "#FF4D4F", background: "rgba(255,77,79,0.12)" }
              }
            >
              {delta > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {season.teamName && <span className="truncate max-w-[120px]">{season.teamName}</span>}
          {season.leagueName && (
            <>
              <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-40" />
              <span className="truncate max-w-[120px]">{season.leagueName}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="w-20 text-right text-2xl font-bold tabular-nums" style={{ color }}>
          {season.overall ?? "—"}
        </span>
        <div className="flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]" style={{ height: 6 }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: barWidth, background: `linear-gradient(90deg, ${color}aa, ${color})` }}
          />
        </div>
        <span className="w-16 text-right text-[10px] text-gray-600">Overall</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {season.goals   != null && <Stat label="Gols"    value={season.goals} />}
        {season.assists != null && <Stat label="Assist." value={season.assists} />}
        {season.minutes != null && <Stat label="Min."    value={season.minutes} />}
        {season.rating  != null && <Stat label="Rating"  value={season.rating.toFixed(1)} />}
        {mv && <span className="ml-auto text-xs font-semibold text-[#00FF9C]">{mv}</span>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-sm font-bold tabular-nums text-gray-300">{value}</span>
      <span className="text-[10px] text-gray-600">{label}</span>
    </span>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[11px] text-gray-400">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]" style={{ height: 5 }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <span className="w-7 text-right text-xs font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayerProfile() {
  const { id }   = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const location  = useLocation();
  const navState  = (location.state as PlayerNavState | null);

  const [data, setData]       = useState<PlayerEvolutionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);

    getPlayerEvolution(id)
      .then((res) => { if (active) setData(res.data ?? null); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Erro ao carregar evolução"); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [id, fetchKey]);

  const seasons: SeasonPoint[] = (data?.trend.seasons ?? [])
    .filter((s) => s.seasonYear != null)
    .sort((a, b) => a.seasonYear - b.seasonYear);

  const lastSeason = seasons.at(-1) ?? null;
  const maxOverall = Math.max(...seasons.map((s) => s.overall ?? 0), 1);

  const trend = data?.trend;
  const tCfg  = TREND_CONFIG[trend?.direction ?? "stable"];
  const { Icon: TrendIcon } = tCfg;

  const primaryPosition = data?.positions?.[0] ?? null;

  // Context from navigation state
  const ctx       = navState?.source === "hidden-gems" ? navState.gem : navState?.entry;
  const nationality = ctx?.nationality ?? null;
  const potential   = ctx?.potential ?? null;
  const marketValue = navState?.source === "hidden-gems" ? navState.gem?.marketValue ?? null
                    : navState?.source === "scouting-ranking" ? navState.entry?.marketValue ?? null
                    : null;

  // Breadcrumb source label
  const sourceLabel = navState?.source === "hidden-gems" ? "Hidden Gems"
                    : navState?.source === "scouting-ranking" ? "Ranking Inteligente"
                    : "Jogadores";

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-[960px] space-y-5">

            {/* ── Breadcrumb ──────────────────────────────────────────────── */}
            <nav className="flex items-center gap-2 text-xs text-gray-500">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 transition-colors hover:text-gray-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
              <ChevronRight className="h-3 w-3 opacity-40" />
              <span className="text-[10px] uppercase tracking-[0.2em]">{sourceLabel}</span>
              <ChevronRight className="h-3 w-3 opacity-40" />
              <span className="text-gray-300">{data?.playerName ?? "Jogador"}</span>
            </nav>

            {/* ── Loading skeleton ─────────────────────────────────────────── */}
            {loading && (
              <div className="space-y-4">
                <div className="animate-pulse rounded-[28px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-7">
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                    <div className="space-y-3">
                      <div className="h-5 w-28 rounded-full bg-[rgba(255,255,255,0.05)]" />
                      <div className="h-8 w-52 rounded-[10px] bg-[rgba(255,255,255,0.06)]" />
                      <div className="flex gap-2">
                        <div className="h-6 w-12 rounded-[8px] bg-[rgba(255,255,255,0.05)]" />
                        <div className="h-6 w-16 rounded-[8px] bg-[rgba(255,255,255,0.04)]" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="h-4 w-16 rounded bg-[rgba(255,255,255,0.04)]" />
                      <div className="h-14 w-16 rounded-[10px] bg-[rgba(255,255,255,0.06)]" />
                    </div>
                  </div>
                </div>
                <div className="animate-pulse rounded-[22px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]" style={{ height: 200 }} />
                <div className="animate-pulse rounded-[20px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]" style={{ height: 110 }} />
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-[16px] border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)]" style={{ height: 90 }} />
                ))}
              </div>
            )}

            {/* ── Error ────────────────────────────────────────────────────── */}
            {error && (
              <div className="flex items-center gap-3 rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4">
                <Zap className="h-5 w-5 flex-shrink-0 text-[#FF4D4F]" />
                <p className="flex-1 text-sm text-[#FFB4B5]">{error}</p>
                <button
                  type="button"
                  onClick={() => setFetchKey((k) => k + 1)}
                  className="flex items-center gap-1.5 rounded-[10px] border border-[rgba(255,77,79,0.3)] px-3 py-1.5 text-xs text-[#FF4D4F] transition-all hover:bg-[rgba(255,77,79,0.1)]"
                >
                  <RotateCcw className="h-3 w-3" />
                  Tentar novamente
                </button>
              </div>
            )}

            {/* ── Not found ────────────────────────────────────────────────── */}
            {!loading && !error && !data && (
              <div className="flex flex-col items-center gap-5 py-24">
                <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "rgba(122,92,255,0.08)", border: "1.5px solid rgba(122,92,255,0.2)" }}>
                  <Crosshair className="h-9 w-9 text-[#7A5CFF] opacity-50" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-300">Jogador não encontrado</p>
                  <p className="mt-1 text-sm text-gray-500">O perfil solicitado não existe ou ainda não foi enriquecido.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:border-[rgba(255,255,255,0.2)] hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </button>
              </div>
            )}

            {!loading && data && (
              <>
                {/* ── Section 1 — Hero ─────────────────────────────────────── */}
                <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] p-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                  <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.14),transparent_68%)] blur-2xl" />
                  <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.1),transparent_72%)] blur-2xl" />

                  <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                    {/* Identity */}
                    <div className="flex flex-col gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#7FDBFF] w-fit">
                        <Crosshair className="h-3.5 w-3.5" />
                        Perfil do Jogador
                      </div>
                      <h1 className="text-3xl font-bold text-white">{data.playerName}</h1>

                      {/* Primary meta row */}
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                        {primaryPosition && (
                          <span className="rounded-[8px] px-2.5 py-1 text-xs font-bold" style={{ background: "rgba(0,194,255,0.14)", color: "#00C2FF" }}>
                            {primaryPosition}
                          </span>
                        )}
                        {data.age != null && <span>{data.age} anos</span>}
                        {nationality && (
                          <>
                            <span className="opacity-30">·</span>
                            <span>{nationality}</span>
                          </>
                        )}
                        {lastSeason?.teamName && (
                          <>
                            <span className="opacity-30">·</span>
                            <span>{lastSeason.teamName}</span>
                          </>
                        )}
                        {lastSeason?.leagueName && (
                          <>
                            <span className="opacity-30">·</span>
                            <span>{lastSeason.leagueName}</span>
                          </>
                        )}
                      </div>

                      {/* Secondary meta chips (potential + market value) */}
                      {(potential != null || marketValue != null) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {potential != null && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(251,191,36,0.1)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.25)" }}>
                              <Zap className="h-3 w-3" />
                              Pot. {potential}
                            </span>
                          )}
                          {marketValue != null && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(0,255,156,0.08)", color: "#00FF9C", border: "1px solid rgba(0,255,156,0.22)" }}>
                              <DollarSign className="h-3 w-3" />
                              {formatMarketValue(marketValue)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Overall + full profile link */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Overall</span>
                        <span className="text-5xl font-black tabular-nums" style={{ color: overallColor(data.currentOverall) }}>
                          {data.currentOverall ?? "—"}
                        </span>
                      </div>
                      <Link
                        to={`/players/${data.playerId}`}
                        className="inline-flex items-center gap-1.5 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] text-gray-400 transition-all hover:border-[rgba(0,194,255,0.3)] hover:text-[#00C2FF]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Perfil completo
                      </Link>
                    </div>
                  </div>
                </section>

                {/* ── Section 2 — Intelligence panel ───────────────────────── */}
                {navState?.source && ctx && (
                  <IntelligencePanel
                    source={navState.source}
                    gem={navState.gem}
                    entry={navState.entry}
                    evolution={data}
                  />
                )}

                {/* ── Section 3 — Trend summary ─────────────────────────────── */}
                <section
                  className="rounded-[20px] border p-5"
                  style={{ borderColor: tCfg.border, background: tCfg.bg }}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px]"
                        style={{ background: `${tCfg.color}20`, border: `1.5px solid ${tCfg.color}40` }}
                      >
                        <TrendIcon className="h-5 w-5" style={{ color: tCfg.color }} />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: tCfg.color }}>{tCfg.label}</p>
                        <p className="mt-0.5 text-sm text-gray-400">{tCfg.summary}</p>
                        {trend && trend.slopePerYear !== 0 && (
                          <p className="mt-1 text-[11px]" style={{ color: tCfg.color }}>
                            {trend.slopePerYear > 0 ? "+" : ""}{trend.slopePerYear} pts/ano · delta {trend.overallDelta > 0 ? "+" : ""}{trend.overallDelta} pts total
                          </p>
                        )}
                      </div>
                    </div>

                    {data.scoutingScore && (
                      <div className="min-w-[220px] space-y-1.5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Scouting Score</span>
                          <span className="text-xl font-black" style={{ color: tCfg.color }}>
                            {data.scoutingScore.total}
                          </span>
                        </div>
                        <ScoreBar label="Overall"   value={data.scoutingScore.breakdown.overallScore}  color="#00C2FF" />
                        <ScoreBar label="Tendência" value={data.scoutingScore.breakdown.trendScore}    color={tCfg.color} />
                        <ScoreBar label="Valor"     value={data.scoutingScore.breakdown.valueScore}    color="#7A5CFF" />
                        <ScoreBar label="Potencial" value={data.scoutingScore.breakdown.ceilingScore}  color="#FBBF24" />
                      </div>
                    )}
                  </div>
                </section>

                {/* ── Section 4 — Season timeline ───────────────────────────── */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[#00C2FF]" />
                      <h2 className="text-sm font-semibold text-gray-200">Evolução por Temporada</h2>
                      <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] text-gray-500">
                        {seasons.length} temp.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span>mais antigo</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>mais recente</span>
                    </div>
                  </div>

                  {/* Career summary strip */}
                  <CareerSummary seasons={seasons} />

                  {seasons.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-[16px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] py-12">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)]">
                        <Zap className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-400">Nenhuma temporada registrada</p>
                        <p className="mt-0.5 text-xs text-gray-600">Execute o enriquecimento para gerar o histórico.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {seasons.map((season, idx) => (
                        <SeasonRow
                          key={`${season.seasonYear}-${idx}`}
                          season={season}
                          isCurrent={idx === seasons.length - 1}
                          maxOverall={maxOverall}
                          prevOverall={idx > 0 ? (seasons[idx - 1].overall ?? null) : null}
                          index={idx}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* ── Section 5 — DNA ──────────────────────────────────────── */}
                {(() => {
                  // Try DNA from navigation context first, fall back to last season
                  let dna: Record<string, number> | null = null;

                  const ctxDna = navState?.source === "hidden-gems" ? navState.gem?.dnaScore : null;
                  if (ctxDna && typeof ctxDna === "object" && !Array.isArray(ctxDna)) {
                    const entries = Object.entries(ctxDna).filter(([, v]) => typeof v === "number");
                    if (entries.length > 0) dna = Object.fromEntries(entries) as Record<string, number>;
                  }

                  if (!dna) {
                    const dnaRaw = (lastSeason as SeasonPoint & { dnaScore?: unknown })?.dnaScore;
                    if (dnaRaw && typeof dnaRaw === "object" && !Array.isArray(dnaRaw)) {
                      const entries = Object.entries(dnaRaw as object).filter(([, v]) => typeof v === "number");
                      if (entries.length > 0) dna = Object.fromEntries(entries) as Record<string, number>;
                    }
                  }

                  if (!dna) return null;

                  return (
                    <section className="space-y-3 rounded-[20px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-5">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-[#7A5CFF]" />
                        <h2 className="text-sm font-semibold text-gray-200">DNA do Jogador</h2>
                      </div>
                      <DnaBlock dna={dna} />
                    </section>
                  );
                })()}

              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
