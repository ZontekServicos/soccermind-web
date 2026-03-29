import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { GitCompareArrows, Search, Users } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { ActivePlayersFilterChips } from "../components/ActivePlayersFilterChips";
import { PlayersFiltersPanel } from "../components/PlayersFiltersPanel";
import { SectionCard } from "../components/player-intelligence/SectionCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { createComparisonAnalysis } from "../services/analysis";
import {
  getCompareDataByIds,
  getCompareDataByNames,
  getCompareShortlist,
  type CompareViewModel,
  type PlayerFilterOptions,
} from "../services/compare";
import { EMPTY_PLAYER, type PlayerExtended } from "../types/player";
import type { FieldIntelligence, PlayerIntelligenceProfile } from "../types/player-intelligence";
import {
  buildApiFilters,
  countActiveFilters,
  DEFAULT_PLAYERS_FILTERS,
  type FilterFieldKey,
  type PlayersFiltersState,
  parseFiltersFromSearchParams,
} from "../utils/playerFilters";

type PositionContext = CompareViewModel["positionContext"];

const EMPTY_FILTER_OPTIONS: PlayerFilterOptions = {
  positions: [],
  nationalities: [],
  teams: [],
  leagues: [],
  sources: [],
};

function buildPlayerCaption(player: PlayerExtended) {
  return [player.position, player.club].filter(Boolean).join(" - ");
}

function dedupePlayers(players: PlayerExtended[]) {
  const seen = new Set<string>();
  return players.filter((player) => {
    if (!player.id || seen.has(player.id)) return false;
    seen.add(player.id);
    return true;
  });
}

function formatWinnerLabel(winner: "A" | "B" | "DRAW", nameA: string, nameB: string) {
  if (winner === "A") return nameA;
  if (winner === "B") return nameB;
  return "Balanced";
}

function winnerTone(winner: "A" | "B" | "DRAW") {
  if (winner === "A") return "border-[rgba(0,194,255,0.24)] bg-[rgba(0,194,255,0.10)] text-[#9BE7FF]";
  if (winner === "B") return "border-[rgba(168,85,247,0.24)] bg-[rgba(168,85,247,0.10)] text-[#D8B4FE]";
  return "border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-gray-300";
}

function metricTone(score: number, inverse = false) {
  const effective = inverse ? 100 - score : score;
  if (effective >= 70) return "text-[#B6FFD8]";
  if (effective >= 50) return "text-[#9BE7FF]";
  return "text-[#FFD6A5]";
}

function renderMetricBand(profile: PlayerIntelligenceProfile | null, key: "risk" | "upside" | "liquidity" | "value") {
  if (!profile) return null;
  const band =
    key === "value"
      ? profile.executiveSnapshot.value ?? profile.market?.financialRisk ?? profile.executiveSnapshot.risk
      : profile.executiveSnapshot[key];

  return (
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{key}</p>
      <p className={`mt-3 text-2xl font-semibold ${metricTone(band.score, key === "risk")}`}>{band.score}</p>
      <p className="mt-1 text-sm text-white">{band.label}</p>
      <p className="mt-2 text-xs leading-5 text-gray-400">{band.summary}</p>
    </div>
  );
}

function PitchBase({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[rgba(0,255,156,0.10)] bg-[radial-gradient(circle_at_center,rgba(0,255,156,0.08),transparent_55%),linear-gradient(180deg,#0B2A23,#07142A)]">
      <svg viewBox="0 0 100 100" className="aspect-[4/5] w-full">
        <rect x="1" y="1" width="98" height="98" rx="2" fill="transparent" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
        <line x1="50" y1="1" x2="50" y2="99" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="10" fill="transparent" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="0.9" fill="rgba(255,255,255,0.8)" />
        <rect x="1" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="83" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="1" y="36" width="5" height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="94" y="36" width="5" height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {children}
      </svg>
    </div>
  );
}

function HeatmapPitch({ intelligence }: { intelligence: FieldIntelligence }) {
  return (
    <PitchBase>
      {intelligence.heatmap.map((zone, index) => (
        <rect
          key={`${zone.x}-${zone.y}-${index}`}
          x={zone.x + 0.6}
          y={zone.y + 0.6}
          width={Math.max(zone.width - 1.2, 0)}
          height={Math.max(zone.height - 1.2, 0)}
          fill={`rgba(0,194,255,${Math.max(zone.intensity / 120, 0.12)})`}
        />
      ))}
    </PitchBase>
  );
}

function ShotMapPitch({ intelligence }: { intelligence: FieldIntelligence }) {
  return (
    <PitchBase>
      {intelligence.shots.map((shot, index) => (
        <circle
          key={`${shot.x}-${shot.y}-${index}`}
          cx={shot.x}
          cy={shot.y}
          r={Math.max(1.6, (shot.value ?? 0.1) * 7)}
          fill={shot.outcome === "goal" ? "#00FF9C" : shot.outcome === "saved" ? "#00C2FF" : "#FF7B7D"}
          fillOpacity="0.75"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="0.35"
        />
      ))}
    </PitchBase>
  );
}

function PassMapPitch({ intelligence }: { intelligence: FieldIntelligence }) {
  return (
    <PitchBase>
      {intelligence.passes.map((pass, index) => (
        <g key={`${pass.x}-${pass.y}-${index}`}>
          <line
            x1={pass.x}
            y1={pass.y}
            x2={pass.endX ?? pass.x}
            y2={pass.endY ?? pass.y}
            stroke={pass.outcome === "success" ? "rgba(0,255,156,0.72)" : "rgba(255,77,79,0.65)"}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <circle cx={pass.x} cy={pass.y} r="1" fill="rgba(255,255,255,0.65)" />
          <circle cx={pass.endX ?? pass.x} cy={pass.endY ?? pass.y} r="1" fill={pass.outcome === "success" ? "rgba(0,255,156,0.72)" : "rgba(255,77,79,0.65)"} />
        </g>
      ))}
    </PitchBase>
  );
}

function DefensiveActionsPitch({ intelligence }: { intelligence: FieldIntelligence }) {
  return (
    <PitchBase>
      {intelligence.defensiveActions.map((action, index) => (
        <g key={`${action.x}-${action.y}-${index}`} transform={`translate(${action.x}, ${action.y})`}>
          <line x1="-1.4" y1="-1.4" x2="1.4" y2="1.4" stroke={action.outcome === "success" ? "#FBBF24" : "#FF7B7D"} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="-1.4" y1="1.4" x2="1.4" y2="-1.4" stroke={action.outcome === "success" ? "#FBBF24" : "#FF7B7D"} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ))}
    </PitchBase>
  );
}

function IntelligenceColumn({
  title,
  player,
  profile,
  accent,
}: {
  title: string;
  player: PlayerExtended;
  profile: PlayerIntelligenceProfile | null;
  accent: "A" | "B";
}) {
  const accentBorder = accent === "A" ? "border-[rgba(0,194,255,0.24)]" : "border-[rgba(168,85,247,0.24)]";
  const accentBadge = accent === "A" ? "text-[#9BE7FF]" : "text-[#D8B4FE]";

  return (
    <div className={`rounded-[22px] border bg-[rgba(255,255,255,0.03)] p-5 ${accentBorder}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[11px] uppercase tracking-[0.24em] ${accentBadge}`}>{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{player.name}</h3>
          <p className="mt-1 text-sm text-gray-400">{buildPlayerCaption(player)}</p>
        </div>
        <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Overall</p>
          <p className="mt-2 text-2xl font-semibold text-white">{player.overallRating}</p>
        </div>
      </div>
      {profile ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {renderMetricBand(profile, "risk")}
            {renderMetricBand(profile, "upside")}
            {renderMetricBand(profile, "liquidity")}
            {renderMetricBand(profile, "value")}
          </div>
          <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Recommendation</p>
            <p className="mt-3 text-xl font-semibold text-white">{profile.executiveSnapshot.recommendation}</p>
            <p className="mt-2 text-sm text-gray-400">Confidence {profile.executiveSnapshot.confidence}</p>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-gray-400">
          Full intelligence profile is unavailable for this player in the current environment.
        </div>
      )}
    </div>
  );
}

function WinnerTag({
  label,
  winner,
  nameA,
  nameB,
}: {
  label: string;
  winner: "A" | "B" | "DRAW";
  nameA: string;
  nameB: string;
}) {
  return (
    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${winnerTone(winner)}`}>
      {label}: {formatWinnerLabel(winner, nameA, nameB)}
    </span>
  );
}

function PositionContextBanner({
  kind,
  label,
  message,
  positionA,
  positionB,
}: {
  kind: PositionContext["kind"];
  label: string;
  message: string;
  positionA: string;
  positionB: string;
}) {
  const styles = {
    same: { border: "border-[rgba(0,255,156,0.22)]", background: "bg-[rgba(0,255,156,0.08)]", accent: "text-[#7DFFD1]" },
    related: { border: "border-[rgba(0,194,255,0.22)]", background: "bg-[rgba(0,194,255,0.08)]", accent: "text-[#9BE7FF]" },
    cross: { border: "border-[rgba(251,191,36,0.22)]", background: "bg-[rgba(251,191,36,0.08)]", accent: "text-[#F8D98B]" },
  }[kind];

  return (
    <div className={`rounded-[18px] border px-5 py-4 ${styles.border} ${styles.background}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={`text-sm font-semibold ${styles.accent}`}>{label}</p>
          <p className="mt-1 text-sm text-gray-300">{message}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs text-gray-300">
          <span>{positionA}</span>
          <span className="text-gray-500">vs</span>
          <span>{positionB}</span>
        </div>
      </div>
    </div>
  );
}

function ComparisonStatRow({
  label,
  valueA,
  valueB,
  inverse = false,
}: {
  label: string;
  valueA: number;
  valueB: number;
  inverse?: boolean;
}) {
  const winner = Math.abs(valueA - valueB) < 0.001 ? "DRAW" : inverse ? (valueA < valueB ? "A" : "B") : valueA > valueB ? "A" : "B";
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <div className={`text-left text-lg font-semibold ${winner === "A" ? "text-[#9BE7FF]" : "text-white"}`}>{valueA.toFixed(1)}</div>
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{label}</p>
        <p className="mt-1 text-xs text-gray-400">{winner === "DRAW" ? "Balanced" : `Winner ${winner}`}</p>
      </div>
      <div className={`text-right text-lg font-semibold ${winner === "B" ? "text-[#D8B4FE]" : "text-white"}`}>{valueB.toFixed(1)}</div>
    </div>
  );
}

export default function Compare() {
  const { user } = useAuth();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const initialFilters = useMemo(() => parseFiltersFromSearchParams(urlSearchParams), []);
  const [filters, setFilters] = useState<PlayersFiltersState>(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search.trim());
  const [filtersExpanded, setFiltersExpanded] = useState(() => countActiveFilters(initialFilters) > 0);
  const [availablePlayers, setAvailablePlayers] = useState<PlayerExtended[]>([]);
  const [playerA, setPlayerA] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [playerB, setPlayerB] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [selectAOpen, setSelectAOpen] = useState(false);
  const [selectBOpen, setSelectBOpen] = useState(false);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<CompareViewModel | null>(null);
  const [filterOptions, setFilterOptions] = useState<PlayerFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveFeedbackTone, setSaveFeedbackTone] = useState<"success" | "error">("success");
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [analysisDescription, setAnalysisDescription] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

  const apiFilters = useMemo(() => buildApiFilters(filters, debouncedSearch), [filters, debouncedSearch]);
  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);

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
    setUrlSearchParams(nextParams, { replace: true });
  }, [filters, setUrlSearchParams]);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      setPlayersLoading(true);
      try {
        const response = await getCompareShortlist({ ...apiFilters, page: 1, limit: 80 });
        if (!active) return;
        const mappedPlayers = Array.isArray(response.data.players) ? response.data.players : [];
        setAvailablePlayers(mappedPlayers);
        setPlayersError(null);
        setFilterOptions(response.data.filterOptions ?? EMPTY_FILTER_OPTIONS);
        setPlayerA((current) => (current.id && current.id !== EMPTY_PLAYER.id ? current : mappedPlayers[0] ?? EMPTY_PLAYER));
        setPlayerB((current) => (current.id && current.id !== EMPTY_PLAYER.id ? current : mappedPlayers[1] ?? mappedPlayers[0] ?? EMPTY_PLAYER));
      } catch (error) {
        if (!active) return;
        setAvailablePlayers([]);
        setPlayersError(error instanceof Error ? error.message : "Erro ao carregar a shortlist de jogadores");
      } finally {
        if (active) setPlayersLoading(false);
      }
    }

    void loadPlayers();
    return () => {
      active = false;
    };
  }, [apiFilters]);

  useEffect(() => {
    let active = true;

    async function loadComparison() {
      if (!playerA.name || !playerB.name || playerA.name === "Sem dados" || playerB.name === "Sem dados") {
        setComparisonData(null);
        return;
      }

      setCompareLoading(true);
      try {
        const response =
          playerA.id && playerB.id && playerA.id !== "empty-player" && playerB.id !== "empty-player"
            ? await getCompareDataByIds(playerA.id, playerB.id)
            : await getCompareDataByNames(playerA.name, playerB.name);

        if (!active) return;
        setComparisonData(response.data);
        setCompareError(null);
      } catch (error) {
        if (!active) return;
        setComparisonData(null);
        setCompareError(error instanceof Error ? error.message : "Erro ao comparar jogadores");
      } finally {
        if (active) setCompareLoading(false);
      }
    }

    void loadComparison();
    return () => {
      active = false;
    };
  }, [playerA.id, playerA.name, playerB.id, playerB.name]);

  const selectablePlayers = useMemo(
    () =>
      dedupePlayers(
        [playerA, playerB, ...availablePlayers].filter((player) => player.id && player.id !== EMPTY_PLAYER.id),
      ),
    [availablePlayers, playerA, playerB],
  );

  const playersById = useMemo(() => new Map(selectablePlayers.map((player) => [player.id, player])), [selectablePlayers]);
  const displayPlayerA = comparisonData?.playerA ?? playerA;
  const displayPlayerB = comparisonData?.playerB ?? playerB;
  const positionContext = comparisonData?.positionContext ?? null;
  const hasValidPlayers =
    Boolean(playerA.id) &&
    Boolean(playerB.id) &&
    playerA.id !== EMPTY_PLAYER.id &&
    playerB.id !== EMPTY_PLAYER.id &&
    playerA.id !== playerB.id;
  const profileA = comparisonData?.intelligenceProfiles?.playerA ?? null;
  const profileB = comparisonData?.intelligenceProfiles?.playerB ?? null;
  const executiveRecommendation = comparisonData?.executiveRecommendation ?? null;

  const radarData = comparisonData?.radarData || [
    { attribute: "Pace", A: displayPlayerA.stats.pace, B: displayPlayerB.stats.pace },
    { attribute: "Shooting", A: displayPlayerA.stats.shooting, B: displayPlayerB.stats.shooting },
    { attribute: "Passing", A: displayPlayerA.stats.passing, B: displayPlayerB.stats.passing },
    { attribute: "Dribbling", A: displayPlayerA.stats.dribbling, B: displayPlayerB.stats.dribbling },
    { attribute: "Defending", A: displayPlayerA.stats.defending, B: displayPlayerB.stats.defending },
    { attribute: "Physical", A: displayPlayerA.stats.physical, B: displayPlayerB.stats.physical },
  ];

  const handleFieldChange = (field: FilterFieldKey, value: string) => setFilters((current) => ({ ...current, [field]: value }));
  const handleSearchChange = (value: string) => setFilters((current) => ({ ...current, search: value }));
  const handleTogglePosition = (position: string) =>
    setFilters((current) => ({
      ...current,
      positions: current.positions.includes(position)
        ? current.positions.filter((item) => item !== position)
        : [...current.positions, position],
    }));
  const handleClearFilters = () => setFilters(DEFAULT_PLAYERS_FILTERS);

  const handleSaveAnalysis = async () => {
    if (!hasValidPlayers) {
      setSaveFeedbackTone("error");
      setSaveFeedback("Selecione dois jogadores validos e diferentes para salvar a analise.");
      return;
    }

    setSaveLoading(true);
    setSaveFeedback(null);
    try {
      const response = await createComparisonAnalysis({
        playerIds: [playerA.id, playerB.id],
        title: analysisTitle.trim() || `Comparacao - ${displayPlayerA.name} vs ${displayPlayerB.name}`,
        description: analysisDescription.trim() || undefined,
        analyst: user?.name,
      });
      setSaveFeedbackTone("success");
      setSaveFeedback(`Analise salva com sucesso: ${response.data.title}. A central de analises foi sincronizada com o backend.`);
      setAnalysisTitle("");
      setAnalysisDescription("");
    } catch (error) {
      setSaveFeedbackTone("error");
      setSaveFeedback(error instanceof Error ? error.message : "Nao foi possivel salvar a analise.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1680px] space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.16),transparent_68%)] blur-2xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.12),transparent_72%)] blur-2xl" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#C7B8FF]">
                    <GitCompareArrows className="h-3.5 w-3.5" />
                    Compare Intelligence
                  </div>
                  <h1 className="text-4xl font-semibold text-white">Player vs Player</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
                    The comparison now starts from the same full intelligence foundation used by each individual player page, so every block is grounded in real profile context.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4 backdrop-blur-sm">
                    <div className="grid gap-3">
                      <Input
                        value={analysisTitle}
                        onChange={(event) => setAnalysisTitle(event.target.value)}
                        maxLength={160}
                        placeholder={`Comparacao - ${displayPlayerA.name} vs ${displayPlayerB.name}`}
                        className="h-10 rounded-[12px] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-sm text-gray-100 placeholder:text-gray-500"
                      />
                      <Textarea
                        value={analysisDescription}
                        onChange={(event) => setAnalysisDescription(event.target.value)}
                        maxLength={1000}
                        placeholder="Descricao opcional para contextualizar a comparacao"
                        className="min-h-[76px] rounded-[12px] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-sm text-gray-100 placeholder:text-gray-500"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleSaveAnalysis}
                          disabled={saveLoading || !hasValidPlayers}
                          className="h-10 rounded-[12px] border border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.12)] px-5 font-semibold text-[#9BE7FF] hover:bg-[rgba(0,194,255,0.18)]"
                        >
                          {saveLoading ? "Salvando analise..." : "Salvar na central de analises"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(122,92,255,0.18)]">
                          <Users className="h-5 w-5 text-[#C7B8FF]" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Shortlist</p>
                          <p className="text-2xl font-bold text-[#C7B8FF]">{availablePlayers.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Filtros ativos</p>
                      <p className="mt-2 text-2xl font-bold text-[#9BE7FF]">{activeFiltersCount}</p>
                    </div>
                    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Recommendation</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {executiveRecommendation ? formatWinnerLabel(executiveRecommendation.winner, displayPlayerA.name, displayPlayerB.name) : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {saveFeedback && (
              <div
                className="rounded-[16px] px-5 py-4 text-sm"
                style={{
                  border: saveFeedbackTone === "success" ? "1px solid rgba(0,255,156,0.18)" : "1px solid rgba(255,77,79,0.22)",
                  background: saveFeedbackTone === "success" ? "rgba(0,255,156,0.08)" : "rgba(255,77,79,0.08)",
                  color: saveFeedbackTone === "success" ? "#9CFFD1" : "#FFB4B5",
                }}
              >
                {saveFeedback}
              </div>
            )}

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
              onClearSearch={() => setFilters((current) => ({ ...current, search: "" }))}
              onRemovePosition={(position) =>
                setFilters((current) => ({
                  ...current,
                  positions: current.positions.filter((item) => item !== position),
                }))
              }
              onClearField={(field) => setFilters((current) => ({ ...current, [field]: "" }))}
              onClearRange={([minField, maxField]) => setFilters((current) => ({ ...current, [minField]: "", [maxField]: "" }))}
            />

            {playersError && <div className="rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">{playersError}</div>}
            {compareError && <div className="rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">{compareError}</div>}

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[22px] border border-[rgba(0,194,255,0.22)] bg-[rgba(255,255,255,0.03)] p-6">
                <label className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Jogador A</label>
                <Select value={playerA.id} onValueChange={(value) => setPlayerA(playersById.get(value) ?? EMPTY_PLAYER)} open={selectAOpen} onOpenChange={setSelectAOpen}>
                  <SelectTrigger className="h-14 rounded-[14px] border-[rgba(0,194,255,0.28)] bg-[rgba(255,255,255,0.02)]">
                    <SelectValue placeholder="Selecione o Jogador A" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1B35] border-[rgba(0,194,255,0.3)]">
                    {selectablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} - {player.club}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-[22px] border border-[rgba(168,85,247,0.22)] bg-[rgba(255,255,255,0.03)] p-6">
                <label className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-[#D8B4FE]">Jogador B</label>
                <Select value={playerB.id} onValueChange={(value) => setPlayerB(playersById.get(value) ?? EMPTY_PLAYER)} open={selectBOpen} onOpenChange={setSelectBOpen}>
                  <SelectTrigger className="h-14 rounded-[14px] border-[rgba(168,85,247,0.28)] bg-[rgba(255,255,255,0.02)]">
                    <SelectValue placeholder="Selecione o Jogador B" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1B35] border-[rgba(168,85,247,0.3)]">
                    {selectablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} - {player.club}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {playersLoading && (
              <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-gray-400">
                Carregando shortlist para comparacao...
              </div>
            )}
            {!playersLoading && selectablePlayers.length === 0 && (
              <div className="py-14 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)]">
                  <Search className="h-7 w-7 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">Nenhum jogador encontrado com os filtros selecionados.</p>
              </div>
            )}

            {positionContext && (
              <PositionContextBanner
                kind={positionContext.kind}
                label={positionContext.label}
                message={positionContext.message}
                positionA={positionContext.positionA}
                positionB={positionContext.positionB}
              />
            )}

            <SectionCard
              eyebrow="Executive Snapshot"
              title="Two complete player cases, compared block by block"
              description="Recommendation, trust and winner logic all come from the full player profiles, not a shallow compare-only model."
              accent="cyan"
              aside={
                executiveRecommendation ? (
                  <div className="flex flex-wrap gap-2">
                    <WinnerTag label="Final recommendation" winner={executiveRecommendation.winner} nameA={displayPlayerA.name} nameB={displayPlayerB.name} />
                    <WinnerTag label="Sporting impact" winner={executiveRecommendation.sportingImpact} nameA={displayPlayerA.name} nameB={displayPlayerB.name} />
                    <WinnerTag label="Market efficiency" winner={executiveRecommendation.marketEfficiency} nameA={displayPlayerA.name} nameB={displayPlayerB.name} />
                  </div>
                ) : null
              }
            >
              <div className="grid gap-6 xl:grid-cols-2">
                <IntelligenceColumn title="Player A" player={displayPlayerA} profile={profileA} accent="A" />
                <IntelligenceColumn title="Player B" player={displayPlayerB} profile={profileB} accent="B" />
              </div>
              {executiveRecommendation && (
                <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Executive Recommendation</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{formatWinnerLabel(executiveRecommendation.winner, displayPlayerA.name, displayPlayerB.name)}</p>
                    <p className="mt-3 text-sm leading-6 text-gray-400">{executiveRecommendation.summary}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <ComparisonStatRow label="Weighted Score" valueA={executiveRecommendation.weightedScores.playerA} valueB={executiveRecommendation.weightedScores.playerB} />
                    <ComparisonStatRow label="Technical Block" valueA={comparisonData?.blockWinners?.technical?.playerA ?? 0} valueB={comparisonData?.blockWinners?.technical?.playerB ?? 0} />
                    <ComparisonStatRow label="Market Block" valueA={comparisonData?.blockWinners?.market?.playerA ?? 0} valueB={comparisonData?.blockWinners?.market?.playerB ?? 0} />
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard eyebrow="Core Identity" title="Profile context before the scouting dive" description="Age, club, league, nationality and dominant position stay visible because every recommendation depends on context, not just output." accent="green">
              <div className="grid gap-4 xl:grid-cols-2">
                {[
                  { title: displayPlayerA.name, player: displayPlayerA, profile: profileA },
                  { title: displayPlayerB.name, player: displayPlayerB, profile: profileB },
                ].map((item) => (
                  <div key={item.title} className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Age</p><p className="mt-2 text-lg text-white">{item.profile?.identity?.age ?? item.player.age}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Club</p><p className="mt-2 text-lg text-white">{item.profile?.identity?.club ?? item.player.club}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">League</p><p className="mt-2 text-lg text-white">{item.profile?.identity?.league ?? "-"}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Nationality</p><p className="mt-2 text-lg text-white">{item.profile?.identity?.nationality ?? item.player.nationality}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Dominant Position</p><p className="mt-2 text-lg text-white">{item.profile?.identity?.dominantPosition ?? item.player.position}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Archetype</p><p className="mt-2 text-lg text-white">{item.profile?.summary?.archetype ?? "N/A"}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Attributes & Metrics"
              title="Technical baseline with core and market context"
              description="Core attributes, overall, potential and market value stay linked to the richer profile rather than floating as isolated summary stats."
              accent="purple"
              aside={comparisonData?.blockWinners?.technical ? <WinnerTag label="Technical winner" winner={comparisonData.blockWinners.technical.winner} nameA={displayPlayerA.name} nameB={displayPlayerB.name} /> : null}
            >
              <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                  <ResponsiveContainer width="100%" height={360}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                      <PolarAngleAxis dataKey="attribute" stroke="#94a3b8" style={{ fontSize: "13px", fontWeight: 500 }} />
                      <Radar name={displayPlayerA.name} dataKey="A" stroke="#00C2FF" fill="#00C2FF" fillOpacity={0.2} strokeWidth={2.5} />
                      <Radar name={displayPlayerB.name} dataKey="B" stroke="#7A5CFF" fill="#7A5CFF" fillOpacity={0.2} strokeWidth={2.5} />
                      <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "20px" }} iconType="circle" />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {comparisonData?.comparisonStats.map((stat) => (
                    <ComparisonStatRow key={stat.name} label={stat.name} valueA={stat.a} valueB={stat.b} />
                  ))}
                  <ComparisonStatRow label="Overall" valueA={displayPlayerA.overallRating} valueB={displayPlayerB.overallRating} />
                  <ComparisonStatRow label="Potential" valueA={displayPlayerA.potential} valueB={displayPlayerB.potential} />
                  <ComparisonStatRow label="Market Value" valueA={displayPlayerA.marketValueAmount ?? 0} valueB={displayPlayerB.marketValueAmount ?? 0} />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Market & Risk"
              title="Deal quality, liquidity and downside"
              description="Liquidity, financial risk, physical risk, tactical adaptation risk and capital efficiency are compared using the same player-level intelligence blocks used on the profile page."
              accent="amber"
              aside={
                comparisonData?.blockWinners?.market && comparisonData?.blockWinners?.risk ? (
                  <div className="flex flex-wrap gap-2">
                    <WinnerTag label="Market winner" winner={comparisonData.blockWinners.market.winner} nameA={displayPlayerA.name} nameB={displayPlayerB.name} />
                    <WinnerTag label="Risk winner" winner={comparisonData.blockWinners.risk.winner} nameA={displayPlayerA.name} nameB={displayPlayerB.name} />
                  </div>
                ) : null
              }
            >
              <div className="grid gap-4 xl:grid-cols-2">
                <ComparisonStatRow label="Liquidity" valueA={profileA?.market?.liquidity.score ?? displayPlayerA.liquidity.score} valueB={profileB?.market?.liquidity.score ?? displayPlayerB.liquidity.score} />
                <ComparisonStatRow label="Financial Risk" valueA={profileA?.market?.financialRisk.score ?? displayPlayerA.financialRisk.index} valueB={profileB?.market?.financialRisk.score ?? displayPlayerB.financialRisk.index} inverse />
                <ComparisonStatRow label="Physical Risk" valueA={profileA?.physical?.physicalRisk.score ?? displayPlayerA.structuralRisk.score} valueB={profileB?.physical?.physicalRisk.score ?? displayPlayerB.structuralRisk.score} inverse />
                <ComparisonStatRow label="Tactical Adaptation Risk" valueA={profileA?.tactical?.tacticalAdaptationRisk.score ?? displayPlayerA.risk.score} valueB={profileB?.tactical?.tacticalAdaptationRisk.score ?? displayPlayerB.risk.score} inverse />
                <ComparisonStatRow label="Capital Efficiency" valueA={profileA?.market?.capitalEfficiency ?? displayPlayerA.capitalEfficiency} valueB={profileB?.market?.capitalEfficiency ?? displayPlayerB.capitalEfficiency} />
                <ComparisonStatRow label="Value Score" valueA={profileA?.market?.valueScore ?? 0} valueB={profileB?.market?.valueScore ?? 0} />
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="SoccerMind DNA"
              title="Trait-by-trait comparison"
              description="Verticality, progressive threat, ball security, tactical maturity, transition impact, final-third creation, pressing intensity and depth attack are compared from the player DNA blocks."
              accent="purple"
              aside={comparisonData?.blockWinners?.tacticalDna ? <WinnerTag label="Tactical / DNA winner" winner={comparisonData.blockWinners.tacticalDna.winner} nameA={displayPlayerA.name} nameB={displayPlayerB.name} /> : null}
            >
              <div className="space-y-3">
                {["verticality", "progressive-threat", "ball-security", "tactical-maturity", "transition-impact", "final-third-creation", "pressing-intensity", "depth-attack"].map((key) => {
                  const traitA = profileA?.dna?.traits.find((trait) => trait.key === key) ?? profileA?.soccerMindDna.traits.find((trait) => trait.key === key);
                  const traitB = profileB?.dna?.traits.find((trait) => trait.key === key) ?? profileB?.soccerMindDna.traits.find((trait) => trait.key === key);
                  if (!traitA || !traitB) return null;
                  return <ComparisonStatRow key={key} label={traitA.label} valueA={traitA.value} valueB={traitB.value} />;
                })}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Field Intelligence" title="Spatial and event intelligence side by side" description="Heatmap, shot map, pass map and defensive actions stay anchored to each player's full profile context." accent="green">
              <div className="grid gap-6 xl:grid-cols-2">
                {[
                  { label: "Player A", name: displayPlayerA.name, intelligence: profileA?.fieldIntelligence ?? null },
                  { label: "Player B", name: displayPlayerB.name, intelligence: profileB?.fieldIntelligence ?? null },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">{item.label}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{item.name}</h3>
                    {item.intelligence ? (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">Heatmap</p><HeatmapPitch intelligence={item.intelligence} /></div>
                        <div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">Shot Map</p><ShotMapPitch intelligence={item.intelligence} /></div>
                        <div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">Pass Map</p><PassMapPitch intelligence={item.intelligence} /></div>
                        <div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">Defensive Actions</p><DefensiveActionsPitch intelligence={item.intelligence} /></div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-400">Field intelligence is unavailable for this player in the current environment.</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Trend & Projection"
              title="Current level, peak and future exit logic"
              description="Projection and upside blocks are compared directly from the individual player profiles."
              accent="cyan"
              aside={comparisonData?.blockWinners?.upside ? <WinnerTag label="Upside winner" winner={comparisonData.blockWinners.upside.winner} nameA={displayPlayerA.name} nameB={displayPlayerB.name} /> : null}
            >
              <div className="grid gap-4 xl:grid-cols-2">
                {[{ player: displayPlayerA, profile: profileA }, { player: displayPlayerB, profile: profileB }].map((item) => (
                  <div key={item.player.id} className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-sm font-semibold text-white">{item.player.name}</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Current Level</p><p className="mt-2 text-2xl text-white">{item.profile?.projection?.currentLevel ?? item.player.overallRating}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Expected Peak</p><p className="mt-2 text-2xl text-white">{item.profile?.projection?.expectedPeak ?? item.player.potential}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Growth Outlook</p><p className="mt-2 text-lg text-white">{item.profile?.projection?.growthOutlook ?? "N/A"}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Resale Potential</p><p className="mt-2 text-lg text-white">{item.profile?.projection?.resalePotential.label ?? "N/A"}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Similarity & Fit" title="Ideal role, system and best use case" description="The final fit layer is derived from each player's full profile context and the executive recommendation weights." accent="amber">
              <div className="grid gap-6 xl:grid-cols-2">
                {[{ player: displayPlayerA, profile: profileA }, { player: displayPlayerB, profile: profileB }].map((item) => (
                  <div key={item.player.id} className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-sm font-semibold text-white">{item.player.name}</p>
                    <div className="mt-4 space-y-4">
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Ideal Role</p><p className="mt-2 text-lg text-white">{item.profile?.summary?.idealRole ?? item.profile?.tactical?.idealRole ?? "N/A"}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Ideal System</p><p className="mt-2 text-lg text-white">{item.profile?.summary?.idealSystem ?? item.profile?.tactical?.idealSystem ?? "N/A"}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Best Use Case</p><p className="mt-2 text-sm leading-6 text-gray-300">{item.profile?.summary?.bestUseCase ?? item.profile?.tactical?.bestUseCase ?? "N/A"}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {compareLoading && (
              <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-gray-400">
                Carregando comparacao...
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
