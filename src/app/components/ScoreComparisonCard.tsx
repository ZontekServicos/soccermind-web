import { Card } from "./ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreComparisonCardProps {
  title: string;
  scoreA: number;
  scoreB: number;
  maxScore?: number;
}

export function ScoreComparisonCard({ title, scoreA, scoreB, maxScore = 100 }: ScoreComparisonCardProps) {
  const difference = Math.abs(scoreA - scoreB);
  const winner = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "TIE";
  const percentageA = (scoreA / maxScore) * 100;
  const percentageB = (scoreB / maxScore) * 100;

  return (
    <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm text-gray-400 uppercase tracking-wider">{title}</h4>
        {winner !== "TIE" && (
          <div className="flex items-center gap-1 text-[#00C2FF] text-xs">
            {winner === "A" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>+{difference.toFixed(1)}</span>
          </div>
        )}
        {winner === "TIE" && (
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Minus className="w-3 h-3" />
            <span>Empate</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Jogador A</span>
            <span className={`text-lg ${winner === "A" ? "text-[#00C2FF]" : "text-white"}`}>
              {scoreA.toFixed(1)}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${winner === "A" ? "bg-[#00C2FF]" : "bg-gray-600"} transition-all duration-500`}
              style={{ width: `${percentageA}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Jogador B</span>
            <span className={`text-lg ${winner === "B" ? "text-[#7A5CFF]" : "text-white"}`}>
              {scoreB.toFixed(1)}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${winner === "B" ? "bg-[#7A5CFF]" : "bg-gray-600"} transition-all duration-500`}
              style={{ width: `${percentageB}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
