import type { MarketRiskProfile } from "../../types/player-intelligence";
import { SectionCard } from "./SectionCard";

interface MarketRiskSectionProps {
  marketRisk: MarketRiskProfile;
}

function formatMarketValue(value: number | null) {
  if (value === null) return "N/A";
  if (value >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `EUR ${(value / 1_000).toFixed(0)}K`;
  return `EUR ${value.toFixed(0)}`;
}

function RiskLine({
  label,
  score,
  summary,
}: {
  label: string;
  score: number;
  summary: string;
}) {
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{label}</p>
        <span className="text-sm font-semibold text-white">{score}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div className={`h-full rounded-full ${score >= 68 ? "bg-[#FF4D4F]" : score >= 50 ? "bg-[#FBBF24]" : "bg-[#00FF9C]"}`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-400">{summary}</p>
    </div>
  );
}

export function MarketRiskSection({ marketRisk }: MarketRiskSectionProps) {
  return (
    <SectionCard
      eyebrow="Market & Risk"
      title="Transaction framing"
      description="Pricing, salary and risk ranges are isolated into a dedicated block so real market feeds can replace the mocks cleanly."
      accent="amber"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Market Value</p>
            <p className="mt-3 text-2xl font-semibold text-white">{formatMarketValue(marketRisk.marketValue)}</p>
          </div>
          <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Salary Range</p>
            <p className="mt-3 text-lg font-semibold text-white">{marketRisk.salaryRange.label}</p>
          </div>
          <RiskLine label={`Liquidity · ${marketRisk.liquidity.label}`} score={marketRisk.liquidity.score} summary={marketRisk.liquidity.summary} />
          <RiskLine label={`Resale Potential · ${marketRisk.resalePotential.label}`} score={marketRisk.resalePotential.score} summary={marketRisk.resalePotential.summary} />
        </div>
        <div className="space-y-4">
          <RiskLine label={`Physical Risk · ${marketRisk.physicalRisk.label}`} score={marketRisk.physicalRisk.score} summary={marketRisk.physicalRisk.summary} />
          <RiskLine label={`Tactical Adaptation · ${marketRisk.tacticalAdaptationRisk.label}`} score={marketRisk.tacticalAdaptationRisk.score} summary={marketRisk.tacticalAdaptationRisk.summary} />
          <RiskLine label={`Financial Risk · ${marketRisk.financialRisk.label}`} score={marketRisk.financialRisk.score} summary={marketRisk.financialRisk.summary} />
        </div>
      </div>
    </SectionCard>
  );
}
