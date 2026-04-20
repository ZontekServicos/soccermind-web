import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Crosshair,
  Gem,
  Rocket,
  RotateCcw,
  Sparkles,
  Star,
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
  getScoutingRanking,
  type ScoutingLabel,
  type ScoutingRankingEntry,
} from "../../services/scouting";

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "SS", "CF", "ST"];
const SPORTMONKS_PLACEHOLDER = "placeholder.png";

const LABEL_CONFIG: Record<
  ScoutingLabel,
  { label: string; color: string; bg: string; border: string; glow: string; Icon: React.ElementType }
> = {
  ELITE_PROSPECT: {
    label:  "Elite Prospect",
    color:  "#FFD700",
    bg:     "rgba(255,215,0,0.12)",
    border: "rgba(255,215,0,0.35)",
    glow:   "rgba(255,215,0,0.15)",
    Icon:   Trophy,
  },
  RISING_STAR: {
    label:  "Rising Star",
    color:  "#00C2FF",
    bg:     "rgba(0,194,255,0.12)",
    border: "rgba(0,194,255,0.35)",
    glow:   "rgba(0,194,255,0.12)",
    Icon:   Rocket,
  },
  VALUE_PICK: {
    label:  "Value Pick",
    color:  "#7A5CFF",
    bg:     "rgba(122,92,255,0.14)",
    border: "rgba(122,92,255,0.35)",
    glow:   "rgba(122,92,255,0.12)",
    Icon:   Gem,
  },
  STABLE: {
    label:  "Stable",
    color:  "#94a3b8",
    bg:     "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.22)",
    glow:   "transparent",
    Icon:   Star,
  },
  DECLINING: {
    label:  "Declining",
    color:  "#FF4D4F",
    bg:     "rgba(255,77,79,0.10)",
    border: "rgba(255,77,79,0.28)",
    glow:   "rgba(255,77,79,0.08)",
    Icon:   TrendingDown,
  },
};

const TREND_CONFIG = {
  rising:   { Icon: ArrowUpRight,   color: "#00FF9C", label: "Em alta" },
  stable:   { Icon: ArrowRight,     color: "#94a3b8", label: "Estável" },
  declining:{ Icon: ArrowDownRight, color: "#FF4D4F", label: "Em queda" },
};

const LABEL_OPTIONS: { value: ScoutingLabel | ""; label: string }[] = [
  { value: "",               label: "Todos os perfis" },
  { value: "ELITE_PROSPECT", label: "Elite Prospect" },
  { value: "RISING_STAR",    label: "Rising Star" },
  { value: "VALUE_PICK",     label: "Value Pick" },
  { value: "STABLE",         label: "Stable" },
  { value: "DECLINING",      label: "Declining" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMarketValue(v: number | null) {
  if (v == null) return "N/A";
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `€${(v / 1_000).toFixed(0)}K`;
  return `€${v}`;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#00FF9C";
  if (score >= 60) return "#00C2FF";
  if (score >= 45) return "#7A5CFF";
  if (score >= 30) return "#FBBF24";
  return "#FF4D4F";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlayerAvatar({ name, image, overall }: { name: string; image: string | null; overall: number | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hasImage = !!image && !image.includes(SPORTMONKS_PLACEHOLDER) && !failed;

  const ovr = overall ?? 0;
  const borderColor =
    ovr >= 80 ? "rgba(0,255,156,0.6)"
    : ovr >= 70 ? "rgba(251,191,36,0.5)"
    : "rgba(0,194,255,0.35)";

  if (hasImage) {
    return (
      <div
        className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
        style={{ border: `2px solid ${borderColor}` }}
      >
        <img src={image!} alt={name} className="h-full w-full object-cover object-top" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div
      className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] text-lg font-bold shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
      style={{
        background: "linear-gradient(135deg, rgba(0,194,255,0.22) 0%, rgba(122,92,255,0.22) 100%)",
        border: `2px solid ${borderColor}`,
      }}
    >
      <span className="text-white">{initials}</span>
    </div>
  );
}

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[9px] uppercase tracking-[0.18em] text-gray-500">{label}</span>
    </div>
  );
}

function LabelBadge({ scoutingLabel }: { scoutingLabel: ScoutingLabel }) {
  const cfg = LABEL_CONFIG[scoutingLabel];
  const { Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function TrendBadge({ direction }: { direction: "rising" | "stable" | "declining" }) {
  const cfg = TREND_CONFIG[direction] ?? TREND_CONFIG.stable;
  const { Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ color: cfg.color, background: `${cfg.color}14`, border: `1px solid ${cfg.color}33` }}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function PlayerCard({ entry, rank }: { entry: ScoutingRankingEntry; rank: number }) {
  const navigate = useNavigate();
  const cfg = LABEL_CONFIG[entry.scoutingLabel];
  const primaryPosition = entry.positions[0] ?? "—";

  return (
    <article
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      style={{
        background: "linear-gradient(160deg, rgba(10,27,53,0.98) 0%, rgba(7,20,42,0.96) 100%)",
        borderColor: cfg.border,
        boxShadow: `0 8px_32px_rgba(0,0,0,0.3), inset 0 0 60px ${cfg.glow}`,
      }}
      onClick={() => navigate(`/player/${entry.playerId}`)}
    >
      {/* Top glow strip */}
      <div
        className="absolute left-0 right-0 top-0 h-[2px] opacity-80"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
      />

      {/* Card body */}
      <div className="flex flex-col gap-4 p-5">

        {/* Row 1 — rank + label + trend */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
            >
              {rank}
            </span>
            <LabelBadge scoutingLabel={entry.scoutingLabel} />
          </div>
          <TrendBadge direction={entry.trendDirection} />
        </div>

        {/* Row 2 — avatar + identity */}
        <div className="flex items-start gap-3">
          <PlayerAvatar name={entry.name} image={entry.imagePath} overall={entry.overall} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-white transition-colors group-hover:text-[#00C2FF]">
              {entry.name}
            </h3>
            <p className="text-xs text-gray-400">
              <span
                className="mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: "rgba(0,194,255,0.12)", color: "#00C2FF" }}
              >
                {primaryPosition}
              </span>
              {entry.age != null ? `${entry.age} anos` : "—"}
              {entry.nationality ? ` · ${entry.nationality}` : ""}
            </p>
            {(entry.team || entry.league) && (
              <p className="mt-0.5 truncate text-[11px] text-gray-500">
                {[entry.team, entry.league].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Row 3 — score metrics */}
        <div
          className="grid grid-cols-3 gap-2 rounded-[12px] px-3 py-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <ScoreRing
            value={entry.overall ?? 0}
            label="Overall"
            color={scoreColor(entry.overall ?? 0)}
          />
          <div className="relative flex flex-col items-center gap-1 before:absolute before:left-0 before:top-1/2 before:h-8 before:-translate-y-1/2 before:w-px before:bg-[rgba(255,255,255,0.06)] after:absolute after:right-0 after:top-1/2 after:h-8 after:-translate-y-1/2 after:w-px after:bg-[rgba(255,255,255,0.06)]">
            <span className="text-2xl font-bold tabular-nums" style={{ color: scoreColor(entry.scoutingTotal) }}>
              {entry.scoutingTotal}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-gray-500">Scout</span>
          </div>
          <ScoreRing
            value={entry.breakdown.trendScore}
            label="Trend"
            color={
              entry.trendDirection === "rising" ? "#00FF9C"
              : entry.trendDirection === "declining" ? "#FF4D4F"
              : "#94a3b8"
            }
          />
        </div>

        {/* Row 4 — footer meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            {entry.seasonCount > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {entry.seasonCount} temp{entry.seasonCount !== 1 ? "." : "."}
              </span>
            )}
            {entry.marketValue != null && (
              <span className="font-semibold text-[#00FF9C]">{formatMarketValue(entry.marketValue)}</span>
            )}
            {entry.slopePerYear !== 0 && (
              <span
                className="font-medium"
                style={{ color: entry.slopePerYear > 0 ? "#00FF9C" : "#FF4D4F" }}
              >
                {entry.slopePerYear > 0 ? "+" : ""}{entry.slopePerYear} pts/ano
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

// ─── Filters ──────────────────────────────────────────────────────────────────

interface FiltersState {
  position:   string;
  label:      ScoutingLabel | "";
  ageMax:     string;
  overallMin: string;
}

const DEFAULT_FILTERS: FiltersState = {
  position:   "",
  label:      "",
  ageMax:     "",
  overallMin: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScoutingRanking() {
  const [players, setPlayers] = useState<ScoutingRankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  // local (editing) vs committed (fetched) filters
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [committed, setCommitted] = useState<FiltersState>(DEFAULT_FILTERS);

  const isDirty = JSON.stringify(filters) !== JSON.stringify(committed);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getScoutingRanking({
      position:   committed.position  || undefined,
      label:      (committed.label || undefined) as ScoutingLabel | undefined,
      ageMax:     committed.ageMax    ? Number(committed.ageMax)    : undefined,
      overallMin: committed.overallMin ? Number(committed.overallMin) : undefined,
      limit: 60,
    })
      .then((res) => {
        if (!active) return;
        setPlayers(res.data ?? []);
        setTotal((res.meta as { total?: number } | undefined)?.total ?? res.data?.length ?? null);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setPlayers([]);
        setError(err instanceof Error ? err.message : "Erro ao carregar ranking");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [committed]);

  const handleApply = () => {
    setCommitted({ ...filters });
  };

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    setCommitted(DEFAULT_FILTERS);
  };

  // label distribution for header chips
  const labelCounts = players.reduce<Partial<Record<ScoutingLabel, number>>>((acc, p) => {
    acc[p.scoutingLabel] = (acc[p.scoutingLabel] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-[1600px] space-y-6">

            {/* ── Hero header ──────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-24 -top-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.12),transparent_68%)] blur-2xl" />
              <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.1),transparent_72%)] blur-2xl" />

              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#7FDBFF]">
                    <Crosshair className="h-3.5 w-3.5" />
                    Scout Intelligence · AI
                  </div>
                  <h1 className="text-4xl font-semibold text-white">Ranking Inteligente</h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
                    Jogadores identificados automaticamente por overall, tendência de crescimento e eficiência de valor.
                  </p>
                </div>

                {/* Stats strip */}
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#00C2FF]" />
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Jogadores</p>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-[#00C2FF]">{total ?? players.length}</p>
                  </div>
                  {(["ELITE_PROSPECT", "RISING_STAR", "VALUE_PICK"] as ScoutingLabel[]).map((lbl) => {
                    const cnt = labelCounts[lbl] ?? 0;
                    if (!cnt) return null;
                    const cfg = LABEL_CONFIG[lbl];
                    return (
                      <div
                        key={lbl}
                        className="rounded-[16px] border px-4 py-3"
                        style={{ borderColor: cfg.border, background: cfg.bg }}
                      >
                        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: cfg.color }}>
                          {cfg.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold" style={{ color: cfg.color }}>{cnt}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── Filters ───────────────────────────────────────────────────── */}
            <section className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5">
              <div className="flex flex-wrap items-end gap-4">

                {/* Position chips */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Posição</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POSITIONS.map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setFilters((f) => ({ ...f, position: f.position === pos ? "" : pos }))}
                        className="rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold transition-all"
                        style={
                          filters.position === pos
                            ? { borderColor: "#00C2FF", background: "rgba(0,194,255,0.15)", color: "#00C2FF" }
                            : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#94a3b8" }
                        }
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label selector */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Perfil</span>
                  <div className="relative">
                    <select
                      value={filters.label}
                      onChange={(e) => setFilters((f) => ({ ...f, label: e.target.value as ScoutingLabel | "" }))}
                      className="appearance-none rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 pr-8 text-sm text-gray-300 focus:border-[#00C2FF] focus:outline-none"
                    >
                      {LABEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#07142A]">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                {/* Age max */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Idade máx.</span>
                  <input
                    type="number"
                    min={15}
                    max={45}
                    placeholder="ex: 23"
                    value={filters.ageMax}
                    onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value }))}
                    className="w-24 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-[#00C2FF] focus:outline-none"
                  />
                </div>

                {/* Overall min */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Overall mín.</span>
                  <input
                    type="number"
                    min={40}
                    max={99}
                    placeholder="ex: 70"
                    value={filters.overallMin}
                    onChange={(e) => setFilters((f) => ({ ...f, overallMin: e.target.value }))}
                    className="w-24 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-[#00C2FF] focus:outline-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="ml-auto flex items-center gap-2">
                  {isDirty && (
                    <span className="rounded-full border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)] px-3 py-1.5 text-xs font-medium text-[#FBBF24]">
                      Filtros modificados
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!isDirty}
                    className="inline-flex items-center gap-2 rounded-[12px] bg-[#00C2FF] px-5 py-2.5 text-sm font-bold text-[#07142A] shadow-[0_4px_20px_rgba(0,194,255,0.3)] transition-all hover:bg-[#33CFFF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Sparkles className="h-4 w-4" />
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-2 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 text-sm font-medium text-gray-400 transition-all hover:border-[rgba(255,255,255,0.15)] hover:text-gray-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpar
                  </button>
                </div>
              </div>
            </section>

            {/* ── Error state ───────────────────────────────────────────────── */}
            {error && (
              <div className="rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {error}
              </div>
            )}

            {/* ── Loading skeleton ──────────────────────────────────────────── */}
            {loading && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-[20px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-5"
                    style={{ height: 240 }}
                  />
                ))}
              </div>
            )}

            {/* ── Cards grid ────────────────────────────────────────────────── */}
            {!loading && players.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {players.map((entry) => (
                  <PlayerCard key={entry.playerId} entry={entry} rank={entry.rank} />
                ))}
              </div>
            )}

            {/* ── Empty state ───────────────────────────────────────────────── */}
            {!loading && players.length === 0 && !error && (
              <div className="flex flex-col items-center gap-4 py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)]">
                  <Zap className="h-7 w-7 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">
                  Nenhum jogador encontrado com os filtros aplicados.
                </p>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-[#00C2FF] underline-offset-2 hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
