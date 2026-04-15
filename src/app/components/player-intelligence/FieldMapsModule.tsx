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

  // Boundary — slightly more visible than secondary lines
  line("rgba(255,255,255,0.28)", 0.9);
  ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, 3); ctx.stroke();

  // Centre line + circle
  line("rgba(255,255,255,0.15)", 0.7);
  ctx.beginPath(); ctx.moveTo(cx, fy); ctx.lineTo(cx, fy + fh); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  dot(cx, cy);

  line("rgba(255,255,255,0.13)", 0.7);

  // Left penalty area + box + spot + arc
  ctx.strokeRect(fx, paY, paW, paH);
  ctx.strokeRect(fx, sbY, sbW, sbH);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  dot(fx + psp, cy);
  ctx.save();
  ctx.beginPath(); ctx.rect(fx + paW, fy - 2, fw + 4, fh + 4); ctx.clip();
  ctx.beginPath(); ctx.arc(fx + psp, cy, cr, -Math.PI * 0.5, Math.PI * 0.5);
  line("rgba(255,255,255,0.13)", 0.7); ctx.stroke();
  ctx.restore();
  line("rgba(255,255,255,0.10)", 0.7);
  ctx.strokeRect(fx - gD, cy - gH / 2, gD, gH);

  line("rgba(255,255,255,0.13)", 0.7);

  // Right penalty area + box + spot + arc
  ctx.strokeRect(fx + fw - paW, paY, paW, paH);
  ctx.strokeRect(fx + fw - sbW, sbY, sbW, sbH);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  dot(fx + fw - psp, cy);
  ctx.save();
  ctx.beginPath(); ctx.rect(fx - 4, fy - 2, fw - paW + 4, fh + 4); ctx.clip();
  ctx.beginPath(); ctx.arc(fx + fw - psp, cy, cr, Math.PI * 0.5, Math.PI * 1.5);
  line("rgba(255,255,255,0.13)", 0.7); ctx.stroke();
  ctx.restore();
  line("rgba(255,255,255,0.10)", 0.7);
  ctx.strokeRect(fx + fw, cy - gH / 2, gD, gH);

  // Corner arcs
  line("rgba(255,255,255,0.14)", 0.7);
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
    ctx.fillStyle = "#060f08";
    ctx.fillRect(0, 0, W, H);
    // Ambient field glow — subtle green bloom at centre
    const ambient = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.65);
    ambient.addColorStop(0, "rgba(0,80,28,0.45)");
    ambient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, W, H);

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
    <div className="overflow-hidden rounded-xl border border-white/[0.07] h-[190px] flex items-center justify-center" style={{ background: "linear-gradient(160deg,#0a1f12 0%,#060f1a 100%)" }}>
      <svg viewBox="0 0 100 100" className="h-full w-auto" aria-hidden="true">
        {/* Field bg */}
        <rect x="0" y="0" width="100" height="100" fill="rgba(0,40,15,0.30)" />
        {/* Boundary */}
        <rect x="1" y="1" width="98" height="98" rx="2" fill="transparent" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
        {/* Centre line */}
        <line x1="50" y1="1" x2="50" y2="99" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
        {/* Centre circle */}
        <circle cx="50" cy="50" r="10" fill="transparent" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.55)" />
        {/* Left penalty area */}
        <rect x="1" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
        <rect x="1" y="36" width="5"  height="28" fill="transparent" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
        <circle cx="12" cy="50" r="0.7" fill="rgba(255,255,255,0.45)" />
        <path d="M 17 40 A 12 12 0 0 0 17 60" fill="transparent" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        {/* Right penalty area */}
        <rect x="83" y="21" width="16" height="58" fill="transparent" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
        <rect x="94" y="36" width="5"  height="28" fill="transparent" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
        <circle cx="88" cy="50" r="0.7" fill="rgba(255,255,255,0.45)" />
        <path d="M 83 40 A 12 12 0 0 1 83 60" fill="transparent" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
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
        const isSuccess = pass.outcome === "success";
        const stroke = isSuccess ? "rgba(0,255,156,0.82)" : "rgba(255,55,55,0.75)";
        const x1 = pass.x,       y1 = toSVGY(pass.y);
        const x2 = pass.endX ?? pass.x, y2 = toSVGY(pass.endY ?? pass.y);
        return (
          <g key={`${x1}-${y1}-${i}`}>
            {/* depth shadow */}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.35)" strokeWidth="2.2" strokeLinecap="round" />
            {/* main line */}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
            {/* origin dot */}
            <circle cx={x1} cy={y1} r="1.0" fill="rgba(255,255,255,0.45)" />
            {/* end dot — slightly larger */}
            <circle cx={x2} cy={y2} r="1.4" fill={stroke} />
          </g>
        );
      })}
    </PitchBase>
  );
}

function ShotMapPitch({ shots }: { shots: MapEventFE[] }) {
  return (
    <PitchBase>
      {shots.slice(0, 16).map((shot, i) => {
        // goal=green, saved=yellow, blocked/other=red
        const color =
          shot.outcome === "goal"  ? "#00FF9C" :
          shot.outcome === "saved" ? "#FFD600" : "#FF4040";
        const cx = shot.x;
        const cy = toSVGY(shot.y);
        return (
          <g key={`${shot.x}-${shot.y}-${i}`}>
            {/* outer glow ring */}
            <circle cx={cx} cy={cy} r={4.0} fill={color} fillOpacity="0.12" />
            {/* mid ring */}
            <circle cx={cx} cy={cy} r={2.6} fill={color} fillOpacity="0.25" />
            {/* main dot */}
            <circle cx={cx} cy={cy} r={1.9} fill={color} fillOpacity="0.90" stroke="rgba(255,255,255,0.70)" strokeWidth="0.4" />
          </g>
        );
      })}
    </PitchBase>
  );
}

function EmptyPitch() {
  return (
    <PitchBase>
      <circle cx="50" cy="46" r="7" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
      <line x1="50" y1="39.5" x2="50" y2="52.5" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
      <text x="50" y="59" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="4.5" fontFamily="system-ui,sans-serif" letterSpacing="0.5">
        sem dados disponíveis
      </text>
    </PitchBase>
  );
}

// ---------------------------------------------------------------------------
// Panel chrome
// ---------------------------------------------------------------------------

function StatBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[17px] font-bold leading-none tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[8.5px] uppercase tracking-[0.20em] text-white/30">{label}</span>
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
    <div className="group relative flex flex-col rounded-2xl border border-white/[0.08] p-4 shadow-[0_6px_28px_rgba(0,0,0,0.45)] transition-all duration-200 hover:border-white/[0.14] hover:shadow-[0_10px_40px_rgba(0,0,0,0.55)]" style={{ background: "linear-gradient(150deg,rgba(255,255,255,0.045) 0%,rgba(0,0,0,0.18) 100%)" }}>
      {/* top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/[0.11] to-transparent" />
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold leading-tight text-white">{title}</p>
          <p className="mt-0.5 text-[9.5px] uppercase tracking-[0.24em] text-white/30">{subtitle}</p>
        </div>
        {stats && <div className="flex gap-3">{stats}</div>}
      </div>
      {children}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col animate-pulse rounded-2xl border border-white/[0.06] p-4 shadow-[0_6px_28px_rgba(0,0,0,0.35)]" style={{ background: "linear-gradient(150deg,rgba(255,255,255,0.03) 0%,rgba(0,0,0,0.12) 100%)" }}>
      <div className="mb-3 flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full bg-white/[0.07]" />
          <div className="h-2 w-16 rounded-full bg-white/[0.04]" />
        </div>
        <div className="h-7 w-10 rounded-lg bg-white/[0.04]" />
      </div>
      <div className="h-[190px] rounded-xl bg-white/[0.04]" />
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <div className="h-12 rounded-xl bg-white/[0.03]" />
        <div className="h-12 rounded-xl bg-white/[0.03]" />
      </div>
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
  { color: "#FFD600", label: "Defendido" },
  { color: "#FF4040", label: "Bloqueado" },
  { color: "#00FF9C", label: "Passe certo", dash: true },
  { color: "#FF3737", label: "Passe errado", dash: true },
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
              <p className="mt-2.5 rounded-xl border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.06)] px-3 py-2 text-[11px] leading-snug text-[#7DD9FF]">
                {insight}
              </p>
            )}

            {/* Dominant zones */}
            {heatmapData?.dominantZones && heatmapData.dominantZones.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {heatmapData.dominantZones.slice(0, 3).map((zone) => (
                  <span
                    key={zone}
                    className="rounded-full border border-[rgba(0,194,255,0.20)] bg-[rgba(0,194,255,0.07)] px-2.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#7DD9FF]"
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
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-center">
                  <p className="text-[15px] font-bold tabular-nums text-[#00FF9C]">{ab.dribbles}</p>
                  <p className="mt-0.5 text-[8px] uppercase tracking-[0.18em] text-white/30">Dribles</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-center">
                  <p className="text-[15px] font-bold tabular-nums text-[#7DD9FF]">{ab.interceptions}</p>
                  <p className="mt-0.5 text-[8px] uppercase tracking-[0.18em] text-white/30">Interc.</p>
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
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-center">
                  <p className="text-[15px] font-bold tabular-nums text-[#FBBF24]">{ab.tackles}</p>
                  <p className="mt-0.5 text-[8px] uppercase tracking-[0.18em] text-white/30">Desarmes</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-center">
                  <p className="text-[15px] font-bold tabular-nums text-[#C084FC]">{ab.saves}</p>
                  <p className="mt-0.5 text-[8px] uppercase tracking-[0.18em] text-white/30">Defesas</p>
                </div>
              </div>
            )}
          </MapPanel>
        )}

      </div>

      {/* ── Shared legend row ── */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-4 px-1">
        {/* Heat density scale */}
        <div className="flex items-center gap-2">
          {HEAT_LEGEND.map(({ color, label }, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-sm shadow-sm" style={{ background: color }} />
              {label && <span className="text-[8.5px] uppercase tracking-[0.18em] text-white/30">{label}</span>}
            </div>
          ))}
        </div>

        <div className="h-3 w-px bg-white/[0.10]" />

        {/* Shot / pass outcomes */}
        {SHOT_LEGEND.map(({ color, label }, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}66` }} />
            <span className="text-[8.5px] uppercase tracking-[0.18em] text-white/30">{label}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
