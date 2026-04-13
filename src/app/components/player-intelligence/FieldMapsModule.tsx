/**
 * FieldMapsModule.tsx
 *
 * Três painéis de visualização espacial do jogador:
 *   1. Mapa de Calor — canvas Wyscout-style (grid 20×20, box-blur, gradiente real)
 *   2. Passes       — SVG com rotas + totais reais da API
 *   3. Finalizações — SVG com pontos + totais reais da API
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { apiFetch } from "../../services/api";
import type { FieldIntelligence, SpatialEventPoint } from "../../types/player-intelligence";
import { SectionCard } from "./SectionCard";

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

interface HeatmapCell {
  col: number;       // 0–9  (field length axis)
  row: number;       // 0–6  (field width axis)
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
// Canvas constants — landscape field (goals left/right), 400×260 px internal
// ---------------------------------------------------------------------------

const CV_W = 400;
const CV_H = 260;
const FX   = 20;           // field left margin (goal depth)
const FY   = 10;           // field top margin
const FW   = CV_W - 40;    // 360
const FH   = CV_H - 20;    // 240
const CX   = FX + FW / 2;  // 200 — centre x
const CY   = FY + FH / 2;  // 130 — centre y

// Derived field geometry (proportional to real pitch 105m × 68m)
const PA_W  = FW * 0.157;          // penalty area depth  ≈ 56px  (16.5m)
const PA_H  = FH * 0.588;          // penalty area width  ≈ 141px (40.32m)
const PA_Y  = CY - PA_H / 2;
const SB_W  = FW * 0.052;          // 6-yard box depth    ≈ 19px  (5.5m)
const SB_H  = FH * 0.270;          // 6-yard box width    ≈ 65px  (18.32m)
const SB_Y  = CY - SB_H / 2;
const CR    = FH * 0.147;          // centre circle r     ≈ 35px  (10m)
const PSPOT = FW * 0.105;          // penalty spot x dist ≈ 38px  (11m from line)
const GOAL_H = FH * 0.108;         // goal height         ≈ 26px  (7.32m)
const GOAL_D = 10;                 // goal depth (px)

// API grid dimensions (source data)
const API_COLS = 10;
const API_ROWS = 7;

// Working grid for heatmap (upsampled 20×20)
const GRID = 20;

// ---------------------------------------------------------------------------
// Wyscout colour scale  (cyan → green → yellow → orange → red)
// ---------------------------------------------------------------------------

function getHeatColor(v: number): string {
  if (v < 0.06) return "transparent";
  const a = (n: number) => Math.min(n, 1).toFixed(3);
  if (v < 0.22) return `rgba(0,194,255,${a(v * 1.3)})`;
  if (v < 0.42) return `rgba(0,220,150,${a(0.20 + v * 0.9)})`;
  if (v < 0.62) return `rgba(255,220,0,${a(0.38 + v * 0.7)})`;
  if (v < 0.82) return `rgba(255,115,0,${a(0.50 + v * 0.5)})`;
  return                `rgba(255,25,25,${a(0.60 + v * 0.4)})`;
}

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------

/** Upsample API 10×7 cells to a GRID×GRID float array. */
function buildGrid(cells: HeatmapCell[]): number[][] {
  const g: number[][] = Array.from({ length: GRID }, () => Array(GRID).fill(0));
  for (const cell of cells) {
    // Map API col (0-9) and row (0-6) to 20×20 space using nearest-neighbour
    const gx = Math.round((cell.col / (API_COLS - 1)) * (GRID - 1));
    const gy = Math.round((cell.row / (API_ROWS - 1)) * (GRID - 1));
    if (g[gy] !== undefined) g[gy][gx] = Math.max(g[gy][gx], cell.intensity);
  }
  return g;
}

/** Weighted 3×3 box-blur — 2 passes for smoother gradient. */
function smoothGrid(src: number[][]): number[][] {
  let grid = src;
  for (let pass = 0; pass < 2; pass++) {
    const tmp = grid.map(r => [...r]);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        let sum = 0, wt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < GRID && nx >= 0 && nx < GRID) {
              const w = dy === 0 && dx === 0 ? 4 : 1;
              sum += grid[ny][nx] * w;
              wt  += w;
            }
          }
        }
        tmp[y][x] = sum / wt;
      }
    }
    grid = tmp;
  }
  return grid;
}

/** Normalise 0-1 (guard against all-zero). */
function normalizeGrid(grid: number[][]): number[][] {
  const max = Math.max(...grid.flat(), 1);
  return grid.map(row => row.map(v => v / max));
}

// ---------------------------------------------------------------------------
// Auto-insight from weighted centre of mass of the API cells
// ---------------------------------------------------------------------------

function deriveInsight(cells: HeatmapCell[]): string | null {
  if (!cells.length) return null;
  let totalW = 0, sumX = 0, sumY = 0;
  for (const c of cells) {
    sumX += c.col * c.intensity;
    sumY += c.row * c.intensity;
    totalW += c.intensity;
  }
  if (totalW === 0) return null;

  const avgX = (sumX / totalW / (API_COLS - 1)) * 100; // 0–100, length axis
  const avgY = (sumY / totalW / (API_ROWS - 1)) * 100;  // 0–100, width axis

  const zone =
    avgX > 65 ? "Alta presença ofensiva" :
    avgX < 35 ? "Bloco defensivo"        : "Atuação no meio-campo";

  const side =
    avgY < 33 ? "corredor esquerdo" :
    avgY > 66 ? "corredor direito"  : "eixo central";

  return `${zone} · ${side}`;
}

// ---------------------------------------------------------------------------
// Canvas field lines
// ---------------------------------------------------------------------------

function drawFieldLines(ctx: CanvasRenderingContext2D) {
  const line  = (style: string, w = 1) => { ctx.strokeStyle = style; ctx.lineWidth = w; };
  const dot   = (x: number, y: number, r = 2) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };

  // Field background (radial dark-green gradient)
  const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(FW, FH) * 0.65);
  bg.addColorStop(0, "rgba(0,55,22,0.0)"); // transparent — heatmap shows through
  bg.addColorStop(1, "rgba(0,20,8,0.0)");
  ctx.fillStyle = bg;
  ctx.fillRect(FX, FY, FW, FH);

  // ── Boundary ──
  line("rgba(255,255,255,0.55)");
  ctx.beginPath(); ctx.roundRect(FX, FY, FW, FH, 3); ctx.stroke();

  // ── Centre line ──
  ctx.beginPath(); ctx.moveTo(CX, FY); ctx.lineTo(CX, FY + FH); ctx.stroke();

  // ── Centre circle ──
  ctx.beginPath(); ctx.arc(CX, CY, CR, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  dot(CX, CY);

  line("rgba(255,255,255,0.42)");

  // ── Left penalty area ──
  ctx.strokeRect(FX, PA_Y, PA_W, PA_H);
  // Left 6-yard box
  ctx.strokeRect(FX, SB_Y, SB_W, SB_H);
  // Left penalty spot
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  dot(FX + PSPOT, CY);
  // Left penalty arc (only part outside penalty area)
  ctx.save();
  ctx.beginPath(); ctx.rect(FX + PA_W, FY - 2, FW + 4, FH + 4); ctx.clip();
  ctx.beginPath(); ctx.arc(FX + PSPOT, CY, CR, -Math.PI * 0.5, Math.PI * 0.5);
  line("rgba(255,255,255,0.42)"); ctx.stroke();
  ctx.restore();
  // Left goal
  line("rgba(255,255,255,0.25)");
  ctx.strokeRect(FX - GOAL_D, CY - GOAL_H / 2, GOAL_D, GOAL_H);

  line("rgba(255,255,255,0.42)");

  // ── Right penalty area ──
  ctx.strokeRect(FX + FW - PA_W, PA_Y, PA_W, PA_H);
  // Right 6-yard box
  ctx.strokeRect(FX + FW - SB_W, SB_Y, SB_W, SB_H);
  // Right penalty spot
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  dot(FX + FW - PSPOT, CY);
  // Right penalty arc (only part outside penalty area)
  ctx.save();
  ctx.beginPath(); ctx.rect(FX - 4, FY - 2, FW - PA_W + 4, FH + 4); ctx.clip();
  ctx.beginPath(); ctx.arc(FX + FW - PSPOT, CY, CR, Math.PI * 0.5, Math.PI * 1.5);
  line("rgba(255,255,255,0.42)"); ctx.stroke();
  ctx.restore();
  // Right goal
  line("rgba(255,255,255,0.25)");
  ctx.strokeRect(FX + FW, CY - GOAL_H / 2, GOAL_D, GOAL_H);

  // ── Corner arcs ──
  line("rgba(255,255,255,0.35)");
  const R = 7;
  const corners: [number, number, number, number][] = [
    [FX,       FY,      0,             Math.PI / 2],
    [FX + FW,  FY,      Math.PI / 2,   Math.PI],
    [FX,       FY + FH, Math.PI * 1.5, Math.PI * 2],
    [FX + FW,  FY + FH, Math.PI,       Math.PI * 1.5],
  ];
  for (const [cx, cy, s, e] of corners) {
    ctx.beginPath(); ctx.arc(cx, cy, R, s, e); ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// HeatmapCanvas — the Wyscout-style canvas component
// ---------------------------------------------------------------------------

interface HeatmapCanvasProps {
  cells: HeatmapCell[];
  isEmpty: boolean;
}

function HeatmapCanvas({ cells, isEmpty }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // — Background —
    ctx.clearRect(0, 0, CV_W, CV_H);
    const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(FW, FH) * 0.75);
    bg.addColorStop(0, "rgba(0,55,22,0.92)");
    bg.addColorStop(1, "rgba(0,22,8,0.97)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CV_W, CV_H);

    // — Heatmap cells —
    if (!isEmpty && cells.length > 0) {
      const raw        = buildGrid(cells);
      const smoothed   = smoothGrid(raw);
      const normalized = normalizeGrid(smoothed);

      const cellW = FW / GRID;
      const cellH = FH / GRID;

      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
          const v     = normalized[row][col];
          const color = getHeatColor(v);
          if (color === "transparent") continue;
          ctx.fillStyle = color;
          ctx.fillRect(
            FX + col * cellW,
            FY + row * cellH,
            cellW + 0.5, // +0.5 to close sub-pixel gaps
            cellH + 0.5,
          );
        }
      }
    }

    // — Field lines on top of heatmap —
    drawFieldLines(ctx);

    // — Empty state label —
    if (isEmpty) {
      ctx.fillStyle   = "rgba(255,255,255,0.18)";
      ctx.font        = "13px system-ui, sans-serif";
      ctx.textAlign   = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("sem dados de posicionamento", CV_W / 2, CV_H / 2);
    }
  }, [cells, isEmpty]);

  return (
    <canvas
      ref={canvasRef}
      width={CV_W}
      height={CV_H}
      className="block w-full rounded-[14px]"
      aria-label="Heatmap de posicionamento do jogador"
    />
  );
}

// ---------------------------------------------------------------------------
// Pitch SVG base — used by Pass and Shot maps (portrait, 100×100 viewBox)
// ---------------------------------------------------------------------------

function PitchBase({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[rgba(0,255,156,0.10)] bg-[radial-gradient(circle_at_center,rgba(0,255,156,0.08),transparent_55%),linear-gradient(180deg,#0B2A23,#07142A)] h-[185px] flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-auto" aria-hidden="true">
        <rect x="1" y="1" width="98" height="98" rx="2" fill="transparent" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
        <line x1="50" y1="1" x2="50" y2="99" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="10" fill="transparent" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="0.9" fill="rgba(255,255,255,0.8)" />
        <rect x="1" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="1" y="36" width="5"  height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <circle cx="12" cy="50" r="0.8" fill="rgba(255,255,255,0.8)" />
        <path d="M 17 40 A 12 12 0 0 0 17 60" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="83" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <rect x="94" y="36" width="5"  height="28" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        <circle cx="88" cy="50" r="0.8" fill="rgba(255,255,255,0.8)" />
        <path d="M 83 40 A 12 12 0 0 1 83 60" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
        {children}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pass & Shot map SVG components
// ---------------------------------------------------------------------------

function PassMapPitch({ passes }: { passes: SpatialEventPoint[] }) {
  return (
    <PitchBase>
      {passes.slice(0, 18).map((pass, i) => {
        const color = pass.outcome === "success" ? "rgba(0,255,156,0.72)" : "rgba(255,77,79,0.65)";
        return (
          <g key={`${pass.x}-${pass.y}-${i}`}>
            <line
              x1={pass.x}        y1={pass.y}
              x2={pass.endX ?? pass.x} y2={pass.endY ?? pass.y}
              stroke={color} strokeWidth="1.1" strokeLinecap="round"
            />
            <circle cx={pass.x} cy={pass.y} r="0.9" fill="rgba(255,255,255,0.55)" />
            <circle cx={pass.endX ?? pass.x} cy={pass.endY ?? pass.y} r="0.9" fill={color} />
          </g>
        );
      })}
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

function EmptyPitch() {
  return (
    <PitchBase>
      <text x="50" y="52" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="5" fontFamily="sans-serif">
        sem dados
      </text>
    </PitchBase>
  );
}

// ---------------------------------------------------------------------------
// Panel chrome
// ---------------------------------------------------------------------------

function StatBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-base font-semibold leading-none" style={{ color }}>{value}</span>
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

function PanelSkeleton() {
  return (
    <div className="flex flex-col animate-pulse rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
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
// Legend strip — shared colour reference for all three panels
// ---------------------------------------------------------------------------

const HEAT_LEGEND = [
  { color: "#00C2FF", label: "Baixo" },
  { color: "#00DC96", label: "" },
  { color: "#FFDC00", label: "Médio" },
  { color: "#FF7300", label: "" },
  { color: "#FF1919", label: "Alto" },
] as const;

const SHOT_LEGEND = [
  { color: "#00FF9C", label: "Gol" },
  { color: "#00C2FF", label: "Defendido" },
  { color: "#FF7B7D", label: "Bloqueado" },
  { color: "#00FF9C", label: "Passe completo", dash: true },
  { color: "#FF7B7D", label: "Passe incompleto", dash: true },
] as const;

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface FieldMapsModuleProps {
  playerId: string;
  fieldIntelligence: FieldIntelligence | null;
}

export function FieldMapsModule({ playerId, fieldIntelligence }: FieldMapsModuleProps) {
  const [data,    setData]    = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    apiFetch<HeatmapData>(`/maps/heatmap/${playerId}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [playerId]);

  const ab      = data?.actionBreakdown;
  const isEmpty = !data || data.totalEvents === 0;
  const cells   = data?.grid ?? [];
  const insight = isEmpty ? null : deriveInsight(cells);
  const passes  = fieldIntelligence?.passes ?? [];
  const shots   = fieldIntelligence?.shots  ?? [];

  return (
    <SectionCard
      eyebrow="Mapas de Atuação"
      title="Posicionamento em campo"
      description="Heatmap canvas real (20×20 grid, box-blur) · Rotas e finalizações geradas pelo perfil."
      accent="green"
    >
      <div className="grid gap-4 xl:grid-cols-3">

        {/* ── 1. Mapa de Calor — canvas Wyscout ── */}
        {loading ? <PanelSkeleton /> : (
          <MapPanel
            title="Mapa de Calor"
            subtitle="densidade de atuação"
            stats={data ? <StatBadge value={data.totalEvents} label="eventos" color="#00C2FF" /> : undefined}
          >
            <HeatmapCanvas cells={cells} isEmpty={isEmpty} />

            {/* Auto-insight */}
            {insight && (
              <p className="mt-2 rounded-[10px] border border-[rgba(0,194,255,0.15)] bg-[rgba(0,194,255,0.05)] px-3 py-2 text-[11px] text-[#9BE7FF]">
                {insight}
              </p>
            )}

            {/* Dominant zones */}
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

        {/* ── 2. Passes ── */}
        {loading ? <PanelSkeleton /> : (
          <MapPanel
            title="Passes"
            subtitle="rotas de progressão"
            stats={ab ? <StatBadge value={ab.passes} label="passes" color="#00FF9C" /> : undefined}
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

        {/* ── 3. Finalizações ── */}
        {loading ? <PanelSkeleton /> : (
          <MapPanel
            title="Finalizações"
            subtitle="tentativas ao gol"
            stats={ab ? (
              <>
                <StatBadge value={ab.goals} label="gols"   color="#00FF9C" />
                <StatBadge value={ab.shots} label="chutes" color="#FF7B7D" />
              </>
            ) : undefined}
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

      {/* ── Shared legend row ── */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
        {/* Heat scale */}
        <div className="flex items-center gap-2">
          {HEAT_LEGEND.map(({ color, label }, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
              {label && <span className="text-[9px] uppercase tracking-[0.16em] text-gray-500">{label}</span>}
            </div>
          ))}
        </div>

        <div className="h-3 w-px bg-[rgba(255,255,255,0.12)]" />

        {/* Shot / pass colours */}
        {SHOT_LEGEND.map(({ color, label }, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: color, opacity: 0.9 }}
            />
            <span className="text-[9px] uppercase tracking-[0.16em] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
