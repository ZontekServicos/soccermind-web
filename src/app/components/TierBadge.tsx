import { Badge } from "./ui/badge";

interface TierBadgeProps {
  tier: "ELITE" | "A" | "B" | "C" | "DEVELOPMENT";
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const colors = {
    ELITE: "bg-[#7A5CFF] text-white shadow-[0_0_12px_rgba(122,92,255,0.4)]",
    A: "bg-[#00C2FF] text-[#07142A] shadow-[0_0_12px_rgba(0,194,255,0.4)]",
    B: "bg-[#00FF9C] text-[#07142A] shadow-[0_0_12px_rgba(0,255,156,0.4)]",
    C: "bg-gray-500 text-white shadow-[0_0_10px_rgba(107,114,128,0.35)]",
    DEVELOPMENT: "bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.35)]",
  };

  return (
    <Badge className={`${colors[tier]} px-4 py-1.5 text-sm tracking-wider ${className || ""}`}>
      {tier}
    </Badge>
  );
}