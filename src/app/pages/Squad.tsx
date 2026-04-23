import { useState, useMemo, useEffect, useCallback } from "react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import {
  LayoutGrid,
  List,
  Users,
  Search,
  Filter,
  Save,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Edit,
  RefreshCw,
  Loader2,
  Shield,
  Zap,
  Scale,
} from "lucide-react";
import { RiskBadge } from "../components/RiskBadge";
import { PlayerEditModal } from "../components/PlayerEditModal";
import { PlayerFieldCard, PlayerPhoto, DropZone, getTopDna } from "../components/PlayerFieldCard";
import {
  getLineupSnapshot,
  getSquadSnapshot,
  loadTeamSquad,
  persistLineup,
  persistSquad,
} from "../services/squad";
import type { DnaScore, SquadLineup, SquadPlayer } from "../types/squad";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode      = "cards" | "list" | "tactical";
type Formation     = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "4-1-4-1";
type DnaFilter     = "all" | "impact" | "intelligence" | "defensiveIQ" | "consistency";
type TacticalStyle = "offensive" | "balanced" | "defensive";

// ─── Available teams ──────────────────────────────────────────────────────────

const AVAILABLE_TEAMS = [
  { value: "Corinthians",      label: "Corinthians" },
  { value: "Flamengo",         label: "Flamengo" },
  { value: "Palmeiras",        label: "Palmeiras" },
  { value: "São Paulo",        label: "São Paulo FC" },
  { value: "Santos",           label: "Santos FC" },
  { value: "Internacional",    label: "Internacional" },
  { value: "Grêmio",           label: "Grêmio" },
  { value: "Atlético Mineiro", label: "Atlético-MG" },
  { value: "Cruzeiro",         label: "Cruzeiro" },
  { value: "Fluminense",       label: "Fluminense" },
  { value: "Botafogo",         label: "Botafogo" },
  { value: "Vasco",            label: "Vasco da Gama" },
];

// ─── DNA weights per field slot (for Auto IA scoring) ─────────────────────────

const SLOT_DNA_WEIGHTS: Record<string, Record<string, number>> = {
  GK:   { defensiveIQ: 0.55, consistency: 0.45 },
  LB:   { defensiveIQ: 0.45, intelligence: 0.30, consistency: 0.25 },
  CB1:  { defensiveIQ: 0.60, consistency: 0.40 },
  CB2:  { defensiveIQ: 0.60, consistency: 0.40 },
  CB3:  { defensiveIQ: 0.60, consistency: 0.40 },
  RB:   { defensiveIQ: 0.45, intelligence: 0.30, consistency: 0.25 },
  CDM:  { defensiveIQ: 0.50, intelligence: 0.30, consistency: 0.20 },
  CDM1: { defensiveIQ: 0.50, intelligence: 0.30, consistency: 0.20 },
  CDM2: { defensiveIQ: 0.50, intelligence: 0.30, consistency: 0.20 },
  LWB:  { defensiveIQ: 0.40, impact: 0.35, intelligence: 0.25 },
  RWB:  { defensiveIQ: 0.40, impact: 0.35, intelligence: 0.25 },
  CM1:  { intelligence: 0.50, consistency: 0.30, defensiveIQ: 0.20 },
  CM2:  { intelligence: 0.50, consistency: 0.30, defensiveIQ: 0.20 },
  CM3:  { intelligence: 0.50, consistency: 0.30, defensiveIQ: 0.20 },
  LM:   { impact: 0.42, intelligence: 0.38, consistency: 0.20 },
  RM:   { impact: 0.42, intelligence: 0.38, consistency: 0.20 },
  CAM:  { intelligence: 0.50, impact: 0.40, consistency: 0.10 },
  LW:   { impact: 0.55, intelligence: 0.28, consistency: 0.17 },
  RW:   { impact: 0.55, intelligence: 0.28, consistency: 0.17 },
  ST:   { impact: 0.65, intelligence: 0.20, consistency: 0.15 },
  ST1:  { impact: 0.60, intelligence: 0.25, consistency: 0.15 },
  ST2:  { impact: 0.55, intelligence: 0.25, consistency: 0.20 },
};

// ─── Formations ───────────────────────────────────────────────────────────────

const formations: Record<
  Formation,
  { positions: Record<string, { x: string; y: string; compatiblePositions: string[] }> }
> = {
  "4-3-3": {
    positions: {
      GK:  { x: "50%", y: "90%", compatiblePositions: ["Goleiro"] },
      LB:  { x: "15%", y: "70%", compatiblePositions: ["Lateral Esquerdo", "Zagueiro"] },
      CB1: { x: "38%", y: "72%", compatiblePositions: ["Zagueiro"] },
      CB2: { x: "62%", y: "72%", compatiblePositions: ["Zagueiro"] },
      RB:  { x: "85%", y: "70%", compatiblePositions: ["Lateral Direito", "Zagueiro"] },
      CDM: { x: "50%", y: "52%", compatiblePositions: ["Volante"] },
      CM1: { x: "30%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante"] },
      CM2: { x: "70%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante"] },
      LW:  { x: "20%", y: "20%", compatiblePositions: ["Atacante", "Meia Atacante"] },
      ST:  { x: "50%", y: "15%", compatiblePositions: ["Atacante"] },
      RW:  { x: "80%", y: "20%", compatiblePositions: ["Atacante", "Meia Atacante"] },
    },
  },
  "4-4-2": {
    positions: {
      GK:  { x: "50%", y: "90%", compatiblePositions: ["Goleiro"] },
      LB:  { x: "15%", y: "70%", compatiblePositions: ["Lateral Esquerdo", "Zagueiro"] },
      CB1: { x: "38%", y: "72%", compatiblePositions: ["Zagueiro"] },
      CB2: { x: "62%", y: "72%", compatiblePositions: ["Zagueiro"] },
      RB:  { x: "85%", y: "70%", compatiblePositions: ["Lateral Direito", "Zagueiro"] },
      LM:  { x: "15%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante", "Atacante"] },
      CM1: { x: "40%", y: "50%", compatiblePositions: ["Volante", "Meia Atacante"] },
      CM2: { x: "60%", y: "50%", compatiblePositions: ["Volante", "Meia Atacante"] },
      RM:  { x: "85%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante", "Atacante"] },
      ST1: { x: "40%", y: "20%", compatiblePositions: ["Atacante"] },
      ST2: { x: "60%", y: "20%", compatiblePositions: ["Atacante"] },
    },
  },
  "4-2-3-1": {
    positions: {
      GK:   { x: "50%", y: "90%", compatiblePositions: ["Goleiro"] },
      LB:   { x: "15%", y: "70%", compatiblePositions: ["Lateral Esquerdo", "Zagueiro"] },
      CB1:  { x: "38%", y: "72%", compatiblePositions: ["Zagueiro"] },
      CB2:  { x: "62%", y: "72%", compatiblePositions: ["Zagueiro"] },
      RB:   { x: "85%", y: "70%", compatiblePositions: ["Lateral Direito", "Zagueiro"] },
      CDM1: { x: "35%", y: "55%", compatiblePositions: ["Volante"] },
      CDM2: { x: "65%", y: "55%", compatiblePositions: ["Volante"] },
      CAM:  { x: "50%", y: "38%", compatiblePositions: ["Meia Atacante", "Volante"] },
      LW:   { x: "20%", y: "28%", compatiblePositions: ["Atacante", "Meia Atacante"] },
      ST:   { x: "50%", y: "15%", compatiblePositions: ["Atacante"] },
      RW:   { x: "80%", y: "28%", compatiblePositions: ["Atacante", "Meia Atacante"] },
    },
  },
  "3-5-2": {
    positions: {
      GK:  { x: "50%", y: "90%", compatiblePositions: ["Goleiro"] },
      LWB: { x: "10%", y: "55%", compatiblePositions: ["Lateral Esquerdo", "Volante"] },
      CB1: { x: "30%", y: "72%", compatiblePositions: ["Zagueiro"] },
      CB2: { x: "50%", y: "75%", compatiblePositions: ["Zagueiro"] },
      CB3: { x: "70%", y: "72%", compatiblePositions: ["Zagueiro"] },
      RWB: { x: "90%", y: "55%", compatiblePositions: ["Lateral Direito", "Volante"] },
      CM1: { x: "35%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante"] },
      CM2: { x: "50%", y: "40%", compatiblePositions: ["Volante", "Meia Atacante"] },
      CM3: { x: "65%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante"] },
      ST1: { x: "40%", y: "18%", compatiblePositions: ["Atacante"] },
      ST2: { x: "60%", y: "18%", compatiblePositions: ["Atacante"] },
    },
  },
  "4-1-4-1": {
    positions: {
      GK:  { x: "50%", y: "90%", compatiblePositions: ["Goleiro"] },
      LB:  { x: "15%", y: "72%", compatiblePositions: ["Lateral Esquerdo", "Zagueiro"] },
      CB1: { x: "38%", y: "75%", compatiblePositions: ["Zagueiro"] },
      CB2: { x: "62%", y: "75%", compatiblePositions: ["Zagueiro"] },
      RB:  { x: "85%", y: "72%", compatiblePositions: ["Lateral Direito", "Zagueiro"] },
      CDM: { x: "50%", y: "58%", compatiblePositions: ["Volante"] },
      LM:  { x: "15%", y: "40%", compatiblePositions: ["Meia Atacante", "Atacante"] },
      CM1: { x: "38%", y: "42%", compatiblePositions: ["Volante", "Meia Atacante"] },
      CM2: { x: "62%", y: "42%", compatiblePositions: ["Volante", "Meia Atacante"] },
      RM:  { x: "85%", y: "40%", compatiblePositions: ["Meia Atacante", "Atacante"] },
      ST:  { x: "50%", y: "18%", compatiblePositions: ["Atacante"] },
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const positionOptions = [
  { value: "all",              label: "Todas as Posições" },
  { value: "Goleiro",          label: "Goleiros" },
  { value: "Lateral Esquerdo", label: "Laterais-Esquerdo" },
  { value: "Lateral Direito",  label: "Laterais-Direito" },
  { value: "Zagueiro",         label: "Zagueiros" },
  { value: "Volante",          label: "Volantes" },
  { value: "Meia Atacante",    label: "Meias" },
  { value: "Atacante",         label: "Atacantes" },
];

const ovrOptions = [
  { value: "all",   label: "Todos os OVR" },
  { value: "80+",   label: "80+ Elite" },
  { value: "75-79", label: "75-79 Bom" },
  { value: "70-74", label: "70-74 Médio" },
  { value: "69-",   label: "69- Básico" },
];

const dnaFilterOptions: { value: DnaFilter; label: string; emoji: string }[] = [
  { value: "all",          label: "Todos",  emoji: "" },
  { value: "impact",       label: "Impact", emoji: "⚡" },
  { value: "intelligence", label: "Intel",  emoji: "🧠" },
  { value: "defensiveIQ",  label: "Def IQ", emoji: "🛡" },
  { value: "consistency",  label: "Steady", emoji: "⚖" },
];

const tacticalStyleOptions: { value: TacticalStyle; label: string; icon: typeof Zap; color: string; active: string }[] = [
  { value: "offensive", label: "Ofensivo",   icon: Zap,    color: "#FF4D4F", active: "bg-[#FF4D4F] text-white border-transparent" },
  { value: "balanced",  label: "Equilíbrio", icon: Scale,  color: "#00FF9C", active: "bg-[#00FF9C] text-[#07142A] border-transparent" },
  { value: "defensive", label: "Defensivo",  icon: Shield, color: "#00C2FF", active: "bg-[#00C2FF] text-[#07142A] border-transparent" },
];

function getBadgeColor(position: string) {
  if (position === "Goleiro") return "bg-[#fbbf24] text-[#07142A]";
  if (position.includes("Lateral") || position === "Zagueiro") return "bg-[#00C2FF] text-[#07142A]";
  if (position === "Volante" || position === "Meia Atacante") return "bg-[#7A5CFF] text-white";
  return "bg-[#FF4D4F] text-white";
}

function calcCollectiveDna(lineup: SquadLineup): DnaScore | null {
  const players = Object.values(lineup).filter(Boolean);
  if (players.length === 0) return null;
  const withDna = players.filter((p) => p.dna);
  if (withDna.length === 0) return null;
  const sum = withDna.reduce(
    (acc, p) => ({
      impact:       acc.impact       + p.dna!.impact,
      intelligence: acc.intelligence + p.dna!.intelligence,
      defensiveIQ:  acc.defensiveIQ  + p.dna!.defensiveIQ,
      consistency:  acc.consistency  + p.dna!.consistency,
      potential:    acc.potential    + p.dna!.potential,
    }),
    { impact: 0, intelligence: 0, defensiveIQ: 0, consistency: 0, potential: 0 },
  );
  const n = withDna.length;
  return {
    impact:       Math.round(sum.impact / n),
    intelligence: Math.round(sum.intelligence / n),
    defensiveIQ:  Math.round(sum.defensiveIQ / n),
    consistency:  Math.round(sum.consistency / n),
    potential:    Math.round(sum.potential / n),
  };
}

/** Score a player's fit for a specific field slot + tactical style. */
function scorePlayerForSlot(player: SquadPlayer, slot: string, style: TacticalStyle): number {
  const ovrNorm = player.overallRating / 99;

  const weights = SLOT_DNA_WEIGHTS[slot] ?? { intelligence: 0.50, consistency: 0.50 };

  let dnaScore = 0.5;
  if (player.dna) {
    const dnaMap: Record<string, number> = {
      impact:       player.dna.impact       / 100,
      intelligence: player.dna.intelligence / 100,
      defensiveIQ:  player.dna.defensiveIQ  / 100,
      consistency:  player.dna.consistency  / 100,
    };
    dnaScore = Object.entries(weights).reduce((sum, [dim, w]) => sum + (dnaMap[dim] ?? 0) * w, 0);
  }

  // OVR weight is lower when we trust DNA fit more
  const ovrW = style === "balanced" ? 0.55 : 0.48;
  const dnaW = 1 - ovrW;

  // Small style-based bias
  let styleBias = 0;
  if (player.dna) {
    if (style === "offensive") styleBias = (player.dna.impact       / 100) * 0.07;
    if (style === "defensive") styleBias = (player.dna.defensiveIQ  / 100) * 0.07;
  }

  return ovrNorm * ovrW + dnaScore * dnaW + styleBias;
}

// ─── FilterBar (must be outside Squad to preserve input focus) ────────────────

interface FilterBarProps {
  searchQuery:     string;  setSearchQuery:     (v: string) => void;
  positionFilter:  string;  setPositionFilter:  (v: string) => void;
  ovrFilter:       string;  setOvrFilter:       (v: string) => void;
  cols?: number;
}

function FilterBar({
  searchQuery, setSearchQuery,
  positionFilter, setPositionFilter,
  ovrFilter, setOvrFilter,
  cols = 3,
}: FilterBarProps) {
  return (
    <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-4 mb-6">
      <div className={`grid grid-cols-${cols} gap-4`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar jogador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
          />
        </div>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="bg-[#07142A] border-[rgba(0,194,255,0.3)]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {positionOptions.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ovrFilter} onValueChange={setOvrFilter}>
          <SelectTrigger className="bg-[#07142A] border-[rgba(0,194,255,0.3)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ovrOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}

function DnaBar({ label, emoji, value }: { label: string; emoji: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-400 w-14 truncate">{emoji} {label}</span>
      <div className="flex-1 h-1.5 bg-[#07142A] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#7A5CFF] to-[#00C2FF] rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[9px] font-bold text-[#00C2FF] w-5 text-right">{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Squad() {
  const [squad,         setSquad]         = useState<SquadPlayer[]>(() => getSquadSnapshot());
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const [squadFromApi,  setSquadFromApi]  = useState(false);
  const [selectedTeam,  setSelectedTeam]  = useState("Corinthians");

  const [viewMode,       setViewMode]       = useState<ViewMode>("tactical");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [ovrFilter,      setOvrFilter]      = useState<string>("all");
  const [dnaFilter,      setDnaFilter]      = useState<DnaFilter>("all");
  const [formation,      setFormation]      = useState<Formation>("4-3-3");
  const [tacticalStyle,  setTacticalStyle]  = useState<TacticalStyle>("balanced");
  const [lineup,         setLineup]         = useState<SquadLineup>(() => getLineupSnapshot(squad));

  const [draggedPlayer,       setDraggedPlayer]       = useState<SquadPlayer | null>(null);
  const [draggedFromPosition, setDraggedFromPosition] = useState<string | null>(null);
  const [editingPlayer,       setEditingPlayer]       = useState<SquadPlayer | null>(null);
  const [isAddingPlayer,      setIsAddingPlayer]      = useState(false);
  const [saveFeedback,        setSaveFeedback]        = useState<string | null>(null);

  // ── Load squad ─────────────────────────────────────────────────────────────
  const refreshSquad = useCallback(async (teamOverride?: string) => {
    const team = teamOverride ?? selectedTeam;
    setIsLoadingSquad(true);
    try {
      const { players, fromApi } = await loadTeamSquad(team);
      setSquad(players);
      setSquadFromApi(fromApi);
      persistSquad(players);
      setLineup({});
    } finally {
      setIsLoadingSquad(false);
    }
  }, [selectedTeam]);

  useEffect(() => { refreshSquad(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTeamChange = useCallback((team: string) => {
    setSelectedTeam(team);
    refreshSquad(team);
  }, [refreshSquad]);

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => { persistSquad(squad); }, [squad]);
  useEffect(() => { persistLineup(lineup); }, [lineup]);
  useEffect(() => {
    setLineup((cur) => Object.keys(cur).length > 0 ? cur : getLineupSnapshot(squad));
  }, [squad]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredPlayers = useMemo(() => {
    return squad.filter((player) => {
      if (!player.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (positionFilter !== "all" && player.position !== positionFilter) return false;
      if (ovrFilter === "80+")   { if (player.overallRating < 80)                                   return false; }
      if (ovrFilter === "75-79") { if (player.overallRating < 75 || player.overallRating >= 80)     return false; }
      if (ovrFilter === "70-74") { if (player.overallRating < 70 || player.overallRating >= 75)     return false; }
      if (ovrFilter === "69-")   { if (player.overallRating >= 70)                                  return false; }
      if (dnaFilter !== "all" && player.dna) {
        const dims = { impact: player.dna.impact, intelligence: player.dna.intelligence, defensiveIQ: player.dna.defensiveIQ, consistency: player.dna.consistency };
        const top = Object.entries(dims).reduce((a, b) => (b[1] > a[1] ? b : a));
        if (top[0] !== dnaFilter) return false;
      }
      return true;
    });
  }, [squad, searchQuery, positionFilter, ovrFilter, dnaFilter]);

  const groupedPlayers = useMemo(() => ({
    Goleiros:              filteredPlayers.filter((p) => p.position === "Goleiro"),
    "Laterais-Esquerdo":   filteredPlayers.filter((p) => p.position === "Lateral Esquerdo"),
    "Laterais-Direito":    filteredPlayers.filter((p) => p.position === "Lateral Direito"),
    Zagueiros:             filteredPlayers.filter((p) => p.position === "Zagueiro"),
    Volantes:              filteredPlayers.filter((p) => p.position === "Volante"),
    Meias:                 filteredPlayers.filter((p) => p.position === "Meia Atacante"),
    Atacantes:             filteredPlayers.filter((p) => p.position === "Atacante"),
  }), [filteredPlayers]);

  const starterIds   = useMemo(() => new Set(Object.values(lineup).map((p) => p.id)), [lineup]);
  const benchPlayers = filteredPlayers.filter((p) => !starterIds.has(p.id));

  // ── Team stats ─────────────────────────────────────────────────────────────
  const teamStats = useMemo(() => {
    const slots    = formations[formation].positions;
    const starters = Object.values(lineup).filter(Boolean);
    if (starters.length === 0) return { avgOVR: 0, avgCapital: 0, offensive: 0, defensive: 0, chemistry: 0, dna: null };

    const avgOVR     = starters.reduce((s, p) => s + p.overallRating, 0) / starters.length;
    const avgCapital = starters.reduce((s, p) => s + p.capitalEfficiency, 0) / starters.length;
    const offensive  = starters.reduce((s, p) => s + (p.stats.shooting + p.stats.dribbling + p.stats.pace) / 3, 0) / starters.length;
    const defensive  = starters.reduce((s, p) => s + (p.stats.defending + p.stats.physical) / 2, 0) / starters.length;
    const dna        = calcCollectiveDna(lineup);

    const total      = Object.keys(slots).length;
    const compatible = Object.entries(lineup).filter(([slot, p]) => slots[slot]?.compatiblePositions.includes(p.position)).length;
    const chemistry  = total > 0 ? Math.round((compatible / total) * 100) : 0;

    return { avgOVR, avgCapital, offensive, defensive, chemistry, dna };
  }, [lineup, formation]);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((player: SquadPlayer, fromPosition?: string) => {
    setDraggedPlayer(player);
    setDraggedFromPosition(fromPosition ?? null);
  }, []);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = useCallback((position: string) => {
    if (!draggedPlayer) return;
    setLineup((prev) => {
      const next = { ...prev };
      if (draggedFromPosition) delete next[draggedFromPosition];
      next[position] = draggedPlayer;
      return next;
    });
    setDraggedPlayer(null);
    setDraggedFromPosition(null);
  }, [draggedPlayer, draggedFromPosition]);

  const handleRemovePlayer = useCallback((position: string) => {
    setLineup((prev) => { const next = { ...prev }; delete next[position]; return next; });
  }, []);

  const handleReset = () => setLineup({});

  // ── DNA-aware Auto IA ──────────────────────────────────────────────────────
  const handleAutoGenerate = () => {
    if (squad.length === 0) return;

    setSearchQuery(""); setPositionFilter("all"); setOvrFilter("all"); setDnaFilter("all");

    const newLineup: Record<string, SquadPlayer> = {};
    const usedIds = new Set<string>();
    const formationPositions = formations[formation].positions;

    const pickBest = (slot: string, positionList: string[]) => {
      for (const pos of positionList) {
        const candidates = squad.filter((p) => p.position === pos && !usedIds.has(p.id));
        if (candidates.length > 0) {
          return candidates.reduce((best, p) =>
            scorePlayerForSlot(p, slot, tacticalStyle) > scorePlayerForSlot(best, slot, tacticalStyle) ? p : best
          );
        }
      }
      return null;
    };

    // Pass 1: primary position only
    for (const [slot, data] of Object.entries(formationPositions)) {
      const primary    = data.compatiblePositions[0];
      const candidates = squad.filter((p) => p.position === primary && !usedIds.has(p.id));
      if (candidates.length > 0) {
        const best = candidates.reduce((b, p) =>
          scorePlayerForSlot(p, slot, tacticalStyle) > scorePlayerForSlot(b, slot, tacticalStyle) ? p : b
        );
        newLineup[slot] = best;
        usedIds.add(best.id);
      }
    }

    // Pass 2: fallback positions for unfilled slots
    for (const [slot, data] of Object.entries(formationPositions)) {
      if (newLineup[slot]) continue;
      const best = pickBest(slot, data.compatiblePositions.slice(1));
      if (best) { newLineup[slot] = best; usedIds.add(best.id); }
    }

    setLineup(newLineup);
  };

  const isPositionCompatible = (position: string, player: SquadPlayer) =>
    formations[formation].positions[position]?.compatiblePositions.includes(player.position);

  // ── Player CRUD ────────────────────────────────────────────────────────────
  const handleSavePlayer = (player: SquadPlayer) => {
    setSquad((prev) => {
      const idx = prev.findIndex((p) => p.id === player.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = player; return next; }
      return [...prev, player];
    });
    setLineup((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((pos) => { if (next[pos].id === player.id) next[pos] = player; });
      return next;
    });
    setEditingPlayer(null);
    setIsAddingPlayer(false);
  };

  const handleDeletePlayer = (playerId: string) => {
    setSquad((prev) => prev.filter((p) => p.id !== playerId));
    setLineup((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((pos) => { if (next[pos].id === playerId) delete next[pos]; });
      return next;
    });
    setEditingPlayer(null);
  };

  const handleSaveLineup = () => {
    persistLineup(lineup);
    setSaveFeedback("Escalação salva com sucesso!");
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const teamLabel = AVAILABLE_TEAMS.find((t) => t.value === selectedTeam)?.label ?? selectedTeam;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1800px] mx-auto space-y-6">

            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
              <div className="space-y-1.5">
                <h1 className="text-4xl mb-1">
                  {viewMode === "tactical" ? "Montar Esquema Tático" : "Elenco Atual"}
                </h1>
                {/* Team selector */}
                <div className="flex items-center gap-3">
                  <Select value={selectedTeam} onValueChange={handleTeamChange}>
                    <SelectTrigger className="w-52 bg-[#0A1B35] border-[rgba(0,194,255,0.25)] text-sm h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TEAMS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-gray-500 text-sm">— Temporada 2026</span>
                  {squadFromApi && (
                    <span className="text-[#00FF9C] text-xs">● Dados reais</span>
                  )}
                  {!squadFromApi && squad.length > 0 && (
                    <span className="text-[#fbbf24] text-xs">● Mock</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  onClick={() => setIsAddingPlayer(true)}
                  size="sm"
                  className="bg-[#00FF9C] text-[#07142A] hover:bg-[#00e68a]"
                >
                  <Plus className="w-4 h-4 mr-1.5" />Adicionar
                </Button>
                <Button
                  onClick={handleSaveLineup}
                  size="sm"
                  className="bg-[#00C2FF] text-[#07142A] hover:bg-[#00a8e0]"
                >
                  <Save className="w-4 h-4 mr-1.5" />Salvar Escalação
                </Button>
                <div className="h-6 w-px bg-gray-700" />
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className={viewMode === "cards" ? "bg-[#00C2FF] text-[#07142A]" : ""}
                >
                  <LayoutGrid className="w-4 h-4 mr-1.5" />Cards
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-[#00C2FF] text-[#07142A]" : ""}
                >
                  <List className="w-4 h-4 mr-1.5" />Lista
                </Button>
                <Button
                  variant={viewMode === "tactical" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("tactical")}
                  className={viewMode === "tactical" ? "bg-[#00C2FF] text-[#07142A]" : ""}
                >
                  <Users className="w-4 h-4 mr-1.5" />Tático
                </Button>
                <Button
                  onClick={() => refreshSquad()}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingSquad}
                  className="border-[rgba(0,194,255,0.3)] text-gray-400 hover:text-white"
                >
                  {isLoadingSquad ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Save feedback */}
            {saveFeedback && (
              <div className="flex items-center gap-2 rounded-[12px] border border-[rgba(0,255,156,0.25)] bg-[rgba(0,255,156,0.08)] px-4 py-3 text-sm text-[#B6FFD8]">
                <span className="text-[#00FF9C]">✓</span> {saveFeedback}
              </div>
            )}

            {/* ══════════════ TACTICAL VIEW ══════════════ */}
            {viewMode === "tactical" && (
              <>
                {/* Controls */}
                <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-5 flex-wrap">

                      {/* Formation */}
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Formação</label>
                        <Select
                          value={formation}
                          onValueChange={(v) => { setFormation(v as Formation); setLineup({}); }}
                        >
                          <SelectTrigger className="w-32 bg-[#07142A] border-[rgba(0,194,255,0.3)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4-3-3">4-3-3</SelectItem>
                            <SelectItem value="4-4-2">4-4-2</SelectItem>
                            <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                            <SelectItem value="3-5-2">3-5-2</SelectItem>
                            <SelectItem value="4-1-4-1">4-1-4-1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="h-12 w-px bg-gray-700" />

                      {/* KPIs */}
                      <div className="flex gap-5">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">OVR Médio</p>
                          <p className="text-xl font-black text-[#00FF9C]">{teamStats.avgOVR > 0 ? teamStats.avgOVR.toFixed(1) : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Cap Eff.</p>
                          <p className="text-xl font-black text-[#00C2FF]">{teamStats.avgCapital > 0 ? teamStats.avgCapital.toFixed(1) : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Química</p>
                          <p className="text-xl font-black text-[#00FF9C]">{teamStats.chemistry > 0 ? `${teamStats.chemistry}%` : "—"}</p>
                        </div>
                      </div>

                      {/* DNA bars */}
                      {teamStats.dna && (
                        <>
                          <div className="h-12 w-px bg-gray-700" />
                          <div className="space-y-1.5 min-w-[160px]">
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">DNA Coletivo</p>
                            <DnaBar label="Impact" emoji="⚡" value={teamStats.dna.impact} />
                            <DnaBar label="Intel"  emoji="🧠" value={teamStats.dna.intelligence} />
                            <DnaBar label="Def IQ" emoji="🛡" value={teamStats.dna.defensiveIQ} />
                            <DnaBar label="Steady" emoji="⚖" value={teamStats.dna.consistency} />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 self-start items-end">
                      {/* Tactical style picker */}
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 text-right">Estilo Auto IA</p>
                        <div className="flex gap-1">
                          {tacticalStyleOptions.map(({ value, label, icon: Icon, color, active }) => (
                            <button
                              key={value}
                              onClick={() => setTacticalStyle(value)}
                              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border font-semibold transition-all ${
                                tacticalStyle === value
                                  ? active
                                  : "border-[rgba(255,255,255,0.12)] bg-[#07142A] text-gray-400 hover:text-white"
                              }`}
                            >
                              <Icon className="w-3 h-3" style={{ color: tacticalStyle === value ? undefined : color }} />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAutoGenerate}
                          size="sm"
                          disabled={isLoadingSquad || squad.length === 0}
                          className="bg-gradient-to-r from-[#7A5CFF] to-[#00C2FF] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isLoadingSquad
                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            : <Sparkles className="w-4 h-4 mr-2" />}
                          Auto IA
                        </Button>
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          size="sm"
                          className="border-[#FF4D4F] text-[#FF4D4F] hover:bg-[rgba(255,77,79,0.1)]"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />Resetar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Balance bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#FF4D4F]" />
                        <span className="text-xs text-gray-400">Ofensivo</span>
                        <span className="text-xs font-bold text-[#FF4D4F] ml-1">{teamStats.offensive.toFixed(0)}</span>
                      </div>
                      <span className="text-xs text-gray-500">Equilíbrio Tático</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#00C2FF] mr-1">{teamStats.defensive.toFixed(0)}</span>
                        <span className="text-xs text-gray-400">Defensivo</span>
                        <TrendingDown className="w-3.5 h-3.5 text-[#00C2FF]" />
                      </div>
                    </div>
                    <div className="relative h-2 bg-[#07142A] rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D4F] via-[#fbbf24] to-[#00C2FF] rounded-full" />
                      {(teamStats.offensive + teamStats.defensive) > 0 && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full shadow-lg"
                          style={{ left: `${(teamStats.defensive / (teamStats.offensive + teamStats.defensive)) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                </Card>

                {/* Field + bench */}
                <div className="grid grid-cols-12 gap-6">
                  {/* Field */}
                  <div className="col-span-8">
                    <Card className="bg-gradient-to-b from-[#0A1B35] to-[#0d2340] border-[rgba(0,194,255,0.2)] p-4">
                      {isLoadingSquad && (
                        <div className="flex items-center justify-center gap-2 mb-3 text-[#00C2FF]">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">Carregando elenco de {teamLabel}…</span>
                        </div>
                      )}
                      {!isLoadingSquad && squad.length === 0 && (
                        <div className="flex items-center justify-center gap-2 mb-3 text-[#fbbf24]">
                          <span className="text-xs">Nenhum jogador encontrado para {teamLabel}. Tente outro time.</span>
                        </div>
                      )}
                      <div
                        className="relative w-full rounded-xl border-4 border-white overflow-hidden"
                        style={{ height: "720px" }}
                      >
                        {/* Pitch */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "repeating-linear-gradient(180deg, #1a5c2e 0px, #1a5c2e 44px, #1e6433 44px, #1e6433 88px)",
                          }}
                        />
                        {/* Markings */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 border-2 border-white border-opacity-50 rounded-full" />
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-50" />
                          <div className="absolute left-0 top-1/2 w-full h-px bg-white opacity-35" />
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-60 h-24 border-2 border-white border-t-0 opacity-35" />
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-14 border-2 border-white border-t-0 opacity-35" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-60 h-24 border-2 border-white border-b-0 opacity-35" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-32 h-14 border-2 border-white border-b-0 opacity-35" />
                        </div>

                        {/* Positions */}
                        {Object.entries(formations[formation].positions).map(([pos, coords]) => {
                          const player = lineup[pos];
                          const isCompatibleDrop = draggedPlayer ? isPositionCompatible(pos, draggedPlayer) : true;
                          return (
                            <div
                              key={pos}
                              className="absolute -translate-x-1/2 -translate-y-1/2"
                              style={{ left: coords.x, top: coords.y }}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(pos)}
                            >
                              {player ? (
                                <PlayerFieldCard
                                  player={player}
                                  position={pos}
                                  isCompatible={isCompatibleDrop}
                                  onDragStart={() => handleDragStart(player, pos)}
                                  onRemove={() => handleRemovePlayer(pos)}
                                />
                              ) : (
                                <DropZone
                                  position={pos}
                                  isCompatible={isCompatibleDrop}
                                  isDragging={!!draggedPlayer}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Bench */}
                  <div className="col-span-4">
                    <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-4 h-full flex flex-col">
                      <h3 className="text-sm font-bold mb-3 text-[#00C2FF] uppercase tracking-wider">
                        Banco de Jogadores
                        <span className="ml-2 text-gray-500 font-normal normal-case">({benchPlayers.length})</span>
                      </h3>

                      <div className="space-y-2 mb-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white h-8 text-sm"
                          />
                        </div>
                        <Select value={positionFilter} onValueChange={setPositionFilter}>
                          <SelectTrigger className="bg-[#07142A] border-[rgba(0,194,255,0.3)] h-8 text-xs">
                            <Filter className="w-3 h-3 mr-1.5" /><SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {positionOptions.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-1">
                          {dnaFilterOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setDnaFilter(opt.value)}
                              className={`text-[9px] px-2 py-0.5 rounded-full transition-all ${
                                dnaFilter === opt.value
                                  ? "bg-[#7A5CFF] text-white"
                                  : "bg-[#07142A] text-gray-400 hover:text-white border border-gray-700"
                              }`}
                            >
                              {opt.emoji && `${opt.emoji} `}{opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 420px)" }}>
                        {benchPlayers.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-4">Nenhum jogador disponível</p>
                        )}
                        {benchPlayers.map((player) => {
                          const topDna = player.dna ? getTopDna(player.dna) : null;
                          return (
                            <div
                              key={player.id}
                              draggable
                              onDragStart={() => handleDragStart(player)}
                              className="bg-[#07142A] border border-[rgba(0,194,255,0.2)] rounded-lg p-2.5 cursor-move hover:border-[#00C2FF] hover:shadow-[0_0_10px_rgba(0,194,255,0.25)] transition-all"
                            >
                              <div className="flex items-center gap-2.5">
                                <PlayerPhoto name={player.name} image={player.image} ovr={player.overallRating} size="md" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-base font-black text-[#00FF9C]">{player.overallRating}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${getBadgeColor(player.position)}`}>
                                      {player.position}
                                    </span>
                                    {topDna && <span className="text-[8px] text-[#00C2FF]">{topDna.emoji} {topDna.label}</span>}
                                  </div>
                                  <p className="text-xs font-bold text-white truncate">{player.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] text-gray-400">{player.age}a</span>
                                    {player.potential && <>
                                      <span className="text-[9px] text-gray-600">•</span>
                                      <span className="text-[9px] text-[#00FF9C]">POT {player.potential}</span>
                                    </>}
                                    <span className="text-[9px] text-gray-600">•</span>
                                    <RiskBadge level={player.riskLevel} size="sm" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                </div>
              </>
            )}

            {/* ══════════════ CARDS VIEW ══════════════ */}
            {viewMode === "cards" && (
              <>
                <FilterBar
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  positionFilter={positionFilter} setPositionFilter={setPositionFilter}
                  ovrFilter={ovrFilter} setOvrFilter={setOvrFilter}
                />
                <div className="space-y-8">
                  {Object.entries(groupedPlayers).map(([group, players]) => {
                    if (players.length === 0) return null;
                    return (
                      <div key={group}>
                        <div className="flex items-center gap-3 mb-4">
                          <h2 className="text-2xl uppercase tracking-wider text-[#00C2FF]">{group}</h2>
                          <span className="text-sm text-gray-400 bg-[#0A1B35] px-3 py-1 rounded-full">
                            {players.length} {players.length === 1 ? "jogador" : "jogadores"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                          {players.map((player) => {
                            const topDna = player.dna ? getTopDna(player.dna) : null;
                            return (
                              <Card
                                key={player.id}
                                className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-5 hover:border-[#00C2FF] transition-all hover:shadow-[0_0_20px_rgba(0,194,255,0.3)]"
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <PlayerPhoto name={player.name} image={player.image} ovr={player.overallRating} size="md" />
                                  <div>
                                    <h3 className="font-bold text-base leading-tight">{player.name}</h3>
                                    <p className="text-xs text-gray-400">{player.position}</p>
                                    {topDna && <span className="text-[9px] text-[#00C2FF]">{topDna.emoji} {topDna.label}</span>}
                                  </div>
                                  <div className="ml-auto text-right">
                                    <div className="text-2xl font-black text-[#00FF9C]">{player.overallRating}</div>
                                    <p className="text-[9px] text-gray-400">OVR</p>
                                  </div>
                                </div>
                                <div className="space-y-1.5 mb-4">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Idade</span><span>{player.age} anos</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Nac.</span><span>{player.nationality}</span>
                                  </div>
                                  {player.potential && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-400">Potencial</span>
                                      <span className="text-[#00FF9C]">{player.potential}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Risco</span>
                                    <RiskBadge level={player.riskLevel} size="sm" />
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Valor</span>
                                    <span className="text-[#00C2FF]">{player.marketValue}</span>
                                  </div>
                                </div>
                                {player.dna && (
                                  <div className="mb-3 space-y-1.5 border-t border-gray-700 pt-3">
                                    <DnaBar label="Impact" emoji="⚡" value={player.dna.impact} />
                                    <DnaBar label="Intel"  emoji="🧠" value={player.dna.intelligence} />
                                    <DnaBar label="Def IQ" emoji="🛡" value={player.dna.defensiveIQ} />
                                  </div>
                                )}
                                <Button
                                  onClick={() => setEditingPlayer(player)}
                                  className="w-full bg-[#7A5CFF] text-white hover:bg-[#6a4cef] text-xs h-8"
                                >
                                  <Edit className="w-3 h-3 mr-1.5" />Editar
                                </Button>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ══════════════ LIST VIEW ══════════════ */}
            {viewMode === "list" && (
              <>
                <FilterBar
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  positionFilter={positionFilter} setPositionFilter={setPositionFilter}
                  ovrFilter={ovrFilter} setOvrFilter={setOvrFilter}
                />
                <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)]">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-700">
                        <tr>
                          {["Jogador","Pos.","Idade","OVR","POT","DNA Top","Risco","Valor","Ações"].map((h, i) => (
                            <th key={h} className={`py-3 px-3 text-xs text-gray-400 uppercase tracking-wider ${i === 0 ? "text-left px-4" : i === 8 ? "text-right px-4" : "text-center"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredPlayers.map((player) => {
                          const topDna = player.dna ? getTopDna(player.dna) : null;
                          return (
                            <tr key={player.id} className="hover:bg-[#07142A] transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <PlayerPhoto name={player.name} image={player.image} ovr={player.overallRating} size="md" />
                                  <div>
                                    <p className="font-bold text-sm">{player.name}</p>
                                    <p className="text-[10px] text-gray-400">{player.nationality}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`text-[9px] px-2 py-0.5 rounded ${getBadgeColor(player.position)}`}>{player.position}</span>
                              </td>
                              <td className="py-3 px-3 text-center text-sm">{player.age}</td>
                              <td className="py-3 px-3 text-center">
                                <span className="text-[#00FF9C] font-black text-base">{player.overallRating}</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {player.potential
                                  ? <span className="text-[#7A5CFF] font-bold text-sm">{player.potential}</span>
                                  : <span className="text-gray-600">—</span>}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {topDna
                                  ? <span className="text-[10px] text-[#00C2FF]">{topDna.emoji} {topDna.label}</span>
                                  : <span className="text-gray-600">—</span>}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex justify-center"><RiskBadge level={player.riskLevel} size="sm" /></div>
                              </td>
                              <td className="py-3 px-3 text-center text-[#00C2FF] text-xs">{player.marketValue}</td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  onClick={() => setEditingPlayer(player)}
                                  size="sm"
                                  className="bg-[#7A5CFF] text-white hover:bg-[#6a4cef] h-7 text-xs"
                                >
                                  <Edit className="w-3 h-3 mr-1" />Editar
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>

      {(editingPlayer || isAddingPlayer) && (
        <PlayerEditModal
          player={editingPlayer}
          onClose={() => { setEditingPlayer(null); setIsAddingPlayer(false); }}
          onSave={handleSavePlayer}
          onDelete={handleDeletePlayer}
          isNew={isAddingPlayer}
        />
      )}
    </div>
  );
}
