import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Download, FileText, Loader2, Star, TrendingUp } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { DNABars } from "../components/player-intelligence/DNABars";
import { ExecutiveSnapshotCard } from "../components/player-intelligence/ExecutiveSnapshotCard";
import { SectionCard } from "../components/player-intelligence/SectionCard";
import { useAuth } from "../contexts/AuthContext";
import type { PlayerCardModel, PlayerProfileModel } from "../mappers/player.mapper";
import { getPlayerIntelligenceProfile } from "../services/playerIntelligence";
import {
  generatePlayerReport,
  getPlayer,
  getPlayerProjection,
  getSimilarPlayers,
  type PlayerReportResult,
} from "../services/players";
import type {
  FieldIntelligence,
  PlayerIntelligenceProfile,
  SpatialEventPoint,
  SpatialZone,
} from "../types/player-intelligence";
import { downloadPlayerReportPdf } from "../utils/playerReportPdf";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../services/watchlist";

function formatMarketValue(value: number | null) {
  if (value === null) return "N/A";
  if (value >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `EUR ${(value / 1_000).toFixed(0)}K`;
  return `EUR ${value.toFixed(0)}`;
}

function getNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatMarketTick(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

function getPositionColor(position: string) {
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
}

function getTone(value: number, inverse = false) {
  const effectiveValue = inverse ? 100 - value : value;
  if (effectiveValue >= 70) return "text-[#B6FFD8]";
  if (effectiveValue >= 50) return "text-[#9BE7FF]";
  return "text-[#FFD6A5]";
}

function PitchBase({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[rgba(0,255,156,0.10)] bg-[radial-gradient(circle_at_center,rgba(0,255,156,0.08),transparent_55%),linear-gradient(180deg,#0B2A23,#07142A)]">
      <svg viewBox="0 0 100 100" className="aspect-[4/5] w-full">
        <rect x="1" y="1" width="98" height="98" rx="2" fill="transparent" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
        <line x1="50" y1="1" x2="50" y2="99" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="10" fill="transparent" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <rect x="1" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="83" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="1" y="36" width="5" height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="94" y="36" width="5" height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {children}
      </svg>
    </div>
  );
}

function HeatmapPitch({ zones }: { zones: SpatialZone[] }) {
  return (
    <PitchBase>
      {zones.map((zone, index) => (
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

function PassMapPitch({ passes }: { passes: SpatialEventPoint[] }) {
  return (
    <PitchBase>
      {passes.map((pass, index) => (
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
          <circle
            cx={pass.endX ?? pass.x}
            cy={pass.endY ?? pass.y}
            r="1"
            fill={pass.outcome === "success" ? "rgba(0,255,156,0.72)" : "rgba(255,77,79,0.65)"}
          />
        </g>
      ))}
    </PitchBase>
  );
}

function ShotMapPitch({ shots }: { shots: SpatialEventPoint[] }) {
  return (
    <PitchBase>
      {shots.map((shot, index) => (
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

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className={`text-lg font-semibold ${getTone(value)}`}>{value}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#00C2FF,#00FF9C)]" style={{ width: `${Math.max(8, value)}%` }} />
      </div>
    </div>
  );
}

function InsightCard({
  label,
  value,
  tone = "cyan",
}: {
  label: string;
  value: string;
  tone?: "cyan" | "green" | "amber" | "purple";
}) {
  const toneMap = {
    cyan: "border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.08)] text-[#9BE7FF]",
    green: "border-[rgba(0,255,156,0.20)] bg-[rgba(0,255,156,0.08)] text-[#B6FFD8]",
    amber: "border-[rgba(251,191,36,0.22)] bg-[rgba(251,191,36,0.08)] text-[#FDE68A]",
    purple: "border-[rgba(168,85,247,0.22)] bg-[rgba(168,85,247,0.08)] text-[#E9D5FF]",
  }[tone];

  return (
    <div className={`rounded-[18px] border p-4 ${toneMap}`}>
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-300">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function FieldFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export default function PlayerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [player, setPlayer] = useState<PlayerProfileModel | null>(null);
  const [similarPlayers, setSimilarPlayers] = useState<PlayerCardModel[]>([]);
  const [projection, setProjection] = useState<Record<string, unknown> | null>(null);
  const [intelligenceProfile, setIntelligenceProfile] = useState<PlayerIntelligenceProfile | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<PlayerReportResult | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWatchlistState() {
      if (!id) return;

      try {
        const response = await getWatchlist();
        if (!active) return;

        const exists = Array.isArray(response.data)
          ? response.data.some((item) => item && typeof item === "object" && "playerId" in item && String(item.playerId) === id)
          : false;

        setIsInWatchlist(exists);
      } catch {
        if (active) setIsInWatchlist(false);
      }
    }

    void loadWatchlistState();

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

        if (!active) return;

        const nextPlayer = playerResponse.data ?? null;
        const nextProjection = (projectionResponse?.data as Record<string, unknown> | undefined) ?? null;
        const nextSimilarPlayers = Array.isArray(similarResponse?.data) ? similarResponse.data : [];

        setPlayer(nextPlayer);
        setProjection(nextProjection);
        setSimilarPlayers(nextSimilarPlayers);

        if (nextPlayer) {
          try {
            const nextIntelligenceProfile =
              nextPlayer.intelligenceProfile && typeof nextPlayer.intelligenceProfile === "object"
                ? (nextPlayer.intelligenceProfile as PlayerIntelligenceProfile)
                : await getPlayerIntelligenceProfile({
                    player: nextPlayer,
                    similarPlayers: nextSimilarPlayers,
                    projection: nextProjection,
                  });

            if (!active) return;
            setIntelligenceProfile(nextIntelligenceProfile);
          } catch {
            if (active) setIntelligenceProfile(null);
          }
        } else {
          setIntelligenceProfile(null);
        }

        setError(null);
      } catch (fetchError) {
        if (!active) return;

        setPlayer(null);
        setSimilarPlayers([]);
        setProjection(null);
        setIntelligenceProfile(null);
        setError(fetchError instanceof Error ? fetchError.message : "Erro ao carregar jogador");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPlayerDetails();

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

  const technicalMetrics = useMemo(() => {
    if (!player) return [];

    return [
      { label: "Pace", value: intelligenceProfile?.technical?.coreAttributes.pace ?? player.pac ?? 0 },
      { label: "Passing", value: intelligenceProfile?.technical?.coreAttributes.passing ?? player.pas ?? 0 },
      { label: "Dribbling", value: intelligenceProfile?.technical?.coreAttributes.dribbling ?? player.dri ?? 0 },
      { label: "Shooting", value: intelligenceProfile?.technical?.coreAttributes.shooting ?? player.sho ?? 0 },
      { label: "Defending", value: intelligenceProfile?.technical?.coreAttributes.defending ?? player.def ?? 0 },
    ];
  }, [intelligenceProfile, player]);

  const physicalMetrics = useMemo(() => {
    if (!player) return [];

    return [
      { label: "Acceleration", value: intelligenceProfile?.physical?.acceleration ?? player.stats.acceleration ?? 0 },
      { label: "Sprint Speed", value: intelligenceProfile?.physical?.sprintSpeed ?? player.stats.sprintSpeed ?? 0 },
      { label: "Stamina", value: intelligenceProfile?.physical?.stamina ?? player.stats.stamina ?? 0 },
      { label: "Strength", value: intelligenceProfile?.physical?.strength ?? player.stats.strength ?? 0 },
      { label: "Agility", value: intelligenceProfile?.physical?.agility ?? player.stats.agility ?? 0 },
    ];
  }, [intelligenceProfile, player]);

  const handleWatchlistToggle = async () => {
    if (!player) return;

    try {
      if (isInWatchlist) {
        await removeFromWatchlist(player.id);
        setIsInWatchlist(false);
        return;
      }

      await addToWatchlist({ playerId: player.id });
      setIsInWatchlist(true);
    } catch (watchlistError) {
      setError(watchlistError instanceof Error ? watchlistError.message : "Erro ao atualizar watchlist");
    }
  };

  const handleGenerateReport = async () => {
    if (!id || reportLoading) return;

    setReportLoading(true);
    setReportError(null);
    setReportResult(null);

    try {
      const response = await generatePlayerReport(id, { analyst: user?.name });

      if (!response.success || !response.data) {
        throw new Error(response.error || "Nao foi possivel gerar a analise individual.");
      }

      setReportResult(response.data);
    } catch (generationError) {
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
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex flex-1 items-center justify-center text-sm text-gray-400">Carregando jogador...</main>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-xl text-gray-400">{error || "Jogador nao encontrado"}</p>
              <button
                onClick={() => navigate("/players")}
                className="rounded-lg bg-[#00C2FF] px-4 py-2 text-[#07142A] transition-colors hover:bg-[#00A8E0]"
              >
                Voltar para Ranking
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const profile = intelligenceProfile;
  const fieldIntelligence: FieldIntelligence | null = profile?.fieldIntelligence ?? null;
  const seasonTrends = profile?.contextSimilarity.seasonTrends ?? [];

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-[1520px] space-y-6">
            <button
              onClick={() => navigate("/players")}
              className="flex items-center gap-2 text-gray-400 transition-colors hover:text-[#00C2FF]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Ranking
            </button>

            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.16),transparent_68%)] blur-2xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.12),transparent_72%)] blur-2xl" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] text-3xl shadow-[0_0_30px_rgba(0,194,255,0.4)]">
                    {player.name
                      .split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <h1 className="text-4xl font-semibold text-white">{player.name}</h1>
                      <span className={`${getPositionColor(player.position || "-")} rounded px-3 py-1 text-sm text-white`}>
                        {player.position || "-"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <span>{player.nationality || "-"}</span>
                      <span>•</span>
                      <span>{player.age} anos</span>
                      <span>•</span>
                      <span className="text-white">{player.team || "Sem clube"}</span>
                      <span>•</span>
                      <span>{player.league || "-"}</span>
                    </div>
                    {profile?.summary?.archetype ? (
                      <div className="mt-4 inline-flex rounded-full border border-[rgba(168,85,247,0.22)] bg-[rgba(168,85,247,0.10)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E9D5FF]">
                        {profile.summary.archetype}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <InsightCard label="Overall" value={`${player.overall ?? "-"}`} />
                  <InsightCard
                    label="Potential"
                    value={displayedPotential !== null ? String(displayedPotential) : "-"}
                    tone="green"
                  />
                  <InsightCard label="Market Value" value={formatMarketValue(player.marketValue)} tone="amber" />
                  <button
                    type="button"
                    onClick={handleWatchlistToggle}
                    className={`rounded-[18px] border px-5 py-4 text-left transition-colors ${
                      isInWatchlist
                        ? "border-[#fbbf24] bg-[#fbbf24]/12 text-[#fbbf24]"
                        : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-300 hover:border-[#fbbf24]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" fill={isInWatchlist ? "currentColor" : "none"} />
                      <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                        {isInWatchlist ? "Na Watchlist" : "Salvar"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {profile ? (
              <>
                <ExecutiveSnapshotCard
                  snapshot={profile.executiveSnapshot}
                  dataSourceLabel={`Source ${profile.dataStatus.source}`}
                  subtitle="Recommendation, confidence, risk, value and upside stay above the fold."
                />

                <DNABars dna={profile.soccerMindDna} />

                <SectionCard
                  eyebrow="Attributes"
                  title="Technical and physical baseline"
                  description="Five signals per pillar. Enough to decide whether the player clears the role threshold."
                  accent="cyan"
                >
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Technical</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">Ball quality and execution</h3>
                      </div>
                      <div className="space-y-3">
                        {technicalMetrics.map((metric) => (
                          <MetricBar key={metric.label} label={metric.label} value={metric.value} />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#B6FFD8]">Physical</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">Speed, motor and duel readiness</h3>
                      </div>
                      <div className="space-y-3">
                        {physicalMetrics.map((metric) => (
                          <MetricBar key={metric.label} label={metric.label} value={metric.value} />
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  eyebrow="Market & Risk"
                  title="Deal framing"
                  description="Price, liquidity and risk stack presented as one transaction call."
                  accent="amber"
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <InsightCard label="Market Value" value={formatMarketValue(profile.marketRisk.marketValue)} tone="amber" />
                    <InsightCard label="Liquidity" value={profile.marketRisk.liquidity.label} tone="green" />
                    <InsightCard label="Physical Risk" value={profile.marketRisk.physicalRisk.label} tone="amber" />
                    <InsightCard label="Financial Risk" value={profile.marketRisk.financialRisk.label} tone="amber" />
                    <InsightCard label="Resale" value={profile.marketRisk.resalePotential.label} tone="purple" />
                  </div>
                </SectionCard>

                {fieldIntelligence ? (
                  <SectionCard
                    eyebrow="Field Intelligence"
                    title="Where the player changes the pitch"
                    description="Spatial evidence kept compact: heat, passes and shots only."
                    accent="green"
                  >
                    <div className="grid gap-4 xl:grid-cols-3">
                      <FieldFrame title="Heatmap" subtitle="occupation">
                        <HeatmapPitch zones={fieldIntelligence.heatmap} />
                      </FieldFrame>
                      <FieldFrame title="Passes" subtitle="progression">
                        <PassMapPitch passes={fieldIntelligence.passes} />
                      </FieldFrame>
                      <FieldFrame title="Shots" subtitle="threat">
                        <ShotMapPitch shots={fieldIntelligence.shots} />
                      </FieldFrame>
                    </div>
                  </SectionCard>
                ) : null}

                <SectionCard
                  eyebrow="Projection"
                  title="Expected trajectory"
                  description="Future value in five quick decision tiles."
                  accent="purple"
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <InsightCard label="Current Level" value={`${profile.projection.currentLevel}`} />
                    <InsightCard label="Expected Peak" value={`${profile.projection.expectedPeak}`} tone="green" />
                    <InsightCard
                      label="Next Season"
                      value={`${profile.projection.expectedOverallNextSeason}`}
                      tone="cyan"
                    />
                    <InsightCard label="Growth Outlook" value={profile.projection.growthOutlook} tone="purple" />
                    <InsightCard label="Resale Potential" value={profile.projection.resalePotential.label} tone="amber" />
                  </div>
                </SectionCard>

                <SectionCard
                  eyebrow="Context"
                  title="Trend and fit context"
                  description="Season trend plus a short shortlist of systems, clubs and comparables."
                  accent="purple"
                >
                  <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Ideal Systems</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {profile.contextSimilarity.idealSystems.slice(0, 2).map((system) => (
                              <span
                                key={system}
                                className="rounded-full border border-[rgba(0,255,156,0.18)] bg-[rgba(0,255,156,0.08)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B6FFD8]"
                              >
                                {system}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Ideal Clubs</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {profile.contextSimilarity.idealClubs.slice(0, 2).map((club) => (
                              <span
                                key={club}
                                className="rounded-full border border-[rgba(168,85,247,0.22)] bg-[rgba(168,85,247,0.08)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E9D5FF]"
                              >
                                {club}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Closest Context Matches</p>
                        <div className="mt-4 space-y-3">
                          {profile.contextSimilarity.similarPlayers.slice(0, 3).map((similar) => (
                            <div
                              key={similar.id}
                              className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,20,42,0.7)] px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-white">{similar.name}</p>
                                  <p className="text-sm text-gray-400">
                                    {similar.position} • {similar.team}
                                  </p>
                                </div>
                                <span className="rounded-full border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.08)] px-3 py-1 text-xs font-semibold text-[#9BE7FF]">
                                  Fit {similar.fitScore}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Season Trend</p>
                      <p className="mt-2 text-sm text-gray-400">Performance level against projected market movement.</p>
                      <div className="mt-4 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={seasonTrends}>
                            <defs>
                              <linearGradient id="playerTrendPerformance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#00C2FF" stopOpacity={0.04} />
                              </linearGradient>
                              <linearGradient id="playerTrendMarket" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.04} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                            <XAxis dataKey="season" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="performance" domain={[40, 100]} tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis
                              yAxisId="market"
                              orientation="right"
                              tickFormatter={formatMarketTick}
                              tick={{ fill: "#94A3B8", fontSize: 12 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0A1B35",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "16px",
                                color: "#ffffff",
                              }}
                              formatter={(value: number, name: string) =>
                                name === "market" ? [`EUR ${formatMarketTick(value)}`, "Market"] : [value, "Performance"]
                              }
                            />
                            <Area yAxisId="performance" type="monotone" dataKey="performance" stroke="#00C2FF" fill="url(#playerTrendPerformance)" strokeWidth={2} />
                            <Area yAxisId="market" type="monotone" dataKey="market" stroke="#A855F7" fill="url(#playerTrendMarket)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </>
            ) : (
              <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-gray-400">
                Intelligence profile indisponivel para este jogador no ambiente atual.
              </div>
            )}

            {similarPlayers.length > 0 ? (
              <SectionCard
                eyebrow="Related Players"
                title="Quick follow-up options"
                description="Fast pivots if this player becomes unavailable or overpriced."
                accent="green"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {similarPlayers.slice(0, 3).map((similarPlayer, index) => (
                    <button
                      key={`${similarPlayer.id ?? similarPlayer.name ?? "item"}-${index}`}
                      type="button"
                      onClick={() => navigate(`/players/${similarPlayer.id}`)}
                      className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4 text-left transition-colors hover:border-[rgba(0,194,255,0.3)]"
                    >
                      <p className="font-semibold text-white">{similarPlayer.name}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {(similarPlayer.position || "-")} • {(similarPlayer.team || "Sem clube")}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#B6FFD8]">
                        {formatMarketValue(similarPlayer.marketValue)}
                      </p>
                    </button>
                  ))}
                </div>
              </SectionCard>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-3">
              <Link
                to={`/compare?player1=${player.id}`}
                className="rounded-[18px] bg-[#00C2FF] py-3 text-center font-semibold text-[#07142A] transition-colors hover:bg-[#00A8E0]"
              >
                Comparar com outro jogador
              </Link>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#a855f7,#00C2FF)] py-3 font-semibold text-white shadow-[0_10px_30px_rgba(0,194,255,0.18)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {reportLoading ? "Gerando analise..." : "Gerar Relatorio Individual"}
              </button>
              <button className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] py-3 transition-colors hover:bg-[rgba(255,255,255,0.05)]">
                Adicionar ao Relatorio
              </button>
            </div>

            {reportError ? (
              <div className="rounded-[18px] border border-[rgba(255,77,79,0.28)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {reportError}
              </div>
            ) : null}

            {reportResult ? (
              <section className="overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(10,27,53,0.98),rgba(7,20,42,0.94))] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                <div className="border-b border-[rgba(255,255,255,0.06)] px-7 py-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Relatorio Individual</p>
                      <h2 className="mt-3 text-3xl font-semibold text-white">{reportResult.player.name}</h2>
                      <p className="mt-3 max-w-4xl text-sm text-gray-400">
                        Analise persistida na central Analysis. Exportacao premium continua disponivel abaixo.
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs text-gray-300">
                      {new Date(reportResult.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="px-7 py-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <InsightCard label="Overall" value={`${reportResult.metrics.overall}`} />
                    <InsightCard
                      label="Risco"
                      value={`${reportResult.metrics.riskScore.toFixed(1)} • ${reportResult.metrics.riskLevel}`}
                      tone="amber"
                    />
                    <InsightCard label="Liquidez" value={reportResult.metrics.liquidityScore.toFixed(1)} tone="green" />
                    <InsightCard
                      label="Capital Efficiency"
                      value={reportResult.metrics.capitalEfficiency.toFixed(1)}
                      tone="purple"
                    />
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[20px] border border-[rgba(0,194,255,0.2)] bg-[rgba(255,255,255,0.03)] p-6">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Narrativa da IA</p>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-gray-300">
                        {(reportResult.aiNarrative ?? "Narrativa indisponivel.")
                          .split(/\n{2,}/)
                          .filter(Boolean)
                          .map((paragraph, index) => (
                            <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[20px] border border-[rgba(168,85,247,0.24)] bg-[rgba(168,85,247,0.10)] p-6">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#D8B4FE]">Recomendacao Executiva</p>
                        <p className="mt-4 text-[15px] leading-7 text-white">{reportResult.recommendation}</p>
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
                      onClick={() => navigate(reportResult.analysisId ? `/analysis/${reportResult.analysisId}` : "/history")}
                      className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[rgba(0,255,156,0.26)] bg-[rgba(0,255,156,0.10)] px-5 py-3 font-semibold text-[#B6FFD8] transition-colors hover:bg-[rgba(0,255,156,0.16)]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Abrir Analysis salva
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
            ) : null}

            {displayedPotential !== null && overallValue !== null && displayedPotential > overallValue + 5 ? (
              <div className="flex items-center gap-2 rounded-[18px] border border-[rgba(0,255,156,0.18)] bg-[rgba(0,255,156,0.08)] px-4 py-3 text-sm text-[#B6FFD8]">
                <TrendingUp className="h-4 w-4" />
                Potencial projetado acima do nivel atual por mais de 5 pontos.
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
