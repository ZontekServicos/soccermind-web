import { memo, useState } from "react";
import { Minus } from "lucide-react";
import type { DnaScore, SquadPlayer } from "../types/squad";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getOvrGlow(ovr: number): string {
  if (ovr >= 80) return "border-[#00FF9C] shadow-[0_0_14px_rgba(0,255,156,0.55)]";
  if (ovr >= 70) return "border-[#fbbf24] shadow-[0_0_14px_rgba(251,191,36,0.55)]";
  return "border-[#FF4D4F] shadow-[0_0_14px_rgba(255,77,79,0.55)]";
}

function getOvrColor(ovr: number): string {
  if (ovr >= 80) return "text-[#00FF9C]";
  if (ovr >= 70) return "text-[#fbbf24]";
  return "text-[#FF4D4F]";
}

interface TopDna {
  label: string;
  emoji: string;
  value: number;
}

export function getTopDna(dna: DnaScore): TopDna {
  const dims = [
    { key: "impact" as const, label: "Impact", emoji: "⚡" },
    { key: "intelligence" as const, label: "Intel", emoji: "🧠" },
    { key: "defensiveIQ" as const, label: "Def IQ", emoji: "🛡" },
    { key: "consistency" as const, label: "Steady", emoji: "⚖" },
  ];

  let top = dims[0];
  let topVal = dna[dims[0].key];

  for (const dim of dims.slice(1)) {
    const val = dna[dim.key];
    if (val > topVal) {
      top = dim;
      topVal = val;
    }
  }

  return { label: top.label, emoji: top.emoji, value: topVal };
}

// ─── PlayerPhoto ────────────────────────────────────────────────────────────

interface PlayerPhotoProps {
  name: string;
  image?: string | null;
  ovr: number;
  size?: "sm" | "md";
}

export function PlayerPhoto({ name, image, ovr, size = "sm" }: PlayerPhotoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dim = size === "md" ? "w-10 h-10" : "w-8 h-8";
  const textSize = size === "md" ? "text-sm" : "text-[10px]";
  const glowBorder = getOvrGlow(ovr);

  if (image && !imgFailed) {
    return (
      <div
        className={`${dim} rounded-full overflow-hidden border-2 flex-shrink-0 ${glowBorder}`}
      >
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
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] flex items-center justify-center flex-shrink-0 border-2 ${glowBorder}`}
    >
      <span className={`${textSize} font-bold text-white`}>{initials}</span>
    </div>
  );
}

// ─── Stats keys per position ─────────────────────────────────────────────────

function getKeyStats(
  position: string,
  stats: SquadPlayer["stats"],
): Array<{ label: string; value: number }> {
  if (position === "Goleiro") {
    return [
      { label: "DEF", value: stats.defending },
      { label: "PHY", value: stats.physical },
      { label: "PAS", value: stats.passing },
    ];
  }
  if (["Zagueiro", "Lateral Esquerdo", "Lateral Direito"].includes(position)) {
    return [
      { label: "DEF", value: stats.defending },
      { label: "PHY", value: stats.physical },
      { label: "PAS", value: stats.passing },
    ];
  }
  if (position === "Volante") {
    return [
      { label: "DEF", value: stats.defending },
      { label: "PAS", value: stats.passing },
      { label: "PHY", value: stats.physical },
    ];
  }
  if (position === "Meia Atacante") {
    return [
      { label: "PAS", value: stats.passing },
      { label: "DRI", value: stats.dribbling },
      { label: "SHO", value: stats.shooting },
    ];
  }
  // Atacante
  return [
    { label: "SHO", value: stats.shooting },
    { label: "PAC", value: stats.pace },
    { label: "DRI", value: stats.dribbling },
  ];
}

// ─── Tooltip ────────────────────────────────────────────────────────────────

function PlayerTooltip({ player }: { player: SquadPlayer }) {
  const { stats, dna, age, potential } = player;

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#07142A] border border-[rgba(0,194,255,0.4)] rounded-lg p-3 shadow-2xl pointer-events-none">
      <p className="text-xs font-bold text-white mb-2 truncate">{player.name}</p>

      {/* FIFA stats */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        {[
          { label: "PAC", value: stats.pace },
          { label: "SHO", value: stats.shooting },
          { label: "PAS", value: stats.passing },
          { label: "DRI", value: stats.dribbling },
          { label: "DEF", value: stats.defending },
          { label: "PHY", value: stats.physical },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-[8px] text-gray-400">{label}</div>
            <div className="text-[10px] font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* DNA */}
      {dna && (
        <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
          <p className="text-[8px] text-gray-400 uppercase tracking-wider mb-1">DNA SoccerMind</p>
          {[
            { label: "⚡ Impact", value: dna.impact },
            { label: "🧠 Intelligence", value: dna.intelligence },
            { label: "🛡 Def IQ", value: dna.defensiveIQ },
            { label: "⚖ Consistency", value: dna.consistency },
            { label: "📈 Potential", value: dna.potential },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[8px] text-gray-300">{label}</span>
              <span className="text-[8px] font-bold text-[#00C2FF]">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Age / Potential */}
      <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
        <span className="text-[8px] text-gray-400">{age} anos</span>
        {potential && (
          <span className="text-[8px] text-[#00FF9C]">POT {potential}</span>
        )}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

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
  const ovr = player.overallRating;
  const ovrGlow = getOvrGlow(ovr);
  const ovrColor = getOvrColor(ovr);
  const keyStats = getKeyStats(player.position, player.stats);
  const topDna = player.dna ? getTopDna(player.dna) : null;

  const borderClass = isCompatible
    ? ovrGlow
    : "border-[#FF4D4F] shadow-[0_0_10px_rgba(255,77,79,0.4)]";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="relative cursor-move group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && <PlayerTooltip player={player} />}

      {/* Card */}
      <div
        className={`w-[90px] bg-gradient-to-br from-[#0d2340] to-[#07142A] rounded-xl border-2 ${borderClass} p-2 hover:scale-105 transition-transform`}
      >
        {/* OVR + Photo row */}
        <div className="flex items-center gap-1 mb-1">
          <div className="text-center">
            <div className={`text-lg font-black leading-none ${ovrColor}`}>{ovr}</div>
            <div className="text-[7px] text-gray-500 uppercase">{position}</div>
          </div>
          <div className="flex-1 flex justify-center">
            <PlayerPhoto
              name={player.name}
              image={player.image}
              ovr={ovr}
              size="sm"
            />
          </div>
        </div>

        {/* Player name */}
        <div className="text-[8px] font-bold text-white mb-1 truncate text-center">
          {player.name.split(" ").pop()}
        </div>

        {/* Top DNA badge */}
        {topDna && (
          <div className="flex justify-center mb-1">
            <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-[rgba(0,194,255,0.15)] text-[#00C2FF] font-semibold">
              {topDna.emoji} {topDna.label}
            </span>
          </div>
        )}

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-0.5">
          {keyStats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-[6px] text-gray-500">{label}</div>
              <div className="text-[8px] text-white font-bold">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF4D4F] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
      >
        <Minus className="w-3 h-3 text-white" />
      </button>
    </div>
  );
});
