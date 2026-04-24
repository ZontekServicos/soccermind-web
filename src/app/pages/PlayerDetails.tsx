import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookmarkPlus, Star } from "lucide-react";
import { positionLabel } from "../utils/positions";
import { Link, useNavigate, useParams } from "react-router";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { DNABars } from "../components/player-intelligence/DNABars";
import { FieldMapsModule } from "../components/player-intelligence/FieldMapsModule";
import { PlayerVideosSection } from "../components/player-intelligence/PlayerVideosSection";
import { ExecutiveSnapshotCard } from "../components/player-intelligence/ExecutiveSnapshotCard";
import { SectionCard } from "../components/player-intelligence/SectionCard";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { getPlayerIntelligenceProfile } from "../services/playerIntelligence";
import { getPlayer, getPlayerProjection, getSimilarPlayers } from "../services/players";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../services/watchlist";
import { createAnalysisEntry } from "../services/analysis";
import type {
  PlayerIntelligenceProfile,
} from "../types/player-intelligence";
import { normalizePlayerIntelligenceProfile } from "../types/player-intelligence";
import type { PlayerCardModel, PlayerProfileModel } from "../mappers/player.mapper";
import { t as translate } from "../../i18n";

function formatMarketValue(value: number | null) {
  if (value === null) return "N/A";
  if (value >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `EUR ${(value / 1_000).toFixed(0)}K`;
  return `EUR ${value.toFixed(0)}`;
}

function getTone(value: number, inverse = false) {
  const effectiveValue = inverse ? 100 - value : value;
  if (effectiveValue >= 70) return "text-[#B6FFD8]";
  if (effectiveValue >= 50) return "text-[#9BE7FF]";
  return "text-[#FFD6A5]";
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

function MetricBar({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const width = Math.max(8, Math.min(100, inverse ? 100 - value : value));
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className={`text-lg font-semibold ${getTone(value, inverse)}`}>{value}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div
          className={`h-full rounded-full ${inverse ? "bg-[linear-gradient(90deg,#FF7B7D,#FBBF24)]" : "bg-[linear-gradient(90deg,#00C2FF,#00FF9C)]"}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player avatar — shows real photo or initials fallback
// ---------------------------------------------------------------------------
const SPORTMONKS_PLACEHOLDER = "placeholder.png";

function PlayerAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hasRealImage = !!imageUrl && !imageUrl.includes(SPORTMONKS_PLACEHOLDER);

  if (hasRealImage) {
    return (
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full shadow-[0_0_30px_rgba(0,194,255,0.4)] ring-2 ring-[rgba(0,194,255,0.4)]">
        <img
          src={imageUrl!}
          alt={name}
          className="h-full w-full object-cover object-top"
          onError={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              e.currentTarget.remove();
              parent.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] text-3xl font-bold text-white">${initials}</div>`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] text-3xl font-bold text-white shadow-[0_0_30px_rgba(0,194,255,0.4)]">
      {initials}
    </div>
  );
}

export default function PlayerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [player, setPlayer] = useState<PlayerProfileModel | null>(null);
  const [similarPlayers, setSimilarPlayers] = useState<PlayerCardModel[]>([]);
  const [profile, setProfile] = useState<PlayerIntelligenceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPlayerDetails() {
      if (!id) {
        setError(translate("player.notFound"));
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [playerResponse, projectionResponse, similarResponse, watchlistResponse] = await Promise.all([
          getPlayer(id),
          getPlayerProjection(id).catch(() => null),
          getSimilarPlayers(id).catch(() => null),
          getWatchlist().catch(() => null),
        ]);

        if (!active) return;

        const nextPlayer = playerResponse.data ?? null;
        const nextProjection = (projectionResponse?.data as Record<string, unknown> | undefined) ?? null;
        const nextSimilarPlayers = Array.isArray(similarResponse?.data) ? similarResponse.data : [];

        setPlayer(nextPlayer);
        setSimilarPlayers(nextSimilarPlayers);
        setIsInWatchlist(
          Array.isArray(watchlistResponse?.data)
            ? watchlistResponse.data.some((item) => item && typeof item === "object" && "playerId" in item && String(item.playerId) === id)
            : false,
        );

        const rawProfile =
          nextPlayer?.intelligenceProfile && typeof nextPlayer.intelligenceProfile === "object"
            ? nextPlayer.intelligenceProfile
            : nextPlayer
              ? await getPlayerIntelligenceProfile({
                  player: nextPlayer,
                  similarPlayers: nextSimilarPlayers,
                  projection: nextProjection,
                })
              : null;

        setProfile(normalizePlayerIntelligenceProfile(rawProfile));
        setError(nextPlayer ? null : translate("player.notFound"));
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : translate("player.loadError"));
        setPlayer(null);
        setProfile(null);
        setSimilarPlayers([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPlayerDetails();

    return () => {
      active = false;
    };
  }, [id]);

  const dnaTraits = useMemo(() => (profile ? [...profile.dna.traits].slice(0, 5) : []), [profile]);
  const technicalMetrics = useMemo(
    () =>
      profile
        ? [
            { label: t("metrics.ballStriking"), value: profile.technical.ballStriking },
            { label: t("metrics.passing"),      value: profile.technical.passing },
            { label: t("metrics.carrying"),     value: profile.technical.carrying },
            { label: t("metrics.firstTouch"),   value: profile.technical.firstTouch },
            { label: t("metrics.creativity"),   value: profile.technical.creativity },
          ]
        : [],
    [profile, language],
  );
  const physicalMetrics = useMemo(
    () =>
      profile
        ? [
            { label: t("metrics.acceleration"), value: profile.physical.acceleration },
            { label: t("metrics.sprintSpeed"),  value: profile.physical.sprintSpeed },
            { label: t("metrics.agility"),      value: profile.physical.agility },
            { label: t("metrics.strength"),     value: profile.physical.strength },
            { label: t("metrics.stamina"),      value: profile.physical.stamina },
          ]
        : [],
    [profile, language],
  );

  async function handleWatchlistToggle() {
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
      setError(watchlistError instanceof Error ? watchlistError.message : translate("player.loadError"));
    }
  }

  async function handleSaveToHistory() {
    if (!player || saveLoading || savedToHistory) return;
    setSaveLoading(true);
    try {
      await createAnalysisEntry({
        playerId: player.id,
        playerName: profile?.identity.name ?? player.name ?? player.id,
        title: `Análise — ${profile?.identity.name ?? player.name}`,
        description: profile?.summary.recommendation ?? "",
        analyst: user?.name,
      });
      setSavedToHistory(true);
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex flex-1 items-center justify-center text-sm text-gray-400">{t("player.loading")}</main>
        </div>
      </div>
    );
  }

  if (error || !player || !profile) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-xl text-gray-400">{error || t("player.notFound")}</p>
              <button
                onClick={() => navigate("/players")}
                className="rounded-lg bg-[#00C2FF] px-4 py-2 text-[#07142A] transition-colors hover:bg-[#00A8E0]"
              >
                {t("player.backToRanking")}
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
              {t("player.backToRanking")}
            </button>

            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.16),transparent_68%)] blur-2xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.12),transparent_72%)] blur-2xl" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                  <PlayerAvatar
                    name={profile.identity.name}
                    imageUrl={player.image}
                  />

                  <div>
                    <div className="mb-2 flex items-center gap-3 flex-wrap">
                      <h1 className="text-4xl font-semibold text-white">{profile.identity.name}</h1>
                      <span className={`${getPositionColor(profile.identity.primaryPosition || "-")} rounded px-3 py-1 text-sm text-white`}>
                        {profile.identity.primaryPosition ? positionLabel(profile.identity.primaryPosition) : "-"}
                      </span>
                      {(() => {
                        const ovr = player.overall ?? null;
                        const tiers: Array<[number, string, string]> = [
                          [90, t("player.tierIcon"),     "#FFD700"],
                          [85, t("player.tierElite"),    "#00FF9C"],
                          [78, t("player.tierPremium"),  "#00C2FF"],
                          [70, t("player.tierStandout"), "#7A5CFF"],
                          [62, t("player.tierRegular"),  "#FBBF24"],
                          [54, t("player.tierBasic"),    "#94a3b8"],
                          [0,  t("player.tierProspect"), "#C084FC"],
                        ];
                        const [, label, color] = tiers.find(([min]) => (ovr ?? 0) >= min) ?? tiers[tiers.length - 1];
                        return (
                          <span
                            className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                            style={{ color, borderColor: `${color}55`, background: `${color}12` }}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <span>{profile.identity.nationality || "-"}</span>
                      <span>•</span>
                      <span>{profile.identity.age != null ? t("player.yearsOld", { age: profile.identity.age }) : "-"}</span>
                      <span>•</span>
                      <span className="text-white">{profile.identity.club || t("player.noClub")}</span>
                      <span>•</span>
                      <span>{profile.identity.league || "-"}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[rgba(168,85,247,0.22)] bg-[rgba(168,85,247,0.10)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E9D5FF]">
                        {profile.dna.archetype}
                      </span>
                      {profile.dna.dominantTraits
                        .filter((trait) => trait.toLowerCase() !== profile.dna.archetype.toLowerCase())
                        .slice(0, 2)
                        .map((trait) => (
                          <span
                            key={trait}
                            className="rounded-full border border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.08)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9BE7FF]"
                          >
                            {trait}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <InsightCard label={t("player.currentLevel")} value={`${profile.summary.currentLevel.score}`} />
                  <InsightCard label={t("player.expectedPeak")} value={`${profile.projection.expectedPeakOverall}`} tone="green" />
                  <InsightCard label={t("player.marketValue")} value={formatMarketValue(profile.market.currentValue)} tone="amber" />
                  {/* Watchlist + Save — stacked in the same 4th column slot */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleWatchlistToggle}
                      className={`flex-1 rounded-[18px] border px-5 py-3 text-left transition-colors ${
                        isInWatchlist
                          ? "border-[#fbbf24] bg-[#fbbf24]/12 text-[#fbbf24]"
                          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-300 hover:border-[#fbbf24]/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" fill={isInWatchlist ? "currentColor" : "none"} />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                          {isInWatchlist ? t("player.watchlistSaved") : t("player.save")}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveToHistory()}
                      disabled={saveLoading || savedToHistory}
                      className={`flex items-center gap-2 rounded-[14px] border px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        savedToHistory
                          ? "border-[rgba(0,255,156,0.3)] bg-[rgba(0,255,156,0.08)] text-[#00FF9C]"
                          : "border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.08)] text-[#9BE7FF] hover:bg-[rgba(0,194,255,0.14)]"
                      }`}
                    >
                      <BookmarkPlus className="h-4 w-4 shrink-0" />
                      {savedToHistory ? t("player.historySaved") : saveLoading ? t("player.historySaving") : t("player.addToHistory")}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <ExecutiveSnapshotCard
              snapshot={profile.summary}
              dataSourceLabel={t("player.analysisLive", { source: profile.context.sourceAnalysisType ?? "live" })}
              subtitle={t("player.executiveSubtitle")}
            />

            <DNABars dna={profile.dna} />

            <SectionCard
              eyebrow={t("player.attributesEyebrow")}
              title={t("player.attributesTitle")}
              description={t("player.attributesDescription")}
              accent="cyan"
            >
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-3">
                  {technicalMetrics.map((metric) => (
                    <MetricBar key={metric.label} label={metric.label} value={metric.value} />
                  ))}
                </div>
                <div className="space-y-3">
                  {physicalMetrics.map((metric) => (
                    <MetricBar key={metric.label} label={metric.label} value={metric.value} />
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow={t("player.marketRiskEyebrow")}
              title={t("player.marketRiskTitle")}
              description={t("player.marketRiskDescription")}
              accent="amber"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InsightCard label={t("dashboard.liquidity")} value={profile.market.liquidity.label} tone="green" />
                <InsightCard label={t("player.valueRetention")} value={profile.market.valueRetention.label} tone="purple" />
                <InsightCard label={t("player.overallRisk")} value={profile.risk.overall.label} tone="amber" />
                <InsightCard label={t("dashboard.financialRisk")} value={profile.risk.financial.label} tone="amber" />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricBar label={t("player.contractPressure")} value={profile.market.contractPressure.score} inverse />
                <MetricBar label={t("player.availability")} value={profile.risk.availability.score} inverse />
                <MetricBar label={t("player.volatility")} value={profile.risk.volatility.score} inverse />
                <MetricBar label={t("player.sampleConfidence")} value={profile.context.sampleConfidence} />
              </div>
            </SectionCard>

            <FieldMapsModule playerId={player.id} />

            <SectionCard
              eyebrow={t("player.projectionEyebrow")}
              title={t("player.projectionTitle")}
              description={t("player.projectionDescription")}
              accent="purple"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <InsightCard label={t("player.currentOverall")} value={`${profile.projection.currentOverall}`} />
                <InsightCard label={t("player.nextSeason")} value={`${profile.projection.nextSeasonOverall}`} tone="cyan" />
                <InsightCard label={t("player.expectedPeak")} value={`${profile.projection.expectedPeakOverall}`} tone="green" />
                <InsightCard label={t("player.curve")} value={profile.projection.developmentCurve} tone="purple" />
                <InsightCard label={t("player.resaleOutlook")} value={profile.projection.resaleOutlook.label} tone="amber" />
              </div>
            </SectionCard>

            <SectionCard
              eyebrow={t("player.contextEyebrow")}
              title={t("player.contextTitle")}
              description={t("player.contextDescription")}
              accent="purple"
            >
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InsightCard label={t("player.competitionLevel")} value={profile.context.competitionLevel} />
                    <InsightCard label={t("player.sourceAnalysis")} value={profile.context.sourceAnalysisType ?? "live"} tone="purple" />
                  </div>

                  <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{t("player.topInsights")}</p>
                    <div className="mt-4 space-y-3">
                      {[
                        ...profile.narrative.aiInsights,
                        ...profile.narrative.strengths,
                        ...profile.narrative.concerns,
                        ...profile.narrative.developmentFocus,
                      ]
                        .filter(Boolean)
                        .slice(0, 5)
                        .map((insight, index) => (
                          <div
                            key={`${index}-${insight.slice(0, 18)}`}
                            className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,20,42,0.7)] px-4 py-3 text-sm text-gray-300"
                          >
                            {insight}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{t("player.dnaTraits")}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {dnaTraits.map((trait) => (
                        <div
                          key={trait.key}
                          className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,20,42,0.7)] px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-white">{trait.label}</p>
                          <p className="mt-2 text-sm text-gray-400">{trait.interpretation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{t("player.seasonTrend")}</p>
                  <div className="mt-4 space-y-3">
                    {profile.context.seasonTrend.slice(0, 5).map((point) => (
                      <div
                        key={point.season}
                        className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,20,42,0.7)] p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-semibold text-white">{point.season}</span>
                          <span className="text-xs uppercase tracking-[0.18em] text-gray-500">{formatMarketValue(point.marketValue)}</span>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <MetricBar label={t("player.overall")} value={point.overall} />
                          <MetricBar label={t("player.risk")} value={point.riskScore} inverse />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <PlayerVideosSection
              playerId={player.id}
              analystName={user?.name || "Analista"}
            />

            {similarPlayers.length > 0 ? (
              <SectionCard
                eyebrow={t("player.relatedPlayersEyebrow")}
                title={t("player.relatedPlayersTitle")}
                description={t("player.relatedPlayersDescription")}
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
                        {similarPlayer.position ? positionLabel(similarPlayer.position) : "-"} • {(similarPlayer.team || t("player.noClub"))}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#B6FFD8]">
                        {formatMarketValue(similarPlayer.marketValue)}
                      </p>
                    </button>
                  ))}
                </div>
              </SectionCard>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <Link
                to={`/compare?player1=${player.id}`}
                className="rounded-[18px] bg-[#00C2FF] py-3 text-center font-semibold text-[#07142A] transition-colors hover:bg-[#00A8E0]"
              >
                {t("player.compareWithAnother")}
              </Link>
              <button className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] py-3 text-white transition-colors hover:bg-[rgba(255,255,255,0.05)]">
                {t("player.addToReport")}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
