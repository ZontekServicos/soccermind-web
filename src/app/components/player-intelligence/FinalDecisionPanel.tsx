import { Trophy } from "lucide-react";
import { t as translate } from "../../../i18n";

interface FinalDecisionPanelProps {
  playerAName: string;
  playerBName: string;
  finalDecision: {
    betterPlayer: { playerName: string };
    saferPlayer: { playerName: string };
    higherUpside: { playerName: string };
    bestTacticalFit: { playerName: string };
  };
  confidence?: number;
  insights: string[];
  summary?: string;
}

export function FinalDecisionPanel({
  playerAName,
  playerBName,
  finalDecision,
  confidence = 0,
  insights,
  summary,
}: FinalDecisionPanelProps) {
  const visibleReasons = insights.filter(Boolean).slice(0, 5);
  const decisionTiles = [
    { label: translate("decision.betterPlayer"), value: finalDecision.betterPlayer.playerName || translate("comparison.balanced") },
    { label: translate("decision.saferPlayer"), value: finalDecision.saferPlayer.playerName || translate("comparison.balanced") },
    { label: translate("decision.higherUpside"), value: finalDecision.higherUpside.playerName || translate("comparison.balanced") },
    { label: translate("decision.bestTacticalFit"), value: finalDecision.bestTacticalFit.playerName || translate("comparison.balanced") },
  ];

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[rgba(0,194,255,0.24)] bg-[linear-gradient(135deg,rgba(10,27,53,0.98),rgba(11,19,41,0.96))] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.18),transparent_65%)] blur-2xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.12),transparent_72%)] blur-2xl" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">
            <Trophy className="h-3.5 w-3.5" />
            {translate("decision.title")}
          </div>
          <h2 className="mt-4 text-3xl font-semibold text-white">{finalDecision.betterPlayer.playerName || translate("comparison.balanced")}</h2>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-gray-500">
            {playerAName} vs {playerBName}
          </p>
          {summary ? <p className="mt-3 max-w-2xl text-sm text-gray-400">{summary}</p> : null}
        </div>

        <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{translate("comparison.confidence")}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{confidence}%</p>
        </div>
      </div>

      <div className="relative mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {decisionTiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4"
          >
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{tile.label}</p>
            <p className="mt-3 text-base font-semibold text-white">{tile.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {visibleReasons.map((reason, index) => (
          <div
            key={`${index}-${reason.slice(0, 20)}`}
            className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4"
          >
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{translate("decision.reason", { index: index + 1 })}</p>
            <p className="mt-3 text-sm leading-6 text-white">{reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
