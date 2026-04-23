import { memo, useEffect, useState } from "react";
import { Minus } from "lucide-react";
import type { DnaScore, SquadPlayer } from "../types/squad";

// ─── FUT card tier system ─────────────────────────────────────────────────────

function getCardTier(ovr: number) {
  if (ovr >= 85) return {
    bg:      "linear-gradient(170deg, #3A2100 0%, #5C3500 55%, #2E1A00 100%)",
    accent:  "#FFD700",
    border:  "rgba(255,215,0,0.90)",
    glow:    "0 0 22px rgba(255,215,0,0.60), 0 0 44px rgba(255,215,0,0.22)",
    shimmer: "rgba(255,215,0,0.14)",
    divider: "rgba(255,215,0,0.18)",
  };
  if (ovr >= 75) return {
    bg:      "linear-gradient(170deg, #1C1C24 0%, #252530 55%, #1A1A22 100%)",
    accent:  "#C8C8DC",
    border:  "rgba(200,200,220,0.80)",
    glow:    "0 0 18px rgba(200,200,220,0.50), 0 0 36px rgba(200,200,220,0.18)",
    shimmer: "rgba(200,200,220,0.10)",
    divider: "rgba(200,200,220,0.15)",
  };
  if (ovr >= 65) return {
    bg:      "linear-gradient(170deg, #2A1400 0%, #3D1E00 55%, #221100 100%)",
    accent:  "#CD7F32",
    border:  "rgba(205,127,50,0.80)",
    glow:    "0 0 16px rgba(205,127,50,0.50), 0 0 32px rgba(205,127,50,0.18)",
    shimmer: "rgba(205,127,50,0.10)",
    divider: "rgba(205,127,50,0.15)",
  };
  return {
    bg:      "linear-gradient(170deg, #0A1428 0%, #0D1B35 55%, #07102A 100%)",
    accent:  "#7A9CC8",
    border:  "rgba(122,156,200,0.55)",
    glow:    "0 0 12px rgba(122,156,200,0.35)",
    shimmer: "rgba(122,156,200,0.08)",
    divider: "rgba(122,156,200,0.12)",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTopDna(dna: DnaScore): { label: string; emoji: string; value: number } {
  const dims = [
    { key: "impact"       as const, label: "Impact", emoji: "⚡" },
    { key: "intelligence" as const, label: "Intel",  emoji: "🧠" },
    { key: "defensiveIQ"  as const, label: "Def IQ", emoji: "🛡" },
    { key: "consistency"  as const, label: "Steady", emoji: "⚖" },
  ];
  let top = dims[0];
  let topVal = dna[dims[0].key];
  for (const dim of dims.slice(1)) {
    if (dna[dim.key] > topVal) { top = dim; topVal = dna[dim.key]; }
  }
  return { label: top.label, emoji: top.emoji, value: topVal };
}

function getKeyStats(position: string, stats: SquadPlayer["stats"]) {
  if (["Goleiro"].includes(position))
    return [{ label: "DEF", value: stats.defending }, { label: "PHY", value: stats.physical }, { label: "PAS", value: stats.passing }];
  if (["Zagueiro", "Lateral Esquerdo", "Lateral Direito"].includes(position))
    return [{ label: "DEF", value: stats.defending }, { label: "PHY", value: stats.physical }, { label: "PAS", value: stats.passing }];
  if (position === "Volante")
    return [{ label: "DEF", value: stats.defending }, { label: "PAS", value: stats.passing }, { label: "PHY", value: stats.physical }];
  if (position === "Meia Atacante")
    return [{ label: "PAS", value: stats.passing }, { label: "DRI", value: stats.dribbling }, { label: "SHO", value: stats.shooting }];
  return [{ label: "SHO", value: stats.shooting }, { label: "PAC", value: stats.pace }, { label: "DRI", value: stats.dribbling }];
}

// ─── PlayerPhoto ──────────────────────────────────────────────────────────────

interface PlayerPhotoProps {
  name: string;
  image?: string | null;
  ovr: number;
  size?: "sm" | "md" | "field";
}

export function PlayerPhoto({ name, image, ovr: _ovr, size = "sm" }: PlayerPhotoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const dim      = size === "field" ? "w-10 h-10" : size === "md" ? "w-10 h-10" : "w-8 h-8";
  const textSize = size === "field" ? "text-sm"   : size === "md" ? "text-sm"   : "text-[10px]";

  if (image && !imgFailed) {
    return (
      <div className={`${dim} rounded-full overflow-hidden flex-shrink-0`}>
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover object-top"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] flex items-center justify-center flex-shrink-0`}>
      <span className={`${textSize} font-bold text-white`}>{initials}</span>
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function PlayerTooltip({ player }: { player: SquadPlayer }) {
  const { stats, dna, age, potential } = player;
  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#07142A] border border-[rgba(0,194,255,0.4)] rounded-xl p-3 shadow-2xl pointer-events-none">
      <p className="text-xs font-bold text-white mb-2 truncate">{player.name}</p>
      <div className="grid grid-cols-3 gap-1 mb-2">
        {[
          { label: "PAC", value: stats.pace },
          { label: "SHO", value: stats.shooting },
          { label: "PAS", value: stats.passing },
          { label: "DRI", value: stats.dribbling },
          { label: "DEF", value: stats.defending },
          { label: "PHY", value: stats.physical },
        ].map(({ label, value }) => (
          <div key={label} className="text-center bg-[rgba(255,255,255,0.04)] rounded py-1">
            <div className="text-[7px] text-gray-500 uppercase">{label}</div>
            <div className="text-[11px] font-black text-white">{value}</div>
          </div>
        ))}
      </div>
      {dna && (
        <div className="border-t border-gray-700 pt-2 space-y-1">
          <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-1">DNA SoccerMind</p>
          {[
            { label: "⚡ Impact",      value: dna.impact },
            { label: "🧠 Intelligence", value: dna.intelligence },
            { label: "🛡 Def IQ",       value: dna.defensiveIQ },
            { label: "⚖ Consistency",  value: dna.consistency },
            { label: "📈 Potential",    value: dna.potential },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[8px] text-gray-400">{label}</span>
              <span className="text-[8px] font-bold text-[#00C2FF]">{value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
        <span className="text-[8px] text-gray-400">{age} anos</span>
        {potential && <span className="text-[8px] text-[#00FF9C]">POT {potential}</span>}
      </div>
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

interface DropZoneProps {
  position: string;
  isCompatible: boolean;
  isDragging: boolean;
}

export function DropZone({ position, isCompatible, isDragging }: DropZoneProps) {
  return (
    <div
      className={`w-[88px] h-[112px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200 ${
        isDragging && isCompatible
          ? "border-[#00FF9C] bg-[rgba(0,255,156,0.08)] shadow-[0_0_16px_rgba(0,255,156,0.35)]"
          : isDragging
          ? "border-[#FF4D4F] bg-[rgba(255,77,79,0.07)]"
          : "border-[rgba(255,255,255,0.14)] bg-[rgba(7,20,42,0.55)]"
      }`}
    >
      <div
        className="w-7 h-7 rounded-full border-2 border-dashed mb-1.5 opacity-25"
        style={{ borderColor: isDragging && isCompatible ? "#00FF9C" : isDragging ? "#FF4D4F" : "#fff" }}
      />
      <div className="text-[10px] font-bold text-gray-400 tracking-wide">{position}</div>
      <div className="text-[7px] text-gray-600 mt-0.5">Arraste aqui</div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface PlayerFieldCardProps {
  player: SquadPlayer;
  position: string;
  isCompatible: boolean;
  onDragStart: () => void;
  onRemove: () => void;
}

export const PlayerFieldCard = memo(function PlayerFieldCard({
  player,
  position,
  isCompatible,
  onDragStart,
  onRemove,
}: PlayerFieldCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => { setShowTooltip(false); }, [player.id]);

  const ovr      = player.overallRating;
  const tier     = getCardTier(ovr);
  const keyStats = getKeyStats(player.position, player.stats);
  const topDna   = player.dna ? getTopDna(player.dna) : null;
  const lastName = player.name.split(" ").pop() ?? player.name;

  const borderColor = isCompatible ? tier.border : "rgba(255,77,79,0.90)";
  const boxShadow   = isCompatible ? tier.glow   : "0 0 14px rgba(255,77,79,0.55)";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="relative cursor-move group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && <PlayerTooltip player={player} />}

      {/* FUT-style card */}
      <div
        className="w-[88px] rounded-xl border-2 overflow-hidden hover:scale-105 transition-all duration-200 select-none"
        style={{ background: tier.bg, borderColor, boxShadow }}
      >
        {/* Header: OVR + position (left) | photo (right) */}
        <div className="flex items-start gap-1 px-2 pt-2 pb-1">
          <div className="flex flex-col items-center leading-none flex-shrink-0">
            <span className="text-[20px] font-black leading-none" style={{ color: tier.accent }}>
              {ovr}
            </span>
            <span
              className="text-[7px] font-bold uppercase tracking-wider mt-0.5"
              style={{ color: tier.accent, opacity: 0.75 }}
            >
              {position}
            </span>
          </div>
          <div className="flex-1 flex justify-end">
            <PlayerPhoto name={player.name} image={player.image} ovr={ovr} size="field" />
          </div>
        </div>

        {/* Player name */}
        <div className="px-2 pb-0.5">
          <div className="text-[9px] font-black text-white text-center truncate leading-tight">
            {lastName}
          </div>
          {topDna && (
            <div className="flex justify-center mt-0.5">
              <span
                className="text-[7px] px-1.5 py-[1px] rounded-full font-semibold"
                style={{
                  color: tier.accent,
                  background: tier.shimmer,
                  border: `1px solid ${tier.border}`,
                }}
              >
                {topDna.emoji} {topDna.label}
              </span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-3 px-1.5 pt-1 pb-1.5 mt-0.5"
          style={{ borderTop: `1px solid ${tier.divider}` }}
        >
          {keyStats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-[6px] text-gray-500 uppercase">{label}</div>
              <div className="text-[9px] font-black" style={{ color: tier.accent }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Remove button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF4D4F] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
      >
        <Minus className="w-3 h-3 text-white" />
      </button>
    </div>
  );
});
