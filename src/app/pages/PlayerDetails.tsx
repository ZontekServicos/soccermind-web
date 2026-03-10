import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, TrendingUp, Shield } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { mapApiPlayerToCard, mapApiPlayerToProfile, type PlayerCardModel, type PlayerProfileModel } from "../mappers/player.mapper";
import { getPlayer, getPlayerProjection, getSimilarPlayers } from "../services/players";

export default function PlayerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerProfileModel | null>(null);
  const [similarPlayers, setSimilarPlayers] = useState<PlayerCardModel[]>([]);
  const [projection, setProjection] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPlayerDetails() {
      if (!id) {
        setError("Jogador não encontrado");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [playerResponse, projectionResponse, similarResponse] = await Promise.all([
          getPlayer(id),
          getPlayerProjection(id).catch(() => null),
          getSimilarPlayers(id).catch(() => null),
        ]);

        if (!active) {
          return;
        }

        setPlayer(mapApiPlayerToProfile(playerResponse.data as Record<string, unknown>));
        setProjection((projectionResponse?.data as Record<string, unknown> | undefined) ?? null);
        setSimilarPlayers(
          Array.isArray(similarResponse?.data)
            ? similarResponse!.data.map((item, index) => {
                const mapped = mapApiPlayerToCard(item as Record<string, unknown>);
                return {
                  ...mapped,
                  id: mapped.id || `${mapped.name}-${index}`,
                };
              })
            : [],
        );
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
    return Number(nextProjection?.overall ?? projectionData.potential ?? player?.potential ?? 0);
  }, [player?.potential, projection]);

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
              <p className="text-xl text-gray-400 mb-4">{error || "Jogador não encontrado"}</p>
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

  const getStatColor = (value: number) => {
    if (value >= 80) return "bg-[#00FF9C] text-[#07142A]";
    if (value >= 70) return "bg-[#7A5CFF] text-white";
    if (value >= 60) return "bg-[#00C2FF] text-[#07142A]";
    if (value >= 50) return "bg-yellow-500 text-[#07142A]";
    return "bg-[#FF4D4F] text-white";
  };

  const getStatBarColor = (value: number) => {
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
    { attribute: "PAC", value: player.pac, fullMark: 100 },
    { attribute: "SHO", value: player.sho, fullMark: 100 },
    { attribute: "PAS", value: player.pas, fullMark: 100 },
    { attribute: "DRI", value: player.dri, fullMark: 100 },
    { attribute: "DEF", value: player.def, fullMark: 100 },
    { attribute: "PHY", value: player.phy, fullMark: 100 },
  ];

  const StatBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className={`px-2 py-0.5 rounded ${getStatColor(value)}`}>{value}</span>
      </div>
      <div className="h-2 bg-[#07142A] rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${value}%`,
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
                    <span className={`${getPositionColor(player.position)} px-3 py-1 rounded text-sm text-white`}>
                      {player.position}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span>{player.nationality}</span>
                    <span>•</span>
                    <span>{player.age} anos</span>
                    <span>•</span>
                    <span className="text-white">{player.team}</span>
                    <span>•</span>
                    <span>{player.league}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-[#07142A] border border-[rgba(0,194,255,0.3)] rounded-lg px-6 py-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Overall</p>
                  <p className="text-3xl text-[#00C2FF]">{player.overall}</p>
                </div>
                <div className="bg-[#07142A] border border-[rgba(0,194,255,0.3)] rounded-lg px-6 py-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Potencial</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl text-[#00FF9C]">{projectedPotential || player.potential}</p>
                    {(projectedPotential || player.potential) > player.overall + 5 && (
                      <TrendingUp className="w-5 h-5 text-[#00FF9C]" />
                    )}
                  </div>
                </div>
                <div className="bg-[#07142A] border border-[rgba(0,194,255,0.3)] rounded-lg px-6 py-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Valor</p>
                  <p className="text-3xl text-[#00FF9C]">{player.marketValue}</p>
                </div>
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
                {[{ label: "PAC", value: player.pac }, { label: "SHO", value: player.sho }, { label: "PAS", value: player.pas }, { label: "DRI", value: player.dri }, { label: "DEF", value: player.def }, { label: "PHY", value: player.phy }].map((item, index) => (
                  <div key={`${item.label}-${index}`} className="text-center">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className={`text-2xl ${item.value >= 80 ? "text-[#00FF9C]" : "text-yellow-500"}`}>{item.value}</p>
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
                    <p className="mt-1 text-sm text-gray-400">{similarPlayer.position} • {similarPlayer.team}</p>
                    <p className="mt-2 text-xs text-[#00FF9C]">{similarPlayer.marketValue}</p>
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
            <button className="flex-1 bg-[#0A1B35] hover:bg-[#1a2942] border border-[rgba(0,194,255,0.3)] py-3 rounded-lg transition-colors">
              Adicionar ao Relatório
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
