/**
 * PlayerSearchPage.tsx  (/player-search)
 *
 * Scout Inteligente — busca avançada com:
 *   • Filtros: posição, liga, nacionalidade, idade, overall, potencial,
 *              valor de mercado (min/max), DNA mínimo
 *   • ValueScore: overall / (marketValue / 1M)
 *   • Ordenação: overall | valueScore | potencial | idade
 *   • Modo "Joias Escondidas": GET /players/hidden-gems
 */

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  Filter,
  Gem,
  Loader2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { apiFetch } from "../services/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerSearchResult {
  id:          string;
  name:        string;
  team:        string | null;
  league:      string | null;
  nationality: string | null;
  age:         number | null;
  positions:   string[];
  overall:     number | null;
  potential:   number | null;
  marketValue: number | null;
  imagePath:   string | null;
  dnaScore:    Record<string, unknown> | null;
  valueScore:  number | null;
}

interface FilterState {
  position:        string;
  league:          string;
  nationality:     string;
  ageMin:          string;
  ageMax:          string;
  overallMin:      string;
  overallMax:      string;
  potentialMin:    string;
  marketValueMin:  string;
  marketValueMax:  string;
  dnaMin:          string;
}

type SortOption = "overall" | "valueScore" | "potential" | "age";

const EMPTY_FILTERS: FilterState = {
  position:       "",
  league:         "",
  nationality:    "",
  ageMin:         "",
  ageMax:         "",
  overallMin:     "",
  overallMax:     "",
  potentialMin:   "",
  marketValueMin: "",
  marketValueMax: "",
  dnaMin:         "",
};

const PLACEHOLDER = "placeholder.png";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMV(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `€${(v / 1_000).toFixed(0)}K`;
  return `€${v}`;
}

function getOverallStyle(ovr: number | null): { color: string; bg: string; border: string } {
  const v = ovr ?? 0;
  if (v >= 88) return { color: "#FFD700", bg: "rgba(255,215,0,0.14)",  border: "rgba(255,215,0,0.35)" };
  if (v >= 82) return { color: "#00FF9C", bg: "rgba(0,255,156,0.12)",  border: "rgba(0,255,156,0.30)" };
  if (v >= 76) return { color: "#00C2FF", bg: "rgba(0,194,255,0.12)",  border: "rgba(0,194,255,0.30)" };
  if (v >= 68) return { color: "#7A5CFF", bg: "rgba(122,92,255,0.13)", border: "rgba(122,92,255,0.30)" };
  if (v >= 55) return { color: "#FBBF24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.28)" };
  return              { color: "#94A3B8", bg: "rgba(148,163,184,0.09)",border: "rgba(148,163,184,0.22)" };
}

function getValueScoreStyle(vs: number | null): string {
  if (vs === null) return "#94A3B8";
  if (vs >= 30)  return "#00FF9C";
  if (vs >= 15)  return "#FBBF24";
  if (vs >= 5)   return "#00C2FF";
  return "#94A3B8";
}

function dnaBadgeScore(dna: Record<string, unknown> | null): number | null {
  if (!dna) return null;
  const nums = Object.values(dna).filter((v): v is number => typeof v === "number");
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function countActiveFilters(f: FilterState): number {
  return Object.values(f).filter((v) => v.trim() !== "").length;
}

// ---------------------------------------------------------------------------
// useDebounce
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// PlayerAvatar
// ---------------------------------------------------------------------------

function PlayerAvatar({
  name, image, overall, size = "md",
}: {
  name: string; image: string | null; overall: number | null; size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hasImg   = !!image && !image.includes(PLACEHOLDER) && !failed;

  const ovr = overall ?? 0;
  const border =
    ovr >= 82 ? "rgba(0,255,156,0.55)" :
    ovr >= 76 ? "rgba(0,194,255,0.55)" :
    ovr >= 68 ? "rgba(122,92,255,0.5)" :
                "rgba(255,255,255,0.18)";

  const dims =
    size === "lg" ? "h-16 w-16 rounded-[14px] text-lg" :
    size === "sm" ? "h-9  w-9  rounded-[10px] text-xs"  :
                    "h-12 w-12 rounded-[12px] text-sm";

  if (hasImg) {
    return (
      <div className={`flex-shrink-0 overflow-hidden ${dims}`} style={{ border: `1.5px solid ${border}` }}>
        <img src={image!} alt={name} className="h-full w-full object-cover object-top" onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center font-semibold text-white ${dims}`}
      style={{
        background: "linear-gradient(135deg, rgba(0,194,255,0.22) 0%, rgba(122,92,255,0.22) 100%)",
        border:     `1.5px solid ${border}`,
      }}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SearchInput
// ---------------------------------------------------------------------------

function SearchInput({ value, onChange, isLoading }: { value: string; onChange: (v: string) => void; isLoading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
        {isLoading
          ? <Loader2 className="h-4 w-4 animate-spin text-[#00C2FF]" />
          : <Search className="h-4 w-4 text-gray-500" />}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por nome, clube ou liga…"
        className="w-full rounded-[14px] border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] py-3.5 pl-11 pr-10 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[rgba(0,194,255,0.4)] focus:bg-[rgba(0,194,255,0.04)] transition-colors"
      />
      {value && (
        <button
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white transition-colors"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FiltersPanel
// ---------------------------------------------------------------------------

interface FiltersPanelProps {
  filters: FilterState; onChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void; isOpen: boolean; activeCount: number;
}

function FiltersPanel({ filters, onChange, onReset, isOpen, activeCount }: FiltersPanelProps) {
  if (!isOpen) return null;

  const field = (label: string, key: keyof FilterState, placeholder: string, type: "text" | "number" = "text") => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{label}</label>
      <input
        type={type}
        value={filters[key]}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={placeholder}
        className="rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[rgba(0,194,255,0.35)] focus:bg-[rgba(0,194,255,0.04)] transition-colors"
      />
    </div>
  );

  return (
    <div className="mt-3 rounded-[18px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-5">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {field("Posição",          "position",       "ex: Centre Forward")}
        {field("Liga",             "league",         "ex: Premier League")}
        {field("Nacionalidade",    "nationality",    "ex: Brazil")}
        {field("Idade mín.",       "ageMin",         "ex: 18",      "number")}
        {field("Idade máx.",       "ageMax",         "ex: 26",      "number")}
        {field("Overall mín.",     "overallMin",     "ex: 70",      "number")}
        {field("Overall máx.",     "overallMax",     "ex: 85",      "number")}
        {field("Potencial mín.",   "potentialMin",   "ex: 78",      "number")}
        {field("Valor mín. (€)",   "marketValueMin", "ex: 500000",  "number")}
        {field("Valor máx. (€)",   "marketValueMax", "ex: 5000000", "number")}
        {field("DNA mín. (0–100)", "dnaMin",         "ex: 65",      "number")}
      </div>

      {activeCount > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-[10px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.06)] px-3 py-1.5 text-xs text-[#FF7B7D] hover:bg-[rgba(255,77,79,0.12)] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SortSelector
// ---------------------------------------------------------------------------

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "overall",    label: "Overall" },
  { value: "valueScore", label: "Value Score" },
  { value: "potential",  label: "Potencial" },
  { value: "age",        label: "Mais jovens" },
];

function SortSelector({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
      <div className="flex gap-1">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
              value === opt.value
                ? "bg-[rgba(0,194,255,0.15)] text-[#00C2FF] border border-[rgba(0,194,255,0.30)]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResultCard
// ---------------------------------------------------------------------------

function ResultCard({ player, onNavigate }: { player: PlayerSearchResult; onNavigate: (id: string) => void }) {
  const ovStyle  = getOverallStyle(player.overall);
  const dnaAvg   = dnaBadgeScore(player.dnaScore);
  const primaryPos = player.positions[0] ?? null;
  const vsColor  = getValueScoreStyle(player.valueScore);

  return (
    <button
      onClick={() => onNavigate(player.id)}
      className="group w-full text-left rounded-[20px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-4 transition-all duration-200 hover:border-[rgba(0,194,255,0.25)] hover:bg-[rgba(0,194,255,0.04)] hover:shadow-[0_8px_24px_rgba(0,194,255,0.07)]"
    >
      {/* ── Avatar + nome + overall ── */}
      <div className="flex items-start gap-3">
        <PlayerAvatar name={player.name} image={player.imagePath} overall={player.overall} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white group-hover:text-[#9BE7FF] transition-colors">
                {player.name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-gray-500">
                {player.team ?? "—"}{player.league ? ` · ${player.league}` : ""}
              </p>
            </div>

            <div
              className="flex-shrink-0 rounded-[8px] px-2.5 py-1 text-sm font-bold tabular-nums"
              style={{ color: ovStyle.color, background: ovStyle.bg, border: `1px solid ${ovStyle.border}` }}
            >
              {player.overall ?? "—"}
            </div>
          </div>

          <p className="mt-1.5 text-[11px] text-gray-600">
            {[player.nationality, player.age ? `${player.age}a` : null, primaryPos]
              .filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* ── Badges ── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {player.potential !== null && (
          <span className="flex items-center gap-1 rounded-full border border-[rgba(0,255,156,0.2)] bg-[rgba(0,255,156,0.06)] px-2.5 py-0.5 text-[10px] font-semibold text-[#00FF9C]">
            ↑ {player.potential} pot
          </span>
        )}

        {player.marketValue !== null && (
          <span className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-2.5 py-0.5 text-[10px] text-gray-400">
            {formatMV(player.marketValue)}
          </span>
        )}

        {player.valueScore !== null && (
          <span
            className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tabular-nums"
            style={{ color: vsColor, borderColor: `${vsColor}33`, background: `${vsColor}0d` }}
            title="ValueScore = overall / (valor em M€)"
          >
            VS {player.valueScore}
          </span>
        )}

        {dnaAvg !== null && (
          <span className="rounded-full border border-[rgba(168,85,247,0.28)] bg-[rgba(168,85,247,0.08)] px-2.5 py-0.5 text-[10px] font-semibold text-[#C084FC]">
            DNA {dnaAvg}
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// ResultsList
// ---------------------------------------------------------------------------

function ResultsList({ results, isLoading, hasQuery, isGems }: {
  results: PlayerSearchResult[]; isLoading: boolean; hasQuery: boolean; isGems: boolean;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 flex-shrink-0 rounded-[12px] bg-[rgba(255,255,255,0.06)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 rounded bg-[rgba(255,255,255,0.07)]" />
                <div className="h-2.5 w-1/2 rounded bg-[rgba(255,255,255,0.04)]" />
                <div className="h-2.5 w-1/3 rounded bg-[rgba(255,255,255,0.03)]" />
              </div>
              <div className="h-8 w-10 flex-shrink-0 rounded-[8px] bg-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="mt-3 flex gap-2">
              <div className="h-5 w-16 rounded-full bg-[rgba(255,255,255,0.04)]" />
              <div className="h-5 w-14 rounded-full bg-[rgba(255,255,255,0.04)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
          <Filter className="h-6 w-6 text-gray-600" />
        </div>
        <p className="text-sm font-medium text-gray-400">
          {isGems
            ? "Nenhuma joia escondida encontrada"
            : hasQuery
            ? "Nenhum jogador encontrado"
            : "Use a busca para encontrar jogadores"}
        </p>
        <p className="mt-1 text-[11px] text-gray-600">
          {hasQuery ? "Tente ajustar os filtros ou termos de busca" : "Digite um nome, clube ou liga para começar"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {results.map((p) => (
        <ResultCard key={p.id} player={p} onNavigate={(id) => navigate(`/players/${id}`)} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PlayerSearchPage() {
  const [query,       setQuery]       = useState("");
  const [filters,     setFilters]     = useState<FilterState>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy,      setSortBy]      = useState<SortOption>("overall");
  const [gemsMode,    setGemsMode]    = useState(false);
  const [results,     setResults]     = useState<PlayerSearchResult[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [fetched,     setFetched]     = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // ── Fetch — normal search ────────────────────────────────────────────────
  useEffect(() => {
    if (gemsMode) return;
    let cancelled = false;

    async function doFetch() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedQuery.trim())        params.set("search",         debouncedQuery.trim());
        if (filters.position.trim())      params.set("position",       filters.position.trim());
        if (filters.league.trim())        params.set("league",         filters.league.trim());
        if (filters.nationality.trim())   params.set("nationality",    filters.nationality.trim());
        if (filters.ageMin.trim())        params.set("ageMin",         filters.ageMin.trim());
        if (filters.ageMax.trim())        params.set("ageMax",         filters.ageMax.trim());
        if (filters.overallMin.trim())    params.set("overallMin",     filters.overallMin.trim());
        if (filters.overallMax.trim())    params.set("overallMax",     filters.overallMax.trim());
        if (filters.potentialMin.trim())  params.set("potentialMin",   filters.potentialMin.trim());
        if (filters.marketValueMin.trim()) params.set("marketValueMin", filters.marketValueMin.trim());
        if (filters.marketValueMax.trim()) params.set("marketValueMax", filters.marketValueMax.trim());
        if (filters.dnaMin.trim())        params.set("dnaMin",         filters.dnaMin.trim());
        params.set("sortBy", sortBy);

        const qs  = params.toString();
        const res = await apiFetch<PlayerSearchResult[]>(`/players/search${qs ? `?${qs}` : ""}`);
        if (!cancelled) { setResults(res.data ?? []); setFetched(true); }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    doFetch();
    return () => { cancelled = true; };
  }, [debouncedQuery, filters, sortBy, gemsMode]);

  // ── Fetch — hidden gems ──────────────────────────────────────────────────
  useEffect(() => {
    if (!gemsMode) return;
    let cancelled = false;

    async function doFetchGems() {
      setLoading(true);
      try {
        const res = await apiFetch<PlayerSearchResult[]>("/players/hidden-gems?limit=40");
        if (!cancelled) { setResults(res.data ?? []); setFetched(true); }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    doFetchGems();
    return () => { cancelled = true; };
  }, [gemsMode]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFilterChange = (key: keyof FilterState, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleReset = () => { setFilters(EMPTY_FILTERS); setQuery(""); };

  const toggleGems = () => {
    setGemsMode((g) => !g);
    if (!gemsMode) { setQuery(""); setFilters(EMPTY_FILTERS); }
  };

  const activeFilterCount = countActiveFilters(filters);
  const hasQuery = debouncedQuery.trim() !== "" || activeFilterCount > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#07142A]">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1520px] space-y-5 px-6 py-6">

            {/* ── Header ── */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#B6FFD8]">
                  Scout Inteligente
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-white">
                  Busca de Jogadores
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  Filtros avançados · Value Score · DNA · Joias do mercado
                </p>
              </div>

              {/* Hidden Gems toggle */}
              <button
                onClick={toggleGems}
                className={`flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-medium transition-all ${
                  gemsMode
                    ? "border-[rgba(251,191,36,0.5)] bg-[rgba(251,191,36,0.1)] text-[#FBBF24] shadow-[0_0_20px_rgba(251,191,36,0.12)]"
                    : "border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.03)] text-gray-400 hover:text-[#FBBF24] hover:border-[rgba(251,191,36,0.3)]"
                }`}
              >
                <Gem className="h-4 w-4" />
                Joias Escondidas
              </button>
            </div>

            {/* Gems mode banner */}
            {gemsMode && (
              <div className="flex items-center gap-3 rounded-[14px] border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] px-4 py-3">
                <Gem className="h-4 w-4 text-[#FBBF24] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#FBBF24]">Modo Joias Escondidas</p>
                  <p className="text-[11px] text-[#FBBF2480]">
                    Overall ≥ 70 · Idade ≤ 24 · Valor abaixo da média — ordenados por ValueScore
                  </p>
                </div>
                <button onClick={toggleGems} className="ml-auto text-[#FBBF2480] hover:text-[#FBBF24] transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── Search bar + controls ── */}
            {!gemsMode && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <SearchInput value={query} onChange={setQuery} isLoading={loading} />
                </div>

                <button
                  onClick={() => setFiltersOpen((o) => !o)}
                  className={`flex items-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-medium transition-all ${
                    filtersOpen || activeFilterCount > 0
                      ? "border-[rgba(0,194,255,0.4)] bg-[rgba(0,194,255,0.08)] text-[#00C2FF]"
                      : "border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.03)] text-gray-400 hover:text-white"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#00C2FF] text-[9px] font-bold text-[#07142A]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* ── Filters panel ── */}
            {!gemsMode && (
              <FiltersPanel
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleReset}
                isOpen={filtersOpen}
                activeCount={activeFilterCount}
              />
            )}

            {/* ── Results bar: count + sort ── */}
            {fetched && !loading && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                  {results.length === 0
                    ? "Sem resultados"
                    : `${results.length} jogador${results.length !== 1 ? "es" : ""} encontrado${results.length !== 1 ? "s" : ""}`}
                </p>

                <div className="flex items-center gap-4">
                  {!gemsMode && <SortSelector value={sortBy} onChange={setSortBy} />}

                  {(hasQuery || gemsMode) && (
                    <button
                      onClick={gemsMode ? toggleGems : handleReset}
                      className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-gray-300 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {gemsMode ? "Sair do modo" : "Limpar busca"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Results grid ── */}
            <ResultsList
              results={results}
              isLoading={loading && !fetched}
              hasQuery={hasQuery || gemsMode}
              isGems={gemsMode}
            />

          </div>
        </main>
      </div>
    </div>
  );
}
