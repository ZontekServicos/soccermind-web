import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, ArrowUpDown, Users, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useNavigate } from "react-router";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { mapApiPlayerToCard, type PlayerCardModel } from "../mappers/player.mapper";
import { getPlayers, searchPlayers } from "../services/players";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../services/watchlist";

type SortBy = "overall" | "potential" | "age";
type SortOrder = "asc" | "desc";

interface PaginationMeta {
  page?: number;
  totalPages?: number;
  total?: number;
}

export default function PlayersRanking() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerCardModel[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("overall");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchFocused, setSearchFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

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

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      setLoading(true);
      try {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        const response = trimmedSearch
          ? await searchPlayers({ page: 1, limit: 100 })
          : await getPlayers(page, limit);

        if (!active) {
          return;
        }

        const rawPlayers = Array.isArray(response.data) ? response.data : [];
        const filteredSource = trimmedSearch
          ? rawPlayers.filter((player) => {
              const item = player as Record<string, unknown>;
              const name = String(item.name ?? "").toLowerCase();
              const team = String(item.team ?? "").toLowerCase();
              const position = String(item.position ?? "").toLowerCase();
              const positions = Array.isArray(item.positions)
                ? item.positions.map((value) => String(value).toLowerCase())
                : [];

              return (
                name.includes(trimmedSearch) ||
                team.includes(trimmedSearch) ||
                position.includes(trimmedSearch) ||
                positions.some((value) => value.includes(trimmedSearch))
              );
            })
          : rawPlayers;

        const paginatedPlayers = trimmedSearch
          ? filteredSource.slice((page - 1) * limit, page * limit)
          : filteredSource;

        const nextPlayers = paginatedPlayers.map((player, index) => {
              const mapped = mapApiPlayerToCard(player as Record<string, unknown>);
              return {
                ...mapped,
                id: mapped.id || `${mapped.name}-${index}`,
              };
            });

        setPlayers(nextPlayers);
        setMeta(
          trimmedSearch
            ? {
                page,
                total: filteredSource.length,
                totalPages: Math.max(1, Math.ceil(filteredSource.length / limit)),
              }
            : ((response.meta || {}) as PaginationMeta),
        );
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
  }, [limit, page, searchTerm]);

  const filteredAndSortedPlayers = useMemo(() => {
    const list = [...players];
    list.sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      return (a[sortBy] - b[sortBy]) * multiplier;
    });
    return list;
  }, [players, sortBy, sortOrder]);

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
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
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
        watchlistError instanceof Error
          ? watchlistError.message
          : "Erro ao atualizar watchlist",
      );
    }
  };

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                <div className="flex-1">
                  <h1 className="text-4xl mb-3">Ranking de Jogadores</h1>
                  <p className="text-sm text-gray-500">Análise completa e comparativa do elenco monitorado</p>
                </div>

                <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[16px] px-6 py-4 border border-[rgba(0,194,255,0.15)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[rgba(0,194,255,0.15)] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#00C2FF]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Total de Jogadores</p>
                      <p className="text-2xl font-bold text-[#00C2FF]">{meta.total ?? filteredAndSortedPlayers.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Search
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                    searchFocused ? "text-[#00C2FF]" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Buscar por nome, clube ou posição..."
                  value={searchTerm}
                  onChange={(event) => {
                    setPage(1);
                    setSearchTerm(event.target.value);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={`w-full bg-[rgba(255,255,255,0.02)] backdrop-blur-sm border rounded-[14px] pl-11 pr-4 py-3.5 text-sm placeholder:text-gray-600 focus:outline-none transition-all ${
                    searchFocused
                      ? "border-[#00C2FF] shadow-[0_0_0_3px_rgba(0,194,255,0.1)]"
                      : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]"
                  }`}
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {error}
              </div>
            )}

            <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.08)] px-8 py-4">
                <div className="flex items-center gap-6">
                  <div className="w-10 text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium">#</div>
                  <div className="flex-1 min-w-[240px] text-[10px] text-gray-400 uppercase tracking-wider font-medium">Jogador</div>
                  <div className="w-20 text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium">Posição</div>
                  <div className="w-32 text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium">Clube</div>
                  <div className="w-24 text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:text-[#00C2FF] transition-colors" onClick={() => handleSort("overall")}>
                    Overall
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                  <div className="w-24 text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:text-[#00C2FF] transition-colors" onClick={() => handleSort("potential")}>
                    Potencial
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                  <div className="w-20 text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:text-[#00C2FF] transition-colors" onClick={() => handleSort("age")}>
                    Idade
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                  <div className="w-28 text-right text-[10px] text-gray-500 uppercase tracking-wider font-medium">Valor</div>
                  <div className="w-32 text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium">Ação</div>
                </div>
              </div>

              <div>
                {loading && <div className="px-8 py-10 text-center text-sm text-gray-500">Carregando jogadores...</div>}

                {!loading &&
                  filteredAndSortedPlayers.map((player, index) => (
                    <div
                      key={`${player.id ?? player.name ?? "item"}-${index}`}
                      className={`px-8 py-5 flex items-center gap-6 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 transition-all duration-200 cursor-pointer group ${
                        index % 2 === 0 ? "bg-[rgba(255,255,255,0.01)]" : "bg-transparent"
                      } hover:bg-[rgba(0,194,255,0.05)] hover:border-[rgba(0,194,255,0.15)]`}
                      onClick={() => navigate(`/players/${player.id}`)}
                    >
                      <div className="w-10 text-center">
                        <span className="text-base text-gray-400 font-medium">#{(page - 1) * limit + index + 1}</span>
                      </div>

                      <div className="flex-1 min-w-[240px]">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-11 h-11 rounded-[12px] flex items-center justify-center text-base font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.3)] relative overflow-hidden"
                            style={{
                              background: "linear-gradient(135deg, rgba(0,194,255,0.25) 0%, rgba(122,92,255,0.25) 100%)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <span className="relative z-10 text-white">
                              {player.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-100 group-hover:text-[#00C2FF] transition-colors mb-0.5">{player.name}</p>
                            <p className="text-xs text-gray-600">{player.nationality}</p>
                          </div>
                        </div>
                      </div>

                      <div className="w-20 flex justify-center">
                        <span className={`${getPositionColor(player.position)} border px-2.5 py-1 rounded-[8px] text-[11px] font-semibold tracking-wide`}>
                          {player.position}
                        </span>
                      </div>

                      <div className="w-32 text-center text-sm text-gray-400">{player.team}</div>

                      <div className="w-24 flex justify-center">
                        <span className={`${getStatColor(player.overall)} px-3 py-1.5 rounded-[8px] text-sm font-bold min-w-[52px] text-center shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}>
                          {player.overall}
                        </span>
                      </div>

                      <div className="w-24 flex justify-center">
                        <div className="flex items-center gap-1.5">
                          <span className={`${getStatColor(player.potential)} px-3 py-1.5 rounded-[8px] text-sm font-bold min-w-[52px] text-center shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}>
                            {player.potential}
                          </span>
                          {player.potential > player.overall + 5 && <TrendingUp className="w-3.5 h-3.5 text-[#00FF9C]/70" />}
                        </div>
                      </div>

                      <div className="w-20 text-center text-sm text-gray-300 font-medium tabular-nums">{player.age}</div>

                      <div className="w-28 text-right text-sm text-[#00FF9C] font-semibold tabular-nums">{player.marketValue}</div>

                      <div className="w-32 flex justify-center">
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
                            className="px-4 py-2 bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] rounded-[10px] text-xs font-semibold transition-all shadow-[0_2px_8px_rgba(0,194,255,0.3)] hover:shadow-[0_4px_12px_rgba(0,194,255,0.4)]"
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
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(255,255,255,0.03)] mb-4">
                  <Search className="w-7 h-7 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">Nenhum jogador encontrado com os critérios de busca</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-gray-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                Página {meta.page ?? page} de {meta.totalPages ?? 1}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={loading || (meta.totalPages !== undefined && page >= meta.totalPages)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-gray-300 disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
