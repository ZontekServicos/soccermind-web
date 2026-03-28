import type { ReactNode } from "react";
import type { FieldIntelligence, SpatialEventPoint, SpatialZone } from "../../types/player-intelligence";
import { SectionCard } from "./SectionCard";

interface FieldIntelligenceSectionProps {
  intelligence: FieldIntelligence;
}

function PitchFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function PitchBase({
  children,
  viewBox = "0 0 100 100",
}: {
  children: ReactNode;
  viewBox?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[rgba(0,255,156,0.10)] bg-[radial-gradient(circle_at_center,rgba(0,255,156,0.08),transparent_55%),linear-gradient(180deg,#0B2A23,#07142A)]">
      <svg viewBox={viewBox} className="aspect-[4/5] w-full">
        <rect x="1" y="1" width="98" height="98" rx="2" fill="transparent" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
        <line x1="50" y1="1" x2="50" y2="99" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="10" fill="transparent" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="0.9" fill="rgba(255,255,255,0.8)" />
        <rect x="1" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="83" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="1" y="36" width="5" height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="94" y="36" width="5" height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <circle cx="12" cy="50" r="0.8" fill="rgba(255,255,255,0.8)" />
        <circle cx="88" cy="50" r="0.8" fill="rgba(255,255,255,0.8)" />
        <path d="M 17 40 A 12 12 0 0 0 17 60" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <path d="M 83 40 A 12 12 0 0 1 83 60" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {children}
      </svg>
    </div>
  );
}

function HeatmapPitch({ zones }: { zones: SpatialZone[] }) {
  return (
    <PitchBase>
      {zones.map((zone, index) => (
        <rect
          key={`${zone.x}-${zone.y}-${index}`}
          x={zone.x + 0.6}
          y={zone.y + 0.6}
          width={Math.max(zone.width - 1.2, 0)}
          height={Math.max(zone.height - 1.2, 0)}
          fill={`rgba(0,194,255,${Math.max(zone.intensity / 120, 0.12)})`}
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="0.3"
        />
      ))}
    </PitchBase>
  );
}

function ShotMapPitch({ shots }: { shots: SpatialEventPoint[] }) {
  return (
    <PitchBase>
      {shots.map((shot, index) => {
        const fill = shot.outcome === "goal" ? "#00FF9C" : shot.outcome === "saved" ? "#00C2FF" : "#FF7B7D";

        return (
          <circle
            key={`${shot.x}-${shot.y}-${index}`}
            cx={shot.x}
            cy={shot.y}
            r={Math.max(1.6, (shot.value ?? 0.1) * 7)}
            fill={fill}
            fillOpacity="0.75"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="0.35"
          />
        );
      })}
    </PitchBase>
  );
}

function PassMapPitch({ passes }: { passes: SpatialEventPoint[] }) {
  return (
    <PitchBase>
      {passes.map((pass, index) => {
        const stroke = pass.outcome === "success" ? "rgba(0,255,156,0.72)" : "rgba(255,77,79,0.65)";
        return (
          <g key={`${pass.x}-${pass.y}-${index}`}>
            <line x1={pass.x} y1={pass.y} x2={pass.endX ?? pass.x} y2={pass.endY ?? pass.y} stroke={stroke} strokeWidth="1.1" strokeLinecap="round" />
            <circle cx={pass.x} cy={pass.y} r="1" fill="rgba(255,255,255,0.65)" />
            <circle cx={pass.endX ?? pass.x} cy={pass.endY ?? pass.y} r="1" fill={stroke} />
          </g>
        );
      })}
    </PitchBase>
  );
}

function DefensiveActionsPitch({ actions }: { actions: SpatialEventPoint[] }) {
  return (
    <PitchBase>
      {actions.map((action, index) => {
        const color = action.outcome === "success" ? "#FBBF24" : "#FF7B7D";
        return (
          <g key={`${action.x}-${action.y}-${index}`} transform={`translate(${action.x}, ${action.y})`}>
            <line x1="-1.4" y1="-1.4" x2="1.4" y2="1.4" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
            <line x1="-1.4" y1="1.4" x2="1.4" y2="-1.4" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
          </g>
        );
      })}
    </PitchBase>
  );
}

export function FieldIntelligenceSection({ intelligence }: FieldIntelligenceSectionProps) {
  return (
    <SectionCard
      eyebrow="Field Intelligence"
      title="Spatial read of the player profile"
      description="Pitch components are fed by a mock event layer today, but the interfaces are ready for real coordinates later."
      accent="green"
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <PitchFrame title="Heatmap" subtitle="occupancy model">
          <HeatmapPitch zones={intelligence.heatmap} />
        </PitchFrame>
        <PitchFrame title="Shot Map" subtitle="attempt locations">
          <ShotMapPitch shots={intelligence.shots} />
        </PitchFrame>
        <PitchFrame title="Pass Map" subtitle="progression routes">
          <PassMapPitch passes={intelligence.passes} />
        </PitchFrame>
      </div>
      <div className="mt-4">
        <PitchFrame title="Defensive Actions" subtitle="duels and recoveries">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <DefensiveActionsPitch actions={intelligence.defensiveActions} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Heat Zones</p>
                <p className="mt-2 text-2xl font-semibold text-white">{intelligence.heatmap.length}</p>
              </div>
              <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Shot Events</p>
                <p className="mt-2 text-2xl font-semibold text-white">{intelligence.shots.length}</p>
              </div>
              <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Pass Sequences</p>
                <p className="mt-2 text-2xl font-semibold text-white">{intelligence.passes.length}</p>
              </div>
            </div>
          </div>
        </PitchFrame>
      </div>
    </SectionCard>
  );
}
