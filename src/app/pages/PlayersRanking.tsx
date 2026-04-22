import { useEffect, useMemo, useState } from "react";
import {
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
import { PlayersFiltersPanel } from "../components/PlayersFiltersPanel";
import { AppSidebar } from "../components/AppSidebar";
import { PlayerAvatar } from "../components/scout/PlayerAvatar";
import { ScorePill } from "../components/scout/ScoreBadge";
import { PlayerLevelBadge } from "../components/scout/LabelBadge";
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

const EMPTY_FILTER_OPTIONS: PlayerFilterOptions = {
  positions: [],
  nationalities: [],
  teams: [],
  leagues: [],
  sources: [],
};

function formatMarketValue(value: number | null) {
  if (value === null) return "N/A";
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
}

function getPositionColor(position: string): string {
  const colors: Record<string, string> = {
    ST: "#FF4D4F", CF: "#FF4D4F",
    LW: "#7A5CFF", RW: "#7A5CFF",
    CAM: "#00C2FF", CM: "#00C2FF",
    CDM: "#00FF9C", CB: "#00FF9C",
    LB: "#FBBF24", RB: "#FBBF24",
    GK: "#F97316",
  };
  return colors[position] ?? "#94a3b8";
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

            {/* ── Sort controls ── */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Ordenar por:</span>
              {(["overall", "potential", "age"] as SortBy[]).map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => handleSort(field)}
                  className="rounded-[8px] border px-3 py-1.5 text-[11px] font-semibold transition-all"
                  style={
                    sortBy === field
                      ? { borderColor: "#00C2FF", background: "rgba(0,194,255,0.12)", color: "#00C2FF" }
                      : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#94a3b8" }
                  }
                >
                  {field === "overall" ? "Overall" : field === "potential" ? "Potencial" : "Idade"}
                  {sortBy === field && (
                    <span className="ml-1 opacity-70">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Loading skeleton ── */}
            {loading && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-[20px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-5"
                    style={{ height: 220 }}
                  />
                ))}
              </div>
            )}

            {/* ── Cards grid ── */}
            {!loading && filteredAndSortedPlayers.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredAndSortedPlayers.map((player, index) => {
                  const rank = (committedPage - 1) * limit + index + 1;
                  const posColor = getPositionColor(player.position ?? "");
                  const isWatchlisted = watchlistIds.has(player.id);
                  const hasPotentialGrowth =
                    player.potential !== null && player.overall !== null && player.potential > player.overall + 5;

                  return (
                    <article
                      key={`${player.id ?? player.name}-${index}`}
                      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
                      style={{
                        background: "linear-gradient(160deg, rgba(10,27,53,0.98) 0%, rgba(7,20,42,0.96) 100%)",
                        borderColor: "rgba(0,194,255,0.18)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                      }}
                      onClick={() => navigate(`/players/${player.id}`)}
                    >
                      {/* Top glow strip */}
                      <div
                        className="absolute left-0 right-0 top-0 h-[2px] opacity-60"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(0,194,255,0.7), transparent)" }}
                      />

                      <div className="flex flex-col gap-4 p-5">
                        {/* Row 1 — rank + level + watchlist */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                              style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
                            >
                              {rank}
                            </span>
                            <PlayerLevelBadge overall={player.overall} />
                          </div>
                          <button
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-[8px] border transition-all ${
                              isWatchlisted
                                ? "border-[#fbbf24] bg-[#fbbf24]/15 text-[#fbbf24]"
                                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-500 opacity-0 group-hover:opacity-100"
                            }`}
                            onClick={(e) => { e.stopPropagation(); void handleWatchlistToggle(player); }}
                          >
                            <Star className="h-3.5 w-3.5" fill={isWatchlisted ? "currentColor" : "none"} />
                          </button>
                        </div>

                        {/* Row 2 — avatar + identity */}
                        <div className="flex items-start gap-3">
                          <PlayerAvatar name={player.name} image={player.image} overall={player.overall} size="md" />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-base font-bold text-white transition-colors group-hover:text-[#00C2FF]">
                              {player.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-400">
                              <span
                                className="mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{ background: `${posColor}18`, color: posColor }}
                              >
                                {player.position ? positionLabel(player.position) : "—"}
                              </span>
                              {player.age != null ? `${player.age} anos` : "—"}
                              {player.nationality ? ` · ${player.nationality}` : ""}
                            </p>
                            {(player.team || player.league) && (
                              <p className="mt-0.5 truncate text-[11px] text-gray-500">
                                {[player.team, player.league].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Row 3 — score metrics */}
                        <div
                          className="grid grid-cols-3 gap-2 rounded-[12px] px-3 py-3"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <ScorePill value={player.overall} />
                            <span className="text-[9px] uppercase tracking-[0.18em] text-gray-500">Overall</span>
                          </div>
                          <div className="relative flex flex-col items-center gap-1 before:absolute before:left-0 before:top-1/2 before:h-8 before:-translate-y-1/2 before:w-px before:bg-[rgba(255,255,255,0.06)] after:absolute after:right-0 after:top-1/2 after:h-8 after:-translate-y-1/2 after:w-px after:bg-[rgba(255,255,255,0.06)]">
                            <div className="flex items-center gap-1">
                              <ScorePill value={player.potential} />
                              {hasPotentialGrowth && <TrendingUp className="h-3 w-3 text-[#00FF9C]" />}
                            </div>
                            <span className="text-[9px] uppercase tracking-[0.18em] text-gray-500">Potencial</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xl font-bold tabular-nums text-gray-300">
                              {player.age ?? "—"}
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.18em] text-gray-500">Anos</span>
                          </div>
                        </div>

                        {/* Row 4 — footer */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#00FF9C]">
                            {formatMarketValue(player.marketValue)}
                          </span>
                          <span className="rounded-[8px] bg-[rgba(0,194,255,0.1)] px-2.5 py-1 text-[11px] font-semibold text-[#00C2FF] opacity-0 transition-opacity group-hover:opacity-100">
                            Ver →
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

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
