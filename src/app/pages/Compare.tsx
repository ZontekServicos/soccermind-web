import { useEffect, useMemo, useState } from "react";
import { GitCompareArrows, Search, Users } from "lucide-react";
import { useSearchParams } from "react-router";
import { ActivePlayersFilterChips } from "../components/ActivePlayersFilterChips";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { ComparisonBlock, type ComparisonMetricItem } from "../components/player-intelligence/ComparisonBlock";
import { FinalDecisionPanel } from "../components/player-intelligence/FinalDecisionPanel";
import { SectionCard } from "../components/player-intelligence/SectionCard";
import { WinnerBadge } from "../components/player-intelligence/WinnerBadge";
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
import type { PlayerIntelligenceProfile } from "../types/player-intelligence";
import {
  buildApiFilters,
  countActiveFilters,
  DEFAULT_PLAYERS_FILTERS,
  type FilterFieldKey,
  type PlayersFiltersState,
  parseFiltersFromSearchParams,
} from "../utils/playerFilters";
import { PlayersFiltersPanel } from "../components/PlayersFiltersPanel";

const EMPTY_FILTER_OPTIONS: PlayerFilterOptions = {
  positions: [],
  nationalities: [],
  teams: [],
  leagues: [],
  sources: [],
};

function dedupePlayers(players: PlayerExtended[]) {
  const seen = new Set<string>();
  return players.filter((player) => {
    if (!player.id || seen.has(player.id)) return false;
    seen.add(player.id);
    return true;
  });
}

function formatMarketValue(value: number | null) {
  if (value === null) return "N/A";
  if (value >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `EUR ${(value / 1_000).toFixed(0)}K`;
  return `EUR ${value.toFixed(0)}`;
}

function formatWinnerLabel(winner: "A" | "B" | "DRAW", nameA: string, nameB: string) {
  if (winner === "A") return nameA;
  if (winner === "B") return nameB;
  return "Balanced";
}

function normalizeWinner(value: unknown): "A" | "B" | "DRAW" {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (normalized === "A" || normalized === "PLAYERA") return "A";
  if (normalized === "B" || normalized === "PLAYERB") return "B";
  return "DRAW";
}

function pickDnaTrait(profile: PlayerIntelligenceProfile | null, key: string) {
  return profile?.dna?.traits.find((trait) => trait.key === key) ?? profile?.soccerMindDna.traits.find((trait) => trait.key === key) ?? null;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildReasons(
  comparisonData: CompareViewModel | null,
  profileA: PlayerIntelligenceProfile | null,
  profileB: PlayerIntelligenceProfile | null,
  nameA: string,
  nameB: string,
) {
  const comparisonRecord = comparisonData?.comparison as
    | { summaryInsights?: string[]; finalDecision?: Record<string, { playerName?: string }> }
    | undefined;
  const summaryInsights = Array.isArray(comparisonRecord?.summaryInsights) ? comparisonRecord.summaryInsights : [];

  if (summaryInsights.length > 0) {
    return summaryInsights.slice(0, 5);
  }

  const betterPlayer = comparisonRecord?.finalDecision?.betterPlayer?.playerName;
  const saferPlayer = comparisonRecord?.finalDecision?.saferPlayer?.playerName;
  const higherUpside = comparisonRecord?.finalDecision?.higherUpside?.playerName;

  return [
    betterPlayer ? `${betterPlayer} grades as the stronger current football decision.` : "",
    saferPlayer ? `${saferPlayer} carries the safer downside profile.` : "",
    higherUpside ? `${higherUpside} has the higher upside case.` : "",
    `${nameA} confidence: ${profileA?.executiveSnapshot.confidence ?? 0}%`,
    `${nameB} confidence: ${profileB?.executiveSnapshot.confidence ?? 0}%`,
  ].filter(Boolean);
}

function buildTechnicalItems(
  playerA: PlayerExtended,
  playerB: PlayerExtended,
  profileA: PlayerIntelligenceProfile | null,
  profileB: PlayerIntelligenceProfile | null,
): ComparisonMetricItem[] {
  return [
    { label: "Pace", valueA: profileA?.technical?.coreAttributes.pace ?? playerA.stats.pace, valueB: profileB?.technical?.coreAttributes.pace ?? playerB.stats.pace },
    { label: "Shooting", valueA: profileA?.technical?.coreAttributes.shooting ?? playerA.stats.shooting, valueB: profileB?.technical?.coreAttributes.shooting ?? playerB.stats.shooting },
    { label: "Passing", valueA: profileA?.technical?.coreAttributes.passing ?? playerA.stats.passing, valueB: profileB?.technical?.coreAttributes.passing ?? playerB.stats.passing },
    { label: "Dribbling", valueA: profileA?.technical?.coreAttributes.dribbling ?? playerA.stats.dribbling, valueB: profileB?.technical?.coreAttributes.dribbling ?? playerB.stats.dribbling },
    { label: "Defending", valueA: profileA?.technical?.coreAttributes.defending ?? playerA.stats.defending, valueB: profileB?.technical?.coreAttributes.defending ?? playerB.stats.defending },
  ];
}

function buildPhysicalItems(profileA: PlayerIntelligenceProfile | null, profileB: PlayerIntelligenceProfile | null) {
  return [
    { label: "Acceleration", valueA: profileA?.physical?.acceleration ?? 0, valueB: profileB?.physical?.acceleration ?? 0 },
    { label: "Sprint Speed", valueA: profileA?.physical?.sprintSpeed ?? 0, valueB: profileB?.physical?.sprintSpeed ?? 0 },
    { label: "Stamina", valueA: profileA?.physical?.stamina ?? 0, valueB: profileB?.physical?.stamina ?? 0 },
    { label: "Strength", valueA: profileA?.physical?.strength ?? 0, valueB: profileB?.physical?.strength ?? 0 },
    { label: "Agility", valueA: profileA?.physical?.agility ?? 0, valueB: profileB?.physical?.agility ?? 0 },
  ];
}

function buildTacticalItems(profileA: PlayerIntelligenceProfile | null, profileB: PlayerIntelligenceProfile | null) {
  return [
    { label: "Tactical Fit", valueA: profileA?.executiveSnapshot.tacticalFit.score ?? 0, valueB: profileB?.executiveSnapshot.tacticalFit.score ?? 0 },
    { label: "Tactical Maturity", valueA: profileA?.tactical?.tacticalMaturity.score ?? 0, valueB: profileB?.tactical?.tacticalMaturity.score ?? 0 },
    { label: "Adaptation Risk", valueA: profileA?.tactical?.tacticalAdaptationRisk.score ?? 0, valueB: profileB?.tactical?.tacticalAdaptationRisk.score ?? 0, inverse: true },
    { label: "Ball Security", valueA: pickDnaTrait(profileA, "ball-security")?.value ?? 0, valueB: pickDnaTrait(profileB, "ball-security")?.value ?? 0 },
    { label: "Transition Impact", valueA: pickDnaTrait(profileA, "transition-impact")?.value ?? 0, valueB: pickDnaTrait(profileB, "transition-impact")?.value ?? 0 },
  ];
}

function buildMarketItems(playerA: PlayerExtended, playerB: PlayerExtended, profileA: PlayerIntelligenceProfile | null, profileB: PlayerIntelligenceProfile | null) {
  return [
    {
      label: "Market Value",
      valueA: profileA?.marketRisk.marketValue ?? profileA?.market?.marketValue ?? playerA.marketValueAmount ?? 0,
      valueB: profileB?.marketRisk.marketValue ?? profileB?.market?.marketValue ?? playerB.marketValueAmount ?? 0,
      format: (value: number) => formatMarketValue(value),
    },
    { label: "Liquidity", valueA: profileA?.marketRisk.liquidity.score ?? profileA?.market?.liquidity.score ?? playerA.liquidity.score, valueB: profileB?.marketRisk.liquidity.score ?? profileB?.market?.liquidity.score ?? playerB.liquidity.score },
    { label: "Value Score", valueA: profileA?.market?.valueScore ?? profileA?.executiveSnapshot.value?.score ?? 0, valueB: profileB?.market?.valueScore ?? profileB?.executiveSnapshot.value?.score ?? 0 },
    { label: "Capital Efficiency", valueA: profileA?.market?.capitalEfficiency ?? playerA.capitalEfficiency, valueB: profileB?.market?.capitalEfficiency ?? playerB.capitalEfficiency },
    { label: "Salary Ceiling", valueA: profileA?.marketRisk.salaryRange.max ?? 0, valueB: profileB?.marketRisk.salaryRange.max ?? 0, inverse: true, format: (value: number) => formatMarketValue(value) },
  ];
}

function buildRiskItems(playerA: PlayerExtended, playerB: PlayerExtended, profileA: PlayerIntelligenceProfile | null, profileB: PlayerIntelligenceProfile | null) {
  return [
    { label: "Composite Risk", valueA: profileA?.executiveSnapshot.risk.score ?? playerA.risk.score, valueB: profileB?.executiveSnapshot.risk.score ?? playerB.risk.score, inverse: true },
    { label: "Physical Risk", valueA: profileA?.marketRisk.physicalRisk.score ?? profileA?.risk?.physical.score ?? playerA.structuralRisk.score, valueB: profileB?.marketRisk.physicalRisk.score ?? profileB?.risk?.physical.score ?? playerB.structuralRisk.score, inverse: true },
    { label: "Financial Risk", valueA: profileA?.marketRisk.financialRisk.score ?? profileA?.risk?.financial.score ?? playerA.financialRisk.index, valueB: profileB?.marketRisk.financialRisk.score ?? profileB?.risk?.financial.score ?? playerB.financialRisk.index, inverse: true },
    { label: "Adaptation Risk", valueA: profileA?.marketRisk.tacticalAdaptationRisk.score ?? profileA?.tactical?.tacticalAdaptationRisk.score ?? 0, valueB: profileB?.marketRisk.tacticalAdaptationRisk.score ?? profileB?.tactical?.tacticalAdaptationRisk.score ?? 0, inverse: true },
    { label: "Resale Security", valueA: profileA?.marketRisk.resalePotential.score ?? profileA?.projection?.resalePotential.score ?? 0, valueB: profileB?.marketRisk.resalePotential.score ?? profileB?.projection?.resalePotential.score ?? 0 },
  ];
}

function buildDnaItems(profileA: PlayerIntelligenceProfile | null, profileB: PlayerIntelligenceProfile | null) {
  const allTraits = [...(profileA?.soccerMindDna.traits ?? []), ...(profileB?.soccerMindDna.traits ?? [])];
  const topTraits = Array.from(new Map(allTraits.map((trait) => [trait.key, trait])).values())
    .sort((left, right) => {
      const leftMax = Math.max(pickDnaTrait(profileA, left.key)?.value ?? 0, pickDnaTrait(profileB, left.key)?.value ?? 0);
      const rightMax = Math.max(pickDnaTrait(profileA, right.key)?.value ?? 0, pickDnaTrait(profileB, right.key)?.value ?? 0);
      return rightMax - leftMax;
    })
    .slice(0, 5);

  return topTraits.map((trait) => ({
    label: trait.label,
    valueA: pickDnaTrait(profileA, trait.key)?.value ?? 0,
    valueB: pickDnaTrait(profileB, trait.key)?.value ?? 0,
  }));
}

function buildProjectionItems(playerA: PlayerExtended, playerB: PlayerExtended, profileA: PlayerIntelligenceProfile | null, profileB: PlayerIntelligenceProfile | null) {
  return [
    { label: "Current Level", valueA: profileA?.projection?.currentLevel ?? playerA.overallRating, valueB: profileB?.projection?.currentLevel ?? playerB.overallRating },
    { label: "Expected Peak", valueA: profileA?.projection?.expectedPeak ?? playerA.potential, valueB: profileB?.projection?.expectedPeak ?? playerB.potential },
    { label: "Next Season", valueA: profileA?.projection?.expectedOverallNextSeason ?? playerA.potential, valueB: profileB?.projection?.expectedOverallNextSeason ?? playerB.potential },
    { label: "Growth Index", valueA: profileA?.projection?.growthIndex ?? 0, valueB: profileB?.projection?.growthIndex ?? 0 },
    { label: "Resale Potential", valueA: profileA?.projection?.resalePotential.score ?? 0, valueB: profileB?.projection?.resalePotential.score ?? 0 },
  ];
}

function resolveBlockWinner(source: unknown) {
  if (source && typeof source === "object" && "winner" in source) {
    return normalizeWinner((source as { winner?: unknown }).winner);
  }

  return "DRAW" as const;
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
    () => dedupePlayers([playerA, playerB, ...availablePlayers].filter((player) => player.id && player.id !== EMPTY_PLAYER.id)),
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
  const recommendedWinner = executiveRecommendation?.winner ?? comparisonData?.winner ?? "DRAW";
  const recommendedPlayer = formatWinnerLabel(recommendedWinner, displayPlayerA.name, displayPlayerB.name);
  const reasons = buildReasons(comparisonData, profileA, profileB, displayPlayerA.name, displayPlayerB.name);
  const confidence =
    recommendedWinner === "A"
      ? profileA?.executiveSnapshot.confidence ?? 0
      : recommendedWinner === "B"
        ? profileB?.executiveSnapshot.confidence ?? 0
        : Math.round(average([profileA?.executiveSnapshot.confidence ?? 0, profileB?.executiveSnapshot.confidence ?? 0]));

  const technicalItems = buildTechnicalItems(displayPlayerA, displayPlayerB, profileA, profileB);
  const physicalItems = buildPhysicalItems(profileA, profileB);
  const tacticalItems = buildTacticalItems(profileA, profileB);
  const marketItems = buildMarketItems(displayPlayerA, displayPlayerB, profileA, profileB);
  const riskItems = buildRiskItems(displayPlayerA, displayPlayerB, profileA, profileB);
  const dnaItems = buildDnaItems(profileA, profileB);
  const projectionItems = buildProjectionItems(displayPlayerA, displayPlayerB, profileA, profileB);

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
      setSaveFeedback(`Analise salva com sucesso: ${response.data.title}.`);
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
      <div className="flex flex-1 flex-col overflow-hidden">
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
                    Decision-first comparison built from the two player intelligence profiles.
                  </p>
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
                    <p className="mt-2 text-lg font-semibold text-white">{recommendedPlayer}</p>
                  </div>
                </div>
              </div>
            </section>

            {saveFeedback ? (
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
            ) : null}

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

            {playersError ? <div className="rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">{playersError}</div> : null}
            {compareError ? <div className="rounded-[16px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">{compareError}</div> : null}

            <section className="grid gap-6 xl:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-[22px] border border-[rgba(0,194,255,0.22)] bg-[rgba(255,255,255,0.03)] p-6">
                <label className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Jogador A</label>
                <Select value={playerA.id} onValueChange={(value) => setPlayerA(playersById.get(value) ?? EMPTY_PLAYER)}>
                  <SelectTrigger className="h-14 rounded-[14px] border-[rgba(0,194,255,0.28)] bg-[rgba(255,255,255,0.02)]">
                    <SelectValue placeholder="Selecione o Jogador A" />
                  </SelectTrigger>
                  <SelectContent className="border-[rgba(0,194,255,0.3)] bg-[#0A1B35]">
                    {selectablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} - {player.club}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden items-center justify-center xl:flex">
                <div className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-xl font-semibold tracking-[0.22em] text-white">
                  VS
                </div>
              </div>

              <div className="rounded-[22px] border border-[rgba(168,85,247,0.22)] bg-[rgba(255,255,255,0.03)] p-6">
                <label className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-[#D8B4FE]">Jogador B</label>
                <Select value={playerB.id} onValueChange={(value) => setPlayerB(playersById.get(value) ?? EMPTY_PLAYER)}>
                  <SelectTrigger className="h-14 rounded-[14px] border-[rgba(168,85,247,0.28)] bg-[rgba(255,255,255,0.02)]">
                    <SelectValue placeholder="Selecione o Jogador B" />
                  </SelectTrigger>
                  <SelectContent className="border-[rgba(168,85,247,0.3)] bg-[#0A1B35]">
                    {selectablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} - {player.club}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <FinalDecisionPanel
                recommendedPlayer={recommendedPlayer}
                confidence={confidence}
                reasons={reasons}
                summary={executiveRecommendation?.summary ?? "Recommendation based on the aggregated comparison blocks."}
              />

              <div className="rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Save Analysis</p>
                <div className="mt-4 grid gap-3">
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
                    className="min-h-[86px] rounded-[12px] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-sm text-gray-100 placeholder:text-gray-500"
                  />
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
            </section>

            {playersLoading ? (
              <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-gray-400">
                Carregando shortlist para comparacao...
              </div>
            ) : null}

            {!playersLoading && selectablePlayers.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)]">
                  <Search className="h-7 w-7 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">Nenhum jogador encontrado com os filtros selecionados.</p>
              </div>
            ) : null}

            {positionContext ? (
              <div className="rounded-[18px] border border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.08)] px-5 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#9BE7FF]">{positionContext.label}</p>
                    <p className="mt-1 text-sm text-gray-300">{positionContext.message}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs text-gray-300">
                    <span>{positionContext.positionA}</span>
                    <span className="text-gray-500">vs</span>
                    <span>{positionContext.positionB}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <SectionCard
              eyebrow="Comparison Cases"
              title="Player A vs Player B"
              description="Two complete cases before the block-by-block verdict."
              accent="cyan"
              aside={<WinnerBadge winner={recommendedWinner} nameA={displayPlayerA.name} nameB={displayPlayerB.name} label="Recommended" />}
            >
              <div className="grid gap-6 xl:grid-cols-2">
                {[
                  {
                    player: displayPlayerA,
                    profile: profileA,
                    accent: "border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.06)]",
                    label: "Player A",
                  },
                  {
                    player: displayPlayerB,
                    profile: profileB,
                    accent: "border-[rgba(168,85,247,0.22)] bg-[rgba(168,85,247,0.06)]",
                    label: "Player B",
                  },
                ].map((item) => (
                  <div key={item.label} className={`rounded-[22px] border p-5 ${item.accent}`}>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-gray-300">{item.label}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{item.player.name}</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {item.player.position} • {item.player.club}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Overall</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{item.player.overallRating}</p>
                      </div>
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Potential</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{item.player.potential}</p>
                      </div>
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Recommendation</p>
                        <p className="mt-2 text-lg font-semibold text-white">{item.profile?.executiveSnapshot.recommendation ?? "N/A"}</p>
                      </div>
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Market Value</p>
                        <p className="mt-2 text-lg font-semibold text-white">{formatMarketValue(item.player.marketValueAmount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <ComparisonBlock
                title="Technical"
                description="Core on-ball quality and execution."
                nameA={displayPlayerA.name}
                nameB={displayPlayerB.name}
                items={technicalItems}
                forcedWinner={resolveBlockWinner(comparisonData?.blockWinners?.technical)}
              />

              <ComparisonBlock
                title="Physical"
                description="Motor, speed and duel profile."
                nameA={displayPlayerA.name}
                nameB={displayPlayerB.name}
                items={physicalItems}
                forcedWinner={resolveBlockWinner(comparisonData?.blockWinners?.physical)}
              />

              <ComparisonBlock
                title="Tactical"
                description="Fit, maturity and adaptation shape."
                nameA={displayPlayerA.name}
                nameB={displayPlayerB.name}
                items={tacticalItems}
                forcedWinner={resolveBlockWinner((comparisonData?.comparison as { winnersByBlock?: { tactical?: unknown } } | undefined)?.winnersByBlock?.tactical ?? comparisonData?.blockWinners?.tacticalDna)}
              />

              <ComparisonBlock
                title="Market"
                description="Transaction quality and price logic."
                nameA={displayPlayerA.name}
                nameB={displayPlayerB.name}
                items={marketItems}
                forcedWinner={resolveBlockWinner(comparisonData?.blockWinners?.market)}
              />

              <ComparisonBlock
                title="Risk"
                description="Downside exposure and security of outcome."
                nameA={displayPlayerA.name}
                nameB={displayPlayerB.name}
                items={riskItems}
                forcedWinner={resolveBlockWinner(comparisonData?.blockWinners?.risk)}
              />

              <ComparisonBlock
                title="DNA"
                description="Trait signature and behavioral edge."
                nameA={displayPlayerA.name}
                nameB={displayPlayerB.name}
                items={dnaItems}
                forcedWinner={resolveBlockWinner((comparisonData?.comparison as { winnersByBlock?: { dna?: unknown } } | undefined)?.winnersByBlock?.dna ?? comparisonData?.blockWinners?.tacticalDna)}
              />

              <ComparisonBlock
                title="Projection"
                description="Future level and upside case."
                nameA={displayPlayerA.name}
                nameB={displayPlayerB.name}
                items={projectionItems}
                forcedWinner={resolveBlockWinner((comparisonData?.comparison as { winnersByBlock?: { projection?: unknown } } | undefined)?.winnersByBlock?.projection ?? comparisonData?.blockWinners?.upside)}
              />
            </div>

            {compareLoading ? (
              <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-gray-400">
                Carregando comparacao...
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
