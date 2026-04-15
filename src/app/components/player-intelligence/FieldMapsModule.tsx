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
import { SectionCard } from "./SectionCard";

// ---------------------------------------------------------------------------
// API types  (mirrors scout-engine player-maps.service response)
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

/** Spatial event as returned by GET /players/:id/events (outcome lowercase) */
interface MapEventFE {
  x: number;
  y: number;
  endX: number | null;
  endY: number | null;
  outcome: string | null;
}

interface PlayerEvents {
  heatmap:       HeatmapData;
  /** Raw (x,y) points in 0–100 space — used directly by the canvas renderer. */
  heatmapPoints: { x: number; y: number }[];
  passes:        MapEventFE[];
  shots:         MapEventFE[];
}

// Internal canvas drawing resolution — React owns the width/height attrs.
// CSS w-full stretches the display; drawing always uses these coordinates.
const CV_W = 400;
const CV_H = 260;

// API grid dimensions (source data — used by deriveInsight only)
const API_COLS = 10;
const API_ROWS = 7;

// ---------------------------------------------------------------------------
// Wyscout colour scale  (cyan → green → yellow → orange → red)
// ---------------------------------------------------------------------------

function getHeatColor(v: number): string {
  // Alpha floor of 0.55 so even a single blob is clearly visible on the dark field.
  const a = (n: number) => Math.min(1, Math.max(0.55, n)).toFixed(3);
  if (v < 0.22) return `rgba(0,194,255,${a(v * 1.8 + 0.3)})`;
  if (v < 0.42) return `rgba(0,220,150,${a(0.45 + v * 0.8)})`;
  if (v < 0.62) return `rgba(255,220,0,${a(0.55 + v * 0.6)})`;
  if (v < 0.82) return `rgba(255,115,0,${a(0.65 + v * 0.4)})`;
  return                `rgba(255,25,25,${a(0.75 + v * 0.25)})`;
}

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

/**
 * Invert the Y axis for SVG pass/shot maps.
 * SVG has y=0 at top; football convention has y=0 at the bottom touchline.
 */
function toSVGY(y: number): number {
  return 100 - y;
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
// Canvas field lines — all geometry derived from live W×H
// ---------------------------------------------------------------------------

function drawFieldLines(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Re-derive geometry from actual canvas dimensions
  const mg   = W * 0.05;             // 5% margin on each side
  const fx   = mg;
  const fy   = H * 0.04;
  const fw   = W - mg * 2;
  const fh   = H - fy * 2;
  const cx   = fx + fw / 2;
  const cy   = fy + fh / 2;
  const paW  = fw * 0.157;
  const paH  = fh * 0.588;
  const paY  = cy - paH / 2;
  const sbW  = fw * 0.052;
  const sbH  = fh * 0.270;
  const sbY  = cy - sbH / 2;
  const cr   = fh * 0.147;
  const psp  = fw * 0.105;
  const gH   = fh * 0.108;
  const gD   = W * 0.025;

  const line = (style: string, w = 1) => { ctx.strokeStyle = style; ctx.lineWidth = w; };
  const dot  = (x: number, y: number, r = 2) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };

  // Boundary
  line("rgba(255,255,255,0.55)");
  ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, 3); ctx.stroke();

  // Centre line + circle
  ctx.beginPath(); ctx.moveTo(cx, fy); ctx.lineTo(cx, fy + fh); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  dot(cx, cy);

  line("rgba(255,255,255,0.42)");

  // Left penalty area + box + spot + arc
  ctx.strokeRect(fx, paY, paW, paH);
  ctx.strokeRect(fx, sbY, sbW, sbH);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  dot(fx + psp, cy);
  ctx.save();
  ctx.beginPath(); ctx.rect(fx + paW, fy - 2, fw + 4, fh + 4); ctx.clip();
  ctx.beginPath(); ctx.arc(fx + psp, cy, cr, -Math.PI * 0.5, Math.PI * 0.5);
  line("rgba(255,255,255,0.42)"); ctx.stroke();
  ctx.restore();
  line("rgba(255,255,255,0.25)");
  ctx.strokeRect(fx - gD, cy - gH / 2, gD, gH);

  line("rgba(255,255,255,0.42)");

  // Right penalty area + box + spot + arc
  ctx.strokeRect(fx + fw - paW, paY, paW, paH);
  ctx.strokeRect(fx + fw - sbW, sbY, sbW, sbH);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  dot(fx + fw - psp, cy);
  ctx.save();
  ctx.beginPath(); ctx.rect(fx - 4, fy - 2, fw - paW + 4, fh + 4); ctx.clip();
  ctx.beginPath(); ctx.arc(fx + fw - psp, cy, cr, Math.PI * 0.5, Math.PI * 1.5);
  line("rgba(255,255,255,0.42)"); ctx.stroke();
  ctx.restore();
  line("rgba(255,255,255,0.25)");
  ctx.strokeRect(fx + fw, cy - gH / 2, gD, gH);

  // Corner arcs
  line("rgba(255,255,255,0.35)");
  const R = W * 0.018;
  const corners: [number, number, number, number][] = [
    [fx,      fy,      0,             Math.PI / 2],
    [fx + fw, fy,      Math.PI / 2,   Math.PI],
    [fx,      fy + fh, Math.PI * 1.5, Math.PI * 2],
    [fx + fw, fy + fh, Math.PI,       Math.PI * 1.5],
  ];
  for (const [x, y, s, e] of corners) {
    ctx.beginPath(); ctx.arc(x, y, R, s, e); ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// HeatmapCanvas — the Wyscout-style canvas component
// ---------------------------------------------------------------------------

interface HeatmapCanvasProps {
  points:  { x: number; y: number }[];  // raw 0–100 coords
  isEmpty: boolean;
}

function HeatmapCanvas({ points, isEmpty }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use the fixed internal resolution — React owns width/height attrs so we
    // must NOT change canvas.width/height here (it would wipe the drawing and
    // React would reset them on the next reconcile anyway).
    const W = CV_W;   // 400
    const H = CV_H;   // 260

    // ── Background ───────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#071a0e";
    ctx.fillRect(0, 0, W, H);

    console.log("[HeatmapCanvas] points:", points.length, points.slice(0, 3));

    // ── Heatmap blobs ────────────────────────────────────────────────────────
    // xPx = (x / 100) * W        — x=0 left edge, x=100 right edge
    // yPx = H - (y / 100) * H    — y=0 bottom, y=100 top (Y-inverted)
    //
    // Density by overlap: each blob is semi-transparent; areas where many
    // blobs stack become brighter.  Amplify when fewer than 20 points so
    // sparse players still show a visible heatmap.
    if (!isEmpty && points.length > 0) {
      const radius  = Math.max(W, H) * 0.08;
      const AMPLIFY = points.length < 20 ? 3 : 1;

      for (const pt of points) {
        if (pt.x < 0 || pt.x > 100 || pt.y < 0 || pt.y > 100) continue;

        const xPx = (pt.x / 100) * W;
        const yPx = H - (pt.y / 100) * H;

        for (let i = 0; i < AMPLIFY; i++) {
          const grad = ctx.createRadialGradient(xPx, yPx, 0, xPx, yPx, radius);
          grad.addColorStop(0,   "rgba(0,255,255,0.9)");
          grad.addColorStop(0.4, "rgba(0,255,255,0.6)");
          grad.addColorStop(1,   "rgba(0,255,255,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(xPx, yPx, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ── Field lines on top ───────────────────────────────────────────────────
    drawFieldLines(ctx, W, H);

    // ── Empty state label ────────────────────────────────────────────────────
    if (isEmpty) {
      ctx.fillStyle    = "rgba(255,255,255,0.25)";
      ctx.font         = "13px system-ui, sans-serif";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("sem dados de posicionamento", W / 2, H / 2);
    }
  }, [points, isEmpty]);

  return (
    // width/height attributes set the internal drawing resolution.
    // CSS w-full stretches the display — drawing coords stay at CV_W × CV_H.
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

function PassMapPitch({ passes }: { passes: MapEventFE[] }) {
  return (
    <PitchBase>
      {passes.slice(0, 18).map((pass, i) => {
        const color  = pass.outcome === "success" ? "rgba(0,255,156,0.72)" : "rgba(255,77,79,0.65)";
        const x1     = pass.x;
        const y1     = toSVGY(pass.y);
        const x2     = pass.endX  ?? pass.x;
        const y2     = toSVGY(pass.endY ?? pass.y);
        return (
          <g key={`${x1}-${y1}-${i}`}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color} strokeWidth="1.1" strokeLinecap="round"
            />
            <circle cx={x1} cy={y1} r="0.9" fill="rgba(255,255,255,0.55)" />
            <circle cx={x2} cy={y2} r="0.9" fill={color} />
          </g>
        );
      })}
    </PitchBase>
  );
}

function ShotMapPitch({ shots }: { shots: MapEventFE[] }) {
  return (
    <PitchBase>
      {shots.slice(0, 16).map((shot, i) => (
        <circle
          key={`${shot.x}-${shot.y}-${i}`}
          cx={shot.x}
          cy={toSVGY(shot.y)}
          r={1.8}
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
}

export function FieldMapsModule({ playerId }: FieldMapsModuleProps) {
  const [events,  setEvents]  = useState<PlayerEvents | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    setLoading(true);

    apiFetch<PlayerEvents>(`/players/${playerId}/events`)
      .then((res) => {
        if (cancelled) return;
        console.log("[FieldMapsModule] events:", res.data);
        setEvents(res.data);
      })
      .catch(() => { if (!cancelled) setEvents(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [playerId]);

  const heatmapData   = events?.heatmap ?? null;
  const ab            = heatmapData?.actionBreakdown;
  const heatmapPoints = events?.heatmapPoints ?? [];
  const isEmpty       = heatmapPoints.length === 0;
  const cells         = heatmapData?.grid ?? [];   // kept for deriveInsight only
  const insight       = isEmpty ? null : deriveInsight(cells);
  const passes        = events?.passes ?? [];
  const shots         = events?.shots  ?? [];

  return (
    <SectionCard
      eyebrow="Mapas de Atuação"
      title="Posicionamento em campo"
      description="Heatmap canvas (renderização direta por eventos) · Rotas e finalizações geradas pelo perfil."
      accent="green"
    >
      <div className="grid gap-4 xl:grid-cols-3">

        {/* ── 1. Mapa de Calor — canvas Wyscout ── */}
        {loading ? <PanelSkeleton /> : (
          <MapPanel
            title="Mapa de Calor"
            subtitle="densidade de atuação"
            stats={heatmapData ? <StatBadge value={heatmapData.totalEvents} label="eventos" color="#00C2FF" /> : undefined}
          >
            <HeatmapCanvas points={heatmapPoints} isEmpty={isEmpty} />

            {/* Auto-insight */}
            {insight && (
              <p className="mt-2 rounded-[10px] border border-[rgba(0,194,255,0.15)] bg-[rgba(0,194,255,0.05)] px-3 py-2 text-[11px] text-[#9BE7FF]">
                {insight}
              </p>
            )}

            {/* Dominant zones */}
            {heatmapData?.dominantZones && heatmapData.dominantZones.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {heatmapData.dominantZones.slice(0, 3).map((zone) => (
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
