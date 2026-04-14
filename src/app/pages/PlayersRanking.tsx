import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  RotateCcw,
  Search,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { AppHeader } from "../components/AppHeader";
import { ActivePlayersFilterChips } from "../components/ActivePlayersFilterChips";
import { PlayersFiltersPanel } from "../components/PlayersFiltersPanel";
import { AppSidebar } from "../components/AppSidebar";
import type { PlayerCardModel } from "../mappers/player.mapper";
import { getRankingData } from "../services/ranking";
import { type PlayerFilterOptions, type PlayersResponseMeta } from "../services/players";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../services/watchlist";
import {
  buildApiFilters,
  countActiveFilters,
  DEFAULT_PLAYERS_FILTERS,
  type FilterFieldKey,
  type PlayersFiltersState,
  parseFiltersFromSearchParams,
} from "../utils/playerFilters";
import { positionLabel } from "../utils/positions";

type SortBy = "overall" | "potential" | "age";
type SortOrder = "asc" | "desc";

interface PaginationMeta extends PlayersResponseMeta {
  page?: number;
  totalPages?: number;
  total?: number;
}

const SPORTMONKS_PLACEHOLDER = "placeholder.png";

function RankingAvatar({
  name,
  image,
  overall,
}: {
  name: string;
  image: string | null;
  overall: number | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const hasRealImage =
    !!image && !image.includes(SPORTMONKS_PLACEHOLDER) && !imgFailed;

  const ovr = overall ?? 0;
  const borderColor =
    ovr >= 80 ? "rgba(0,255,156,0.6)" : ovr >= 70 ? "rgba(251,191,36,0.6)" : "rgba(0,194,255,0.4)";

  if (hasRealImage) {
    return (
      <div
        className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        style={{ border: `1.5px solid ${borderColor}` }}
      >
        <img
          src={image!}
          alt={name}
          className="h-full w-full object-cover object-top"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[12px] text-base font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
      style={{
        background: "linear-gradient(135deg, rgba(0,194,255,0.25) 0%, rgba(122,92,255,0.25) 100%)",
        border: `1.5px solid ${borderColor}`,
      }}
    >
      <span className="relative z-10 text-white">{initials}</span>
    </div>
  );
}

const EMPTY_FILTER_OPTIONS: PlayerFilterOptions = {
  positions: [],
  nationalities: [],
  teams: [],
  leagues: [],
  sources: [],
};

function getPlayerLevel(overall: number | null): { label: string; color: string; bg: string; border: string } {
  const ovr = overall ?? 0;
  if (ovr >= 90) return { label: "Ícone",    color: "#FFD700", bg: "rgba(255,215,0,0.14)",    border: "rgba(255,215,0,0.35)" };
  if (ovr >= 85) return { label: "Elite",    color: "#00FF9C", bg: "rgba(0,255,156,0.12)",    border: "rgba(0,255,156,0.32)" };
  if (ovr >= 80) return { label: "Premium",  color: "#00C2FF", bg: "rgba(0,194,255,0.12)",    border: "rgba(0,194,255,0.3)" };
  if (ovr >= 75) return { label: "Destaque", color: "#7A5CFF", bg: "rgba(122,92,255,0.13)",   border: "rgba(122,92,255,0.3)" };
  if (ovr >= 70) return { label: "Regular",  color: "#FBBF24", bg: "rgba(251,191,36,0.12)",   border: "rgba(251,191,36,0.3)" };
  if (ovr >= 65) return { label: "Básico",   color: "#94a3b8", bg: "rgba(148,163,184,0.10)",  border: "rgba(148,163,184,0.25)" };
  return             { label: "Promessa",    color: "#C084FC", bg: "rgba(192,132,252,0.11)",   border: "rgba(192,132,252,0.28)" };
}

function formatMarketValue(value: number | null) {
  if (value === null) {
    return "N/A";
  }
  if (value >= 1_000_000) {
    return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `EUR ${(value / 1_000).toFixed(0)}K`;
  }
  return `EUR ${value.toFixed(0)}`;
}

function formatStatValue(value: number | null) {
  return value === null ? "-" : value;
}

function parsePage(searchParams: URLSearchParams) {
  const rawValue = Number(searchParams.get("page") ?? "1");
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 1;
}

function parseSortBy(searchParams: URLSearchParams): SortBy {
  const value = searchParams.get("sortBy");
  if (value === "overall" || value === "potential" || value === "age") {
    return value;
  }
  return "overall";
}

function parseSortOrder(searchParams: URLSearchParams): SortOrder {
  return searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
}

export default function PlayersRanking() {
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const initialFilters = useMemo(() => parseFiltersFromSearchParams(urlSearchParams), []);

  const [players, setPlayers] = useState<PlayerCardModel[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<PlayersFiltersState>(initialFilters);
  const [sortBy, setSortBy] = useState<SortBy>(() => parseSortBy(urlSearchParams));
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => parseSortOrder(urlSearchParams));
  const [page, setPage] = useState(() => parsePage(urlSearchParams));
  const [meta, setMeta] = useState<PaginationMeta>({});
  const [filterOptions, setFilterOptions] = useState<PlayerFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  // Committed filters — updated on mount (loads automatically) and when user clicks "Buscar"
  const [committedFilters, setCommittedFilters] = useState<PlayersFiltersState>(initialFilters);
  const [committedPage, setCommittedPage] = useState(1);
  const limit = 20;

  // Dirty flag: user changed filters since last fetch
  const isDirty = JSON.stringify(filters) !== JSON.stringify(committedFilters);

  useEffect(() => {
    let active = true;

    async function loadWatchlist() {
      try {
        const response = await getWatchlist();
        if (!active) return;
        const ids = new Set(
          Array.isArray(response.data)
            ? response.data
                .map((item) =>
                  item && typeof item === "object" && "playerId" in item ? String(item.playerId) : null,
                )
                .filter((item): item is string => Boolean(item))
            : [],
        );
        setWatchlistIds(ids);
      } catch {
        if (active) setWatchlistIds(new Set());
      }
    }

    loadWatchlist();
    return () => { active = false; };
  }, []);

  // Fetch whenever committed filters or page change
  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      setLoading(true);
      try {
        const apiParams = buildApiFilters(committedFilters!, committedFilters!.search.trim());
        const response = await getRankingData({ ...apiParams, page: committedPage, limit });
        if (!active) return;
        const nextMeta = (response.data.meta || response.meta || {}) as PaginationMeta;
        setPlayers(Array.isArray(response.data.players) ? response.data.players : []);
        setMeta(nextMeta);
        setFilterOptions(response.data.filterOptions ?? EMPTY_FILTER_OPTIONS);
        setError(null);
      } catch (fetchError) {
        if (!active) return;
        setPlayers([]);
        setMeta({});
        setError(fetchError instanceof Error ? fetchError.message : "Erro ao carregar jogadores");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPlayers();
    return () => { active = false; };
  }, [committedFilters, committedPage, limit]);

  useEffect(() => {
    const f = committedFilters;
    const nextParams = new URLSearchParams();

    if (f.search.trim()) nextParams.set("search", f.search.trim());
    if (f.positions.length > 0) nextParams.set("positions", f.positions.join(","));
    if (f.nationality) nextParams.set("nationality", f.nationality);
    if (f.team) nextParams.set("team", f.team);
    if (f.league) nextParams.set("league", f.league);
    if (f.source) nextParams.set("source", f.source);
    if (f.minAge) nextParams.set("minAge", f.minAge);
    if (f.maxAge) nextParams.set("maxAge", f.maxAge);
    if (f.minOverall) nextParams.set("minOverall", f.minOverall);
    if (f.maxOverall) nextParams.set("maxOverall", f.maxOverall);
    if (f.minPotential) nextParams.set("minPotential", f.minPotential);
    if (f.maxPotential) nextParams.set("maxPotential", f.maxPotential);
    if (f.minValue) nextParams.set("minValue", f.minValue);
    if (f.maxValue) nextParams.set("maxValue", f.maxValue);
    if (f.level) nextParams.set("level", f.level);
    if (committedPage > 1) nextParams.set("page", String(committedPage));
    if (sortBy !== "overall") nextParams.set("sortBy", sortBy);
    if (sortOrder !== "desc") nextParams.set("sortOrder", sortOrder);

    setUrlSearchParams(nextParams, { replace: true });
  }, [committedFilters, committedPage, setUrlSearchParams, sortBy, sortOrder]);

  const filteredAndSortedPlayers = useMemo(() => {
    const list = [...players];
    const getSortableValue = (value: number | null) => value ?? -1;
    list.sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      return (getSortableValue(a[sortBy]) - getSortableValue(b[sortBy])) * multiplier;
    });
    return list;
  }, [players, sortBy, sortOrder]);

  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);

  const handleSearch = () => {
    setCommittedFilters({ ...filters });
    setCommittedPage(1);
    setPage(1);
  };

  const getStatColor = (value: number) => {
    if (value >= 85) return "bg-[#00FF9C]/90 text-[#07142A]";
    if (value >= 80) return "bg-[#00C2FF]/90 text-[#07142A]";
    if (value >= 75) return "bg-[#7A5CFF]/90 text-white";
    if (value >= 70) return "bg-blue-500/90 text-white";
    if (value >= 60) return "bg-yellow-500/90 text-[#07142A]";
    return "bg-[#FF4D4F]/90 text-white";
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      ST: "bg-[#FF4D4F]/20 text-[#FF4D4F] border-[#FF4D4F]/30",
      CF: "bg-[#FF4D4F]/20 text-[#FF4D4F] border-[#FF4D4F]/30",
      LW: "bg-[#7A5CFF]/20 text-[#7A5CFF] border-[#7A5CFF]/30",
      RW: "bg-[#7A5CFF]/20 text-[#7A5CFF] border-[#7A5CFF]/30",
      CAM: "bg-[#00C2FF]/20 text-[#00C2FF] border-[#00C2FF]/30",
      CM: "bg-[#00C2FF]/20 text-[#00C2FF] border-[#00C2FF]/30",
      CDM: "bg-[#00FF9C]/20 text-[#00FF9C] border-[#00FF9C]/30",
      LB: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      RB: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      CB: "bg-[#00FF9C]/20 text-[#00FF9C] border-[#00FF9C]/30",
      GK: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[position] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(field);
    setSortOrder("desc");
  };

  const handleWatchlistToggle = async (player: PlayerCardModel) => {
    try {
      if (watchlistIds.has(player.id)) {
        await removeFromWatchlist(player.id);
        setWatchlistIds((current) => {
          const next = new Set(current);
          next.delete(player.id);
          return next;
        });
        return;
      }

      await addToWatchlist({ playerId: player.id });
      setWatchlistIds((current) => new Set(current).add(player.id));
    } catch (watchlistError) {
      setError(
        watchlistError instanceof Error ? watchlistError.message : "Erro ao atualizar watchlist",
      );
    }
  };

  const handleFieldChange = (field: FilterFieldKey, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleSearchChange = (value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, search: value }));
  };

  const handleTogglePosition = (position: string) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      positions: current.positions.includes(position)
        ? current.positions.filter((item) => item !== position)
        : [...current.positions, position],
    }));
  };

  const handleClearFilters = () => {
    setPage(1);
    setFilters(DEFAULT_PLAYERS_FILTERS);
    setCommittedFilters(DEFAULT_PLAYERS_FILTERS);
    setCommittedPage(1);
  };

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-[1600px] space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.18),transparent_68%)] blur-2xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.12),transparent_72%)] blur-2xl" />
              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#7FDBFF]">
                    <Crosshair className="h-3.5 w-3.5" />
                    Scout Intelligence
                  </div>
                  <h1 className="text-4xl font-semibold text-white">Ranking de Jogadores</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
                    Jogadores ordenados por overall. Use os filtros para refinar por posição, liga, idade ou valor de mercado.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#00C2FF]" />
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Jogadores</p>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-[#00C2FF]">{meta.total ?? filteredAndSortedPlayers.length}</p>
                  </div>
                  <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Filtros ativos</p>
                    <p className="mt-1 text-2xl font-bold text-[#9BE7FF]">{countActiveFilters(committedFilters)}</p>
                  </div>
                </div>
              </div>
            </section>

            <PlayersFiltersPanel
              filters={filters}
              options={filterOptions}
              activeFiltersCount={activeFiltersCount}
              isExpanded={filtersExpanded}
              onToggleExpanded={() => setFiltersExpanded((current) => !current)}
              onSearchChange={handleSearchChange}
              onFieldChange={handleFieldChange}
              onTogglePosition={handleTogglePosition}
              onClearFilters={handleClearFilters}
            />

            {/* Search CTA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSearch}
                disabled={!isDirty}
                className="inline-flex items-center gap-2.5 rounded-[14px] bg-[#00C2FF] px-7 py-3.5 text-sm font-bold text-[#07142A] shadow-[0_4px_20px_rgba(0,194,255,0.35)] transition-all hover:bg-[#33CFFF] hover:shadow-[0_6px_24px_rgba(0,194,255,0.45)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Search className="h-4 w-4" />
                Aplicar filtros
              </button>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-5 py-3.5 text-sm font-medium text-gray-400 transition-all hover:border-[rgba(255,255,255,0.18)] hover:text-gray-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar filtros
                </button>
              )}
              {isDirty && (
                <span className="rounded-full border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] px-3 py-1.5 text-xs font-semibold text-[#fbbf24]">
                  Filtros modificados — clique em Buscar para atualizar
                </span>
              )}
            </div>

            {error && (
              <div className="rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              {/* ── Header ── */}
              <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-6 py-4">
                <div className="grid items-center gap-3" style={{ gridTemplateColumns: "2.5rem 1fr 7.5rem 8rem 5.5rem 6.5rem 4.5rem 5.5rem 7.5rem 8rem" }}>
                  <div className="text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">#</div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-gray-400">Jogador</div>
                  <div className="text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">Posição</div>
                  <div className="text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">Clube</div>
                  <div className="flex cursor-pointer items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500 transition-colors hover:text-[#00C2FF]" onClick={() => handleSort("overall")}>
                    Overall <ArrowUpDown className="h-3 w-3 shrink-0" />
                  </div>
                  <div className="flex cursor-pointer items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500 transition-colors hover:text-[#00C2FF]" onClick={() => handleSort("potential")}>
                    Potential <ArrowUpDown className="h-3 w-3 shrink-0" />
                  </div>
                  <div className="flex cursor-pointer items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500 transition-colors hover:text-[#00C2FF]" onClick={() => handleSort("age")}>
                    Idade <ArrowUpDown className="h-3 w-3 shrink-0" />
                  </div>
                  <div className="text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">Nível</div>
                  <div className="text-right text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">Valor</div>
                  <div className="text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">Ação</div>
                </div>
              </div>

              <div>
                {loading && <div className="px-8 py-10 text-center text-sm text-gray-500">Carregando jogadores...</div>}

                {!loading &&
                  filteredAndSortedPlayers.map((player, index) => (
                    <div
                      key={`${player.id ?? player.name ?? "item"}-${index}`}
                      className={`group cursor-pointer border-b border-[rgba(255,255,255,0.04)] px-6 py-4 transition-all duration-200 last:border-b-0 ${
                        index % 2 === 0 ? "bg-[rgba(255,255,255,0.01)]" : "bg-transparent"
                      } hover:border-[rgba(0,194,255,0.15)] hover:bg-[rgba(0,194,255,0.05)]`}
                      onClick={() => navigate(`/players/${player.id}`)}
                    >
                      <div className="grid items-center gap-3" style={{ gridTemplateColumns: "2.5rem 1fr 7.5rem 8rem 5.5rem 6.5rem 4.5rem 5.5rem 7.5rem 8rem" }}>

                        {/* # */}
                        <div className="text-center text-sm font-medium text-gray-500">
                          #{(page - 1) * limit + index + 1}
                        </div>

                        {/* Jogador */}
                        <div className="flex min-w-0 items-center gap-3">
                          <RankingAvatar name={player.name} image={player.image} overall={player.overall} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-100 transition-colors group-hover:text-[#00C2FF]">
                              {player.name}
                            </p>
                            <p className="truncate text-xs text-gray-600">{player.nationality}</p>
                          </div>
                        </div>

                        {/* Posição */}
                        <div className="flex justify-center">
                          <span className={`${getPositionColor(player.position || "-")} rounded-[8px] border px-2 py-1 text-[10px] font-semibold tracking-wide`}>
                            {player.position ? positionLabel(player.position) : "-"}
                          </span>
                        </div>

                        {/* Clube */}
                        <div className="truncate text-center text-sm text-gray-400" title={player.team || "-"}>
                          {player.team || "-"}
                        </div>

                        {/* Overall */}
                        <div className="flex justify-center">
                          <span className={`${getStatColor(player.overall ?? 0)} w-12 rounded-[8px] py-1.5 text-center text-sm font-bold shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}>
                            {formatStatValue(player.overall)}
                          </span>
                        </div>

                        {/* Potential */}
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`${getStatColor(player.potential ?? 0)} w-12 rounded-[8px] py-1.5 text-center text-sm font-bold shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}>
                            {formatStatValue(player.potential)}
                          </span>
                          {player.potential !== null && player.overall !== null && player.potential > player.overall + 5 && (
                            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#00FF9C]/70" />
                          )}
                        </div>

                        {/* Idade */}
                        <div className="text-center text-sm font-medium tabular-nums text-gray-300">
                          {player.age ?? "-"}
                        </div>

                        {/* Nível */}
                        <div className="flex justify-center">
                          {(() => {
                            const lvl = getPlayerLevel(player.overall);
                            return (
                              <span
                                className="rounded-[8px] border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                                style={{ color: lvl.color, background: lvl.bg, borderColor: lvl.border }}
                              >
                                {lvl.label}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Valor */}
                        <div className="text-right text-sm font-semibold tabular-nums text-[#00FF9C]">
                          {formatMarketValue(player.marketValue)}
                        </div>

                        {/* Ação */}
                        <div className="flex justify-center">
                          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-[10px] border transition-all ${
                                watchlistIds.has(player.id)
                                  ? "border-[#fbbf24] bg-[#fbbf24]/15 text-[#fbbf24]"
                                  : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-300"
                              }`}
                              onClick={(e) => { e.stopPropagation(); void handleWatchlistToggle(player); }}
                            >
                              <Star className="h-3.5 w-3.5" fill={watchlistIds.has(player.id) ? "currentColor" : "none"} />
                            </button>
                            <button
                              className="rounded-[10px] bg-[#00C2FF]/90 px-3 py-1.5 text-xs font-semibold text-[#07142A] shadow-[0_2px_8px_rgba(0,194,255,0.3)] transition-all hover:bg-[#00C2FF]"
                              onClick={(e) => { e.stopPropagation(); navigate(`/players/${player.id}`); }}
                            >
                              Ver
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {!loading && filteredAndSortedPlayers.length === 0 && (
              <div className="py-16 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)]">
                  <Search className="h-7 w-7 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">Nenhum jogador encontrado com os filtros aplicados.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-xs text-[#00C2FF] underline-offset-2 hover:underline"
                >
                  Limpar filtros e tentar novamente
                </button>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCommittedPage((current) => Math.max(1, current - 1))}
                disabled={committedPage <= 1 || loading}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-gray-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                Página {meta.page ?? committedPage} de {meta.totalPages ?? 1}
                {meta.total != null && (
                  <span className="ml-3 text-[#00C2FF]">{meta.total} jogador{meta.total !== 1 ? "es" : ""}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setCommittedPage((current) => current + 1)}
                disabled={loading || (meta.totalPages !== undefined && committedPage >= meta.totalPages)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-gray-300 disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
