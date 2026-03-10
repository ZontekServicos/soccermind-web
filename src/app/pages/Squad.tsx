import { useState, useMemo, useEffect } from "react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { LayoutGrid, List, Users, Search, Filter, Save, RotateCcw, Sparkles, TrendingUp, TrendingDown, Minus, Plus, Edit } from "lucide-react";
import { corinthiansSquad as defaultSquad, SquadPlayer } from "../data/corinthiansSquad";
import { RiskBadge } from "../components/RiskBadge";
import { PlayerEditModal } from "../components/PlayerEditModal";

type ViewMode = "cards" | "list" | "tactical";
type Formation = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2";

const formations: Record<Formation, { positions: Record<string, { x: string; y: string; compatiblePositions: string[] }> }> = {
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

export default function Squad() {
  // Load squad from localStorage or use default
  const [squad, setSquad] = useState<SquadPlayer[]>(() => {
    const saved = localStorage.getItem("soccermind-squad");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading squad from localStorage", e);
      }
    }
    return defaultSquad;
  });

  const [viewMode, setViewMode] = useState<ViewMode>("tactical");
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [ovrFilter, setOvrFilter] = useState<string>("all");
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [lineup, setLineup] = useState<Record<string, SquadPlayer>>(() => {
    const initialLineup: Record<string, SquadPlayer> = {};
    squad.forEach((player) => {
      if (player.fieldPosition && !initialLineup[player.fieldPosition]) {
        initialLineup[player.fieldPosition] = player;
      }
    });
    return initialLineup;
  });
  
  const [draggedPlayer, setDraggedPlayer] = useState<SquadPlayer | null>(null);
  const [draggedFromPosition, setDraggedFromPosition] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<SquadPlayer | null>(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  // Save squad to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("soccermind-squad", JSON.stringify(squad));
  }, [squad]);

  // Save lineup to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("soccermind-lineup", JSON.stringify(lineup));
  }, [lineup]);

  // Load lineup from localStorage on mount
  useEffect(() => {
    const savedLineup = localStorage.getItem("soccermind-lineup");
    if (savedLineup) {
      try {
        const parsed = JSON.parse(savedLineup);
        // Validate that players still exist in squad
        const validLineup: Record<string, SquadPlayer> = {};
        Object.entries(parsed).forEach(([pos, player]: [string, any]) => {
          const existingPlayer = squad.find(p => p.id === player.id);
          if (existingPlayer) {
            validLineup[pos] = existingPlayer;
          }
        });
        setLineup(validLineup);
      } catch (e) {
        console.error("Error loading lineup from localStorage", e);
      }
    }
  }, []);

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

  const filteredPlayers = squad.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = positionFilter === "all" || player.position === positionFilter;
    
    let matchesOVR = true;
    if (ovrFilter === "80+") matchesOVR = player.overallRating >= 80;
    else if (ovrFilter === "75-79") matchesOVR = player.overallRating >= 75 && player.overallRating < 80;
    else if (ovrFilter === "70-74") matchesOVR = player.overallRating >= 70 && player.overallRating < 75;
    else if (ovrFilter === "69-") matchesOVR = player.overallRating < 70;
    
    return matchesSearch && matchesPosition && matchesOVR;
  });

  const groupedPlayers = {
    "Goleiros": filteredPlayers.filter(p => p.position === "Goleiro"),
    "Laterais-Esquerdo": filteredPlayers.filter(p => p.position === "Lateral Esquerdo"),
    "Laterais-Direito": filteredPlayers.filter(p => p.position === "Lateral Direito"),
    "Zagueiros": filteredPlayers.filter(p => p.position === "Zagueiro"),
    "Volantes": filteredPlayers.filter(p => p.position === "Volante"),
    "Meias": filteredPlayers.filter(p => p.position === "Meia Atacante"),
    "Atacantes": filteredPlayers.filter(p => p.position === "Atacante"),
  };

  const starterIds = new Set(Object.values(lineup).map((p) => p.id));
  const benchPlayers = filteredPlayers.filter((p) => !starterIds.has(p.id));

  // Calculate team stats
  const teamStats = useMemo(() => {
    const starters = Object.values(lineup).filter(Boolean);
    if (starters.length === 0) return { avgOVR: 0, avgCapital: 0, offensive: 0, defensive: 0, chemistry: 85 };
    
    const avgOVR = starters.reduce((sum, p) => sum + p.overallRating, 0) / starters.length;
    const avgCapital = starters.reduce((sum, p) => sum + p.capitalEfficiency, 0) / starters.length;
    
    const offensive = starters.reduce((sum, p) => sum + (p.stats.shooting + p.stats.dribbling + p.stats.pace) / 3, 0) / starters.length;
    const defensive = starters.reduce((sum, p) => sum + (p.stats.defending + p.stats.physical) / 2, 0) / starters.length;
    
    return { avgOVR, avgCapital, offensive, defensive, chemistry: 85 };
  }, [lineup]);

  const handleDragStart = (player: SquadPlayer, fromPosition?: string) => {
    setDraggedPlayer(player);
    setDraggedFromPosition(fromPosition || null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (position: string) => {
    if (!draggedPlayer) return;

    const positionData = formations[formation].positions[position];
    const isCompatible = positionData.compatiblePositions.includes(draggedPlayer.position);

    // Allow drop anyway but show visual feedback
    setLineup((prev) => {
      const newLineup = { ...prev };
      
      // If dragged from field, remove from old position
      if (draggedFromPosition) {
        delete newLineup[draggedFromPosition];
      }
      
      // Place in new position
      newLineup[position] = draggedPlayer;
      return newLineup;
    });

    setDraggedPlayer(null);
    setDraggedFromPosition(null);
  };

  const handleRemovePlayer = (position: string) => {
    setLineup((prev) => {
      const newLineup = { ...prev };
      delete newLineup[position];
      return newLineup;
    });
  };

  const handleReset = () => {
    setLineup({});
  };

  const handleAutoGenerate = () => {
    const newLineup: Record<string, SquadPlayer> = {};
    const positionGroups: Record<string, SquadPlayer[]> = {
      "Goleiro": squad.filter(p => p.position === "Goleiro"),
      "Lateral Esquerdo": squad.filter(p => p.position === "Lateral Esquerdo"),
      "Lateral Direito": squad.filter(p => p.position === "Lateral Direito"),
      "Zagueiro": squad.filter(p => p.position === "Zagueiro"),
      "Volante": squad.filter(p => p.position === "Volante"),
      "Meia Atacante": squad.filter(p => p.position === "Meia Atacante"),
      "Atacante": squad.filter(p => p.position === "Atacante"),
    };

    Object.entries(formations[formation].positions).forEach(([fieldPos, data]) => {
      for (const compatiblePos of data.compatiblePositions) {
        const available = positionGroups[compatiblePos]?.filter(p => !Object.values(newLineup).find(np => np.id === p.id));
        if (available && available.length > 0) {
          const best = available.sort((a, b) => b.overallRating - a.overallRating)[0];
          newLineup[fieldPos] = best;
          break;
        }
      }
    });

    setLineup(newLineup);
  };

  const isPositionCompatible = (position: string, player: SquadPlayer) => {
    const positionData = formations[formation].positions[position];
    return positionData?.compatiblePositions.includes(player.position);
  };

  const getBadgeColor = (position: string) => {
    if (position === "Goleiro") return "bg-[#fbbf24] text-[#07142A]";
    if (position.includes("Lateral") || position === "Zagueiro") return "bg-[#00C2FF] text-[#07142A]";
    if (position === "Volante" || position === "Meia Atacante") return "bg-[#7A5CFF] text-white";
    return "bg-[#FF4D4F] text-white";
  };

  const handleSavePlayer = (player: SquadPlayer) => {
    setSquad((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === player.id);
      if (existingIndex >= 0) {
        // Update existing player
        const newSquad = [...prev];
        newSquad[existingIndex] = player;
        return newSquad;
      } else {
        // Add new player
        return [...prev, player];
      }
    });

    // Update lineup if player is in it
    setLineup((prev) => {
      const newLineup = { ...prev };
      Object.keys(newLineup).forEach((pos) => {
        if (newLineup[pos].id === player.id) {
          newLineup[pos] = player;
        }
      });
      return newLineup;
    });

    setEditingPlayer(null);
    setIsAddingPlayer(false);
  };

  const handleDeletePlayer = (playerId: string) => {
    setSquad((prev) => prev.filter((p) => p.id !== playerId));
    
    // Remove from lineup if present
    setLineup((prev) => {
      const newLineup = { ...prev };
      Object.keys(newLineup).forEach((pos) => {
        if (newLineup[pos].id === playerId) {
          delete newLineup[pos];
        }
      });
      return newLineup;
    });

    setEditingPlayer(null);
  };

  const handleSaveLineup = () => {
    localStorage.setItem("soccermind-lineup", JSON.stringify(lineup));
    alert("✅ Escalação salva com sucesso!");
  };

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1800px] mx-auto space-y-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-4xl mb-2">
                {viewMode === "tactical" ? "Montar Esquema Tático" : "Elenco Atual"}
              </h1>
              <p className="text-gray-400">Sport Club Corinthians Paulista - Temporada 2026</p>
            </div>

            {/* View Mode Selector */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsAddingPlayer(true)}
                  size="sm"
                  className="bg-[#00FF9C] text-[#07142A] hover:bg-[#00e68a]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Jogador
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

            {/* Tactical View */}
            {viewMode === "tactical" && (
              <>
                {/* Tactical Controls */}
                <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Formação</label>
                        <Select value={formation} onValueChange={(value) => setFormation(value as Formation)}>
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

                      {/* Team Stats */}
                      <div className="flex gap-6">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Overall Médio</p>
                          <p className="text-lg font-bold text-[#00FF9C]">{teamStats.avgOVR.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Capital Eff.</p>
                          <p className="text-lg font-bold text-[#00C2FF]">{teamStats.avgCapital.toFixed(1)}/10</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Química</p>
                          <p className="text-lg font-bold text-[#00FF9C]">{teamStats.chemistry}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleAutoGenerate}
                        size="sm"
                        className="bg-gradient-to-r from-[#7A5CFF] to-[#00C2FF] text-white hover:opacity-90"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Melhor Escalação (Auto IA)
                      </Button>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        size="sm"
                        className="border-[#FF4D4F] text-[#FF4D4F] hover:bg-[#FF4D4F20]"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Resetar
                      </Button>
                    </div>
                  </div>

                  {/* Balance Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#FF4D4F]" />
                        <span className="text-xs text-gray-400">Ofensivo</span>
                      </div>
                      <span className="text-xs text-gray-400">Equilíbrio Tático</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Defensivo</span>
                        <TrendingDown className="w-4 h-4 text-[#00C2FF]" />
                      </div>
                    </div>
                    <div className="relative h-2 bg-[#07142A] rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF4D4F] via-[#fbbf24] to-[#00C2FF] rounded-full"
                        style={{ width: "100%" }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full shadow-lg"
                        style={{ left: `${((teamStats.defensive / (teamStats.offensive + teamStats.defensive)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[#FF4D4F]">{teamStats.offensive.toFixed(0)}</span>
                      <span className="text-xs text-[#00C2FF]">{teamStats.defensive.toFixed(0)}</span>
                    </div>
                  </div>
                </Card>

                {/* Main Tactical Layout */}
                <div className="grid grid-cols-12 gap-6">
                  {/* Field (70%) */}
                  <div className="col-span-8">
                    <Card className="bg-gradient-to-b from-[#0A1B35] to-[#0d2340] border-[rgba(0,194,255,0.2)] p-6">
                      <div
                        className="relative w-full rounded-lg border-4 border-white bg-[#1a4d2e] shadow-2xl"
                        style={{
                          height: "750px",
                          backgroundImage: `
                            linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
                          `,
                          backgroundSize: "40px 40px",
                        }}
                      >
                        {/* Field Markings */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Center Circle */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-3 border-white rounded-full" />
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
                          
                          {/* Center Line */}
                          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-white" />
                          
                          {/* Top Penalty Box */}
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-56 h-20 border-3 border-white border-t-0" />
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-12 border-3 border-white border-t-0" />
                          
                          {/* Bottom Penalty Box */}
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-56 h-20 border-3 border-white border-b-0" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-32 h-12 border-3 border-white border-b-0" />
                        </div>

                        {/* Player Positions */}
                        {Object.entries(formations[formation].positions).map(([position, coords]) => {
                          const player = lineup[position];
                          const isCompatibleDrop = draggedPlayer ? isPositionCompatible(position, draggedPlayer) : true;

                          return (
                            <div
                              key={position}
                              className="absolute -translate-x-1/2 -translate-y-1/2"
                              style={{
                                left: coords.x,
                                top: coords.y,
                              }}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(position)}
                            >
                              {player ? (
                                <div
                                  draggable
                                  onDragStart={() => handleDragStart(player, position)}
                                  className={`relative cursor-move group ${
                                    !isCompatibleDrop ? "opacity-50" : ""
                                  }`}
                                >
                                  {/* FIFA-style Card */}
                                  <div
                                    className={`w-24 bg-gradient-to-br from-[#0A1B35] to-[#07142A] rounded-lg border-2 ${
                                      isCompatibleDrop ? "border-[#00FF9C]" : "border-[#FF4D4F]"
                                    } p-2 shadow-xl hover:scale-105 transition-transform`}
                                  >
                                    {/* OVR Badge */}
                                    <div className="flex items-start gap-1 mb-1">
                                      <div className="text-center">
                                        <div className="text-xl font-bold text-[#00FF9C]">{player.overallRating}</div>
                                        <div className="text-[8px] text-gray-400 uppercase">{position}</div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] flex items-center justify-center text-[10px] font-bold">
                                          {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Player Name */}
                                    <div className="text-[9px] font-bold text-white mb-1 truncate">{player.name}</div>

                                    {/* Mini Stats */}
                                    <div className="grid grid-cols-3 gap-1 text-[7px]">
                                      <div className="text-center">
                                        <div className="text-gray-400">PAC</div>
                                        <div className="text-white font-bold">{player.stats.pace}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-400">SHO</div>
                                        <div className="text-white font-bold">{player.stats.shooting}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-400">PAS</div>
                                        <div className="text-white font-bold">{player.stats.passing}</div>
                                      </div>
                                    </div>

                                    {/* Remove button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePlayer(position);
                                      }}
                                      className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF4D4F] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Chemistry Link (placeholder) */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-[#00FF9C] border-2 border-[#07142A] flex items-center justify-center text-[10px] font-bold text-[#07142A]">
                                      10
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`w-24 h-28 rounded-lg border-2 border-dashed ${
                                    draggedPlayer && isCompatibleDrop
                                      ? "border-[#00FF9C] bg-[#00FF9C20]"
                                      : draggedPlayer
                                      ? "border-[#FF4D4F] bg-[#FF4D4F20]"
                                      : "border-gray-600 bg-[#07142A80]"
                                  } flex items-center justify-center`}
                                >
                                  <div className="text-center">
                                    <div className="text-xs text-gray-400 font-bold mb-1">{position}</div>
                                    <div className="text-[8px] text-gray-500">Vazio</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Bench Sidebar (30%) */}
                  <div className="col-span-4">
                    <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-4 h-full">
                      <h3 className="text-lg font-bold mb-4 text-[#00C2FF] uppercase tracking-wider">
                        Banco de Jogadores
                      </h3>

                      {/* Filters */}
                      <div className="space-y-3 mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white h-9 text-sm"
                          />
                        </div>

                        <Select value={positionFilter} onValueChange={setPositionFilter}>
                          <SelectTrigger className="bg-[#07142A] border-[rgba(0,194,255,0.3)] h-9 text-sm">
                            <Filter className="w-3 h-3 mr-2" />
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
                          <SelectTrigger className="bg-[#07142A] border-[rgba(0,194,255,0.3)] h-9 text-sm">
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

                      {/* Player List */}
                      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 450px)" }}>
                        {benchPlayers.map((player) => (
                          <div
                            key={player.id}
                            draggable
                            onDragStart={() => handleDragStart(player)}
                            className="bg-[#07142A] border border-[rgba(0,194,255,0.2)] rounded-lg p-3 cursor-move hover:border-[#00C2FF] hover:shadow-[0_0_10px_rgba(0,194,255,0.3)] transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl font-bold text-[#00FF9C]">{player.overallRating}</span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded ${getBadgeColor(player.position)}`}>
                                    {player.position}
                                  </span>
                                </div>
                                <p className="text-sm font-bold text-white truncate">{player.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-gray-400">{player.age} anos</span>
                                  <span className="text-[10px] text-gray-400">•</span>
                                  <RiskBadge level={player.riskLevel} size="sm" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </>
            )}

            {/* Cards View */}
            {viewMode === "cards" && (
              <>
                <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4">
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

                <div className="space-y-8">
                  {Object.entries(groupedPlayers).map(([positionGroup, players]) => {
                    if (players.length === 0) return null;
                    return (
                      <div key={positionGroup}>
                        <div className="flex items-center gap-3 mb-4">
                          <h2 className="text-2xl uppercase tracking-wider text-[#00C2FF]">{positionGroup}</h2>
                          <span className="text-sm text-gray-400 bg-[#0A1B35] px-3 py-1 rounded-full">
                            {players.length} {players.length === 1 ? "jogador" : "jogadores"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {players.map((player) => (
                            <Card
                              key={player.id}
                              className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-6 hover:border-[#00C2FF] transition-all hover:shadow-[0_0_20px_rgba(0,194,255,0.3)]"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg mb-1">{player.name}</h3>
                                  <p className="text-sm text-gray-400 mb-2">{player.position}</p>
                                  <span className={`text-xs px-2 py-1 rounded ${getBadgeColor(player.position)}`}>
                                    {player.position === "Goleiro" ? "GOL" : 
                                     player.position.includes("Lateral") || player.position === "Zagueiro" ? "DEF" :
                                     player.position === "Volante" || player.position === "Meia Atacante" ? "MEIO" : "ATA"}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-[#00FF9C] mb-1">{player.overallRating}</div>
                                  <p className="text-xs text-gray-400">OVR</p>
                                </div>
                              </div>

                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400">Idade</span>
                                  <span className="text-white">{player.age} anos</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400">Nacionalidade</span>
                                  <span className="text-white">{player.nationality}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400">Capital Eff.</span>
                                  <span className="text-[#00FF9C]">{player.capitalEfficiency.toFixed(1)}/10</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400">Risk Level</span>
                                  <RiskBadge level={player.riskLevel} size="sm" />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400">Valor</span>
                                  <span className="text-[#00C2FF]">{player.marketValue}</span>
                                </div>
                              </div>

                              <Button className="w-full bg-[#00C2FF] text-[#07142A] hover:bg-[#00a8e0]">
                                Ver Perfil
                              </Button>
                              <Button 
                                onClick={() => setEditingPlayer(player)}
                                className="w-full mt-2 bg-[#7A5CFF] text-white hover:bg-[#6a4cef]"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Jogador
                              </Button>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <>
                <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4">
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

                <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)]">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-700">
                        <tr>
                          <th className="text-left py-4 px-6 text-sm text-gray-400 uppercase tracking-wider">Jogador</th>
                          <th className="text-center py-4 px-4 text-sm text-gray-400 uppercase tracking-wider">Posição</th>
                          <th className="text-center py-4 px-4 text-sm text-gray-400 uppercase tracking-wider">Idade</th>
                          <th className="text-center py-4 px-4 text-sm text-gray-400 uppercase tracking-wider">OVR</th>
                          <th className="text-center py-4 px-4 text-sm text-gray-400 uppercase tracking-wider">Capital Eff.</th>
                          <th className="text-center py-4 px-4 text-sm text-gray-400 uppercase tracking-wider">Risk</th>
                          <th className="text-center py-4 px-4 text-sm text-gray-400 uppercase tracking-wider">Valor</th>
                          <th className="text-right py-4 px-6 text-sm text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {filteredPlayers.map((player) => (
                          <tr key={player.id} className="hover:bg-[#07142A] transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-bold">{player.name}</p>
                                <p className="text-xs text-gray-400">#{player.number} • {player.nationality}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`text-xs px-2 py-1 rounded ${getBadgeColor(player.position)}`}>
                                {player.position}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center text-white">{player.age}</td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-[#00FF9C] font-bold text-lg">{player.overallRating}</span>
                            </td>
                            <td className="py-4 px-4 text-center text-[#00FF9C]">
                              {player.capitalEfficiency.toFixed(1)}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex justify-center">
                                <RiskBadge level={player.riskLevel} size="sm" />
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center text-[#00C2FF]">{player.marketValue}</td>
                            <td className="py-4 px-6 text-right">
                              <Button size="sm" className="bg-[#00C2FF] text-[#07142A] hover:bg-[#00a8e0]">
                                Ver Perfil
                              </Button>
                              <Button 
                                onClick={() => setEditingPlayer(player)}
                                className="w-full mt-2 bg-[#7A5CFF] text-white hover:bg-[#6a4cef]"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Jogador
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Player Edit Modal */}
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