import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Users,
  X,
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
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search.trim());
  const [sortBy, setSortBy] = useState<SortBy>(() => parseSortBy(urlSearchParams));
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => parseSortOrder(urlSearchParams));
  const [page, setPage] = useState(() => parsePage(urlSearchParams));
  const [meta, setMeta] = useState<PaginationMeta>({});
  const [filterOptions, setFilterOptions] = useState<PlayerFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(() => countActiveFilters(initialFilters) > 0);
  const limit = 20;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters.search]);

  useEffect(() => {
    let active = true;

    async function loadWatchlist() {
      try {
        const response = await getWatchlist();
        if (!active) {
          return;
        }

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
        if (active) {
          setWatchlistIds(new Set());
        }
      }
    }

    loadWatchlist();

    return () => {
      active = false;
    };
  }, []);

  const apiFilters = useMemo(() => buildApiFilters(filters, debouncedSearch), [filters, debouncedSearch]);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      setLoading(true);
      try {
        const response = await getRankingData({ ...apiFilters, page, limit });
        if (!active) {
          return;
        }

        const nextMeta = (response.data.meta || response.meta || {}) as PaginationMeta;
        setPlayers(Array.isArray(response.data.players) ? response.data.players : []);
        setMeta(nextMeta);
        setFilterOptions(response.data.filterOptions ?? EMPTY_FILTER_OPTIONS);
        setError(null);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        setPlayers([]);
        setMeta({});
        setError(fetchError instanceof Error ? fetchError.message : "Erro ao carregar jogadores");
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
  }, [apiFilters, limit, page]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (filters.search.trim()) nextParams.set("search", filters.search.trim());
    if (filters.positions.length > 0) nextParams.set("positions", filters.positions.join(","));
    if (filters.nationality) nextParams.set("nationality", filters.nationality);
    if (filters.team) nextParams.set("team", filters.team);
    if (filters.league) nextParams.set("league", filters.league);
    if (filters.source) nextParams.set("source", filters.source);
    if (filters.minAge) nextParams.set("minAge", filters.minAge);
    if (filters.maxAge) nextParams.set("maxAge", filters.maxAge);
    if (filters.minOverall) nextParams.set("minOverall", filters.minOverall);
    if (filters.maxOverall) nextParams.set("maxOverall", filters.maxOverall);
    if (filters.minPotential) nextParams.set("minPotential", filters.minPotential);
    if (filters.maxPotential) nextParams.set("maxPotential", filters.maxPotential);
    if (filters.minValue) nextParams.set("minValue", filters.minValue);
    if (filters.maxValue) nextParams.set("maxValue", filters.maxValue);
    if (page > 1) nextParams.set("page", String(page));
    if (sortBy !== "overall") nextParams.set("sortBy", sortBy);
    if (sortOrder !== "desc") nextParams.set("sortOrder", sortOrder);

    setUrlSearchParams(nextParams, { replace: true });
  }, [filters, page, setUrlSearchParams, sortBy, sortOrder]);

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
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#7FDBFF]">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Ranking Intelligence
                  </div>
                  <h1 className="text-4xl font-semibold text-white">Ranking de Jogadores</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
                    Uma camada de filtros analiticos para transformar o ranking em um cockpit real de scouting, sem perder a identidade visual do SoccerMind.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(0,194,255,0.14)]">
                        <Users className="h-5 w-5 text-[#00C2FF]" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Jogadores</p>
                        <p className="text-2xl font-bold text-[#00C2FF]">{meta.total ?? filteredAndSortedPlayers.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Filtros ativos</p>
                    <p className="mt-2 text-2xl font-bold text-[#9BE7FF]">{activeFiltersCount}</p>
                    <p className="mt-1 text-xs text-gray-500">Sincronizados com a URL</p>
                  </div>

                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Atualizacao</p>
                    <p className="mt-2 text-lg font-semibold text-white">Tempo real</p>
                    <p className="mt-1 text-xs text-gray-500">Busca com debounce de 300ms</p>
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

            <ActivePlayersFilterChips
              filters={filters}
              onClearSearch={() => {
                setPage(1);
                setFilters((current) => ({ ...current, search: "" }));
              }}
              onRemovePosition={(position) => {
                setPage(1);
                setFilters((current) => ({
                  ...current,
                  positions: current.positions.filter((item) => item !== position),
                }));
              }}
              onClearField={(field) => {
                setPage(1);
                setFilters((current) => ({ ...current, [field]: "" }));
              }}
              onClearRange={([minField, maxField]) => {
                setPage(1);
                setFilters((current) => ({ ...current, [minField]: "", [maxField]: "" }));
              }}
            />

            {error && (
              <div className="rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-8 py-4">
                <div className="flex items-center gap-6">
                  <div className="w-10 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">#</div>
                  <div className="min-w-[240px] flex-1 text-[10px] font-medium uppercase tracking-[0.24em] text-gray-400">Jogador</div>
                  <div className="w-20 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">Posicao</div>
                  <div className="w-32 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">Clube</div>
                  <div className="flex w-24 cursor-pointer items-center justify-center gap-1.5 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500 transition-colors hover:text-[#00C2FF]" onClick={() => handleSort("overall")}>
                    Overall
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <div className="flex w-24 cursor-pointer items-center justify-center gap-1.5 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500 transition-colors hover:text-[#00C2FF]" onClick={() => handleSort("potential")}>
                    Potential
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <div className="flex w-20 cursor-pointer items-center justify-center gap-1.5 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500 transition-colors hover:text-[#00C2FF]" onClick={() => handleSort("age")}>
                    Idade
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <div className="w-28 text-right text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">Valor</div>
                  <div className="w-32 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">Acao</div>
                </div>
              </div>

              <div>
                {loading && <div className="px-8 py-10 text-center text-sm text-gray-500">Carregando jogadores...</div>}

                {!loading &&
                  filteredAndSortedPlayers.map((player, index) => (
                    <div
                      key={`${player.id ?? player.name ?? "item"}-${index}`}
                      className={`group flex cursor-pointer items-center gap-6 border-b border-[rgba(255,255,255,0.04)] px-8 py-5 transition-all duration-200 last:border-b-0 ${
                        index % 2 === 0 ? "bg-[rgba(255,255,255,0.01)]" : "bg-transparent"
                      } hover:border-[rgba(0,194,255,0.15)] hover:bg-[rgba(0,194,255,0.05)]`}
                      onClick={() => navigate(`/players/${player.id}`)}
                    >
                      <div className="w-10 text-center">
                        <span className="text-base font-medium text-gray-400">#{(page - 1) * limit + index + 1}</span>
                      </div>

                      <div className="min-w-[240px] flex-1">
                        <div className="flex items-center gap-4">
                          <RankingAvatar
                            name={player.name}
                            image={player.image}
                            overall={player.overall}
                          />
                          <div>
                            <p className="mb-0.5 font-semibold text-gray-100 transition-colors group-hover:text-[#00C2FF]">{player.name}</p>
                            <p className="text-xs text-gray-600">{player.nationality}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-20 justify-center">
                        <span className={`${getPositionColor(player.position || "-")} rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold tracking-wide`}>
                          {player.position || "-"}
                        </span>
                      </div>

                      <div className="w-32 text-center text-sm text-gray-400">{player.team || "-"}</div>

                      <div className="flex w-24 justify-center">
                        <span className={`${getStatColor(player.overall ?? 0)} min-w-[52px] rounded-[8px] px-3 py-1.5 text-center text-sm font-bold shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}>
                          {formatStatValue(player.overall)}
                        </span>
                      </div>

                      <div className="flex w-24 justify-center">
                        <div className="flex items-center gap-1.5">
                          <span className={`${getStatColor(player.potential ?? 0)} min-w-[52px] rounded-[8px] px-3 py-1.5 text-center text-sm font-bold shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}>
                            {formatStatValue(player.potential)}
                          </span>
                          {player.potential !== null && player.overall !== null && player.potential > player.overall + 5 && (
                            <TrendingUp className="h-3.5 w-3.5 text-[#00FF9C]/70" />
                          )}
                        </div>
                      </div>

                      <div className="w-20 text-center text-sm font-medium tabular-nums text-gray-300">{player.age}</div>

                      <div className="w-28 text-right text-sm font-semibold tabular-nums text-[#00FF9C]">{formatMarketValue(player.marketValue)}</div>

                      <div className="flex w-32 justify-center">
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border transition-all ${
                              watchlistIds.has(player.id)
                                ? "border-[#fbbf24] bg-[#fbbf24]/15 text-[#fbbf24]"
                                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-300"
                            }`}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleWatchlistToggle(player);
                            }}
                          >
                            <Star className="h-4 w-4" fill={watchlistIds.has(player.id) ? "currentColor" : "none"} />
                          </button>
                          <button
                            className="rounded-[10px] bg-[#00C2FF]/90 px-4 py-2 text-xs font-semibold text-[#07142A] shadow-[0_2px_8px_rgba(0,194,255,0.3)] transition-all hover:bg-[#00C2FF] hover:shadow-[0_4px_12px_rgba(0,194,255,0.4)]"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/players/${player.id}`);
                            }}
                          >
                            Ver Detalhes
                          </button>
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
                <p className="text-sm text-gray-500">Nenhum jogador encontrado com os filtros selecionados.</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-gray-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                Pagina {meta.page ?? page} de {meta.totalPages ?? 1}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={loading || (meta.totalPages !== undefined && page >= meta.totalPages)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-gray-300 disabled:opacity-40"
              >
                Proxima
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
