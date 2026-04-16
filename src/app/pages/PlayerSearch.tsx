import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  GitCompareArrows,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { PlayersFiltersPanel } from "../components/PlayersFiltersPanel";
import type { PlayerCardModel } from "../mappers/player.mapper";
import { getRankingData } from "../services/ranking";
import { type PlayerFilterOptions } from "../services/players";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../services/watchlist";
import {
  buildApiFilters,
  countActiveFilters,
  DEFAULT_PLAYERS_FILTERS,
  type FilterFieldKey,
  type PlayersFiltersState,
} from "../utils/playerFilters";
import { positionLabel } from "../utils/positions";

type SortBy    = "overall" | "potential" | "age";
type SortOrder = "asc" | "desc";

interface PaginationMeta {
  page?: number; totalPages?: number; total?: number; source?: string;
}

const SPORTMONKS_PLACEHOLDER = "placeholder.png";

const EMPTY_FILTER_OPTIONS: PlayerFilterOptions = {
  positions: [], nationalities: [], teams: [], leagues: [], sources: [],
};

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function getPositionColor(position: string) {
  const colors: Record<string, string> = {
    ST:  "bg-[#FF4D4F]/15 text-[#FF4D4F] border-[#FF4D4F]/25",
    CF:  "bg-[#FF4D4F]/15 text-[#FF4D4F] border-[#FF4D4F]/25",
    LW:  "bg-[#7A5CFF]/15 text-[#7A5CFF] border-[#7A5CFF]/25",
    RW:  "bg-[#7A5CFF]/15 text-[#7A5CFF] border-[#7A5CFF]/25",
    CAM: "bg-[#00C2FF]/15 text-[#00C2FF] border-[#00C2FF]/25",
    CM:  "bg-[#00C2FF]/15 text-[#00C2FF] border-[#00C2FF]/25",
    CDM: "bg-[#00FF9C]/15 text-[#00FF9C] border-[#00FF9C]/25",
    LB:  "bg-amber-500/15 text-amber-400 border-amber-500/25",
    RB:  "bg-amber-500/15 text-amber-400 border-amber-500/25",
    CB:  "bg-[#00FF9C]/15 text-[#00FF9C] border-[#00FF9C]/25",
    GK:  "bg-orange-500/15 text-orange-400 border-orange-500/25",
  };
  return colors[position] ?? "bg-gray-500/15 text-gray-400 border-gray-500/25";
}

function getPlayerLevel(overall: number | null) {
  const ovr = overall ?? 0;
  if (ovr >= 90) return { label: "Ícone",    color: "#FFD700", bg: "rgba(255,215,0,0.12)",   border: "rgba(255,215,0,0.30)"  };
  if (ovr >= 85) return { label: "Elite",    color: "#00FF9C", bg: "rgba(0,255,156,0.10)",   border: "rgba(0,255,156,0.28)"  };
  if (ovr >= 80) return { label: "Premium",  color: "#00C2FF", bg: "rgba(0,194,255,0.10)",   border: "rgba(0,194,255,0.26)"  };
  if (ovr >= 75) return { label: "Destaque", color: "#7A5CFF", bg: "rgba(122,92,255,0.11)",  border: "rgba(122,92,255,0.26)" };
  if (ovr >= 70) return { label: "Regular",  color: "#FBBF24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.26)" };
  if (ovr >= 65) return { label: "Básico",   color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.22)" };
  return           { label: "Promessa",   color: "#C084FC", bg: "rgba(192,132,252,0.09)",  border: "rgba(192,132,252,0.24)" };
}

function formatMarketValue(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// Value Score
// ---------------------------------------------------------------------------

function computeValueScore(overall: number | null, marketValue: number | null): number | null {
  if (!overall || !marketValue || marketValue <= 0) return null;
  return Math.round((overall / (marketValue / 1_000_000)) * 10) / 10;
}

interface VSStyle { color: string; bg: string; border: string; label: string }

function getVSStyle(vs: number | null): VSStyle | null {
  if (vs === null) return null;
  if (vs > 3) return { color: "#00FF9C", bg: "rgba(0,255,156,0.10)",  border: "rgba(0,255,156,0.28)",  label: "Bom negócio" };
  if (vs >= 2) return { color: "#FBBF24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.28)", label: "Mercado" };
  return        { color: "#00C2FF", bg: "rgba(0,194,255,0.10)",  border: "rgba(0,194,255,0.28)",  label: "Precificado" };
}

function getMVContext(vs: number | null): { label: string; color: string } | null {
  if (vs === null) return null;
  if (vs > 3) return { label: "baixo",  color: "#00FF9C" };
  if (vs >= 2) return { label: "justo",  color: "#94A3B8" };
  return        { label: "alto",   color: "#FF7B7D" };
}

// ---------------------------------------------------------------------------
// Rank highlight
// ---------------------------------------------------------------------------

interface RankStyle {
  cardGlow:   string;
  rankColor:  string;
  rankBg:     string;
  topBadge:   string | null;
}

function getRankStyle(rank: number): RankStyle {
  if (rank === 1) return {
    cardGlow:  "shadow-[0_0_32px_rgba(0,255,156,0.20)] border-[rgba(0,255,156,0.22)]",
    rankColor: "#00FF9C",
    rankBg:    "rgba(0,255,156,0.12)",
    topBadge:  "BEST VALUE",
  };
  if (rank === 2) return {
    cardGlow:  "shadow-[0_0_24px_rgba(0,194,255,0.16)] border-[rgba(0,194,255,0.20)]",
    rankColor: "#00C2FF",
    rankBg:    "rgba(0,194,255,0.10)",
    topBadge:  null,
  };
  if (rank === 3) return {
    cardGlow:  "shadow-[0_0_20px_rgba(122,92,255,0.14)] border-[rgba(122,92,255,0.20)]",
    rankColor: "#7A5CFF",
    rankBg:    "rgba(122,92,255,0.10)",
    topBadge:  null,
  };
  return {
    cardGlow:  "shadow-[0_2px_12px_rgba(0,0,0,0.30)] border-[rgba(255,255,255,0.06)]",
    rankColor: "#4B5563",
    rankBg:    "transparent",
    topBadge:  null,
  };
}

// ---------------------------------------------------------------------------
// Avatar with glow
// ---------------------------------------------------------------------------

function PlayerAvatar({ name, image, overall }: { name: string; image: string | null; overall: number | null }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials  = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hasReal   = !!image && !image.includes(SPORTMONKS_PLACEHOLDER) && !imgFailed;
  const ovr       = overall ?? 0;

  const glowColor =
    ovr >= 85 ? "rgba(0,255,156,0.55)" :
    ovr >= 80 ? "rgba(0,194,255,0.50)" :
    ovr >= 75 ? "rgba(122,92,255,0.45)" :
    ovr >= 70 ? "rgba(251,191,36,0.40)" :
                "rgba(255,255,255,0.18)";

  const glowShadow =
    ovr >= 85 ? "0 0 20px rgba(0,255,156,0.30)" :
    ovr >= 80 ? "0 0 16px rgba(0,194,255,0.25)" :
    ovr >= 75 ? "0 0 14px rgba(122,92,255,0.22)" :
    ovr >= 70 ? "0 0 12px rgba(251,191,36,0.20)" :
                "none";

  const base = "flex-shrink-0 h-[60px] w-[60px] rounded-[14px] overflow-hidden";

  if (hasReal) {
    return (
      <div className={base} style={{ border: `1.5px solid ${glowColor}`, boxShadow: glowShadow }}>
        <img src={image!} alt={name} className="h-full w-full object-cover object-top" onError={() => setImgFailed(true)} />
      </div>
    );
  }

  return (
    <div
      className={`${base} flex items-center justify-center text-base font-semibold text-white`}
      style={{
        background:  "linear-gradient(135deg,rgba(0,194,255,0.22) 0%,rgba(122,92,255,0.22) 100%)",
        border:      `1.5px solid ${glowColor}`,
        boxShadow:   glowShadow,
      }}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overall display
// ---------------------------------------------------------------------------

function OverallDisplay({ overall, potential }: { overall: number | null; potential: number | null }) {
  const ovr = overall ?? 0;
  const color =
    ovr >= 88 ? "#FFD700" :
    ovr >= 82 ? "#00FF9C" :
    ovr >= 76 ? "#00C2FF" :
    ovr >= 68 ? "#7A5CFF" :
    ovr >= 55 ? "#FBBF24" :
                "#94A3B8";

  const hasTrendUp = potential !== null && overall !== null && potential > overall + 5;

  return (
    <div className="flex items-end gap-3">
      {/* OVERALL — main number */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-[0.22em] text-gray-600">OVR</span>
        <span
          className="text-[34px] font-extrabold leading-none tabular-nums"
          style={{ color, textShadow: `0 0 24px ${color}55` }}
        >
          {overall ?? "—"}
        </span>
      </div>

      {/* POTENTIAL — secondary */}
      <div className="mb-0.5 flex flex-col items-center">
        <span className="text-[9px] uppercase tracking-[0.20em] text-gray-600">POT</span>
        <div className="flex items-center gap-0.5">
          <span className="text-[18px] font-bold tabular-nums text-gray-300">
            {potential ?? "—"}
          </span>
          {hasTrendUp && <TrendingUp className="h-3.5 w-3.5 text-[#00FF9C]/70" />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scout card (single row)
// ---------------------------------------------------------------------------

interface ScoutCardProps {
  player:       PlayerCardModel;
  rank:         number;
  isWatched:    boolean;
  onNavigate:   () => void;
  onCompare:    () => void;
  onWatchlist:  () => void;
}

function ScoutCard({ player, rank, isWatched, onNavigate, onCompare, onWatchlist }: ScoutCardProps) {
  const rs     = getRankStyle(rank);
  const level  = getPlayerLevel(player.overall);
  const vs     = computeValueScore(player.overall, player.marketValue);
  const vsStyle = getVSStyle(vs);
  const mvCtx  = getMVContext(vs);

  return (
    <div
      className={`group relative flex cursor-pointer items-center gap-5 rounded-[20px] border px-6 py-5 transition-all duration-200 hover:scale-[1.003] hover:border-[rgba(0,194,255,0.28)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(0,194,255,0.08)] ${rs.cardGlow}`}
      style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(0,0,0,0.18) 100%)" }}
      onClick={onNavigate}
    >
      {/* Top-edge shimmer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[20px] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />

      {/* ── 1. RANK ─────────────────────────────────────────────────────── */}
      <div className="flex w-10 flex-shrink-0 flex-col items-center gap-1.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[13px] font-extrabold tabular-nums"
          style={{ color: rs.rankColor, background: rs.rankBg }}
        >
          {rank}
        </div>
        {rs.topBadge && (
          <span
            className="rounded-[5px] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: rs.rankColor, background: `${rs.rankBg}`, border: `1px solid ${rs.rankColor}44` }}
          >
            {rs.topBadge}
          </span>
        )}
      </div>

      {/* ── 2. AVATAR ───────────────────────────────────────────────────── */}
      <PlayerAvatar name={player.name} image={player.image} overall={player.overall} />

      {/* ── 3. IDENTITY ─────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold leading-tight text-white transition-colors group-hover:text-[#9BE7FF]">
            {player.name}
          </span>
          {/* Level badge */}
          <span
            className="rounded-[6px] border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: level.color, background: level.bg, borderColor: level.border }}
          >
            {level.label}
          </span>
        </div>

        {/* Position + Club */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {player.position && (
            <span className={`${getPositionColor(player.position)} rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold`}>
              {positionLabel(player.position)}
            </span>
          )}
          <span className="text-[12px] text-gray-500">
            {player.team ?? "—"}
          </span>
        </div>

        {/* Nationality · Age */}
        <p className="mt-1 text-[11px] text-gray-600">
          {[player.nationality, player.age ? `${player.age} anos` : null]
            .filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* ── 4. METRICS ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0">
        <OverallDisplay overall={player.overall} potential={player.potential} />
      </div>

      {/* Separator */}
      <div className="h-12 w-px flex-shrink-0 bg-white/[0.06]" />

      {/* ── 5. VALUE SCORE ──────────────────────────────────────────────── */}
      <div className="w-28 flex-shrink-0">
        {vsStyle ? (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[9px] uppercase tracking-[0.22em] text-gray-600">Value Score</span>
            <span
              className="rounded-[8px] border px-2.5 py-1 text-[18px] font-extrabold tabular-nums leading-none"
              style={{ color: vsStyle.color, background: vsStyle.bg, borderColor: vsStyle.border }}
              title={vsStyle.label}
            >
              {vs}
            </span>
            <span className="text-[9px] font-medium" style={{ color: vsStyle.color }}>
              {vsStyle.label}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-gray-700">VS —</span>
        )}
      </div>

      {/* ── 6. CONTEXT ──────────────────────────────────────────────────── */}
      <div className="w-28 flex-shrink-0 text-right">
        <span className="text-[9px] uppercase tracking-[0.22em] text-gray-600">Valor</span>
        <p className="mt-0.5 text-[16px] font-bold tabular-nums text-white">
          {formatMarketValue(player.marketValue)}
        </p>
        {mvCtx && (
          <span className="text-[10px] font-medium" style={{ color: mvCtx.color }}>
            {mvCtx.label}
          </span>
        )}
      </div>

      {/* Separator */}
      <div className="h-12 w-px flex-shrink-0 bg-white/[0.06]" />

      {/* ── 7. ACTIONS ──────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {/* Watchlist */}
          <button
            className={`inline-flex h-8 w-8 items-center justify-center rounded-[9px] border transition-all ${
              isWatched
                ? "border-[#fbbf24] bg-[#fbbf24]/12 text-[#fbbf24]"
                : "border-white/[0.08] bg-white/[0.03] text-gray-500 hover:border-[#fbbf24]/50 hover:text-[#fbbf24]"
            }`}
            onClick={(e) => { e.stopPropagation(); onWatchlist(); }}
            title={isWatched ? "Remover da watchlist" : "Adicionar à watchlist"}
          >
            <Star className="h-3.5 w-3.5" fill={isWatched ? "currentColor" : "none"} />
          </button>

          {/* Compare */}
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] border border-white/[0.08] bg-white/[0.03] text-gray-500 transition-all hover:border-[rgba(122,92,255,0.45)] hover:text-[#7A5CFF]"
            onClick={(e) => { e.stopPropagation(); onCompare(); }}
            title="Comparar jogador"
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Ver detalhes */}
        <button
          className="rounded-[9px] bg-[#00C2FF]/12 px-3 py-1.5 text-[11px] font-semibold text-[#00C2FF] ring-1 ring-[rgba(0,194,255,0.28)] transition-all hover:bg-[#00C2FF]/20 hover:ring-[rgba(0,194,255,0.50)]"
          onClick={(e) => { e.stopPropagation(); onNavigate(); }}
        >
          Ver detalhes
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort header button
// ---------------------------------------------------------------------------

function SortButton({ label, field, active, order, onClick }: {
  label: string; field: SortBy; active: boolean; order: SortOrder; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[11px] font-medium transition-all ${
        active
          ? "bg-[rgba(0,194,255,0.12)] text-[#00C2FF] ring-1 ring-[rgba(0,194,255,0.30)]"
          : "text-gray-500 hover:text-gray-300"
      }`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
      {active && (
        <span className="text-[9px]">{order === "desc" ? "↓" : "↑"}</span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PlayerSearch() {
  const navigate = useNavigate();

  const [players,       setPlayers]       = useState<PlayerCardModel[]>([]);
  const [watchlistIds,  setWatchlistIds]  = useState<Set<string>>(new Set());
  const [filters,       setFilters]       = useState<PlayersFiltersState>(DEFAULT_PLAYERS_FILTERS);
  const [sortBy,        setSortBy]        = useState<SortBy>("overall");
  const [sortOrder,     setSortOrder]     = useState<SortOrder>("desc");
  const [page,          setPage]          = useState(1);
  const [meta,          setMeta]          = useState<PaginationMeta>({});
  const [filterOptions, setFilterOptions] = useState<PlayerFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [hasSearched,   setHasSearched]   = useState(false);
  const limit = 20;

  // Load watchlist on mount
  useEffect(() => {
    let active = true;
    getWatchlist()
      .then((response) => {
        if (!active) return;
        const ids = new Set(
          Array.isArray(response.data)
            ? response.data
                .map((item) => item && typeof item === "object" && "playerId" in item ? String(item.playerId) : null)
                .filter((item): item is string => Boolean(item))
            : [],
        );
        setWatchlistIds(ids);
      })
      .catch(() => { if (active) setWatchlistIds(new Set()); });
    return () => { active = false; };
  }, []);

  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);

  const sortedPlayers = useMemo(() => {
    const list = [...players];
    list.sort((a, b) => {
      const val = (v: number | null) => v ?? -1;
      return (val(a[sortBy]) - val(b[sortBy])) * (sortOrder === "asc" ? 1 : -1);
    });
    return list;
  }, [players, sortBy, sortOrder]);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      const apiParams  = buildApiFilters(filters, filters.search.trim());
      const response   = await getRankingData({ ...apiParams, page, limit });
      const nextMeta   = (response.data.meta || response.meta || {}) as PaginationMeta;
      setPlayers(Array.isArray(response.data.players) ? response.data.players : []);
      setMeta(nextMeta);
      setFilterOptions(response.data.filterOptions ?? EMPTY_FILTER_OPTIONS);
    } catch (fetchError) {
      setPlayers([]);
      setMeta({});
      setError(fetchError instanceof Error ? fetchError.message : "Erro ao buscar jogadores");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (nextPage: number) => {
    setPage(nextPage);
    setLoading(true);
    setError(null);
    try {
      const apiParams = buildApiFilters(filters, filters.search.trim());
      const response  = await getRankingData({ ...apiParams, page: nextPage, limit });
      const nextMeta  = (response.data.meta || response.meta || {}) as PaginationMeta;
      setPlayers(Array.isArray(response.data.players) ? response.data.players : []);
      setMeta(nextMeta);
    } catch (fetchError) {
      setPlayers([]);
      setMeta({});
      setError(fetchError instanceof Error ? fetchError.message : "Erro ao carregar página");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_PLAYERS_FILTERS);
    setPlayers([]);
    setMeta({});
    setHasSearched(false);
    setPage(1);
  };

  const handleSort = (field: SortBy) => {
    if (sortBy === field) { setSortOrder((o) => (o === "asc" ? "desc" : "asc")); return; }
    setSortBy(field);
    setSortOrder("desc");
  };

  const handleWatchlistToggle = async (player: PlayerCardModel) => {
    try {
      if (watchlistIds.has(player.id)) {
        await removeFromWatchlist(player.id);
        setWatchlistIds((cur) => { const n = new Set(cur); n.delete(player.id); return n; });
      } else {
        await addToWatchlist({ playerId: player.id });
        setWatchlistIds((cur) => new Set(cur).add(player.id));
      }
    } catch { /* silent */ }
  };

  const handleFieldChange    = (field: FilterFieldKey, value: string) =>
    setFilters((c) => ({ ...c, [field]: value }));

  const handleSearchChange   = (value: string) =>
    setFilters((c) => ({ ...c, search: value }));

  const handleTogglePosition = (position: string) =>
    setFilters((c) => ({
      ...c,
      positions: c.positions.includes(position)
        ? c.positions.filter((p) => p !== position)
        : [...c.positions, position],
    }));

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-[1400px] space-y-6">

            {/* ── Header banner ── */}
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.18),transparent_68%)] blur-2xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.12),transparent_72%)] blur-2xl" />
              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#7FDBFF]">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Scouting Ativo
                  </div>
                  <h1 className="text-3xl font-semibold text-white">Ranking de Jogadores</h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
                    Defina os critérios de scouting e execute a busca. Cada card inclui Overall, Potencial e Value Score.
                  </p>
                </div>

                {hasSearched && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Encontrados</p>
                      <p className="mt-1 text-2xl font-bold text-[#00C2FF]">{meta.total ?? sortedPlayers.length}</p>
                    </div>
                    <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Filtros ativos</p>
                      <p className="mt-1 text-2xl font-bold text-[#9BE7FF]">{activeFiltersCount}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Filters ── */}
            <PlayersFiltersPanel
              filters={filters}
              options={filterOptions}
              activeFiltersCount={activeFiltersCount}
              isExpanded={filtersExpanded}
              onToggleExpanded={() => setFiltersExpanded((v) => !v)}
              onSearchChange={handleSearchChange}
              onFieldChange={handleFieldChange}
              onTogglePosition={handleTogglePosition}
              onClearFilters={handleClearFilters}
            />

            {/* ── Action bar ── */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={loading}
                className="inline-flex items-center gap-2.5 rounded-[14px] bg-[#00C2FF] px-7 py-3.5 text-sm font-bold text-[#07142A] shadow-[0_4px_20px_rgba(0,194,255,0.35)] transition-all hover:bg-[#33CFFF] hover:shadow-[0_6px_24px_rgba(0,194,255,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {loading ? "Buscando..." : "Buscar jogadores"}
              </button>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] px-5 py-3.5 text-sm font-medium text-gray-400 transition-all hover:border-[rgba(255,255,255,0.18)] hover:text-gray-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar filtros
                </button>
              )}
            </div>

            {/* ── Error ── */}
            {error && (
              <div className="rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {error}
              </div>
            )}

            {/* ── Empty state (before first search) ── */}
            {!hasSearched && !loading && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[20px] border border-[rgba(0,194,255,0.15)] bg-[rgba(0,194,255,0.06)]">
                  <Search className="h-9 w-9 text-[#00C2FF]/60" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-300">Defina os critérios de scouting</h3>
                <p className="max-w-md text-sm leading-relaxed text-gray-600">
                  Configure os filtros — posição, overall, idade, liga, valor — e clique em{" "}
                  <span className="font-semibold text-[#00C2FF]">"Buscar jogadores"</span> para gerar o ranking.
                </p>
              </div>
            )}

            {/* ── Loading ── */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-[#00C2FF]" />
                <span className="ml-3 text-sm text-gray-500">Buscando jogadores...</span>
              </div>
            )}

            {/* ── Results ── */}
            {hasSearched && !loading && (
              <>
                {sortedPlayers.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)]">
                      <Search className="h-7 w-7 text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500">Nenhum jogador encontrado com os filtros aplicados.</p>
                    <button onClick={handleClearFilters} className="mt-4 text-xs text-[#00C2FF] underline-offset-2 hover:underline">
                      Limpar filtros e tentar novamente
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Sort bar */}
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-gray-600">
                        {sortedPlayers.length} resultado{sortedPlayers.length !== 1 ? "s" : ""}
                        {meta.total && meta.total > sortedPlayers.length
                          ? ` de ${meta.total}`
                          : ""}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="mr-1 text-[10px] uppercase tracking-[0.20em] text-gray-600">Ordenar</span>
                        <SortButton label="Overall"    field="overall"   active={sortBy === "overall"}   order={sortOrder} onClick={() => handleSort("overall")} />
                        <SortButton label="Potencial"  field="potential" active={sortBy === "potential"} order={sortOrder} onClick={() => handleSort("potential")} />
                        <SortButton label="Idade"      field="age"       active={sortBy === "age"}       order={sortOrder} onClick={() => handleSort("age")} />
                      </div>
                    </div>

                    {/* Card list */}
                    <div className="space-y-3">
                      {sortedPlayers.map((player, index) => (
                        <ScoutCard
                          key={`${player.id}-${index}`}
                          player={player}
                          rank={(page - 1) * limit + index + 1}
                          isWatched={watchlistIds.has(player.id)}
                          onNavigate={() => navigate(`/players/${player.id}`)}
                          onCompare={() => navigate(`/compare?a=${player.id}`)}
                          onWatchlist={() => void handleWatchlistToggle(player)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* ── Pagination ── */}
                {sortedPlayers.length > 0 && (
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => void handlePageChange(Math.max(1, page - 1))}
                      disabled={page <= 1 || loading}
                      className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-gray-300 disabled:opacity-40 hover:border-[rgba(255,255,255,0.16)]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>
                    <span className="text-sm text-gray-500">
                      Página {meta.page ?? page} de {meta.totalPages ?? 1}
                      {meta.total != null && (
                        <span className="ml-3 text-[#00C2FF]">
                          {meta.total} jogador{meta.total !== 1 ? "es" : ""}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handlePageChange(page + 1)}
                      disabled={loading || (meta.totalPages !== undefined && page >= meta.totalPages)}
                      className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-gray-300 disabled:opacity-40 hover:border-[rgba(255,255,255,0.16)]"
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
