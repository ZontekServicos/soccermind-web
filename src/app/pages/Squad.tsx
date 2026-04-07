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
} from "lucide-react";
import { RiskBadge } from "../components/RiskBadge";
import { PlayerEditModal } from "../components/PlayerEditModal";
import { PlayerFieldCard, PlayerPhoto, getTopDna } from "../components/PlayerFieldCard";
import {
  getLineupSnapshot,
  getSquadSnapshot,
  loadCorinthiansSquad,
  persistLineup,
  persistSquad,
} from "../services/squad";
import type { DnaScore, SquadLineup, SquadPlayer } from "../types/squad";

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = "cards" | "list" | "tactical";
type Formation = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2";
type DnaFilter = "all" | "impact" | "intelligence" | "defensiveIQ" | "consistency";

// ─── Formations ──────────────────────────────────────────────────────────────

const formations: Record<
  Formation,
  { positions: Record<string, { x: string; y: string; compatiblePositions: string[] }> }
> = {
  "4-3-3": {
    positions: {
      GK: { x: "50%", y: "90%", compatiblePositions: ["Goleiro"] },
      LB: { x: "15%", y: "70%", compatiblePositions: ["Lateral Esquerdo", "Zagueiro"] },
      CB1: { x: "38%", y: "72%", compatiblePositions: ["Zagueiro"] },
      CB2: { x: "62%", y: "72%", compatiblePositions: ["Zagueiro"] },
      RB: { x: "85%", y: "70%", compatiblePositions: ["Lateral Direito", "Zagueiro"] },
      CDM: { x: "50%", y: "52%", compatiblePositions: ["Volante"] },
      CM1: { x: "30%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante"] },
      CM2: { x: "70%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante"] },
      LW: { x: "20%", y: "20%", compatiblePositions: ["Atacante", "Meia Atacante"] },
      ST: { x: "50%", y: "15%", compatiblePositions: ["Atacante"] },
      RW: { x: "80%", y: "20%", compatiblePositions: ["Atacante", "Meia Atacante"] },
    },
  },
  "4-4-2": {
    positions: {
      GK: { x: "50%", y: "90%", compatiblePositions: ["Goleiro"] },
      LB: { x: "15%", y: "70%", compatiblePositions: ["Lateral Esquerdo", "Zagueiro"] },
      CB1: { x: "38%", y: "72%", compatiblePositions: ["Zagueiro"] },
      CB2: { x: "62%", y: "72%", compatiblePositions: ["Zagueiro"] },
      RB: { x: "85%", y: "70%", compatiblePositions: ["Lateral Direito", "Zagueiro"] },
      LM: { x: "15%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante", "Atacante"] },
      CM1: { x: "40%", y: "50%", compatiblePositions: ["Volante", "Meia Atacante"] },
      CM2: { x: "60%", y: "50%", compatiblePositions: ["Volante", "Meia Atacante"] },
      RM: { x: "85%", y: "45%", compatiblePositions: ["Volante", "Meia Atacante", "Atacante"] },
      ST1: { x: "40%", y: "20%", compatiblePositions: ["Atacante"] },
      ST2: { x: "60%", y: "20%", compatiblePositions: ["Atacante"] },
    },
  },
  "4-2-3-1": {
    positions: {
      GK: { x: "50%", y: "90%", compatiblePositions: ["Goleiro"] },
      LB: { x: "15%", y: "70%", compatiblePositions: ["Lateral Esquerdo", "Zagueiro"] },
      CB1: { x: "38%", y: "72%", compatiblePositions: ["Zagueiro"] },
      CB2: { x: "62%", y: "72%", compatiblePositions: ["Zagueiro"] },
      RB: { x: "85%", y: "70%", compatiblePositions: ["Lateral Direito", "Zagueiro"] },
      CDM1: { x: "35%", y: "55%", compatiblePositions: ["Volante"] },
      CDM2: { x: "65%", y: "55%", compatiblePositions: ["Volante"] },
      CAM: { x: "50%", y: "38%", compatiblePositions: ["Meia Atacante", "Volante"] },
      LW: { x: "20%", y: "28%", compatiblePositions: ["Atacante", "Meia Atacante"] },
      ST: { x: "50%", y: "15%", compatiblePositions: ["Atacante"] },
      RW: { x: "80%", y: "28%", compatiblePositions: ["Atacante", "Meia Atacante"] },
    },
  },
  "3-5-2": {
    positions: {
      GK: { x: "50%", y: "90%", compatiblePositions: ["Goleiro"] },
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
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const positions = [
  { value: "all", label: "Todas as Posições" },
  { value: "Goleiro", label: "Goleiros" },
  { value: "Lateral Esquerdo", label: "Laterais-Esquerdo" },
  { value: "Lateral Direito", label: "Laterais-Direito" },
  { value: "Zagueiro", label: "Zagueiros" },
  { value: "Volante", label: "Volantes" },
  { value: "Meia Atacante", label: "Meias" },
  { value: "Atacante", label: "Atacantes" },
];

const ovrOptions = [
  { value: "all", label: "Todos os OVR" },
  { value: "80+", label: "80+ Elite" },
  { value: "75-79", label: "75-79 Bom" },
  { value: "70-74", label: "70-74 Médio" },
  { value: "69-", label: "69- Básico" },
];

const dnaFilterOptions: { value: DnaFilter; label: string; emoji: string }[] = [
  { value: "all", label: "Todos", emoji: "" },
  { value: "impact", label: "Impact", emoji: "⚡" },
  { value: "intelligence", label: "Intel", emoji: "🧠" },
  { value: "defensiveIQ", label: "Def IQ", emoji: "🛡" },
  { value: "consistency", label: "Steady", emoji: "⚖" },
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
      impact: acc.impact + p.dna!.impact,
      intelligence: acc.intelligence + p.dna!.intelligence,
      defensiveIQ: acc.defensiveIQ + p.dna!.defensiveIQ,
      consistency: acc.consistency + p.dna!.consistency,
      potential: acc.potential + p.dna!.potential,
    }),
    { impact: 0, intelligence: 0, defensiveIQ: 0, consistency: 0, potential: 0 },
  );

  const n = withDna.length;
  return {
    impact: Math.round(sum.impact / n),
    intelligence: Math.round(sum.intelligence / n),
    defensiveIQ: Math.round(sum.defensiveIQ / n),
    consistency: Math.round(sum.consistency / n),
    potential: Math.round(sum.potential / n),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DnaBar({ label, emoji, value }: { label: string; emoji: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-400 w-14 truncate">
        {emoji} {label}
      </span>
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

function DropZone({
  position,
  isCompatible,
  isDragging,
}: {
  position: string;
  isCompatible: boolean;
  isDragging: boolean;
}) {
  return (
    <div
      className={`w-[90px] h-28 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
        isDragging && isCompatible
          ? "border-[#00FF9C] bg-[rgba(0,255,156,0.1)]"
          : isDragging
            ? "border-[#FF4D4F] bg-[rgba(255,77,79,0.1)]"
            : "border-gray-600 bg-[rgba(7,20,42,0.5)]"
      }`}
    >
      <div className="text-center">
        <div className="text-xs text-gray-400 font-bold mb-0.5">{position}</div>
        <div className="text-[8px] text-gray-600">Arraste aqui</div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Squad() {
  const [squad, setSquad] = useState<SquadPlayer[]>(() => getSquadSnapshot());
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const [squadFromApi, setSquadFromApi] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("tactical");
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [ovrFilter, setOvrFilter] = useState<string>("all");
  const [dnaFilter, setDnaFilter] = useState<DnaFilter>("all");
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [lineup, setLineup] = useState<SquadLineup>(() => getLineupSnapshot(squad));

  const [draggedPlayer, setDraggedPlayer] = useState<SquadPlayer | null>(null);
  const [draggedFromPosition, setDraggedFromPosition] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<SquadPlayer | null>(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  // ── Load real squad from API on mount ──────────────────────────────────────
  const refreshSquad = useCallback(async () => {
    setIsLoadingSquad(true);
    try {
      const { players, fromApi } = await loadCorinthiansSquad();
      setSquad(players);
      setSquadFromApi(fromApi);
      persistSquad(players);
      // Reset lineup so it gets rebuilt from new data
      setLineup({});
    } finally {
      setIsLoadingSquad(false);
    }
  }, []);

  useEffect(() => {
    refreshSquad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist on change ──────────────────────────────────────────────────────
  useEffect(() => {
    persistSquad(squad);
  }, [squad]);

  useEffect(() => {
    persistLineup(lineup);
  }, [lineup]);

  // Keep lineup coherent with squad roster
  useEffect(() => {
    setLineup((current) => {
      if (Object.keys(current).length > 0) return current;
      return getLineupSnapshot(squad);
    });
  }, [squad]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredPlayers = useMemo(() => {
    return squad.filter((player) => {
      if (!player.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (positionFilter !== "all" && player.position !== positionFilter) return false;

      if (ovrFilter === "80+") { if (player.overallRating < 80) return false; }
      else if (ovrFilter === "75-79") { if (player.overallRating < 75 || player.overallRating >= 80) return false; }
      else if (ovrFilter === "70-74") { if (player.overallRating < 70 || player.overallRating >= 75) return false; }
      else if (ovrFilter === "69-") { if (player.overallRating >= 70) return false; }

      if (dnaFilter !== "all" && player.dna) {
        const dims = {
          impact: player.dna.impact,
          intelligence: player.dna.intelligence,
          defensiveIQ: player.dna.defensiveIQ,
          consistency: player.dna.consistency,
        };
        const top = Object.entries(dims).reduce((a, b) => (b[1] > a[1] ? b : a));
        if (top[0] !== dnaFilter) return false;
      }

      return true;
    });
  }, [squad, searchQuery, positionFilter, ovrFilter, dnaFilter]);

  const groupedPlayers = useMemo(
    () => ({
      Goleiros: filteredPlayers.filter((p) => p.position === "Goleiro"),
      "Laterais-Esquerdo": filteredPlayers.filter((p) => p.position === "Lateral Esquerdo"),
      "Laterais-Direito": filteredPlayers.filter((p) => p.position === "Lateral Direito"),
      Zagueiros: filteredPlayers.filter((p) => p.position === "Zagueiro"),
      Volantes: filteredPlayers.filter((p) => p.position === "Volante"),
      Meias: filteredPlayers.filter((p) => p.position === "Meia Atacante"),
      Atacantes: filteredPlayers.filter((p) => p.position === "Atacante"),
    }),
    [filteredPlayers],
  );

  const starterIds = useMemo(
    () => new Set(Object.values(lineup).map((p) => p.id)),
    [lineup],
  );
  const benchPlayers = filteredPlayers.filter((p) => !starterIds.has(p.id));

  // ── Team stats ─────────────────────────────────────────────────────────────
  const teamStats = useMemo(() => {
    const starters = Object.values(lineup).filter(Boolean);
    if (starters.length === 0) {
      return { avgOVR: 0, avgCapital: 0, offensive: 0, defensive: 0, chemistry: 85, dna: null };
    }

    const avgOVR = starters.reduce((sum, p) => sum + p.overallRating, 0) / starters.length;
    const avgCapital = starters.reduce((sum, p) => sum + p.capitalEfficiency, 0) / starters.length;
    const offensive =
      starters.reduce((sum, p) => sum + (p.stats.shooting + p.stats.dribbling + p.stats.pace) / 3, 0) /
      starters.length;
    const defensive =
      starters.reduce((sum, p) => sum + (p.stats.defending + p.stats.physical) / 2, 0) / starters.length;
    const dna = calcCollectiveDna(lineup);

    return { avgOVR, avgCapital, offensive, defensive, chemistry: 85, dna };
  }, [lineup]);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((player: SquadPlayer, fromPosition?: string) => {
    setDraggedPlayer(player);
    setDraggedFromPosition(fromPosition || null);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback(
    (position: string) => {
      if (!draggedPlayer) return;

      setLineup((prev) => {
        const newLineup = { ...prev };
        if (draggedFromPosition) delete newLineup[draggedFromPosition];
        newLineup[position] = draggedPlayer;
        return newLineup;
      });

      setDraggedPlayer(null);
      setDraggedFromPosition(null);
    },
    [draggedPlayer, draggedFromPosition],
  );

  const handleRemovePlayer = useCallback((position: string) => {
    setLineup((prev) => {
      const newLineup = { ...prev };
      delete newLineup[position];
      return newLineup;
    });
  }, []);

  const handleReset = () => setLineup({});

  const handleAutoGenerate = () => {
    const newLineup: Record<string, SquadPlayer> = {};
    const positionGroups: Record<string, SquadPlayer[]> = {
      "Goleiro": squad.filter((p) => p.position === "Goleiro"),
      "Lateral Esquerdo": squad.filter((p) => p.position === "Lateral Esquerdo"),
      "Lateral Direito": squad.filter((p) => p.position === "Lateral Direito"),
      "Zagueiro": squad.filter((p) => p.position === "Zagueiro"),
      "Volante": squad.filter((p) => p.position === "Volante"),
      "Meia Atacante": squad.filter((p) => p.position === "Meia Atacante"),
      "Atacante": squad.filter((p) => p.position === "Atacante"),
    };

    Object.entries(formations[formation].positions).forEach(([fieldPos, data]) => {
      for (const compatiblePos of data.compatiblePositions) {
        const available = positionGroups[compatiblePos]?.filter(
          (p) => !Object.values(newLineup).find((np) => np.id === p.id),
        );
        if (available && available.length > 0) {
          const best = [...available].sort((a, b) => b.overallRating - a.overallRating)[0];
          newLineup[fieldPos] = best;
          break;
        }
      }
    });

    setLineup(newLineup);
  };

  const isPositionCompatible = (position: string, player: SquadPlayer) =>
    formations[formation].positions[position]?.compatiblePositions.includes(player.position);

  const handleSavePlayer = (player: SquadPlayer) => {
    setSquad((prev) => {
      const idx = prev.findIndex((p) => p.id === player.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = player;
        return next;
      }
      return [...prev, player];
    });

    setLineup((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((pos) => {
        if (next[pos].id === player.id) next[pos] = player;
      });
      return next;
    });

    setEditingPlayer(null);
    setIsAddingPlayer(false);
  };

  const handleDeletePlayer = (playerId: string) => {
    setSquad((prev) => prev.filter((p) => p.id !== playerId));
    setLineup((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((pos) => {
        if (next[pos].id === playerId) delete next[pos];
      });
      return next;
    });
    setEditingPlayer(null);
  };

  const handleSaveLineup = () => {
    persistLineup(lineup);
    alert("✅ Escalação salva com sucesso!");
  };

  // ── Shared filter bar (cards + list) ──────────────────────────────────────
  function FilterBar({ cols = 3 }: { cols?: number }) {
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
              {positions.map((pos) => (
                <SelectItem key={pos.value} value={pos.value}>
                  {pos.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ovrFilter} onValueChange={setOvrFilter}>
            <SelectTrigger className="bg-[#07142A] border-[rgba(0,194,255,0.3)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ovrOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1800px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-4xl mb-1">
                  {viewMode === "tactical" ? "Montar Esquema Tático" : "Elenco Atual"}
                </h1>
                <p className="text-gray-400 text-sm">
                  Sport Club Corinthians Paulista — Temporada 2026
                  {squadFromApi && (
                    <span className="ml-2 text-[#00FF9C] text-xs">● Dados reais carregados</span>
                  )}
                </p>
              </div>
              <Button
                onClick={refreshSquad}
                variant="outline"
                size="sm"
                disabled={isLoadingSquad}
                className="border-[rgba(0,194,255,0.3)] text-gray-400 hover:text-white"
              >
                {isLoadingSquad ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Sincronizar</span>
              </Button>
            </div>

            {/* View mode + actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsAddingPlayer(true)}
                  size="sm"
                  className="bg-[#00FF9C] text-[#07142A] hover:bg-[#00e68a]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
                <Button
                  onClick={handleSaveLineup}
                  size="sm"
                  className="bg-[#00C2FF] text-[#07142A] hover:bg-[#00a8e0]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Escalação
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className={viewMode === "cards" ? "bg-[#00C2FF] text-[#07142A]" : ""}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-[#00C2FF] text-[#07142A]" : ""}
                >
                  <List className="w-4 h-4 mr-2" />
                  Lista
                </Button>
                <Button
                  variant={viewMode === "tactical" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("tactical")}
                  className={viewMode === "tactical" ? "bg-[#00C2FF] text-[#07142A]" : ""}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Tático
                </Button>
              </div>
            </div>

            {/* ════════════════════ TACTICAL VIEW ════════════════════ */}
            {viewMode === "tactical" && (
              <>
                {/* Controls card */}
                <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-6 flex-wrap">
                      {/* Formation selector */}
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Formação</label>
                        <Select
                          value={formation}
                          onValueChange={(v) => setFormation(v as Formation)}
                        >
                          <SelectTrigger className="w-32 bg-[#07142A] border-[rgba(0,194,255,0.3)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4-3-3">4-3-3</SelectItem>
                            <SelectItem value="4-4-2">4-4-2</SelectItem>
                            <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                            <SelectItem value="3-5-2">3-5-2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="h-12 w-px bg-gray-700" />

                      {/* KPIs */}
                      <div className="flex gap-5">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">OVR Médio</p>
                          <p className="text-xl font-black text-[#00FF9C]">
                            {teamStats.avgOVR > 0 ? teamStats.avgOVR.toFixed(1) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Cap Eff.</p>
                          <p className="text-xl font-black text-[#00C2FF]">
                            {teamStats.avgCapital > 0 ? teamStats.avgCapital.toFixed(1) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Química</p>
                          <p className="text-xl font-black text-[#00FF9C]">
                            {teamStats.chemistry}
                          </p>
                        </div>
                      </div>

                      {/* Collective DNA bars */}
                      {teamStats.dna && (
                        <>
                          <div className="h-12 w-px bg-gray-700" />
                          <div className="space-y-1.5 min-w-[160px]">
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">
                              DNA Coletivo
                            </p>
                            <DnaBar label="Impact" emoji="⚡" value={teamStats.dna.impact} />
                            <DnaBar label="Intel" emoji="🧠" value={teamStats.dna.intelligence} />
                            <DnaBar label="Def IQ" emoji="🛡" value={teamStats.dna.defensiveIQ} />
                            <DnaBar label="Steady" emoji="⚖" value={teamStats.dna.consistency} />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 self-start">
                      <Button
                        onClick={handleAutoGenerate}
                        size="sm"
                        className="bg-gradient-to-r from-[#7A5CFF] to-[#00C2FF] text-white hover:opacity-90"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Auto IA
                      </Button>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        size="sm"
                        className="border-[#FF4D4F] text-[#FF4D4F] hover:bg-[rgba(255,77,79,0.1)]"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Resetar
                      </Button>
                    </div>
                  </div>

                  {/* Offensive/defensive balance */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#FF4D4F]" />
                        <span className="text-xs text-gray-400">Ofensivo</span>
                        <span className="text-xs font-bold text-[#FF4D4F] ml-1">
                          {teamStats.offensive.toFixed(0)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">Equilíbrio Tático</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#00C2FF] mr-1">
                          {teamStats.defensive.toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-400">Defensivo</span>
                        <TrendingDown className="w-3.5 h-3.5 text-[#00C2FF]" />
                      </div>
                    </div>
                    <div className="relative h-2 bg-[#07142A] rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D4F] via-[#fbbf24] to-[#00C2FF] rounded-full" />
                      {(teamStats.offensive + teamStats.defensive) > 0 && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full shadow-lg"
                          style={{
                            left: `${(teamStats.defensive / (teamStats.offensive + teamStats.defensive)) * 100}%`,
                          }}
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
                          <span className="text-xs">Carregando jogadores reais...</span>
                        </div>
                      )}
                      <div
                        className="relative w-full rounded-xl border-4 border-white overflow-hidden"
                        style={{ height: "720px" }}
                      >
                        {/* Grass texture */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 40px, transparent 40px, transparent 80px), #1a5c2e",
                          }}
                        />

                        {/* Field markings */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 border-2 border-white border-opacity-60 rounded-full" />
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-60" />
                          <div className="absolute left-0 top-1/2 w-full h-px bg-white opacity-40" />
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-60 h-24 border-2 border-white border-t-0 opacity-40" />
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-14 border-2 border-white border-t-0 opacity-40" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-60 h-24 border-2 border-white border-b-0 opacity-40" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-32 h-14 border-2 border-white border-b-0 opacity-40" />
                        </div>

                        {/* Player positions */}
                        {Object.entries(formations[formation].positions).map(([position, coords]) => {
                          const player = lineup[position];
                          const isCompatibleDrop = draggedPlayer
                            ? isPositionCompatible(position, draggedPlayer)
                            : true;

                          return (
                            <div
                              key={position}
                              className="absolute -translate-x-1/2 -translate-y-1/2"
                              style={{ left: coords.x, top: coords.y }}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(position)}
                            >
                              {player ? (
                                <PlayerFieldCard
                                  player={player}
                                  position={position}
                                  isCompatible={isCompatibleDrop}
                                  onDragStart={() => handleDragStart(player, position)}
                                  onRemove={() => handleRemovePlayer(position)}
                                />
                              ) : (
                                <DropZone
                                  position={position}
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
                        <span className="ml-2 text-gray-500 font-normal normal-case">
                          ({benchPlayers.length})
                        </span>
                      </h3>

                      {/* Filters */}
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
                            <Filter className="w-3 h-3 mr-1.5" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {positions.map((pos) => (
                              <SelectItem key={pos.value} value={pos.value}>
                                {pos.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* DNA filter pills */}
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
                              {opt.emoji && `${opt.emoji} `}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bench player list */}
                      <div
                        className="flex-1 space-y-2 overflow-y-auto pr-1"
                        style={{ maxHeight: "calc(100vh - 420px)" }}
                      >
                        {benchPlayers.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-4">
                            Nenhum jogador disponível
                          </p>
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
                                <PlayerPhoto
                                  name={player.name}
                                  image={player.image}
                                  ovr={player.overallRating}
                                  size="md"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-base font-black text-[#00FF9C]">
                                      {player.overallRating}
                                    </span>
                                    <span
                                      className={`text-[8px] px-1.5 py-0.5 rounded ${getBadgeColor(player.position)}`}
                                    >
                                      {player.position}
                                    </span>
                                    {topDna && (
                                      <span className="text-[8px] text-[#00C2FF]">
                                        {topDna.emoji} {topDna.label}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-bold text-white truncate">
                                    {player.name}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] text-gray-400">{player.age}a</span>
                                    {player.potential && (
                                      <>
                                        <span className="text-[9px] text-gray-600">•</span>
                                        <span className="text-[9px] text-[#00FF9C]">
                                          POT {player.potential}
                                        </span>
                                      </>
                                    )}
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

            {/* ════════════════════ CARDS VIEW ════════════════════ */}
            {viewMode === "cards" && (
              <>
                <FilterBar />
                <div className="space-y-8">
                  {Object.entries(groupedPlayers).map(([positionGroup, players]) => {
                    if (players.length === 0) return null;
                    return (
                      <div key={positionGroup}>
                        <div className="flex items-center gap-3 mb-4">
                          <h2 className="text-2xl uppercase tracking-wider text-[#00C2FF]">
                            {positionGroup}
                          </h2>
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
                                {/* Photo + OVR */}
                                <div className="flex items-center gap-3 mb-4">
                                  <PlayerPhoto
                                    name={player.name}
                                    image={player.image}
                                    ovr={player.overallRating}
                                    size="md"
                                  />
                                  <div>
                                    <h3 className="font-bold text-base leading-tight">
                                      {player.name}
                                    </h3>
                                    <p className="text-xs text-gray-400">{player.position}</p>
                                    {topDna && (
                                      <span className="text-[9px] text-[#00C2FF]">
                                        {topDna.emoji} {topDna.label}
                                      </span>
                                    )}
                                  </div>
                                  <div className="ml-auto text-right">
                                    <div className="text-2xl font-black text-[#00FF9C]">
                                      {player.overallRating}
                                    </div>
                                    <p className="text-[9px] text-gray-400">OVR</p>
                                  </div>
                                </div>

                                <div className="space-y-1.5 mb-4">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Idade</span>
                                    <span className="text-white">{player.age} anos</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Nac.</span>
                                    <span className="text-white">{player.nationality}</span>
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

                                {/* DNA mini bars */}
                                {player.dna && (
                                  <div className="mb-3 space-y-1.5 border-t border-gray-700 pt-3">
                                    <DnaBar label="Impact" emoji="⚡" value={player.dna.impact} />
                                    <DnaBar label="Intel" emoji="🧠" value={player.dna.intelligence} />
                                    <DnaBar label="Def IQ" emoji="🛡" value={player.dna.defensiveIQ} />
                                  </div>
                                )}

                                <Button
                                  onClick={() => setEditingPlayer(player)}
                                  className="w-full bg-[#7A5CFF] text-white hover:bg-[#6a4cef] text-xs h-8"
                                >
                                  <Edit className="w-3 h-3 mr-1.5" />
                                  Editar
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

            {/* ════════════════════ LIST VIEW ════════════════════ */}
            {viewMode === "list" && (
              <>
                <FilterBar />
                <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)]">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-700">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider">
                            Jogador
                          </th>
                          <th className="text-center py-3 px-3 text-xs text-gray-400 uppercase tracking-wider">
                            Pos.
                          </th>
                          <th className="text-center py-3 px-3 text-xs text-gray-400 uppercase tracking-wider">
                            Idade
                          </th>
                          <th className="text-center py-3 px-3 text-xs text-gray-400 uppercase tracking-wider">
                            OVR
                          </th>
                          <th className="text-center py-3 px-3 text-xs text-gray-400 uppercase tracking-wider">
                            POT
                          </th>
                          <th className="text-center py-3 px-3 text-xs text-gray-400 uppercase tracking-wider">
                            DNA Top
                          </th>
                          <th className="text-center py-3 px-3 text-xs text-gray-400 uppercase tracking-wider">
                            Risco
                          </th>
                          <th className="text-center py-3 px-3 text-xs text-gray-400 uppercase tracking-wider">
                            Valor
                          </th>
                          <th className="text-right py-3 px-4 text-xs text-gray-400 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredPlayers.map((player) => {
                          const topDna = player.dna ? getTopDna(player.dna) : null;
                          return (
                            <tr
                              key={player.id}
                              className="hover:bg-[#07142A] transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <PlayerPhoto
                                    name={player.name}
                                    image={player.image}
                                    ovr={player.overallRating}
                                    size="md"
                                  />
                                  <div>
                                    <p className="font-bold text-sm">{player.name}</p>
                                    <p className="text-[10px] text-gray-400">{player.nationality}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded ${getBadgeColor(player.position)}`}
                                >
                                  {player.position}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center text-sm">{player.age}</td>
                              <td className="py-3 px-3 text-center">
                                <span className="text-[#00FF9C] font-black text-base">
                                  {player.overallRating}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {player.potential ? (
                                  <span className="text-[#7A5CFF] font-bold text-sm">
                                    {player.potential}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {topDna ? (
                                  <span className="text-[10px] text-[#00C2FF]">
                                    {topDna.emoji} {topDna.label}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex justify-center">
                                  <RiskBadge level={player.riskLevel} size="sm" />
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center text-[#00C2FF] text-xs">
                                {player.marketValue}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  onClick={() => setEditingPlayer(player)}
                                  size="sm"
                                  className="bg-[#7A5CFF] text-white hover:bg-[#6a4cef] h-7 text-xs"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Editar
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

      {/* Edit / Add modal */}
      {(editingPlayer || isAddingPlayer) && (
        <PlayerEditModal
          player={editingPlayer}
          onClose={() => {
            setEditingPlayer(null);
            setIsAddingPlayer(false);
          }}
          onSave={handleSavePlayer}
          onDelete={handleDeletePlayer}
          isNew={isAddingPlayer}
        />
      )}
    </div>
  );
}
