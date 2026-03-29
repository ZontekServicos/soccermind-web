import { useEffect, useMemo, useState } from "react";
import { GitCompareArrows, Search, Users } from "lucide-react";
import { useSearchParams } from "react-router";
import { ActivePlayersFilterChips } from "../components/ActivePlayersFilterChips";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { PlayersFiltersPanel } from "../components/PlayersFiltersPanel";
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
import { getCompareDataByIds, getCompareShortlist, type CompareViewModel, type PlayerFilterOptions } from "../services/compare";
import { EMPTY_PLAYER, type PlayerExtended } from "../types/player";
import { normalizePlayerIntelligenceProfile, type PlayerIntelligenceProfile } from "../types/player-intelligence";
import {
  buildApiFilters,
  countActiveFilters,
  DEFAULT_PLAYERS_FILTERS,
  type FilterFieldKey,
  type PlayersFiltersState,
  parseFiltersFromSearchParams,
} from "../utils/playerFilters";

const EMPTY_FILTER_OPTIONS: PlayerFilterOptions = { positions: [], nationalities: [], teams: [], leagues: [], sources: [] };

function money(value: number | null) {
  if (value === null) return "N/A";
  if (value >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `EUR ${(value / 1_000).toFixed(0)}K`;
  return `EUR ${value.toFixed(0)}`;
}

function winnerLabel(winner: "A" | "B" | "DRAW", nameA: string, nameB: string) {
  if (winner === "A") return nameA;
  if (winner === "B") return nameB;
  return "Balanced";
}

function dedupe(players: PlayerExtended[]) {
  const seen = new Set<string>();
  return players.filter((player) => {
    if (!player.id || seen.has(player.id)) return false;
    seen.add(player.id);
    return true;
  });
}

function scoreItems(profileA: PlayerIntelligenceProfile | null, profileB: PlayerIntelligenceProfile | null) {
  const topTraits = Array.from(new Map([...(profileA?.dna.traits ?? []), ...(profileB?.dna.traits ?? [])].map((trait) => [trait.key, trait])).values()).slice(0, 5);
  const dnaItems = topTraits.map((trait) => ({
    label: trait.label,
    valueA: profileA?.dna.traits.find((item) => item.key === trait.key)?.value ?? 0,
    valueB: profileB?.dna.traits.find((item) => item.key === trait.key)?.value ?? 0,
  }));

  return {
    technical: [
      { label: "Ball Striking", valueA: profileA?.technical.ballStriking ?? 0, valueB: profileB?.technical.ballStriking ?? 0 },
      { label: "Passing", valueA: profileA?.technical.passing ?? 0, valueB: profileB?.technical.passing ?? 0 },
      { label: "Carrying", valueA: profileA?.technical.carrying ?? 0, valueB: profileB?.technical.carrying ?? 0 },
      { label: "First Touch", valueA: profileA?.technical.firstTouch ?? 0, valueB: profileB?.technical.firstTouch ?? 0 },
      { label: "Creativity", valueA: profileA?.technical.creativity ?? 0, valueB: profileB?.technical.creativity ?? 0 },
    ] satisfies ComparisonMetricItem[],
    physical: [
      { label: "Acceleration", valueA: profileA?.physical.acceleration ?? 0, valueB: profileB?.physical.acceleration ?? 0 },
      { label: "Sprint Speed", valueA: profileA?.physical.sprintSpeed ?? 0, valueB: profileB?.physical.sprintSpeed ?? 0 },
      { label: "Agility", valueA: profileA?.physical.agility ?? 0, valueB: profileB?.physical.agility ?? 0 },
      { label: "Strength", valueA: profileA?.physical.strength ?? 0, valueB: profileB?.physical.strength ?? 0 },
      { label: "Stamina", valueA: profileA?.physical.stamina ?? 0, valueB: profileB?.physical.stamina ?? 0 },
    ] satisfies ComparisonMetricItem[],
    tactical: [
      { label: "Positioning", valueA: profileA?.tactical.positioning ?? 0, valueB: profileB?.tactical.positioning ?? 0 },
      { label: "Decision Making", valueA: profileA?.tactical.decisionMaking ?? 0, valueB: profileB?.tactical.decisionMaking ?? 0 },
      { label: "Transition Impact", valueA: profileA?.tactical.transitionImpact ?? 0, valueB: profileB?.tactical.transitionImpact ?? 0 },
      { label: "Flexibility", valueA: profileA?.tactical.tacticalFlexibility ?? 0, valueB: profileB?.tactical.tacticalFlexibility ?? 0 },
      { label: "Role Discipline", valueA: profileA?.tactical.roleDiscipline ?? 0, valueB: profileB?.tactical.roleDiscipline ?? 0 },
    ] satisfies ComparisonMetricItem[],
    market: [
      { label: "Current Value", valueA: profileA?.market.currentValue ?? 0, valueB: profileB?.market.currentValue ?? 0, format: (value) => money(value) },
      { label: "Liquidity", valueA: profileA?.market.liquidity.score ?? 0, valueB: profileB?.market.liquidity.score ?? 0 },
      { label: "Value Retention", valueA: profileA?.market.valueRetention.score ?? 0, valueB: profileB?.market.valueRetention.score ?? 0 },
      { label: "Contract Pressure", valueA: profileA?.market.contractPressure.score ?? 0, valueB: profileB?.market.contractPressure.score ?? 0, inverse: true },
      { label: "Transfer Value", valueA: profileA?.market.estimatedTransferValue ?? 0, valueB: profileB?.market.estimatedTransferValue ?? 0, format: (value) => money(value) },
    ] satisfies ComparisonMetricItem[],
    risk: [
      { label: "Overall Risk", valueA: profileA?.risk.overall.score ?? 0, valueB: profileB?.risk.overall.score ?? 0, inverse: true },
      { label: "Physical Risk", valueA: profileA?.risk.physical.score ?? 0, valueB: profileB?.risk.physical.score ?? 0, inverse: true },
      { label: "Tactical Risk", valueA: profileA?.risk.tactical.score ?? 0, valueB: profileB?.risk.tactical.score ?? 0, inverse: true },
      { label: "Financial Risk", valueA: profileA?.risk.financial.score ?? 0, valueB: profileB?.risk.financial.score ?? 0, inverse: true },
      { label: "Availability", valueA: profileA?.risk.availability.score ?? 0, valueB: profileB?.risk.availability.score ?? 0, inverse: true },
    ] satisfies ComparisonMetricItem[],
    dna: dnaItems satisfies ComparisonMetricItem[],
    projection: [
      { label: "Current Overall", valueA: profileA?.projection.currentOverall ?? 0, valueB: profileB?.projection.currentOverall ?? 0 },
      { label: "Next Season", valueA: profileA?.projection.nextSeasonOverall ?? 0, valueB: profileB?.projection.nextSeasonOverall ?? 0 },
      { label: "Expected Peak", valueA: profileA?.projection.expectedPeakOverall ?? 0, valueB: profileB?.projection.expectedPeakOverall ?? 0 },
      { label: "Growth Index", valueA: profileA?.projection.growthIndex ?? 0, valueB: profileB?.projection.growthIndex ?? 0 },
      { label: "Resale Outlook", valueA: profileA?.projection.resaleOutlook.score ?? 0, valueB: profileB?.projection.resaleOutlook.score ?? 0 },
    ] satisfies ComparisonMetricItem[],
  };
}

export default function Compare() {
  const { user } = useAuth();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<PlayersFiltersState>(() => parseFiltersFromSearchParams(urlSearchParams));
  const [filtersExpanded, setFiltersExpanded] = useState(() => countActiveFilters(parseFiltersFromSearchParams(urlSearchParams)) > 0);
  const [filterOptions, setFilterOptions] = useState<PlayerFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [players, setPlayers] = useState<PlayerExtended[]>([]);
  const [playerA, setPlayerA] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [playerB, setPlayerB] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [comparisonData, setComparisonData] = useState<CompareViewModel | null>(null);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [compareLoading, setCompareLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [analysisDescription, setAnalysisDescription] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveTone, setSaveTone] = useState<"success" | "error">("success");

  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);
  const apiFilters = useMemo(() => buildApiFilters(filters, filters.search.trim()), [filters]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (filters.search.trim()) nextParams.set("search", filters.search.trim());
    if (filters.positions.length > 0) nextParams.set("positions", filters.positions.join(","));
    if (filters.nationality) nextParams.set("nationality", filters.nationality);
    if (filters.team) nextParams.set("team", filters.team);
    if (filters.league) nextParams.set("league", filters.league);
    setUrlSearchParams(nextParams, { replace: true });
  }, [filters, setUrlSearchParams]);

  useEffect(() => {
    let active = true;
    async function loadPlayers() {
      setPlayersLoading(true);
      try {
        const response = await getCompareShortlist({ ...apiFilters, page: 1, limit: 80 });
        if (!active) return;
        const nextPlayers = Array.isArray(response.data.players) ? response.data.players : [];
        setPlayers(nextPlayers);
        setFilterOptions(response.data.filterOptions ?? EMPTY_FILTER_OPTIONS);
        setPlayerA((current) => (current.id && current.id !== EMPTY_PLAYER.id ? current : nextPlayers[0] ?? EMPTY_PLAYER));
        setPlayerB((current) => (current.id && current.id !== EMPTY_PLAYER.id ? current : nextPlayers[1] ?? nextPlayers[0] ?? EMPTY_PLAYER));
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setPlayers([]);
        setError(loadError instanceof Error ? loadError.message : "Erro ao carregar shortlist");
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
      if (!playerA.id || !playerB.id || playerA.id === playerB.id) {
        setComparisonData(null);
        return;
      }
      setCompareLoading(true);
      try {
        const response = await getCompareDataByIds(playerA.id, playerB.id);
        if (!active) return;
        setComparisonData(response.data);
        setError(null);
      } catch (compareError) {
        if (!active) return;
        setComparisonData(null);
        setError(compareError instanceof Error ? compareError.message : "Erro ao comparar jogadores");
      } finally {
        if (active) setCompareLoading(false);
      }
    }
    void loadComparison();
    return () => {
      active = false;
    };
  }, [playerA.id, playerB.id]);

  const selectablePlayers = useMemo(() => dedupe([playerA, playerB, ...players].filter((item) => item.id && item.id !== EMPTY_PLAYER.id)), [playerA, playerB, players]);
  const playersById = useMemo(() => new Map(selectablePlayers.map((player) => [player.id, player])), [selectablePlayers]);
  const displayA = comparisonData?.playerA ?? playerA;
  const displayB = comparisonData?.playerB ?? playerB;
  const profileA = normalizePlayerIntelligenceProfile(comparisonData?.intelligenceProfiles?.playerA ?? null);
  const profileB = normalizePlayerIntelligenceProfile(comparisonData?.intelligenceProfiles?.playerB ?? null);
  const comparison = (comparisonData?.comparison as { winnersByBlock?: Record<string, unknown>; finalDecision?: any; summaryInsights?: string[] } | undefined) ?? {};
  const items = scoreItems(profileA, profileB);
  const finalDecision = comparison.finalDecision ?? {
    betterPlayer: { playerName: "Balanced" },
    saferPlayer: { playerName: "Balanced" },
    higherUpside: { playerName: "Balanced" },
    bestTacticalFit: { playerName: "Balanced" },
  };
  const insights = Array.isArray(comparison.summaryInsights) ? comparison.summaryInsights.slice(0, 5) : [];
  const winner = finalDecision.betterPlayer.playerName === displayA.name ? "A" : finalDecision.betterPlayer.playerName === displayB.name ? "B" : normalizeWinner(comparisonData?.winner);
  const confidence = winner === "A" ? profileA?.summary.confidence ?? 0 : winner === "B" ? profileB?.summary.confidence ?? 0 : Math.round(average([profileA?.summary.confidence ?? 0, profileB?.summary.confidence ?? 0]));

  async function saveAnalysis() {
    if (!playerA.id || !playerB.id || playerA.id === playerB.id) return;
    setSaveLoading(true);
    try {
      const response = await createComparisonAnalysis({
        playerIds: [playerA.id, playerB.id],
        title: analysisTitle.trim() || `Comparacao - ${displayA.name} vs ${displayB.name}`,
        description: analysisDescription.trim() || undefined,
        analyst: user?.name,
      });
      setSaveTone("success");
      setSaveFeedback(`Analise salva com sucesso: ${response.data.title}.`);
      setAnalysisTitle("");
      setAnalysisDescription("");
    } catch (saveError) {
      setSaveTone("error");
      setSaveFeedback(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar a analise.");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1680px] space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#C7B8FF]">
                    <GitCompareArrows className="h-3.5 w-3.5" />
                    Compare Intelligence
                  </div>
                  <h1 className="text-4xl font-semibold text-white">Player vs Player</h1>
                  <p className="mt-3 max-w-2xl text-sm text-gray-400">Decision-first comparison built from the two player intelligence profiles.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4"><p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Shortlist</p><p className="mt-2 text-2xl font-bold text-[#C7B8FF]">{players.length}</p></div>
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4"><p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Filtros ativos</p><p className="mt-2 text-2xl font-bold text-[#9BE7FF]">{activeFiltersCount}</p></div>
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4"><p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Recommended</p><p className="mt-2 text-lg font-semibold text-white">{winnerLabel(winner, displayA.name, displayB.name)}</p></div>
                </div>
              </div>
            </section>

            {saveFeedback ? <div className={`rounded-[16px] px-5 py-4 text-sm ${saveTone === "success" ? "border border-[rgba(0,255,156,0.18)] bg-[rgba(0,255,156,0.08)] text-[#9CFFD1]" : "border border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] text-[#FFB4B5]"}`}>{saveFeedback}</div> : null}
            {error ? <div className="rounded-[16px] border border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">{error}</div> : null}

            <PlayersFiltersPanel
              filters={filters}
              options={filterOptions}
              activeFiltersCount={activeFiltersCount}
              isExpanded={filtersExpanded}
              onToggleExpanded={() => setFiltersExpanded((current) => !current)}
              onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
              onFieldChange={(field: FilterFieldKey, value: string) => setFilters((current) => ({ ...current, [field]: value }))}
              onTogglePosition={(position) => setFilters((current) => ({ ...current, positions: current.positions.includes(position) ? current.positions.filter((item) => item !== position) : [...current.positions, position] }))}
              onClearFilters={() => setFilters(DEFAULT_PLAYERS_FILTERS)}
            />
            <ActivePlayersFilterChips
              filters={filters}
              onClearSearch={() => setFilters((current) => ({ ...current, search: "" }))}
              onRemovePosition={(position) => setFilters((current) => ({ ...current, positions: current.positions.filter((item) => item !== position) }))}
              onClearField={(field) => setFilters((current) => ({ ...current, [field]: "" }))}
              onClearRange={([minField, maxField]) => setFilters((current) => ({ ...current, [minField]: "", [maxField]: "" }))}
            />

            <section className="grid gap-6 xl:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-[22px] border border-[rgba(0,194,255,0.22)] bg-[rgba(255,255,255,0.03)] p-6">
                <label className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Player A</label>
                <Select value={playerA.id} onValueChange={(value) => setPlayerA(playersById.get(value) ?? EMPTY_PLAYER)}>
                  <SelectTrigger className="h-14 rounded-[14px] border-[rgba(0,194,255,0.28)] bg-[rgba(255,255,255,0.02)]"><SelectValue placeholder="Selecione o Jogador A" /></SelectTrigger>
                  <SelectContent className="border-[rgba(0,194,255,0.3)] bg-[#0A1B35]">{selectablePlayers.map((player) => <SelectItem key={player.id} value={player.id}>{player.name} - {player.club}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="hidden items-center justify-center xl:flex"><div className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-xl font-semibold tracking-[0.22em] text-white">VS</div></div>
              <div className="rounded-[22px] border border-[rgba(168,85,247,0.22)] bg-[rgba(255,255,255,0.03)] p-6">
                <label className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-[#D8B4FE]">Player B</label>
                <Select value={playerB.id} onValueChange={(value) => setPlayerB(playersById.get(value) ?? EMPTY_PLAYER)}>
                  <SelectTrigger className="h-14 rounded-[14px] border-[rgba(168,85,247,0.28)] bg-[rgba(255,255,255,0.02)]"><SelectValue placeholder="Selecione o Jogador B" /></SelectTrigger>
                  <SelectContent className="border-[rgba(168,85,247,0.3)] bg-[#0A1B35]">{selectablePlayers.map((player) => <SelectItem key={player.id} value={player.id}>{player.name} - {player.club}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </section>

            <FinalDecisionPanel playerAName={displayA.name} playerBName={displayB.name} finalDecision={finalDecision} confidence={confidence} insights={insights} summary="Block winners, risk balance and upside are condensed into one direct recommendation." />

            <div className="rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Save Analysis</p>
              <div className="mt-4 grid gap-3">
                <Input value={analysisTitle} onChange={(event) => setAnalysisTitle(event.target.value)} maxLength={160} placeholder={`Comparacao - ${displayA.name} vs ${displayB.name}`} className="h-10 rounded-[12px] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-sm text-gray-100 placeholder:text-gray-500" />
                <Textarea value={analysisDescription} onChange={(event) => setAnalysisDescription(event.target.value)} maxLength={1000} placeholder="Descricao opcional para contextualizar a comparacao" className="min-h-[86px] rounded-[12px] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-sm text-gray-100 placeholder:text-gray-500" />
                <Button type="button" onClick={saveAnalysis} disabled={saveLoading || !playerA.id || !playerB.id || playerA.id === playerB.id} className="h-10 rounded-[12px] border border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.12)] px-5 font-semibold text-[#9BE7FF] hover:bg-[rgba(0,194,255,0.18)]">{saveLoading ? "Salvando analise..." : "Salvar na central de analises"}</Button>
              </div>
            </div>

            <SectionCard eyebrow="Cases" title={`${displayA.name} vs ${displayB.name}`} description="Two profile snapshots before the block-by-block verdict." accent="purple" aside={<WinnerBadge winner={winner} nameA={displayA.name} nameB={displayB.name} label="Recommended" />}>
              <div className="grid gap-6 xl:grid-cols-2">
                {[{ label: "Player A", player: displayA, profile: profileA }, { label: "Player B", player: displayB, profile: profileB }].map((entry) => (
                  <div key={entry.label} className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-gray-300">{entry.label}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{entry.player.name}</h3>
                    <p className="mt-1 text-sm text-gray-400">{entry.player.position} • {entry.player.club}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Recommendation</p><p className="mt-2 text-lg font-semibold text-white">{entry.profile?.summary.recommendation ?? "N/A"}</p></div>
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Confidence</p><p className="mt-2 text-lg font-semibold text-white">{entry.profile?.summary.confidence ?? 0}%</p></div>
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Market Value</p><p className="mt-2 text-lg font-semibold text-white">{money(entry.profile?.market.currentValue ?? entry.player.marketValueAmount)}</p></div>
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">DNA</p><p className="mt-2 text-lg font-semibold text-white">{entry.profile?.dna.archetype ?? "N/A"}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <ComparisonBlock title="Technical" description="Core on-ball quality and execution." nameA={displayA.name} nameB={displayB.name} items={items.technical} forcedWinner={(comparison.winnersByBlock as any)?.technical?.winner} />
              <ComparisonBlock title="Physical" description="Motor, speed and duel profile." nameA={displayA.name} nameB={displayB.name} items={items.physical} forcedWinner={(comparison.winnersByBlock as any)?.physical?.winner} />
              <ComparisonBlock title="Tactical" description="Decision-making, discipline and fit." nameA={displayA.name} nameB={displayB.name} items={items.tactical} forcedWinner={(comparison.winnersByBlock as any)?.tactical?.winner} />
              <ComparisonBlock title="Market" description="Transaction logic and timing." nameA={displayA.name} nameB={displayB.name} items={items.market} forcedWinner={(comparison.winnersByBlock as any)?.market?.winner} />
              <ComparisonBlock title="Risk" description="Downside exposure and resilience." nameA={displayA.name} nameB={displayB.name} items={items.risk} forcedWinner={(comparison.winnersByBlock as any)?.risk?.winner} />
              <ComparisonBlock title="DNA" description="Behavioral and style signature." nameA={displayA.name} nameB={displayB.name} items={items.dna} forcedWinner={(comparison.winnersByBlock as any)?.dna?.winner} />
              <ComparisonBlock title="Projection" description="Future level and resale path." nameA={displayA.name} nameB={displayB.name} items={items.projection} forcedWinner={(comparison.winnersByBlock as any)?.projection?.winner} />
            </div>

            {compareLoading ? <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-gray-400">Carregando comparacao...</div> : null}
            {!playersLoading && selectablePlayers.length === 0 ? <div className="py-14 text-center"><div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)]"><Search className="h-7 w-7 text-gray-600" /></div><p className="text-sm text-gray-500">Nenhum jogador encontrado com os filtros selecionados.</p></div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
