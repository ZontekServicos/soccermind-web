/**
 * StatBar — horizontal comparison bar used in VS / compare layouts.
 * Renders a label, a filled track, and numeric value.
 */
import { scoreColor } from "./ScoreBadge";

interface StatBarProps {
  label: string;
  value: number | null;
  max?: number;
  /** Override automatic color from scoreColor() */
  color?: string;
}

export function StatBar({ label, value, max = 100, color }: StatBarProps) {
  const v = value ?? 0;
  const pct = Math.min(100, Math.max(0, (v / max) * 100));
  const c = color ?? scoreColor(v);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-[11px] font-bold tabular-nums" style={{ color: c }}>
          {value ?? "-"}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: c, boxShadow: `0 0 6px ${c}88` }}
        />
      </div>
    </div>
  );
}
