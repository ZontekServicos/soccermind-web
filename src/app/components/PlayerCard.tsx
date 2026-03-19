import type { SquadPlayer } from "../types/squad";
import { RiskBadge } from "./RiskBadge";

interface PlayerCardProps {
  player: SquadPlayer;
  onClick?: () => void;
  isSelected?: boolean;
  isComparing?: boolean;
  compact?: boolean;
}

export function PlayerCard({ player, onClick, isSelected, isComparing, compact = false }: PlayerCardProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 80) return "text-[#00FF9C]";
    if (rating >= 75) return "text-[#00C2FF]";
    if (rating >= 70) return "text-[#fbbf24]";
    return "text-gray-400";
  };

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`relative bg-gradient-to-br from-[#0A1B35] to-[#07142A] rounded-lg p-3 cursor-pointer transition-all hover:scale-105 border-2 ${
          isSelected
            ? "border-[#00C2FF] shadow-[0_0_25px_rgba(0,194,255,0.6)]"
            : isComparing
            ? "border-[#7A5CFF] shadow-[0_0_25px_rgba(122,92,255,0.6)]"
            : "border-[rgba(0,194,255,0.2)] hover:border-[#00C2FF]"
        }`}
      >
        {/* Overall Rating Badge */}
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#07142A] rounded-full border-2 border-[#00C2FF] flex items-center justify-center">
          <span className={`text-lg font-bold ${getRatingColor(player.overallRating)}`}>
            {player.overallRating}
          </span>
        </div>

        {/* Player Info */}
        <div className="text-center mt-2">
          <div className="text-xs text-[#00C2FF] mb-1">#{player.number}</div>
          <div className="text-sm font-bold mb-1 truncate">{player.name}</div>
          <div className="text-xs text-gray-400 mb-2">{player.position}</div>
          <div className="flex justify-center">
            <RiskBadge level={player.riskLevel} size="sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative bg-gradient-to-br from-[#0A1B35] to-[#07142A] rounded-lg p-4 cursor-pointer transition-all hover:scale-105 border-2 min-w-[180px] ${
        isSelected
          ? "border-[#00C2FF] shadow-[0_0_30px_rgba(0,194,255,0.6)]"
          : isComparing
          ? "border-[#7A5CFF] shadow-[0_0_30px_rgba(122,92,255,0.6)]"
          : "border-[rgba(0,194,255,0.2)] hover:border-[#00C2FF]"
      }`}
    >
      {/* Overall Rating Badge */}
      <div className="absolute -top-3 -right-3 w-14 h-14 bg-[#07142A] rounded-full border-3 border-[#00C2FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,194,255,0.5)]">
        <span className={`text-2xl font-bold ${getRatingColor(player.overallRating)}`}>
          {player.overallRating}
        </span>
      </div>

      {/* Player Number & Nationality */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-[#00C2FF]">#{player.number}</span>
        <span className="text-xs bg-[#00C2FF20] text-[#00C2FF] px-2 py-1 rounded">
          {player.nationality}
        </span>
      </div>

      {/* Player Name */}
      <div className="mb-3">
        <h3 className="font-bold text-lg mb-1">{player.name}</h3>
        <p className="text-xs text-gray-400">{player.position}</p>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">PAC</span>
          <span className="text-white font-bold">{player.stats.pace}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">SHO</span>
          <span className="text-white font-bold">{player.stats.shooting}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">PAS</span>
          <span className="text-white font-bold">{player.stats.passing}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">DRI</span>
          <span className="text-white font-bold">{player.stats.dribbling}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">DEF</span>
          <span className="text-white font-bold">{player.stats.defending}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">PHY</span>
          <span className="text-white font-bold">{player.stats.physical}</span>
        </div>
      </div>

      {/* Risk Badge */}
      <div className="flex justify-center">
        <RiskBadge level={player.riskLevel} size="sm" />
      </div>

      {/* Market Value */}
      <div className="mt-3 text-center text-xs text-[#00C2FF]">{player.marketValue}</div>
    </div>
  );
}
