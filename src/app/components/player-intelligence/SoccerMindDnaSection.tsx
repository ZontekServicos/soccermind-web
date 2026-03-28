import type { SoccerMindDna } from "../../types/player-intelligence";
import { SectionCard } from "./SectionCard";

interface SoccerMindDnaSectionProps {
  dna: SoccerMindDna;
}

const emphasisColor = {
  elite: "from-[#00FF9C] to-[#00C2FF]",
  strong: "from-[#00C2FF] to-[#7A5CFF]",
  stable: "from-[#7A5CFF] to-[#FBBF24]",
  developing: "from-[#FBBF24] to-[#FF4D4F]",
};

export function SoccerMindDnaSection({ dna }: SoccerMindDnaSectionProps) {
  return (
    <SectionCard
      eyebrow="SoccerMind DNA"
      title="Proprietary player traits"
      description="Traits are shaped as reusable intelligence blocks so event feeds can replace the mock layer later."
      accent="purple"
      aside={
        <div className="flex flex-wrap justify-end gap-2">
          {dna.dominantTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[rgba(168,85,247,0.24)] bg-[rgba(168,85,247,0.10)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#E9D5FF]"
            >
              {tag}
            </span>
          ))}
        </div>
      }
    >
      <div className="space-y-4">
        {dna.traits.map((trait) => (
          <div key={trait.key} className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-white">{trait.label}</p>
                  <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                    {trait.emphasis}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400">{trait.note}</p>
              </div>
              <div className="flex items-center gap-4 md:min-w-[220px] md:justify-end">
                <div className="h-2.5 w-full max-w-[180px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                  <div className={`h-full rounded-full bg-gradient-to-r ${emphasisColor[trait.emphasis]}`} style={{ width: `${trait.value}%` }} />
                </div>
                <span className="w-10 text-right text-lg font-semibold text-white">{trait.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
