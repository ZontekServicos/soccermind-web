import { ShieldAlert, Sparkles, Target, TrendingUp } from "lucide-react";
import type { ExecutiveSnapshot } from "../../types/player-intelligence";

interface ExecutiveSnapshotCardProps {
  snapshot: ExecutiveSnapshot;
  dataSourceLabel?: string;
  title?: string;
  subtitle?: string;
}

function getMetricTone(score: number, inverse = false) {
  const effectiveScore = inverse ? 100 - score : score;

  if (effectiveScore >= 70) {
    return "border-[rgba(0,255,156,0.2)] bg-[rgba(0,255,156,0.08)] text-[#B6FFD8]";
  }

  if (effectiveScore >= 50) {
    return "border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.08)] text-[#9BE7FF]";
  }

  return "border-[rgba(251,191,36,0.22)] bg-[rgba(251,191,36,0.08)] text-[#FDE68A]";
}

function SnapshotMetric({
  label,
  score,
  value,
  icon,
  inverse = false,
}: {
  label: string;
  score: number;
  value: string;
  icon: React.ReactNode;
  inverse?: boolean;
}) {
  return (
    <div className={`rounded-[18px] border p-4 ${getMetricTone(score, inverse)}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-current">{icon}</span>
          <span className="text-[10px] uppercase tracking-[0.24em] text-gray-300">{label}</span>
        </div>
        <span className="text-sm font-semibold text-white">{score}</span>
      </div>
      <p className="mt-4 text-xl font-semibold text-white">{value}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div
          className={`h-full rounded-full ${inverse ? "bg-[#FF7B7D]" : "bg-[linear-gradient(90deg,#00C2FF,#00FF9C)]"}`}
          style={{ width: `${Math.max(8, Math.min(100, inverse ? 100 - score : score))}%` }}
        />
      </div>
    </div>
  );
}

export function ExecutiveSnapshotCard({
  snapshot,
  dataSourceLabel,
  title = "Executive Snapshot",
  subtitle = "Decision-first summary built for recruitment calls.",
}: ExecutiveSnapshotCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-[rgba(0,194,255,0.22)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.96))] shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
      <div className="absolute -right-12 top-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.18),transparent_68%)] blur-2xl" />
      <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.12),transparent_70%)] blur-2xl" />
      <div className="relative border-b border-[rgba(255,255,255,0.06)] px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#9BE7FF]">{title}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{snapshot.recommendation}</h2>
            <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dataSourceLabel ? (
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-gray-300">
                {dataSourceLabel}
              </span>
            ) : null}
            <span className="rounded-full border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.08)] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#9BE7FF]">
              Confidence {snapshot.confidence}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-5">
        <SnapshotMetric
          label="Recommendation"
          score={snapshot.confidence}
          value={snapshot.recommendation}
          icon={<Target className="h-4 w-4" />}
        />
        <SnapshotMetric
          label="Confidence"
          score={snapshot.confidence}
          value={`${snapshot.confidence}%`}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <SnapshotMetric
          label="Risk"
          score={snapshot.risk.score}
          value={snapshot.risk.label}
          icon={<ShieldAlert className="h-4 w-4" />}
          inverse
        />
        <SnapshotMetric
          label="Value"
          score={snapshot.value?.score ?? snapshot.liquidity.score}
          value={snapshot.value?.label ?? snapshot.liquidity.label}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <SnapshotMetric
          label="Upside"
          score={snapshot.upside.score}
          value={snapshot.upside.label}
          icon={<Sparkles className="h-4 w-4" />}
        />
      </div>
    </section>
  );
}

