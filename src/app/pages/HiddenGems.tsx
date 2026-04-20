import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Gem,
  Lightbulb,
  Rocket,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import {
  getHiddenGems,
  type HiddenGemEntry,
  type ScoutingLabel,
  type TrendDirection,
} from "../../services/hiddenGems";

// ─── Label config ─────────────────────────────────────────────────────────────

const LABEL_CFG: Record<
  ScoutingLabel,
  { label: string; color: string; bg: string; border: string; glow: string; Icon: React.ElementType }
> = {
  ELITE_PROSPECT: {
    label: "Elite Prospect",
    color: "#FFD700",
    bg:    "rgba(255,215,0,0.11)",
    border:"rgba(255,215,0,0.32)",
    glow:  "rgba(255,215,0,0.12)",
    Icon:  Trophy,
  },
  RISING_STAR: {
    label: "Rising Star",
    color: "#00C2FF",
    bg:    "rgba(0,194,255,0.11)",
    border:"rgba(0,194,255,0.32)",
    glow:  "rgba(0,194,255,0.10)",
    Icon:  Rocket,
  },
  VALUE_PICK: {
    label: "Value Pick",
    color: "#7A5CFF",
    bg:    "rgba(122,92,255,0.13)",
    border:"rgba(122,92,255,0.32)",
    glow:  "rgba(122,92,255,0.10)",
    Icon:  Gem,
  },
  STABLE: {
    label: "Stable",
    color: "#94a3b8",
    bg:    "rgba(148,163,184,0.08)",
    border:"rgba(148,163,184,0.2)",
    glow:  "transparent",
    Icon:  Sparkles,
  },
  DECLINING: {
    label: "Declining",
    color: "#FF4D4F",
    bg:    "rgba(255,77,79,0.09)",
    border:"rgba(255,77,79,0.26)",
    glow:  "rgba(255,77,79,0.06)",
    Icon:  TrendingDown,
  },
};

const TREND_CFG: Record<TrendDirection, { Icon: React.ElementType; color: string; label: string }> = {
  rising:   { Icon: ArrowUpRight,   color: "#00FF9C", label: "Em Alta" },
  stable:   { Icon: ArrowRight,     color: "#94a3b8", label: "Estável" },
  declining:{ Icon: ArrowDownRight, color: "#FF4D4F", label: "Em Queda" },
};

// ─── Gem explanation engine ───────────────────────────────────────────────────

function gemExplanation(player: HiddenGemEntry): { text: string; icon: React.ElementType; color: string } {
  const {
    age,
    trendDirection,
    scoutingScore: { breakdown, label },
    overall,
    potential,
  } = player;

  const isYoung    = (age ?? 99) <= 22;
  const isTeen     = (age ?? 99) <= 19;
  const isRising   = trendDirection === "rising";
  const highValue  = breakdown.valueScore  >= 65;
  const highTrend  = breakdown.trendScore  >= 70;
  const highCeil   = breakdown.ceilingScore >= 60;
  const potGap     = (potential ?? 0) - (overall ?? 0);

  if (isTeen && isRising)
    return { text: "Talento excepcional — teenager em forte ascensão", icon: Rocket, color: "#00C2FF" };
  if (isYoung && isRising && highValue)
    return { text: "Jovem em crescimento com custo abaixo do mercado", icon: TrendingUp, color: "#00FF9C" };
  if (highValue && highTrend)
    return { text: "Alta evolução + baixo valor de mercado", icon: Gem, color: "#7A5CFF" };
  if (highValue && label === "VALUE_PICK")
    return { text: "Excelente custo-benefício — talento subvalorizado", icon: Gem, color: "#7A5CFF" };
  if (isRising && highTrend)
    return { text: "Crescimento consistente nas últimas temporadas", icon: TrendingUp, color: "#00FF9C" };
  if (highCeil && potGap >= 8)
    return { text: `Teto elevado — potencial ${potGap} pts acima do atual`, icon: Zap, color: "#FBBF24" };
  if (isYoung && highValue)
    return { text: "Jovem com forte custo-benefício para investimento", icon: Sparkles, color: "#00C2FF" };
  if (highValue)
    return { text: "Preço de mercado abaixo do que o desempenho justifica", icon: Gem, color: "#7A5CFF" };
  return { text: "Perfil promissor com bom potencial de valorização", icon: Lightbulb, color: "#FBBF24" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SPORTMONKS_PLACEHOLDER = "placeholder.png";

function formatMV(v: number | null) {
  if (v == null) return null;
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `€${(v / 1_000).toFixed(0)}K`;
  return `€${v}`;
}

function scoreColor(s: number): string {
  if (s >= 75) return "#00FF9C";
  if (s >= 60) return "#00C2FF";
  if (s >= 45) return "#7A5CFF";
  if (s >= 30) return "#FBBF24";
  return "#FF4D4F";
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function GemAvatar({ name, image, overall }: { name: string; image: string | null; overall: number | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hasImage = !!image && !image.includes(SPORTMONKS_PLACEHOLDER) && !failed;

  const ovr = overall ?? 0;
  const borderColor = ovr >= 80 ? "rgba(0,255,156,0.65)" : ovr >= 70 ? "rgba(251,191,36,0.55)" : "rgba(0,194,255,0.4)";

  if (hasImage) {
    return (
      <div
        className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[16px] shadow-[0_6px_20px_rgba(0,0,0,0.5)]"
        style={{ border: `2px solid ${borderColor}` }}
      >
        <img src={image!} alt={name} className="h-full w-full object-cover object-top" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div
      className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[16px] text-xl font-black shadow-[0_6px_20px_rgba(0,0,0,0.5)]"
      style={{
        background: "linear-gradient(135deg, rgba(0,194,255,0.25) 0%, rgba(122,92,255,0.25) 100%)",
        border: `2px solid ${borderColor}`,
      }}
    >
      <span className="text-white">{initials}</span>
    </div>
  );
}

// ─── Score pill ───────────────────────────────────────────────────────────────

function ScorePill({ value, label }: { value: number; label: string }) {
  const color = scoreColor(value);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-black tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[9px] uppercase tracking-[0.15em] text-gray-500">{label}</span>
    </div>
  );
}

// ─── Gem card ─────────────────────────────────────────────────────────────────

function GemCard({ gem, index }: { gem: HiddenGemEntry; index: number }) {
  const navigate = useNavigate();

  const labelCfg  = LABEL_CFG[gem.scoutingScore.label] ?? LABEL_CFG.STABLE;
  const trendCfg  = TREND_CFG[gem.trendDirection]  ?? TREND_CFG.stable;
  const insight   = gemExplanation(gem);
  const mv        = formatMV(gem.marketValue);
  const pos       = gem.positions[0] ?? "—";

  const { Icon: LabelIcon } = labelCfg;
  const { Icon: TrendIcon } = trendCfg;
  const { icon: InsightIcon } = insight;

  return (
    <article
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[22px] border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
      style={{
        background: `linear-gradient(160deg, rgba(10,27,53,0.99) 0%, rgba(7,20,42,0.97) 100%)`,
        borderColor: labelCfg.border,
        boxShadow: `0 4px 24px rgba(0,0,0,0.35), inset 0 0 80px ${labelCfg.glow}`,
        animationDelay: `${index * 40}ms`,
      }}
      onClick={() => navigate(`/player/${gem.id}`)}
    >
      {/* Top glow strip */}
      <div
        className="absolute left-0 right-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${labelCfg.color} 40%, ${labelCfg.color} 60%, transparent 95%)` }}
      />

      {/* Ambient glow corner */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${labelCfg.color}22, transparent 70%)` }}
      />

      <div className="relative flex flex-col gap-4 p-5">

        {/* ── Row 1 — badges ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          {/* Hidden gem badge */}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
            style={{
              background: "linear-gradient(90deg, rgba(122,92,255,0.2), rgba(0,194,255,0.15))",
              border: "1px solid rgba(0,194,255,0.25)",
              color: "#9BE7FF",
            }}
          >
            <Gem className="h-3 w-3" />
            Hidden Gem
          </span>

          <div className="flex items-center gap-1.5">
            {/* Label badge */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: labelCfg.color, background: labelCfg.bg, border: `1px solid ${labelCfg.border}` }}
            >
              <LabelIcon className="h-2.5 w-2.5" />
              {labelCfg.label}
            </span>

            {/* Trend badge */}
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ color: trendCfg.color, background: `${trendCfg.color}14`, border: `1px solid ${trendCfg.color}30` }}
            >
              <TrendIcon className="h-2.5 w-2.5" />
              {trendCfg.label}
            </span>
          </div>
        </div>

        {/* ── Row 2 — identity ──────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <GemAvatar name={gem.name} image={gem.imagePath} overall={gem.overall} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-white transition-colors group-hover:text-[#00C2FF]">
              {gem.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(0,194,255,0.12)", color: "#00C2FF" }}
              >
                {pos}
              </span>
              {gem.age != null && <span>{gem.age} anos</span>}
              {gem.nationality && <><span className="opacity-30">·</span><span>{gem.nationality}</span></>}
            </p>
            {(gem.team || gem.league) && (
              <p className="mt-1 truncate text-[11px] text-gray-500">
                {[gem.team, gem.league].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* ── Row 3 — score pills ───────────────────────────────────── */}
        <div
          className="grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.05)] rounded-[12px] py-3"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex justify-center px-2">
            <ScorePill value={gem.overall ?? 0}            label="Overall" />
          </div>
          <div className="flex justify-center px-2">
            <ScorePill value={gem.scoutingScore.total}     label="Scout"   />
          </div>
          <div className="flex justify-center px-2">
            <ScorePill value={gem.scoutingScore.breakdown.trendScore} label="Trend" />
          </div>
        </div>

        {/* ── Row 4 — insight box ───────────────────────────────────── */}
        <div
          className="flex items-center gap-2.5 rounded-[12px] px-3 py-2.5"
          style={{
            background: `linear-gradient(90deg, ${insight.color}10, ${insight.color}06)`,
            border: `1px solid ${insight.color}28`,
          }}
        >
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: `${insight.color}20` }}
          >
            <InsightIcon className="h-3.5 w-3.5" style={{ color: insight.color }} />
          </div>
          <p className="text-[11px] font-medium leading-snug" style={{ color: `${insight.color}cc` }}>
            {insight.text}
          </p>
        </div>

        {/* ── Row 5 — footer ────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            {gem.seasonCount > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {gem.seasonCount} temp{gem.seasonCount !== 1 ? "." : "."}
              </span>
            )}
            {mv && (
              <span className="font-semibold" style={{ color: "#00FF9C" }}>{mv}</span>
            )}
            {gem.trendDelta !== 0 && (
              <span
                className="font-medium"
                style={{ color: gem.trendDelta > 0 ? "#00FF9C" : "#FF4D4F" }}
              >
                {gem.trendDelta > 0 ? "+" : ""}{gem.trendDelta} pts
              </span>
            )}
          </div>
          <span className="rounded-[8px] bg-[rgba(0,194,255,0.1)] px-2.5 py-1 text-[11px] font-semibold text-[#00C2FF] opacity-0 transition-opacity group-hover:opacity-100">
            Ver →
          </span>
        </div>

      </div>
    </article>
  );
}

// ─── Stat strip ───────────────────────────────────────────────────────────────

function HeaderStat({ icon: Icon, label, value, color }: {
  icon:  React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" style={{ color }} />
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HiddenGems() {
  const [gems, setGems] = useState<HiddenGemEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getHiddenGems(30)
      .then((res) => {
        if (!active) return;
        setGems(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar hidden gems");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [fetchKey]);

  // Distribution stats
  const risingCount  = gems.filter((g) => g.trendDirection === "rising").length;
  const youngCount   = gems.filter((g) => (g.age ?? 99) <= 22).length;
  const valuePicks   = gems.filter((g) => g.scoutingScore.label === "VALUE_PICK").length;

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-[1600px] space-y-6">

            {/* ── Hero ───────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              {/* Ambient blobs */}
              <div className="pointer-events-none absolute -right-16 -top-8 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.18),transparent_65%)] blur-3xl" />
              <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.12),transparent_68%)] blur-2xl" />
              <div className="pointer-events-none absolute right-1/3 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.08),transparent_70%)] blur-2xl" />

              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  {/* Tag */}
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(122,92,255,0.3)] bg-[rgba(122,92,255,0.1)] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.24em] text-[#A78BFF]">
                    <Gem className="h-3.5 w-3.5" />
                    Scout Intelligence · Hidden Gems
                  </div>

                  <h1 className="text-4xl font-black text-white">
                    Hidden{" "}
                    <span
                      className="bg-clip-text text-transparent"
                      style={{ backgroundImage: "linear-gradient(90deg, #7A5CFF, #00C2FF)" }}
                    >
                      Gems
                    </span>
                  </h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-400">
                    Jogadores promissores e subvalorizados identificados por IA — custo-benefício superior, tendência positiva e alto potencial de valorização.
                  </p>
                </div>

                {/* Stats strip */}
                {!loading && gems.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    <HeaderStat icon={Users}       label="Gems"          value={gems.length}   color="#00C2FF" />
                    <HeaderStat icon={TrendingUp}  label="Em Alta"       value={risingCount}   color="#00FF9C" />
                    <HeaderStat icon={Zap}         label="≤ 22 anos"     value={youngCount}    color="#FBBF24" />
                    <HeaderStat icon={Gem}         label="Value Picks"   value={valuePicks}    color="#7A5CFF" />
                  </div>
                )}
              </div>
            </section>

            {/* ── Legend ─────────────────────────────────────────────────────── */}
            {!loading && gems.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 px-1 text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#00C2FF]" />
                  <span style={{ color: "#00C2FF" }}>Rising Star</span> — crescimento recente
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#7A5CFF]" />
                  <span style={{ color: "#7A5CFF" }}>Value Pick</span> — custo abaixo do valor real
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#FFD700]" />
                  <span style={{ color: "#FFD700" }}>Elite Prospect</span> — qualidade + tendência
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3 text-[#FBBF24]" />
                  <span>Insights gerados automaticamente por IA</span>
                </span>
              </div>
            )}

            {/* ── Error ──────────────────────────────────────────────────────── */}
            {error && (
              <div className="flex items-center gap-3 rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4">
                <Zap className="h-5 w-5 flex-shrink-0 text-[#FF4D4F]" />
                <p className="text-sm text-[#FFB4B5]">{error}</p>
                <button
                  type="button"
                  onClick={() => setFetchKey((k) => k + 1)}
                  className="ml-auto flex items-center gap-1.5 rounded-[10px] border border-[rgba(255,77,79,0.3)] px-3 py-1.5 text-xs text-[#FF4D4F] transition-all hover:bg-[rgba(255,77,79,0.1)]"
                >
                  <RotateCcw className="h-3 w-3" />
                  Tentar novamente
                </button>
              </div>
            )}

            {/* ── Skeleton ───────────────────────────────────────────────────── */}
            {loading && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-[22px] border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)]"
                    style={{ height: 310 }}
                  />
                ))}
              </div>
            )}

            {/* ── Cards grid ─────────────────────────────────────────────────── */}
            {!loading && gems.length > 0 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {gems.map((gem, i) => (
                  <GemCard key={gem.id} gem={gem} index={i} />
                ))}
              </div>
            )}

            {/* ── Empty ──────────────────────────────────────────────────────── */}
            {!loading && !error && gems.length === 0 && (
              <div className="flex flex-col items-center gap-5 py-24">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: "rgba(122,92,255,0.12)", border: "1.5px solid rgba(122,92,255,0.3)" }}
                >
                  <Gem className="h-9 w-9 text-[#7A5CFF]" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-300">Nenhuma gem encontrada</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Execute o enriquecimento de dados para identificar jogadores subvalorizados.
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
