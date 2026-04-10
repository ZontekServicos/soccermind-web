import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HeatmapCell {
  col: number;       // 0-9
  row: number;       // 0-6
  intensity: number; // 0-100
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
// Field constants — landscape 500×320 viewBox
// ---------------------------------------------------------------------------

const VW = 500;
const VH = 320;
const FX = 22;        // field origin x (left margin for goal)
const FY = 12;        // field origin y
const FW = 456;       // field width
const FH = 296;       // field height

const COLS = 10;
const ROWS = 7;
const CW = FW / COLS;         // ≈ 45.6 per column
const CH = FH / ROWS;         // ≈ 42.3 per row
const CX = FX + FW / 2;      // center x
const CY = FY + FH / 2;      // center y

// Penalty area (16.5m ≈ 15.7% of 105m pitch length)
const PA_W = Math.round(FW * 0.157);   // ≈ 72
const PA_H = Math.round(FH * 0.588);   // ≈ 174 (40.32m of 68m width)
const PA_Y = CY - PA_H / 2;

// 6-yard box (5.5m ≈ 5.2% of length)
const SB_W = Math.round(FW * 0.052);   // ≈ 24
const SB_H = Math.round(FH * 0.27);    // ≈ 80 (18.32m of 68m)
const SB_Y = CY - SB_H / 2;

// ---------------------------------------------------------------------------
// Heat colour mapping
// ---------------------------------------------------------------------------

function cellColor(intensity: number): string {
  if (intensity <= 20) return "rgba(0,194,255,0.07)";
  if (intensity <= 40) return "rgba(0,194,255,0.22)";
  if (intensity <= 60) return "rgba(168,85,247,0.42)";
  if (intensity <= 80) return "rgba(255,77,79,0.52)";
  return "rgba(255,77,79,0.82)";
}

// ---------------------------------------------------------------------------
// Pitch SVG — horizontal orientation, goals on both ends
// ---------------------------------------------------------------------------

function PitchSVG({ grid }: { grid: HeatmapCell[] }) {
  const lineProps = {
    stroke: "rgba(255,255,255,0.15)",
    strokeWidth: "0.65",
    fill: "none",
  } as const;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full"
      aria-label="Campo de futebol com heatmap de posicionamento"
    >
      {/* ── Field background ── */}
      <defs>
        <radialGradient id="pitchGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(0,60,25,0.9)" />
          <stop offset="100%" stopColor="rgba(0,30,10,0.95)" />
        </radialGradient>
        <clipPath id="fieldClip">
          <rect x={FX} y={FY} width={FW} height={FH} rx="3" />
        </clipPath>
      </defs>

      <rect x={FX} y={FY} width={FW} height={FH} rx="3" fill="url(#pitchGrad)" />

      {/* ── Heat overlay (clipped to field) ── */}
      <g clipPath="url(#fieldClip)">
        {grid.map((cell) => (
          <rect
            key={`${cell.col}-${cell.row}`}
            x={FX + cell.col * CW + 1.5}
            y={FY + cell.row * CH + 1.5}
            width={CW - 3}
            height={CH - 3}
            rx="3"
            fill={cellColor(cell.intensity)}
          />
        ))}
      </g>

      {/* ── Field lines (drawn on top of overlay) ── */}

      {/* Outer boundary */}
      <rect x={FX} y={FY} width={FW} height={FH} rx="3" {...lineProps} />

      {/* Centre line */}
      <line x1={CX} y1={FY} x2={CX} y2={FY + FH} {...lineProps} />

      {/* Centre circle */}
      <circle cx={CX} cy={CY} r="30" {...lineProps} />
      <circle cx={CX} cy={CY} r="1.6" fill="rgba(255,255,255,0.45)" />

      {/* Left penalty area */}
      <rect x={FX} y={PA_Y} width={PA_W} height={PA_H} {...lineProps} />
      {/* Left 6-yard box */}
      <rect x={FX} y={SB_Y} width={SB_W} height={SB_H} {...lineProps} />
      {/* Left goal */}
      <rect
        x={FX - 9}
        y={CY - 22}
        width={9}
        height={44}
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="0.8"
      />
      {/* Left penalty spot */}
      <circle cx={FX + PA_W - 14} cy={CY} r="1.5" fill="rgba(255,255,255,0.45)" />
      {/* Left penalty arc */}
      <path
        d={`M ${FX + PA_W} ${CY - 26} A 30 30 0 0 0 ${FX + PA_W} ${CY + 26}`}
        {...lineProps}
      />

      {/* Right penalty area */}
      <rect x={FX + FW - PA_W} y={PA_Y} width={PA_W} height={PA_H} {...lineProps} />
      {/* Right 6-yard box */}
      <rect x={FX + FW - SB_W} y={SB_Y} width={SB_W} height={SB_H} {...lineProps} />
      {/* Right goal */}
      <rect
        x={FX + FW}
        y={CY - 22}
        width={9}
        height={44}
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="0.8"
      />
      {/* Right penalty spot */}
      <circle cx={FX + FW - PA_W + 14} cy={CY} r="1.5" fill="rgba(255,255,255,0.45)" />
      {/* Right penalty arc */}
      <path
        d={`M ${FX + FW - PA_W} ${CY - 26} A 30 30 0 0 1 ${FX + FW - PA_W} ${CY + 26}`}
        {...lineProps}
      />

      {/* Corner arcs */}
      <path d={`M ${FX + 7} ${FY} A 7 7 0 0 1 ${FX} ${FY + 7}`} {...lineProps} />
      <path d={`M ${FX + FW - 7} ${FY} A 7 7 0 0 0 ${FX + FW} ${FY + 7}`} {...lineProps} />
      <path d={`M ${FX} ${FY + FH - 7} A 7 7 0 0 0 ${FX + 7} ${FY + FH}`} {...lineProps} />
      <path d={`M ${FX + FW} ${FY + FH - 7} A 7 7 0 0 1 ${FX + FW - 7} ${FY + FH}`} {...lineProps} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function HeatmapSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-3 w-28 rounded bg-[rgba(255,255,255,0.07)]" />
      <div className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[#0a1628]">
        <div className="aspect-[500/320] w-full bg-[rgba(255,255,255,0.03)]" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-[14px] bg-[rgba(255,255,255,0.04)]" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HeatmapField({ playerId }: { playerId: string }) {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    setFetchError(null);

    apiFetch<HeatmapData>(`/maps/heatmap/${playerId}`)
      .then((res) => setData(res.data))
      .catch((e: unknown) => {
        setFetchError(e instanceof Error ? e.message : "Erro ao carregar heatmap");
      })
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) return <HeatmapSkeleton />;

  if (fetchError || !data) {
    return (
      <div className="rounded-[18px] border border-[rgba(255,77,79,0.2)] bg-[rgba(255,77,79,0.05)] px-5 py-4">
        <p className="text-sm text-[#FF7B7D]">Não foi possível carregar os dados de posicionamento</p>
      </div>
    );
  }

  const isEmpty = data.totalEvents === 0;

  const actions = [
    { label: "Gols",     value: data.actionBreakdown.goals,         color: "#00FF9C" },
    { label: "Finalizações", value: data.actionBreakdown.shots,     color: "#00C2FF" },
    { label: "Desarmes", value: data.actionBreakdown.tackles,        color: "#FBBF24" },
    { label: "Passes",   value: data.actionBreakdown.passes,         color: "#7A5CFF" },
    { label: "Dribles",  value: data.actionBreakdown.dribbles,       color: "#A855F7" },
    { label: "Interc.",  value: data.actionBreakdown.interceptions,  color: "#FF7B7D" },
  ];

  const gradientStops = [
    "rgba(0,194,255,0.07)",
    "rgba(0,194,255,0.22)",
    "rgba(168,85,247,0.42)",
    "rgba(255,77,79,0.52)",
    "rgba(255,77,79,0.82)",
  ];

  return (
    <div className="space-y-4">
      {/* ── SVG Field ── */}
      <div className="overflow-hidden rounded-[20px] border border-[rgba(0,194,255,0.12)] bg-[#0a1628]">
        <PitchSVG grid={isEmpty ? [] : data.grid} />
      </div>

      {/* ── Legend row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Baixo</span>
          <div className="flex gap-0.5">
            {gradientStops.map((color, i) => (
              <div
                key={i}
                className="h-3 w-5 rounded-sm"
                style={{ background: color, border: "1px solid rgba(255,255,255,0.08)" }}
              />
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Alto</span>
        </div>

        <span className="text-[11px] text-gray-400">
          <span className="font-semibold text-white">{data.totalEvents}</span>{" "}
          evento{data.totalEvents !== 1 ? "s" : ""} registrado{data.totalEvents !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Dominant zones ── */}
      {data.dominantZones.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Zonas:</span>
          {data.dominantZones.map((zone) => (
            <span
              key={zone}
              className="rounded-full border border-[rgba(0,194,255,0.28)] bg-[rgba(0,194,255,0.07)] px-3 py-0.5 text-[11px] font-semibold text-[#9BE7FF]"
            >
              {zone}
            </span>
          ))}
        </div>
      )}

      {/* ── Action breakdown cards ── */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {actions.map((item) => (
          <div
            key={item.label}
            className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3 text-center"
          >
            <p
              className="text-xl font-semibold"
              style={{ color: item.value > 0 ? item.color : "rgba(255,255,255,0.2)" }}
            >
              {item.value}
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-gray-500">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Empty state message ── */}
      {isEmpty && (
        <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-5 py-4 text-center">
          <p className="text-sm text-gray-400">Dados de posicionamento não disponíveis</p>
          <p className="mt-1 text-[11px] text-gray-600">
            Eventos foram ingeridos, mas sem coordenadas espaciais (plano Sportmonks)
          </p>
        </div>
      )}
    </div>
  );
}
