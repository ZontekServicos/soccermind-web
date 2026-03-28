import { BadgeCheck, CalendarRange, ShieldAlert, Sparkles, Target } from "lucide-react";
import type { ExecutiveSnapshot } from "../../types/player-intelligence";
import { SectionCard } from "./SectionCard";

interface ExecutiveSnapshotSectionProps {
  snapshot: ExecutiveSnapshot;
  dataSourceLabel: string;
}

function getTone(score: number) {
  if (score >= 75) return "text-[#B6FFD8] border-[rgba(0,255,156,0.22)] bg-[rgba(0,255,156,0.08)]";
  if (score >= 55) return "text-[#9BE7FF] border-[rgba(0,194,255,0.24)] bg-[rgba(0,194,255,0.08)]";
  return "text-[#FFD6A5] border-[rgba(251,191,36,0.24)] bg-[rgba(251,191,36,0.08)]";
}

function MetricCard({
  label,
  value,
  summary,
  score,
}: {
  label: string;
  value: string;
  summary: string;
  score: number;
}) {
  return (
    <div className={`rounded-[18px] border p-4 ${getTone(score)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400">{label}</p>
          <p className="mt-2 text-lg font-semibold text-white">{value}</p>
        </div>
        <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-xs font-semibold text-white">
          {score}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-400">{summary}</p>
    </div>
  );
}

export function ExecutiveSnapshotSection({
  snapshot,
  dataSourceLabel,
}: ExecutiveSnapshotSectionProps) {
  return (
    <SectionCard
      eyebrow="Executive Snapshot"
      title="Decision signal before deep dive"
      description="SoccerMind condenses the acquisition case into the few signals that change decisions."
      accent="cyan"
      aside={
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-gray-300">
            {dataSourceLabel}
          </span>
          <span className="rounded-full border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.08)] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-[#9BE7FF]">
            Confidence {snapshot.confidence}
          </span>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[radial-gradient(circle_at_top_left,rgba(0,194,255,0.18),transparent_45%),rgba(255,255,255,0.03)] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[rgba(0,194,255,0.14)] p-3 text-[#9BE7FF]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Recommendation</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">{snapshot.recommendation}</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="flex items-center gap-2 text-[#B6FFD8]">
                <BadgeCheck className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.22em]">Tactical Fit</span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{snapshot.tacticalFit.score}</p>
              <p className="mt-2 text-sm text-gray-400">{snapshot.tacticalFit.label}</p>
            </div>
            <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="flex items-center gap-2 text-[#D8B4FE]">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.22em]">Upside</span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{snapshot.upside.score}</p>
              <p className="mt-2 text-sm text-gray-400">{snapshot.upside.label}</p>
            </div>
          </div>
          <div className="mt-4 rounded-[18px] border border-[rgba(251,191,36,0.18)] bg-[rgba(251,191,36,0.07)] p-4">
            <div className="flex items-center gap-2 text-[#FDE68A]">
              <CalendarRange className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.22em]">Ideal Acquisition Window</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white">{snapshot.idealAcquisitionWindow}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Risk" value={snapshot.risk.label} score={snapshot.risk.score} summary={snapshot.risk.summary} />
          <MetricCard label="Liquidity" value={snapshot.liquidity.label} score={snapshot.liquidity.score} summary={snapshot.liquidity.summary} />
          <MetricCard
            label="Confidence"
            value={`${snapshot.confidence}%`}
            score={snapshot.confidence}
            summary="Signal confidence based on how aligned the current profile is with the modeled acquisition case."
          />
          <div className="rounded-[18px] border border-[rgba(255,77,79,0.2)] bg-[rgba(255,77,79,0.07)] p-4">
            <div className="flex items-center gap-2 text-[#FFB4B5]">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.22em]">Decision Note</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-white">{snapshot.risk.label}</p>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Upside and tactical fit are attractive, but the transaction still needs price discipline and context validation.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
