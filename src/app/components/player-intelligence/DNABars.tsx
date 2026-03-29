import type { SoccerMindDna } from "../../types/player-intelligence";

interface DNABarsProps {
  dna: SoccerMindDna;
  limit?: number;
}

const emphasisTone = {
  elite: "from-[#00FF9C] to-[#00C2FF]",
  strong: "from-[#00C2FF] to-[#7A5CFF]",
  stable: "from-[#7A5CFF] to-[#FBBF24]",
  developing: "from-[#FBBF24] to-[#FF7B7D]",
};

export function DNABars({ dna, limit = 5 }: DNABarsProps) {
  const traits = [...dna.traits].sort((left, right) => right.value - left.value).slice(0, limit);

  return (
    <section className="rounded-[26px] border border-[rgba(168,85,247,0.22)] bg-[linear-gradient(180deg,rgba(18,19,43,0.98),rgba(7,20,42,0.98))] shadow-[0_18px_50px_rgba(168,85,247,0.12)]">
      <div className="border-b border-[rgba(255,255,255,0.06)] px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#E9D5FF]">SoccerMind DNA</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Core behavior signature</h2>
            <p className="mt-2 text-sm text-gray-400">Top traits only. Keep the read fast and directional.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dna.dominantTags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[rgba(168,85,247,0.24)] bg-[rgba(168,85,247,0.10)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E9D5FF]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 px-6 py-6">
        {traits.map((trait) => (
          <div key={trait.key} className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-white">{trait.label}</p>
                  <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                    {trait.emphasis}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400">{trait.note}</p>
              </div>
              <div className="flex min-w-[220px] items-center gap-4">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${emphasisTone[trait.emphasis]}`}
                    style={{ width: `${trait.value}%` }}
                  />
                </div>
                <span className="w-10 text-right text-lg font-semibold text-white">{trait.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

