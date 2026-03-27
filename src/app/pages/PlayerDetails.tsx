import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, TrendingUp, Shield, Star, FileText, Download, CheckCircle2, Loader2 } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../contexts/AuthContext";
import { API_CONFIG } from "../config/api-config";
import type { PlayerCardModel, PlayerProfileModel } from "../mappers/player.mapper";
import { downloadPlayerReportPdf } from "../utils/playerReportPdf";
import {
  generatePlayerReport,
  getPlayer,
  getPlayerProjection,
  getSimilarPlayers,
  type PlayerReportResult,
} from "../services/players";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../services/watchlist";

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

function getNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatStatValue(value: number | null) {
  return value === null ? "-" : value;
}

function getTierStyles(tier: string) {
  switch (tier) {
    case "ELITE":
      return "border-[rgba(168,85,247,0.34)] bg-[rgba(168,85,247,0.16)] text-[#E9D5FF]";
    case "PREMIUM":
      return "border-[rgba(0,194,255,0.28)] bg-[rgba(0,194,255,0.14)] text-[#9BE7FF]";
    case "STANDARD":
      return "border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.12)] text-[#B6FFD8]";
    default:
      return "border-[rgba(244,201,93,0.28)] bg-[rgba(244,201,93,0.14)] text-[#FBE7A1]";
  }
}

export default function PlayerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [player, setPlayer] = useState<PlayerProfileModel | null>(null);
  const [similarPlayers, setSimilarPlayers] = useState<PlayerCardModel[]>([]);
  const [projection, setProjection] = useState<Record<string, unknown> | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<PlayerReportResult | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWatchlistState() {
      if (!id) {
        return;
      }

      try {
        const response = await getWatchlist();
        if (!active) {
          return;
        }

        const exists = Array.isArray(response.data)
          ? response.data.some(
              (item) =>
                item &&
                typeof item === "object" &&
                "playerId" in item &&
                String(item.playerId) === id,
            )
          : false;
        setIsInWatchlist(exists);
      } catch {
        if (active) {
          setIsInWatchlist(false);
        }
      }
    }

    loadWatchlistState();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function loadPlayerDetails() {
      if (!id) {
        setError("Jogador nao encontrado");
        setLoading(false);
        return;
      }

      setLoading(true);
      setReportResult(null);
      setReportError(null);

      try {
        const [playerResponse, projectionResponse, similarResponse] = await Promise.all([
          getPlayer(id),
          getPlayerProjection(id).catch(() => null),
          getSimilarPlayers(id).catch(() => null),
        ]);

        if (!active) {
          return;
        }

        setPlayer(playerResponse.data ?? null);
        setProjection((projectionResponse?.data as Record<string, unknown> | undefined) ?? null);
        setSimilarPlayers(Array.isArray(similarResponse?.data) ? similarResponse.data : []);
        setError(null);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        setPlayer(null);
        setSimilarPlayers([]);
        setProjection(null);
        setError(fetchError instanceof Error ? fetchError.message : "Erro ao carregar jogador");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPlayerDetails();

    return () => {
      active = false;
    };
  }, [id]);

  const projectedPotential = useMemo(() => {
    const projectionData = projection || {};
    const projections = Array.isArray(projectionData.projections) ? projectionData.projections : [];
    const nextProjection = projections[0] as Record<string, unknown> | undefined;

    return (
      getNullableNumber(nextProjection?.overall) ??
      getNullableNumber(projectionData.projectedPeak) ??
      getNullableNumber(projectionData.potential) ??
      player?.potential ??
      null
    );
  }, [player?.potential, projection]);

  const overallValue = player?.overall ?? null;
  const displayedPotential = projectedPotential ?? player?.potential ?? null;

  const handleWatchlistToggle = async () => {
    if (!player) {
      return;
    }

    try {
      if (isInWatchlist) {
        await removeFromWatchlist(player.id);
        setIsInWatchlist(false);
        return;
      }

      await addToWatchlist({ playerId: player.id });
      setIsInWatchlist(true);
    } catch (watchlistError) {
      setError(
        watchlistError instanceof Error
          ? watchlistError.message
          : "Erro ao atualizar watchlist",
      );
    }
  };

  const handleGenerateReport = async () => {
    if (!id || reportLoading) {
      return;
    }

    console.log("Player ID sendo enviado:", id);
    console.log("URL chamada:", `${API_CONFIG.BASE_URL}/api/player/${id}/report`);
    console.log("[PlayerDetails] generatePlayerReport playerId", id);
    setReportLoading(true);
    setReportError(null);
    setReportResult(null);

    try {
      const response = await generatePlayerReport(id, { analyst: user?.name });
      console.log("[PlayerDetails] generatePlayerReport response", response);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Nao foi possivel gerar a analise individual.");
      }

      setReportResult(response.data);
    } catch (generationError) {
      console.error("[PlayerDetails] generatePlayerReport error", generationError);
      setReportResult(null);
      setReportError(generationError instanceof Error ? generationError.message : "Nao foi possivel gerar a analise individual.");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 flex items-center justify-center text-sm text-gray-400">Carregando jogador...</main>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl text-gray-400 mb-4">{error || "Jogador nao encontrado"}</p>
              <button
                onClick={() => navigate("/players")}
                className="px-4 py-2 bg-[#00C2FF] text-[#07142A] rounded-lg hover:bg-[#00A8E0] transition-colors"
              >
                Voltar para Ranking
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const getStatColor = (value: number | null) => {
    if (value === null) return "bg-gray-700 text-gray-300";
    if (value >= 80) return "bg-[#00FF9C] text-[#07142A]";
    if (value >= 70) return "bg-[#7A5CFF] text-white";
    if (value >= 60) return "bg-[#00C2FF] text-[#07142A]";
    if (value >= 50) return "bg-yellow-500 text-[#07142A]";
    return "bg-[#FF4D4F] text-white";
  };

  const getStatBarColor = (value: number | null) => {
    if (value === null) return "#334155";
    if (value >= 80) return "#00FF9C";
    if (value >= 70) return "#7A5CFF";
    if (value >= 60) return "#00C2FF";
    if (value >= 50) return "#FFB800";
    return "#FF4D4F";
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      ST: "bg-[#FF4D4F]",
      CF: "bg-[#FF4D4F]",
      LW: "bg-[#7A5CFF]",
      RW: "bg-[#7A5CFF]",
      CAM: "bg-[#00C2FF]",
      CM: "bg-[#00C2FF]",
      CDM: "bg-[#00FF9C]",
      LB: "bg-[#FFB800]",
      RB: "bg-[#FFB800]",
      CB: "bg-[#00FF9C]",
      GK: "bg-[#FF6B00]",
    };
    return colors[position] || "bg-gray-500";
  };

  const radarData = [
    { attribute: "PAC", value: player.pac ?? 0, fullMark: 100 },
    { attribute: "SHO", value: player.sho ?? 0, fullMark: 100 },
    { attribute: "PAS", value: player.pas ?? 0, fullMark: 100 },
    { attribute: "DRI", value: player.dri ?? 0, fullMark: 100 },
    { attribute: "DEF", value: player.def ?? 0, fullMark: 100 },
    { attribute: "PHY", value: player.phy ?? 0, fullMark: 100 },
  ];

  const StatBar = ({ label, value }: { label: string; value: number | null }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className={`px-2 py-0.5 rounded ${getStatColor(value)}`}>{formatStatValue(value)}</span>
      </div>
      <div className="h-2 bg-[#07142A] rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${value ?? 0}%`,
            backgroundColor: getStatBarColor(value),
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          <button
            onClick={() => navigate("/players")}
            className="flex items-center gap-2 text-gray-400 hover:text-[#00C2FF] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Ranking
          </button>

          <div className="bg-gradient-to-r from-[#0A1B35] to-[#1a2942] border border-[rgba(0,194,255,0.3)] rounded-lg p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] rounded-full flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(0,194,255,0.4)]">
                  {player.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl">{player.name}</h1>
                    <span className={`${getPositionColor(player.position || "-")} px-3 py-1 rounded text-sm text-white`}>
                      {player.position || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span>{player.nationality || "-"}</span>
                    <span>•</span>
                    <span>{player.age} anos</span>
                    <span>•</span>
                    <span className="text-white">{player.team || "Sem clube"}</span>
                    <span>•</span>
                    <span>{player.league || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-[#07142A] border border-[rgba(0,194,255,0.3)] rounded-lg px-6 py-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Overall</p>
                  <p className="text-3xl text-[#00C2FF]">{formatStatValue(player.overall)}</p>
                </div>
                <div className="bg-[#07142A] border border-[rgba(0,194,255,0.3)] rounded-lg px-6 py-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Potencial</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl text-[#00FF9C]">{formatStatValue(displayedPotential)}</p>
                    {displayedPotential !== null && overallValue !== null && displayedPotential > overallValue + 5 && (
                      <TrendingUp className="w-5 h-5 text-[#00FF9C]" />
                    )}
                  </div>
                </div>
                <div className="bg-[#07142A] border border-[rgba(0,194,255,0.3)] rounded-lg px-6 py-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Valor</p>
                  <p className="text-3xl text-[#00FF9C]">{formatMarketValue(player.marketValue)}</p>
                </div>
                <button
                  type="button"
                  onClick={handleWatchlistToggle}
                  className={`rounded-lg border px-5 py-4 text-center transition-colors ${
                    isInWatchlist
                      ? "border-[#fbbf24] bg-[#fbbf24]/12 text-[#fbbf24]"
                      : "border-[rgba(255,255,255,0.08)] bg-[#07142A] text-gray-300 hover:border-[#fbbf24]/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" fill={isInWatchlist ? "currentColor" : "none"} />
                    <span className="text-xs font-semibold">
                      {isInWatchlist ? "Na Watchlist" : "Salvar"}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {player.playStyles.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[rgba(0,194,255,0.2)]">
                <p className="text-xs text-gray-400 mb-3">ESTILOS DE JOGO</p>
                <div className="flex gap-2">
                  {player.playStyles.map((style, index) => (
                    <span
                      key={`${style}-${index}`}
                      className="px-4 py-2 bg-[#7A5CFF]/20 border border-[#7A5CFF] text-[#7A5CFF] rounded-lg text-sm"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-lg p-6">
              <h2 className="text-xl mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00C2FF]" />
                Atributos Principais
              </h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(0,194,255,0.2)" />
                    <PolarAngleAxis dataKey="attribute" tick={{ fill: "#00C2FF", fontSize: 14 }} />
                    <Radar
                      name={player.name}
                      dataKey="value"
                      stroke="#00C2FF"
                      fill="#00C2FF"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A1B35",
                        border: "1px solid rgba(0,194,255,0.3)",
                        borderRadius: "8px",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { label: "PAC", value: player.pac },
                  { label: "SHO", value: player.sho },
                  { label: "PAS", value: player.pas },
                  { label: "DRI", value: player.dri },
                  { label: "DEF", value: player.def },
                  { label: "PHY", value: player.phy },
                ].map((item, index) => (
                  <div key={`${item.label}-${index}`} className="text-center">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className={`text-2xl ${item.value !== null && item.value >= 80 ? "text-[#00FF9C]" : "text-yellow-500"}`}>
                      {formatStatValue(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-lg p-6">
                <h3 className="text-sm text-[#FF4D4F] mb-4 uppercase tracking-wider">Attacking</h3>
                <div className="space-y-3">
                  <StatBar label="Crossing" value={player.stats.crossing} />
                  <StatBar label="Finishing" value={player.stats.finishing} />
                  <StatBar label="Heading accuracy" value={player.stats.headingAccuracy} />
                  <StatBar label="Short passing" value={player.stats.shortPassing} />
                  <StatBar label="Volleys" value={player.stats.volleys} />
                </div>
              </div>

              <div className="bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-lg p-6">
                <h3 className="text-sm text-[#00FF9C] mb-4 uppercase tracking-wider">Skill</h3>
                <div className="space-y-3">
                  <StatBar label="Dribbling" value={player.stats.dribbling} />
                  <StatBar label="Curve" value={player.stats.curve} />
                  <StatBar label="FK Accuracy" value={player.stats.fkAccuracy} />
                  <StatBar label="Long passing" value={player.stats.longPassing} />
                  <StatBar label="Ball control" value={player.stats.ballControl} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-lg p-6">
              <h3 className="text-sm text-[#00C2FF] mb-4 uppercase tracking-wider">Movement</h3>
              <div className="space-y-3">
                <StatBar label="Acceleration" value={player.stats.acceleration} />
                <StatBar label="Sprint speed" value={player.stats.sprintSpeed} />
                <StatBar label="Agility" value={player.stats.agility} />
                <StatBar label="Reactions" value={player.stats.reactions} />
                <StatBar label="Balance" value={player.stats.balance} />
              </div>
            </div>

            <div className="bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-lg p-6">
              <h3 className="text-sm text-[#FFB800] mb-4 uppercase tracking-wider">Power</h3>
              <div className="space-y-3">
                <StatBar label="Shot power" value={player.stats.shotPower} />
                <StatBar label="Jumping" value={player.stats.jumping} />
                <StatBar label="Stamina" value={player.stats.stamina} />
                <StatBar label="Strength" value={player.stats.strength} />
                <StatBar label="Long shots" value={player.stats.longShots} />
              </div>
            </div>

            <div className="bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-lg p-6">
              <h3 className="text-sm text-[#7A5CFF] mb-4 uppercase tracking-wider">Mentality</h3>
              <div className="space-y-3">
                <StatBar label="Aggression" value={player.stats.aggression} />
                <StatBar label="Interceptions" value={player.stats.interceptions} />
                <StatBar label="Attack position" value={player.stats.attackPosition} />
                <StatBar label="Vision" value={player.stats.vision} />
                <StatBar label="Penalties" value={player.stats.penalties} />
                <StatBar label="Composure" value={player.stats.composure} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-lg p-6">
              <h3 className="text-sm text-[#00FF9C] mb-4 uppercase tracking-wider">Defending</h3>
              <div className="space-y-3">
                <StatBar label="Defensive awareness" value={player.stats.defensiveAwareness} />
                <StatBar label="Standing tackle" value={player.stats.standingTackle} />
                <StatBar label="Sliding tackle" value={player.stats.slidingTackle} />
              </div>
            </div>

            <div className="bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-lg p-6">
              <h3 className="text-sm text-[#FF6B00] mb-4 uppercase tracking-wider">Goalkeeping</h3>
              <div className="space-y-3">
                <StatBar label="GK Diving" value={player.stats.gkDiving} />
                <StatBar label="GK Handling" value={player.stats.gkHandling} />
                <StatBar label="GK Kicking" value={player.stats.gkKicking} />
                <StatBar label="GK Positioning" value={player.stats.gkPositioning} />
                <StatBar label="GK Reflexes" value={player.stats.gkReflexes} />
              </div>
            </div>
          </div>

          {similarPlayers.length > 0 && (
            <div className="mt-6 bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-lg p-6">
              <h3 className="text-sm text-[#00C2FF] mb-4 uppercase tracking-wider">Jogadores Similares</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {similarPlayers.map((similarPlayer, index) => (
                  <button
                    key={`${similarPlayer.id ?? similarPlayer.name ?? "item"}-${index}`}
                    type="button"
                    onClick={() => navigate(`/players/${similarPlayer.id}`)}
                    className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4 text-left hover:border-[rgba(0,194,255,0.3)]"
                  >
                    <p className="font-semibold text-white">{similarPlayer.name}</p>
                    <p className="mt-1 text-sm text-gray-400">
                      {(similarPlayer.position || "-")} • {(similarPlayer.team || "Sem clube")}
                    </p>
                    <p className="mt-2 text-xs text-[#00FF9C]">{formatMarketValue(similarPlayer.marketValue)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <Link
              to={`/compare?player1=${player.id}`}
              className="flex-1 bg-[#00C2FF] hover:bg-[#00A8E0] text-[#07142A] py-3 rounded-lg text-center transition-colors"
            >
              Comparar com outro jogador
            </Link>
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#a855f7,#00C2FF)] py-3 text-white shadow-[0_10px_30px_rgba(0,194,255,0.18)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {reportLoading ? "Gerando analise..." : "Gerar Relatorio Individual"}
            </button>
            <button className="flex-1 bg-[#0A1B35] hover:bg-[#1a2942] border border-[rgba(0,194,255,0.3)] py-3 rounded-lg transition-colors">
              Adicionar ao Relatorio
            </button>
          </div>

          {reportError && (
            <div className="mt-6 rounded-[18px] border border-[rgba(255,77,79,0.28)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
              {reportError}
            </div>
          )}

          {reportResult && (
            <section className="mt-6 overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(10,27,53,0.98),rgba(7,20,42,0.94))] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
              <div className="border-b border-[rgba(255,255,255,0.06)] px-7 py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Relatorio Individual</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">{reportResult.player.name}</h2>
                    <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-400">
                      ScoutReport persistido automaticamente na central decisoria. Use os cards abaixo para leitura rapida e exporte o PDF premium quando quiser compartilhar a versao executiva.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${getTierStyles(reportResult.metrics.tier)}`}>
                      {reportResult.metrics.tier}
                    </span>
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs text-gray-300">
                      {new Date(reportResult.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-7 py-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: "Overall", value: `${reportResult.metrics.overall}`, accent: "#00C2FF" },
                    { label: "Risco", value: `${reportResult.metrics.riskScore.toFixed(1)} · ${reportResult.metrics.riskLevel}`, accent: "#FF4D4F" },
                    { label: "Liquidez", value: reportResult.metrics.liquidityScore.toFixed(1), accent: "#00FF9C" },
                    { label: "Capital Efficiency", value: reportResult.metrics.capitalEfficiency.toFixed(1), accent: "#A855F7" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{item.label}</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                      <div className="mt-4 h-1 rounded-full" style={{ background: `${item.accent}33` }} />
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                  <div className="rounded-[20px] border border-[rgba(0,194,255,0.2)] bg-[rgba(255,255,255,0.03)] p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="h-10 w-1 rounded-full bg-[#00C2FF]" />
                      <div>
                        <h3 className="text-xl font-semibold text-white">Narrativa da IA</h3>
                        <p className="text-sm text-gray-500">Perfil tecnico, risco, timing de oportunidade e leitura executiva.</p>
                      </div>
                    </div>
                    <div className="space-y-4 text-[15px] leading-[1.9] text-gray-300">
                      {(reportResult.aiNarrative ?? "Narrativa indisponivel. As metricas foram preservadas e o relatorio segue salvo na central de analises.")
                        .split(/\n{2,}/)
                        .filter(Boolean)
                        .map((paragraph, index) => (
                          <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[20px] border border-[rgba(168,85,247,0.24)] bg-[rgba(168,85,247,0.10)] p-6">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[#D8B4FE]">Recomendacao Executiva</p>
                      <p className="mt-4 text-[15px] leading-[1.9] text-white">{reportResult.recommendation}</p>
                    </div>

                    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">Leituras-chave</p>
                      <div className="mt-4 space-y-3 text-sm text-gray-300">
                        <div>Arquetipo: <span className="text-white">{reportResult.metrics.archetype}</span></div>
                        <div>Potencial: <span className="text-white">{reportResult.metrics.potential}</span></div>
                        <div>Mercado: <span className="text-white">{formatMarketValue(reportResult.metrics.marketValue)}</span></div>
                        <div>Pico projetado: <span className="text-white">{reportResult.metrics.growthProjection.expectedPeak}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate(reportResult.scoutReportId ? `/reports/${reportResult.scoutReportId}` : "/reports")}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[rgba(0,255,156,0.26)] bg-[rgba(0,255,156,0.10)] px-5 py-3 font-semibold text-[#B6FFD8] transition-colors hover:bg-[rgba(0,255,156,0.16)]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Abrir ScoutReport salvo
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPlayerReportPdf(reportResult, { analyst: user?.name })}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#00C2FF] px-5 py-3 font-semibold text-[#07142A] shadow-[0_10px_30px_rgba(0,194,255,0.22)] transition-colors hover:bg-[#32CEFF]"
                  >
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

