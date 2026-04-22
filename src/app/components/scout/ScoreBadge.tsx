/**
 * Shared score utilities and display components.
 * ScoreRing  — large numeric with label below (used in metric grids)
 * ScorePill  — compact colored pill (used in list rows)
 */

// ─── Color utility ────────────────────────────────────────────────────────────

export function scoreColor(score: number): string {
  if (score >= 75) return "#00FF9C";
  if (score >= 60) return "#00C2FF";
  if (score >= 45) return "#7A5CFF";
  if (score >= 30) return "#FBBF24";
  return "#FF4D4F";
}

// ─── ScoreRing ─────────────────────────────────────────────────────────────────

interface ScoreRingProps {
  value: number;
  label: string;
  color?: string;
}

export function ScoreRing({ value, label, color }: ScoreRingProps) {
  const c = color ?? scoreColor(value);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-bold tabular-nums" style={{ color: c }}>
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-[0.18em] text-gray-500">{label}</span>
    </div>
  );
}

// ─── ScorePill ────────────────────────────────────────────────────────────────

interface ScorePillProps {
  value: number | null;
  className?: string;
}

export function ScorePill({ value, className = "" }: ScorePillProps) {
  const v = value ?? 0;
  const c = scoreColor(v);
  const bg = `${c}22`;
  return (
    <span
      className={`inline-flex w-12 items-center justify-center rounded-[8px] py-1.5 text-sm font-bold shadow-[0_2px_8px_rgba(0,0,0,0.2)] ${className}`}
      style={{ color: c, background: bg, border: `1px solid ${c}44` }}
    >
      {value ?? "-"}
    </span>
  );
}
