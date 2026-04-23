import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, GitCompareArrows, Search } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { ComparisonBlock, type ComparisonMetricItem } from "../components/player-intelligence/ComparisonBlock";
import { FinalDecisionPanel } from "../components/player-intelligence/FinalDecisionPanel";
import { SectionCard } from "../components/player-intelligence/SectionCard";
import { WinnerBadge } from "../components/player-intelligence/WinnerBadge";
import { Button } from "../components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command";
import { Input } from "../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { createComparisonAnalysis } from "../services/analysis";
import { getCompareDataByIds, getCompareEngineData, getCompareShortlist, type CompareViewModel } from "../services/compare";
import { EngineComparisonSection, type EngineComparisonOutput } from "../components/player-intelligence/EngineComparisonSection";
import { EMPTY_PLAYER, type PlayerExtended } from "../types/player";
import { normalizePlayerIntelligenceProfile, type PlayerIntelligenceProfile } from "../types/player-intelligence";
import { t as translate } from "../../i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockTab = "technical" | "physical" | "tactical" | "market" | "risk" | "dna" | "projection";

const BLOCK_TABS: { key: BlockTab; labelKey: string }[] = [
  { key: "technical",  labelKey: "comparison.technical" },
  { key: "physical",   labelKey: "comparison.physical" },
  { key: "tactical",   labelKey: "comparison.tactical" },
  { key: "market",     labelKey: "comparison.market" },
  { key: "risk",       labelKey: "comparison.risk" },
  { key: "dna",        labelKey: "comparison.dna" },
  { key: "projection", labelKey: "comparison.projection" },
];

const BLOCK_DESC_KEYS: Record<BlockTab, string> = {
  technical:  "comparison.technicalDescription",
  physical:   "comparison.physicalDescription",
  tactical:   "comparison.tacticalDescription",
  market:     "comparison.marketDescription",
  risk:       "comparison.riskDescription",
  dna:        "comparison.dnaDescription",
  projection: "comparison.projectionDescription",
};

const DNA_LABELS_PT: Record<string, string> = {
  "Progression":        "Progressão",
  "Duel Power":         "Poder de Duelo",
  "Game Intelligence":  "Intel. de Jogo",
  "Explosiveness":      "Explosividade",
  "Final Third Impact": "Impacto no Terço Final",
  "Pressing Intensity": "Pressão Alta",
  "Aerial Dominance":   "Domínio Aéreo",
  "Ball Retention":     "Retenção de Bola",
  "Chance Creation":    "Criação de Chances",
  "Off-Ball Movement":  "Movimentação",
  "Work Rate":          "Taxa de Trabalho",
  "Positional Sense":   "Senso Posicional",
  "Leadership":         "Liderança",
  "Area Controller":    "Controlador de Área",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function money(value: number | null) {
  if (value === null) return "N/A";
  if (value >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `EUR ${(value / 1_000).toFixed(0)}K`;
  return `EUR ${value.toFixed(0)}`;
}

function normalizeWinner(value: unknown) {
  const n = typeof value === "string" ? value.toUpperCase() : "DRAW";
  if (n === "A" || n === "PLAYERA") return "A" as const;
  if (n === "B" || n === "PLAYERB") return "B" as const;
  return "DRAW" as const;
}

function winnerLabel(winner: "A" | "B" | "DRAW", nameA: string, nameB: string) {
  if (winner === "A") return nameA;
  if (winner === "B") return nameB;
  return translate("comparison.balanced");
}

function dedupe(players: PlayerExtended[]) {
  const seen = new Set<string>();
  return players.filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function syncSelectedPlayers(currentA: PlayerExtended, currentB: PlayerExtended, next: PlayerExtended[]) {
  const fallbackA = next[0] ?? EMPTY_PLAYER;
  const fallbackB = next[1] ?? next[0] ?? EMPTY_PLAYER;
  const nextA = currentA.id && currentA.id !== EMPTY_PLAYER.id && next.some((p) => p.id === currentA.id) ? currentA : fallbackA;
  const nextB = currentB.id && currentB.id !== EMPTY_PLAYER.id && currentB.id !== nextA.id && next.some((p) => p.id === currentB.id) ? currentB : next.find((p) => p.id !== nextA.id) ?? fallbackB;
  return { nextA, nextB };
}

function scoreItems(profileA: PlayerIntelligenceProfile | null, profileB: PlayerIntelligenceProfile | null) {
  const topTraits = Array.from(new Map([...(profileA?.dna.traits ?? []), ...(profileB?.dna.traits ?? [])].map((t) => [t.key, t])).values()).slice(0, 5);
  const dnaItems = topTraits.map((trait) => ({
    label: DNA_LABELS_PT[trait.label] ?? trait.label,
    valueA: profileA?.dna.traits.find((i) => i.key === trait.key)?.value ?? 0,
    valueB: profileB?.dna.traits.find((i) => i.key === trait.key)?.value ?? 0,
  }));
  return {
    technical: [
      { label: translate("metrics.ballStriking"), valueA: profileA?.technical.ballStriking ?? 0, valueB: profileB?.technical.ballStriking ?? 0 },
      { label: translate("metrics.passing"), valueA: profileA?.technical.passing ?? 0, valueB: profileB?.technical.passing ?? 0 },
      { label: translate("metrics.carrying"), valueA: profileA?.technical.carrying ?? 0, valueB: profileB?.technical.carrying ?? 0 },
      { label: translate("metrics.firstTouch"), valueA: profileA?.technical.firstTouch ?? 0, valueB: profileB?.technical.firstTouch ?? 0 },
      { label: translate("metrics.creativity"), valueA: profileA?.technical.creativity ?? 0, valueB: profileB?.technical.creativity ?? 0 },
    ] satisfies ComparisonMetricItem[],
    physical: [
      { label: translate("metrics.acceleration"), valueA: profileA?.physical.acceleration ?? 0, valueB: profileB?.physical.acceleration ?? 0 },
      { label: translate("metrics.sprintSpeed"), valueA: profileA?.physical.sprintSpeed ?? 0, valueB: profileB?.physical.sprintSpeed ?? 0 },
      { label: translate("metrics.agility"), valueA: profileA?.physical.agility ?? 0, valueB: profileB?.physical.agility ?? 0 },
      { label: translate("metrics.strength"), valueA: profileA?.physical.strength ?? 0, valueB: profileB?.physical.strength ?? 0 },
      { label: translate("metrics.stamina"), valueA: profileA?.physical.stamina ?? 0, valueB: profileB?.physical.stamina ?? 0 },
    ] satisfies ComparisonMetricItem[],
    tactical: [
      { label: translate("metrics.positioning"), valueA: profileA?.tactical.positioning ?? 0, valueB: profileB?.tactical.positioning ?? 0 },
      { label: translate("metrics.decisionMaking"), valueA: profileA?.tactical.decisionMaking ?? 0, valueB: profileB?.tactical.decisionMaking ?? 0 },
      { label: translate("metrics.transitionImpact"), valueA: profileA?.tactical.transitionImpact ?? 0, valueB: profileB?.tactical.transitionImpact ?? 0 },
      { label: translate("metrics.flexibility"), valueA: profileA?.tactical.tacticalFlexibility ?? 0, valueB: profileB?.tactical.tacticalFlexibility ?? 0 },
      { label: translate("metrics.roleDiscipline"), valueA: profileA?.tactical.roleDiscipline ?? 0, valueB: profileB?.tactical.roleDiscipline ?? 0 },
    ] satisfies ComparisonMetricItem[],
    market: [
      { label: translate("metrics.currentValue"), valueA: profileA?.market.currentValue ?? 0, valueB: profileB?.market.currentValue ?? 0, format: (v) => money(v) },
      { label: translate("dashboard.liquidity"), valueA: profileA?.market.liquidity.score ?? 0, valueB: profileB?.market.liquidity.score ?? 0 },
      { label: translate("player.valueRetention"), valueA: profileA?.market.valueRetention.score ?? 0, valueB: profileB?.market.valueRetention.score ?? 0 },
      { label: translate("player.contractPressure"), valueA: profileA?.market.contractPressure.score ?? 0, valueB: profileB?.market.contractPressure.score ?? 0, inverse: true },
      { label: translate("metrics.transferValue"), valueA: profileA?.market.estimatedTransferValue ?? 0, valueB: profileB?.market.estimatedTransferValue ?? 0, format: (v) => money(v) },
    ] satisfies ComparisonMetricItem[],
    risk: [
      { label: translate("player.overallRisk"), valueA: profileA?.risk.overall.score ?? 0, valueB: profileB?.risk.overall.score ?? 0, inverse: true },
      { label: translate("metrics.physicalRisk"), valueA: profileA?.risk.physical.score ?? 0, valueB: profileB?.risk.physical.score ?? 0, inverse: true },
      { label: translate("metrics.tacticalRisk"), valueA: profileA?.risk.tactical.score ?? 0, valueB: profileB?.risk.tactical.score ?? 0, inverse: true },
      { label: translate("dashboard.financialRisk"), valueA: profileA?.risk.financial.score ?? 0, valueB: profileB?.risk.financial.score ?? 0, inverse: true },
      { label: translate("player.availability"), valueA: profileA?.risk.availability.score ?? 0, valueB: profileB?.risk.availability.score ?? 0, inverse: true },
    ] satisfies ComparisonMetricItem[],
    dna: dnaItems satisfies ComparisonMetricItem[],
    projection: [
      { label: translate("player.currentOverall"), valueA: profileA?.projection.currentOverall ?? 0, valueB: profileB?.projection.currentOverall ?? 0 },
      { label: translate("player.nextSeason"), valueA: profileA?.projection.nextSeasonOverall ?? 0, valueB: profileB?.projection.nextSeasonOverall ?? 0 },
      { label: translate("player.expectedPeak"), valueA: profileA?.projection.expectedPeakOverall ?? 0, valueB: profileB?.projection.expectedPeakOverall ?? 0 },
      { label: translate("metrics.growthIndex"), valueA: profileA?.projection.growthIndex ?? 0, valueB: profileB?.projection.growthIndex ?? 0 },
      { label: translate("player.resaleOutlook"), valueA: profileA?.projection.resaleOutlook.score ?? 0, valueB: profileB?.projection.resaleOutlook.score ?? 0 },
    ] satisfies ComparisonMetricItem[],
  };
}

// ─── PlayerCombobox ───────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  ELITE: "#FFD700", A: "#C8C8DC", B: "#CD7F32", C: "#7A9CC8", DEVELOPMENT: "#6EE7B7",
};

function PlayerCombobox({
  label,
  sublabel,
  value,
  players,
  variant,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: string;
  players: PlayerExtended[];
  variant: "A" | "B";
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const accent      = variant === "A" ? "#38BDF8" : "#C084FC";
  const accentBg    = variant === "A" ? "rgba(56,189,248,0.08)"  : "rgba(192,132,252,0.08)";
  const accentBorder = variant === "A" ? "rgba(56,189,248,0.28)" : "rgba(192,132,252,0.28)";
  const labelColor  = variant === "A" ? "text-[#9BE7FF]"         : "text-[#D8B4FE]";
  const selected    = players.find((p) => p.id === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] ${labelColor}`}>
          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: accent }} />
          {label}
        </label>
        <span className="text-[11px] text-gray-600">{sublabel}</span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex h-14 w-full items-center justify-between gap-3 rounded-[14px] border px-4 text-left backdrop-blur-sm transition-all"
            style={{
              borderColor: open ? accent : accentBorder,
              background:  open ? accentBg : "rgba(255,255,255,0.02)",
              boxShadow:   open ? `0 0 0 3px ${accent}20` : undefined,
            }}
          >
            {selected ? (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-black"
                  style={{ background: `${accent}18`, color: accent, border: `1.5px solid ${accent}50` }}
                >
                  {selected.overallRating > 0 ? selected.overallRating : "–"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{selected.name}</p>
                  <p className="truncate text-xs text-gray-400">{selected.position} · {selected.club}</p>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Buscar jogador por nome, clube ou posição…</span>
            )}
            <ChevronDown
              className="h-4 w-4 flex-shrink-0 text-gray-500 transition-transform"
              style={{ transform: open ? "rotate(180deg)" : undefined }}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          style={{ width: "var(--radix-popover-trigger-width)", border: `1px solid ${accent}40`, background: "#0A1B35" }}
          align="start"
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Nome, clube ou posição…"
              className="border-b text-white placeholder:text-gray-500"
              style={{ borderColor: `${accent}25` }}
            />
            <CommandList className="max-h-[320px]">
              <CommandEmpty className="py-8 text-center text-sm text-gray-500">
                Nenhum jogador encontrado.
              </CommandEmpty>
              <CommandGroup>
                {players.map((player) => {
                  const isSelected  = player.id === value;
                  const tierColor   = TIER_COLORS[player.tier] ?? "#7A9CC8";
                  return (
                    <CommandItem
                      key={player.id}
                      value={`${player.name} ${player.club} ${player.position} ${player.nationality}`}
                      onSelect={() => { onChange(player.id); setOpen(false); }}
                      className="cursor-pointer rounded-[10px] px-3 py-2.5 aria-selected:bg-[rgba(255,255,255,0.06)]"
                    >
                      <div
                        className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-black"
                        style={{ background: `${accent}14`, color: isSelected ? accent : "#9CA3AF", border: `1.5px solid ${isSelected ? accent : "rgba(255,255,255,0.1)"}50` }}
                      >
                        {player.overallRating > 0 ? player.overallRating : "–"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${isSelected ? "text-white" : "text-gray-200"}`}>{player.name}</p>
                        <p className="truncate text-[11px] text-gray-500">{player.position} · {player.club}</p>
                      </div>
                      <span
                        className="mr-2 flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ color: tierColor, borderColor: `${tierColor}44`, background: `${tierColor}12` }}
                      >
                        {player.tier}
                      </span>
                      {isSelected && <Check className="h-4 w-4 flex-shrink-0" style={{ color: accent }} />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected player info card */}
      {selected && (
        <div
          className="flex items-center gap-3 rounded-[14px] px-3 py-3 transition-all"
          style={{ border: `1px solid ${accent}20`, background: `${accent}05` }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black"
            style={{ background: `${accent}18`, color: accent, border: `2px solid ${accent}45` }}
          >
            {selected.overallRating > 0 ? selected.overallRating : "–"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{selected.name}</p>
            <p className="truncate text-xs text-gray-400">
              {selected.position} · {selected.club}{selected.age > 0 ? ` · ${selected.age} anos` : ""}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] text-gray-500">POT</p>
            <p className="text-sm font-bold" style={{ color: accent }}>
              {selected.potential > 0 ? selected.potential : "–"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Compare() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [players, setPlayers] = useState<PlayerExtended[]>([]);
  const [playerA, setPlayerA] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [playerB, setPlayerB] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [comparisonData, setComparisonData] = useState<CompareViewModel | null>(null);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [compareLoading, setCompareLoading] = useState(false);
  const [engineData, setEngineData] = useState<EngineComparisonOutput | null>(null);
  const [engineLoading, setEngineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [analysisDescription, setAnalysisDescription] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveTone, setSaveTone] = useState<"success" | "error">("success");
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [activeBlockTab, setActiveBlockTab] = useState<BlockTab>("technical");

  // Load players once
  useEffect(() => {
    let active = true;
    async function loadPlayers() {
      setPlayersLoading(true);
      try {
        const response = await getCompareShortlist({ page: 1, limit: 80 });
        if (!active) return;
        const nextPlayers = Array.isArray(response.data.players) ? response.data.players : [];
        setPlayers(nextPlayers);
        setPlayerA((cur) => syncSelectedPlayers(cur, playerB, nextPlayers).nextA);
        setPlayerB((cur) => syncSelectedPlayers(playerA, cur, nextPlayers).nextB);
        setError(null);
      } catch (err) {
        if (!active) return;
        setPlayers([]);
        setError(err instanceof Error ? err.message : t("comparison.empty"));
      } finally {
        if (active) setPlayersLoading(false);
      }
    }
    void loadPlayers();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadComparison() {
      if (!playerA.id || !playerB.id || playerA.id === playerB.id) { setComparisonData(null); return; }
      setCompareLoading(true);
      try {
        const response = await getCompareDataByIds(playerA.id, playerB.id);
        if (!active) return;
        setComparisonData(response.data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setComparisonData(null);
        setError(err instanceof Error ? err.message : t("comparison.loading"));
      } finally {
        if (active) setCompareLoading(false);
      }
    }
    void loadComparison();
    return () => { active = false; };
  }, [playerA.id, playerB.id]);

  useEffect(() => {
    let active = true;
    async function loadEngine() {
      if (!playerA.id || !playerB.id || playerA.id === playerB.id) { setEngineData(null); return; }
      setEngineLoading(true);
      try {
        const response = await getCompareEngineData(playerA.id, playerB.id);
        if (!active) return;
        const payload = (response as { data?: unknown }).data;
        if (payload && typeof payload === "object" && "betterOverall" in payload) {
          setEngineData(payload as EngineComparisonOutput);
        }
      } catch {
        if (active) setEngineData(null);
      } finally {
        if (active) setEngineLoading(false);
      }
    }
    void loadEngine();
    return () => { active = false; };
  }, [playerA.id, playerB.id]);

  useEffect(() => {
    setSavedAnalysisId(null);
    setSaveFeedback(null);
  }, [playerA.id, playerB.id]);

  const selectablePlayers = useMemo(() => dedupe([playerA, playerB, ...players].filter((p) => p.id && p.id !== EMPTY_PLAYER.id)), [playerA, playerB, players]);
  const playersById = useMemo(() => new Map(selectablePlayers.map((p) => [p.id, p])), [selectablePlayers]);
  const displayA = comparisonData?.playerA ?? playerA;
  const displayB = comparisonData?.playerB ?? playerB;
  const profileA = normalizePlayerIntelligenceProfile(comparisonData?.intelligenceProfiles?.playerA ?? null);
  const profileB = normalizePlayerIntelligenceProfile(comparisonData?.intelligenceProfiles?.playerB ?? null);
  const comparison = (comparisonData?.comparison as { winnersByBlock?: Record<string, "A" | "B" | "tie">; finalDecision?: Record<string, "A" | "B">; summaryInsights?: string[] } | undefined) ?? {};
  const items = scoreItems(profileA, profileB);

  function resolveSide(side: "A" | "B" | undefined | null, fallback: string) {
    if (side === "A") return displayA.name;
    if (side === "B") return displayB.name;
    return fallback;
  }

  const rawFinalDecision = comparison.finalDecision;
  const finalDecision = {
    betterPlayer:  { playerName: resolveSide(rawFinalDecision?.betterPlayer,  t("comparison.balanced")) },
    saferPlayer:   { playerName: resolveSide(rawFinalDecision?.saferPlayer,   t("comparison.balanced")) },
    higherUpside:  { playerName: resolveSide(rawFinalDecision?.higherUpside,  t("comparison.balanced")) },
    bestTacticalFit: { playerName: resolveSide(rawFinalDecision?.bestTacticalFit, t("comparison.balanced")) },
  };
  const insights  = Array.isArray(comparison.summaryInsights) ? comparison.summaryInsights.slice(0, 5) : [];
  const winner    = rawFinalDecision?.betterPlayer === "A" ? "A" : rawFinalDecision?.betterPlayer === "B" ? "B" : normalizeWinner(comparisonData?.winner);
  const confidence = winner === "A" ? (profileA?.summary.confidence ?? 0) : winner === "B" ? (profileB?.summary.confidence ?? 0) : Math.round(average([profileA?.summary.confidence ?? 0, profileB?.summary.confidence ?? 0]));

  function getBlockWinner(tab: BlockTab): "A" | "B" | "DRAW" {
    const raw = comparison.winnersByBlock?.[tab];
    if (!raw || raw === "tie") return "DRAW";
    return raw === "A" ? "A" : "B";
  }

  async function saveAnalysis() {
    if (!playerA.id || !playerB.id || playerA.id === playerB.id || savedAnalysisId) return;
    setSaveLoading(true);
    try {
      const response = await createComparisonAnalysis({
        playerIds: [playerA.id, playerB.id],
        title: analysisTitle.trim() || t("comparison.saveDefaultTitle", { playerA: displayA.name, playerB: displayB.name }),
        description: analysisDescription.trim() || undefined,
        analyst: user?.name,
      });
      setSavedAnalysisId(response.data.id);
      setSaveTone("success");
      setSaveFeedback(t("comparison.saveSuccess", { title: response.data.title }));
      setAnalysisTitle("");
      setAnalysisDescription("");
    } catch (err) {
      setSaveTone("error");
      setSaveFeedback(err instanceof Error ? err.message : t("comparison.saveError"));
    } finally {
      setSaveLoading(false);
    }
  }

  const hasComparison = !!(playerA.id && playerB.id && playerA.id !== playerB.id && playerA.id !== EMPTY_PLAYER.id && playerB.id !== EMPTY_PLAYER.id);

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1680px] space-y-6">

            {/* ── Header ── */}
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#C7B8FF]">
                    <GitCompareArrows className="h-3.5 w-3.5" />
                    {t("comparison.badge")}
                  </div>
                  <h1 className="text-4xl font-semibold text-white">{t("comparison.title")}</h1>
                  <p className="mt-3 max-w-2xl text-sm text-gray-400">{t("comparison.subtitle")}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{t("comparison.shortlist")}</p>
                    <p className="mt-2 text-2xl font-bold text-[#C7B8FF]">{players.length}</p>
                  </div>
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{t("comparison.recommended")}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{winnerLabel(winner, displayA.name, displayB.name)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Feedback banners ── */}
            {saveFeedback ? <div className={`rounded-[16px] px-5 py-4 text-sm ${saveTone === "success" ? "border border-[rgba(0,255,156,0.18)] bg-[rgba(0,255,156,0.08)] text-[#9CFFD1]" : "border border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] text-[#FFB4B5]"}`}>{saveFeedback}</div> : null}
            {error ? <div className="rounded-[16px] border border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">{error}</div> : null}

            {/* ── Player selectors ── */}
            <section className="grid gap-6 rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.3)] xl:grid-cols-[1fr_auto_1fr]">
              <PlayerCombobox
                label={t("comparison.playerA")}
                sublabel="Candidato principal"
                value={playerA.id}
                players={selectablePlayers}
                variant="A"
                onChange={(id) => setPlayerA(playersById.get(id) ?? EMPTY_PLAYER)}
              />

              {/* VS divider */}
              <div className="hidden items-center justify-center xl:flex">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-px bg-[rgba(255,255,255,0.08)]" />
                  <div className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-base font-semibold tracking-[0.2em] text-white">VS</div>
                  <div className="h-8 w-px bg-[rgba(255,255,255,0.08)]" />
                </div>
              </div>

              <PlayerCombobox
                label={t("comparison.playerB")}
                sublabel="Benchmark alternativo"
                value={playerB.id}
                players={selectablePlayers}
                variant="B"
                onChange={(id) => setPlayerB(playersById.get(id) ?? EMPTY_PLAYER)}
              />
            </section>

            {/* ── Engine comparison ── */}
            {engineLoading ? (
              <div className="rounded-[26px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-6 py-8 text-center">
                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[rgba(0,194,255,0.3)] border-t-[#9BE7FF]" />
                <p className="text-sm text-gray-500">Carregando engine de análise...</p>
              </div>
            ) : engineData ? (
              <EngineComparisonSection nameA={displayA.name} nameB={displayB.name} data={engineData} />
            ) : null}

            {/* ── Tabbed ComparisonBlocks ── */}
            {hasComparison && (
              <div className="space-y-4">
                <div className="flex overflow-x-auto gap-1 rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1.5">
                  {BLOCK_TABS.map((tab) => {
                    const bw = getBlockWinner(tab.key);
                    const isActive = activeBlockTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveBlockTab(tab.key)}
                        className={`relative flex flex-shrink-0 items-center gap-1.5 rounded-[12px] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all ${isActive ? "bg-[rgba(0,194,255,0.12)] text-[#9BE7FF] border border-[rgba(0,194,255,0.22)]" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        {translate(tab.labelKey)}
                        {bw !== "DRAW" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: bw === "A" ? "#38BDF8" : "#C084FC" }} />}
                      </button>
                    );
                  })}
                </div>

                {compareLoading ? (
                  <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-10 text-center">
                    <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-[rgba(0,194,255,0.3)] border-t-[#9BE7FF]" />
                    <p className="text-sm text-gray-500">{t("comparison.loading")}</p>
                  </div>
                ) : (
                  <ComparisonBlock
                    title={translate(BLOCK_TABS.find((tb) => tb.key === activeBlockTab)!.labelKey)}
                    description={translate(BLOCK_DESC_KEYS[activeBlockTab])}
                    nameA={displayA.name}
                    nameB={displayB.name}
                    items={items[activeBlockTab]}
                    forcedWinner={comparison.winnersByBlock?.[activeBlockTab]}
                  />
                )}
              </div>
            )}

            {/* ── Final Decision ── */}
            <FinalDecisionPanel
              playerAName={displayA.name}
              playerBName={displayB.name}
              finalDecision={finalDecision}
              confidence={confidence}
              insights={insights}
              summary={t("comparison.finalSummary")}
            />

            {/* ── Cases / Executive snapshots ── */}
            <SectionCard
              eyebrow={t("comparison.casesEyebrow")}
              title={`${displayA.name} vs ${displayB.name}`}
              description={t("comparison.casesDescription")}
              accent="purple"
              aside={<WinnerBadge winner={winner} nameA={displayA.name} nameB={displayB.name} label={t("comparison.recommended")} />}
            >
              <div className="grid gap-6 xl:grid-cols-2">
                {[
                  { label: t("comparison.playerA"), player: displayA, profile: profileA, side: "A" as const },
                  { label: t("comparison.playerB"), player: displayB, profile: profileB, side: "B" as const },
                ].map((entry) => (
                  <div
                    key={entry.label}
                    className="rounded-[22px] border bg-[rgba(255,255,255,0.03)] p-5"
                    style={{ borderColor: entry.side === "A" ? "rgba(56,189,248,0.18)" : "rgba(192,132,252,0.18)" }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.24em] text-gray-300">{entry.label}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{entry.player.name}</h3>
                    <p className="mt-1 text-sm text-gray-400">{entry.player.position} · {entry.player.club}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{t("comparison.recommendation")}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{entry.profile?.summary.recommendation ?? "N/A"}</p>
                      </div>
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{t("comparison.confidence")}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{entry.profile?.summary.confidence ?? 0}%</p>
                      </div>
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{t("player.marketValue")}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{money(entry.profile?.market.currentValue ?? entry.player.marketValueAmount)}</p>
                      </div>
                      <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{t("comparison.dna")}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{entry.profile?.dna.archetype ?? "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── Save analysis ── */}
            <div className="rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">{t("comparison.saveTitle")}</p>
                  <p className="mt-0.5 text-xs text-gray-500">A análise só é registrada no histórico quando você salvar explicitamente.</p>
                </div>
                {savedAnalysisId && (
                  <a href={`/analysis/${savedAnalysisId}`} className="inline-flex items-center gap-1.5 rounded-[10px] border border-[rgba(0,255,156,0.25)] bg-[rgba(0,255,156,0.06)] px-3 py-1.5 text-[11px] font-semibold text-[#00FF9C] hover:bg-[rgba(0,255,156,0.12)] transition-colors">
                    Ver no Histórico →
                  </a>
                )}
              </div>
              {savedAnalysisId ? (
                <div className="flex items-center gap-3 rounded-[14px] border border-[rgba(0,255,156,0.2)] bg-[rgba(0,255,156,0.06)] px-4 py-3">
                  <span className="text-lg">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-[#00FF9C]">Análise salva no histórico</p>
                    <p className="text-xs text-gray-500">Selecione novos jogadores para iniciar outra análise.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <Input
                    value={analysisTitle}
                    onChange={(e) => setAnalysisTitle(e.target.value)}
                    maxLength={160}
                    placeholder={t("comparison.savePlaceholder", { playerA: displayA.name, playerB: displayB.name })}
                    className="h-10 rounded-[12px] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-sm text-gray-100 placeholder:text-gray-500"
                  />
                  <Textarea
                    value={analysisDescription}
                    onChange={(e) => setAnalysisDescription(e.target.value)}
                    maxLength={1000}
                    placeholder={t("comparison.saveDescriptionPlaceholder")}
                    className="min-h-[86px] rounded-[12px] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-sm text-gray-100 placeholder:text-gray-500"
                  />
                  <Button
                    type="button"
                    onClick={() => void saveAnalysis()}
                    disabled={saveLoading || !playerA.id || !playerB.id || playerA.id === playerB.id}
                    className="h-10 rounded-[12px] bg-[#00C2FF] px-5 font-semibold text-[#07142A] shadow-[0_4px_16px_rgba(0,194,255,0.3)] hover:bg-[#33CFFF] disabled:opacity-40"
                  >
                    {saveLoading ? "Salvando..." : "Salvar análise"}
                  </Button>
                </div>
              )}
            </div>

            {/* ── Empty state ── */}
            {!playersLoading && selectablePlayers.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)]">
                  <Search className="h-7 w-7 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">{t("comparison.empty")}</p>
              </div>
            ) : null}

          </div>
        </main>
      </div>
    </div>
  );
}
