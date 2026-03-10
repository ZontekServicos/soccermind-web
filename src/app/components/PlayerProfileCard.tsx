import { Card } from "./ui/card";
import { TierBadge } from "./TierBadge";
import { RiskBadge } from "./RiskBadge";
import { CapitalGauge } from "./CapitalGauge";

export interface PlayerProfile {
  id: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  club: string;
  overallRating: number;
  tier: "ELITE" | "A" | "B" | "C" | "DEVELOPMENT";
  positionRank: number;
  capitalEfficiency: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  photoUrl?: string;
}

interface PlayerProfileCardProps {
  player: PlayerProfile;
  variant?: "A" | "B";
  compact?: boolean;
}

export function PlayerProfileCard({ player, variant = "A", compact = false }: PlayerProfileCardProps) {
  const accentColor = variant === "A" ? "#00C2FF" : "#7A5CFF";

  return (
    <Card
      className="bg-[#0A1B35] border-2 p-6 relative overflow-hidden"
      style={{ borderColor: accentColor }}
    >
      {/* Glow effect */}
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{
          background: accentColor,
          boxShadow: `0 0 20px ${accentColor}`,
        }}
      />

      <div className="flex items-start gap-4">
        {/* Player Photo */}
        <div
          className="w-24 h-24 rounded-lg overflow-hidden border-2 flex items-center justify-center bg-gray-800"
          style={{ borderColor: accentColor }}
        >
          {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">⚽</span>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-2xl mb-1">{player.name}</h3>
              <p className="text-sm text-gray-400">
                {player.position} • {player.age} anos • {player.nationality}
              </p>
              <p className="text-xs text-gray-500 mt-1">{player.club}</p>
            </div>
            <TierBadge tier={player.tier} />
          </div>

          {!compact && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Overall</p>
                <p className="text-3xl" style={{ color: accentColor }}>
                  {player.overallRating}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Position Rank</p>
                <p className="text-3xl text-white">#{player.positionRank}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Risk Level</p>
                <RiskBadge level={player.riskLevel} className="mt-2" />
              </div>
            </div>
          )}
        </div>

        {/* Capital Efficiency Gauge */}
        {!compact && (
          <div className="flex items-center">
            <CapitalGauge value={player.capitalEfficiency} size="sm" showLabel={false} />
          </div>
        )}
      </div>
    </Card>
  );
}
