interface CapitalGaugeProps {
  value: number; // 0-10
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function CapitalGauge({ value, size = "md", showLabel = true }: CapitalGaugeProps) {
  const getColor = (val: number) => {
    if (val <= 3) return "#FF4D4F";
    if (val <= 6) return "#fbbf24";
    if (val <= 8) return "#00FF9C";
    return "#00C2FF";
  };

  const getClassification = (val: number) => {
    if (val <= 3) return "BAIXO";
    if (val <= 6) return "MÉDIO";
    if (val <= 8) return "BOM";
    return "EXCELENTE";
  };

  const sizes = {
    xs: { circle: 70, stroke: 6, text: "text-lg", label: "text-[10px]", classification: "text-xs" },
    sm: { circle: 80, stroke: 8, text: "text-xl", label: "text-xs", classification: "text-sm" },
    md: { circle: 120, stroke: 10, text: "text-3xl", label: "text-xs", classification: "text-sm" },
    lg: { circle: 160, stroke: 12, text: "text-5xl", label: "text-sm", classification: "text-base" },
  };

  const { circle, stroke, text, label, classification } = sizes[size];
  const radius = (circle - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 10) * circumference;
  const color = getColor(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: circle, height: circle }}>
        <svg className="transform -rotate-90" width={circle} height={circle}>
          {/* Background circle */}
          <circle
            cx={circle / 2}
            cy={circle / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={circle / 2}
            cy={circle / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${color})`,
              transition: "stroke-dashoffset 1s ease-in-out",
            }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center ${text}`}>
          <span className="font-bold" style={{ color }}>
            {value.toFixed(1)}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <p className={`${label} text-gray-400 uppercase tracking-wider`}>Capital Efficiency</p>
          <p className={`${classification} mt-0.5`} style={{ color }}>
            {getClassification(value)}
          </p>
        </div>
      )}
    </div>
  );
}