/**
 * FieldMapsModule.tsx
 *
 * Três painéis de visualização espacial do jogador:
 *   1. Mapa de Calor — dados reais do endpoint /maps/heatmap/{playerId}
 *   2. Passes       — rotas espaciais (dados do perfil) + total real
 *   3. Finalizações — tentativas ao gol (dados do perfil) + totais reais
 *
 * Remove a redundância do mapa grande (HeatmapField) mantendo
 * um layout limpo, profissional e com dados reais onde disponíveis.
 */

import { useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "../../services/api";
import type { FieldIntelligence, SpatialEventPoint, SpatialZone } from "../../types/player-intelligence";
import { SectionCard } from "./SectionCard";

// ---------------------------------------------------------------------------
// API types (mirrors HeatmapField.tsx interface)
// ---------------------------------------------------------------------------

interface HeatmapCell {
  col: number;       // 0–9
  row: number;       // 0–6
  intensity: number; // 0–100
}

interface ActionBreakdown {
  goals: number;
  shots: number;
  tackles: number;
  passes: number;
  dribbles: number;
  interceptions: number;
  fouls: number;
  saves: number;
}

interface HeatmapData {
  playerId: string;
  totalEvents: number;
  grid: HeatmapCell[];
  dominantZones: string[];
  actionBreakdown: ActionBreakdown;
  seasons: string[];
}

// ---------------------------------------------------------------------------
// Converts the 10×7 API grid to 100×100 SVG zone coordinates
// ---------------------------------------------------------------------------

function gridToZones(grid: HeatmapCell[]): SpatialZone[] {
  const ROW_H = 100 / 7; // ≈14.28 per row
  return grid.map((c) => ({
    x: c.col * 10,
    y: c.row * ROW_H,
    width: 10,
    height: ROW_H,
    intensity: c.intensity,
  }));
}

// ---------------------------------------------------------------------------
// Pitch SVG base — portrait, goals on left/right, 100×100 viewBox
// Fixed height container so all 3 panels stay consistent
// ---------------------------------------------------------------------------

function PitchBase({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[rgba(0,255,156,0.10)] bg-[radial-gradient(circle_at_center,rgba(0,255,156,0.08),transparent_55%),linear-gradient(180deg,#0B2A23,#07142A)] h-[185px] flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-auto"
        aria-hidden="true"
      >
        {/* Boundary */}
        <rect x="1" y="1" width="98" height="98" rx="2" fill="transparent" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
        {/* Centre line */}
        <line x1="50" y1="1" x2="50" y2="99" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        {/* Centre circle */}
        <circle cx="50" cy="50" r="10" fill="transparent" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="0.9" fill="rgba(255,255,255,0.8)" />
        {/* Left penalty area */}
        <rect x="1" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {/* Left 6-yard box */}
        <rect x="1" y="36" width="5" height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {/* Left penalty spot */}
        <circle cx="12" cy="50" r="0.8" fill="rgba(255,255,255,0.8)" />
        {/* Left penalty arc */}
        <path d="M 17 40 A 12 12 0 0 0 17 60" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {/* Right penalty area */}
        <rect x="83" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {/* Right 6-yard box */}
        <rect x="94" y="36" width="5" height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {/* Right penalty spot */}
        <circle cx="88" cy="50" r="0.8" fill="rgba(255,255,255,0.8)" />
        {/* Right penalty arc */}
        <path d="M 83 40 A 12 12 0 0 1 83 60" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {children}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Map visualizations
// ---------------------------------------------------------------------------

function HeatmapPitch({ zones }: { zones: SpatialZone[] }) {
  return (
    <PitchBase>
      {zones.map((zone, i) => (
        <rect
          key={`${zone.x}-${zone.y}-${i}`}
          x={zone.x + 0.5}
          y={zone.y + 0.5}
          width={Math.max(zone.width - 1, 0)}
          height={Math.max(zone.height - 1, 0)}
          fill={`rgba(0,194,255,${Math.max(zone.intensity / 120, 0.10)})`}
        />
      ))}
    </PitchBase>
  );
}

function PassMapPitch({ passes }: { passes: SpatialEventPoint[] }) {
  return (
    <PitchBase>
      {passes.slice(0, 18).map((pass, i) => (
        <g key={`${pass.x}-${pass.y}-${i}`}>
          <line
            x1={pass.x} y1={pass.y}
            x2={pass.endX ?? pass.x} y2={pass.endY ?? pass.y}
            stroke={pass.outcome === "success" ? "rgba(0,255,156,0.72)" : "rgba(255,77,79,0.65)"}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <circle cx={pass.x} cy={pass.y} r="0.9" fill="rgba(255,255,255,0.55)" />
          <circle cx={pass.endX ?? pass.x} cy={pass.endY ?? pass.y} r="0.9"
            fill={pass.outcome === "success" ? "rgba(0,255,156,0.9)" : "rgba(255,77,79,0.9)"} />
        </g>
      ))}
    </PitchBase>
  );
}

function ShotMapPitch({ shots }: { shots: SpatialEventPoint[] }) {
  return (
    <PitchBase>
      {shots.slice(0, 16).map((shot, i) => (
        <circle
          key={`${shot.x}-${shot.y}-${i}`}
          cx={shot.x}
          cy={shot.y}
          r={Math.max(1.6, (shot.value ?? 0.1) * 7)}
          fill={shot.outcome === "goal" ? "#00FF9C" : shot.outcome === "saved" ? "#00C2FF" : "#FF7B7D"}
          fillOpacity="0.75"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="0.35"
        />
      ))}
    </PitchBase>
  );
}

// ---------------------------------------------------------------------------
// Map panel frame — header + optional stat badge + pitch
// ---------------------------------------------------------------------------

function StatBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-base font-semibold leading-none" style={{ color }}>
        {value}
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-gray-500">{label}</span>
    </div>
  );
}

function MapPanel({
  title,
  subtitle,
  stats,
  children,
}: {
  title: string;
  subtitle: string;
  stats?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{subtitle}</p>
        </div>
        {stats && <div className="flex gap-3">{stats}</div>}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PanelSkeleton() {
  return (
    <div className="flex flex-col rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4 animate-pulse">
      <div className="mb-3 flex justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-[rgba(255,255,255,0.07)]" />
          <div className="h-2 w-16 rounded bg-[rgba(255,255,255,0.04)]" />
        </div>
        <div className="h-6 w-10 rounded bg-[rgba(255,255,255,0.04)]" />
      </div>
      <div className="h-[185px] rounded-[14px] bg-[rgba(255,255,255,0.04)]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state — no events ingested yet
// ---------------------------------------------------------------------------

function EmptyPitch() {
  return (
    <PitchBase>
      <text
        x="50"
        y="52"
        textAnchor="middle"
        fill="rgba(255,255,255,0.18)"
        fontSize="5"
        fontFamily="sans-serif"
      >
        sem dados
      </text>
    </PitchBase>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface FieldMapsModuleProps {
  playerId: string;
  /** Mock/profile spatial data — used for pass routes and shot coordinates */
  fieldIntelligence: FieldIntelligence | null;
}

export function FieldMapsModule({ playerId, fieldIntelligence }: FieldMapsModuleProps) {
  const [data, setData]       = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    apiFetch<HeatmapData>(`/maps/heatmap/${playerId}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [playerId]);

  const zones   = data?.grid ? gridToZones(data.grid) : [];
  const ab      = data?.actionBreakdown;
  const isEmpty = !data || data.totalEvents === 0;

  const passes = fieldIntelligence?.passes ?? [];
  const shots  = fieldIntelligence?.shots  ?? [];

  return (
    <SectionCard
      eyebrow="Mapas de Atuação"
      title="Posicionamento em campo"
      description="Heatmap baseado em eventos reais ingeridos do Sportmonks. Rotas e finalizações geradas pelo perfil do jogador."
      accent="green"
    >
      <div className="grid gap-4 xl:grid-cols-3">

        {/* ── Painel 1: Mapa de Calor (dados reais) ── */}
        {loading ? (
          <PanelSkeleton />
        ) : (
          <MapPanel
            title="Mapa de Calor"
            subtitle="densidade de atuação"
            stats={
              data ? (
                <StatBadge
                  value={data.totalEvents}
                  label="eventos"
                  color="#00C2FF"
                />
              ) : undefined
            }
          >
            {isEmpty ? <EmptyPitch /> : <HeatmapPitch zones={zones} />}
            {data?.dominantZones && data.dominantZones.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.dominantZones.slice(0, 3).map((zone) => (
                  <span
                    key={zone}
                    className="rounded-full border border-[rgba(0,194,255,0.25)] bg-[rgba(0,194,255,0.06)] px-2 py-0.5 text-[9px] font-semibold text-[#9BE7FF]"
                  >
                    {zone}
                  </span>
                ))}
              </div>
            )}
          </MapPanel>
        )}

        {/* ── Painel 2: Passes (rotas do perfil + total real) ── */}
        {loading ? (
          <PanelSkeleton />
        ) : (
          <MapPanel
            title="Passes"
            subtitle="rotas de progressão"
            stats={
              ab ? (
                <StatBadge value={ab.passes} label="passes" color="#00FF9C" />
              ) : undefined
            }
          >
            {passes.length > 0 ? <PassMapPitch passes={passes} /> : <EmptyPitch />}
            {ab && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-center">
                  <p className="text-sm font-semibold text-[#00FF9C]">{ab.dribbles}</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500">Dribles</p>
                </div>
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-center">
                  <p className="text-sm font-semibold text-[#9BE7FF]">{ab.interceptions}</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500">Interc.</p>
                </div>
              </div>
            )}
          </MapPanel>
        )}

        {/* ── Painel 3: Finalizações (pontos do perfil + totais reais) ── */}
        {loading ? (
          <PanelSkeleton />
        ) : (
          <MapPanel
            title="Finalizações"
            subtitle="tentativas ao gol"
            stats={
              ab ? (
                <>
                  <StatBadge value={ab.goals}  label="gols"     color="#00FF9C" />
                  <StatBadge value={ab.shots}  label="chutes"   color="#FF7B7D" />
                </>
              ) : undefined
            }
          >
            {shots.length > 0 ? <ShotMapPitch shots={shots} /> : <EmptyPitch />}
            {ab && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-center">
                  <p className="text-sm font-semibold text-[#FBBF24]">{ab.tackles}</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500">Desarmes</p>
                </div>
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-center">
                  <p className="text-sm font-semibold text-[#A855F7]">{ab.saves}</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500">Defesas</p>
                </div>
              </div>
            )}
          </MapPanel>
        )}

      </div>

      {/* Legenda de cores — shots */}
      <div className="mt-4 flex flex-wrap items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#00FF9C]" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Gol</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#00C2FF]" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Defendido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF7B7D]" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Bloqueado / fora</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#00FF9C]" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Passe completo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF7B7D]" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Passe incompleto</span>
        </div>
      </div>
    </SectionCard>
  );
}
