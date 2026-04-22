/**
 * TrendBadge — pill badge for rising/stable/declining trend direction.
 */
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

export const TREND_CONFIG = {
  rising:    { Icon: ArrowUpRight,   color: "#00FF9C", label: "Em alta" },
  stable:    { Icon: ArrowRight,     color: "#94a3b8", label: "Estável" },
  declining: { Icon: ArrowDownRight, color: "#FF4D4F", label: "Em queda" },
};

interface TrendBadgeProps {
  direction: "rising" | "stable" | "declining";
}

export function TrendBadge({ direction }: TrendBadgeProps) {
  const cfg = TREND_CONFIG[direction] ?? TREND_CONFIG.stable;
  const { Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        color: cfg.color,
        background: `${cfg.color}14`,
        border: `1px solid ${cfg.color}33`,
      }}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}
