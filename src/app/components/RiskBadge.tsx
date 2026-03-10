import { Badge } from "./ui/badge";

interface RiskBadgeProps {
  level: "LOW" | "MEDIUM" | "HIGH";
  className?: string;
  size?: "sm" | "md";
}

export function RiskBadge({ level, className, size = "md" }: RiskBadgeProps) {
  const colors = {
    LOW: "bg-[#00FF9C] text-[#07142A] shadow-[0_0_15px_rgba(0,255,156,0.5)]",
    MEDIUM: "bg-[#fbbf24] text-[#07142A] shadow-[0_0_15px_rgba(251,191,36,0.5)]",
    HIGH: "bg-[#FF4D4F] text-white shadow-[0_0_15px_rgba(255,77,79,0.5)]",
  };

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1";

  return (
    <Badge className={`${colors[level]} ${sizeClass} ${className || ""}`}>
      {level}
    </Badge>
  );
}