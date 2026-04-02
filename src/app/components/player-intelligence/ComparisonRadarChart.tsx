import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

export interface RadarDimension {
  label: string;
  valueA: number;
  valueB: number;
}

interface ComparisonRadarChartProps {
  nameA: string;
  nameB: string;
  dimensions: RadarDimension[];
}

const COLOR_A = "#38BDF8";
const COLOR_B = "#C084FC";

export function ComparisonRadarChart({ nameA, nameB, dimensions }: ComparisonRadarChartProps) {
  const data = dimensions.map((d) => ({
    subject: d.label,
    A: Math.round(d.valueA),
    B: Math.round(d.valueB),
    fullMark: 100,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_A }} />
          <span className="text-xs font-medium text-[#9BE7FF]">{nameA}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_B }} />
          <span className="text-xs font-medium text-[#D8B4FE]">{nameB}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 500 }}
          />
          <Radar
            name={nameA}
            dataKey="A"
            stroke={COLOR_A}
            fill={COLOR_A}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Radar
            name={nameB}
            dataKey="B"
            stroke={COLOR_B}
            fill={COLOR_B}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
