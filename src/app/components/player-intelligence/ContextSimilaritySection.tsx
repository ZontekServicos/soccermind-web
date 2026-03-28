import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ContextSimilarity } from "../../types/player-intelligence";
import { SectionCard } from "./SectionCard";

interface ContextSimilaritySectionProps {
  context: ContextSimilarity;
}

function formatMarketTick(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

export function ContextSimilaritySection({ context }: ContextSimilaritySectionProps) {
  return (
    <SectionCard
      eyebrow="Context & Similarity"
      title="Fit, comparables and trend path"
      description="This layer keeps similarities, ideal destinations and seasonal trend hooks close to the acquisition call."
      accent="purple"
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Similar Players</p>
            <div className="mt-4 space-y-3">
              {context.similarPlayers.map((player) => (
                <div key={player.id} className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-sm text-gray-400">
                        {player.position} · {player.team}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.08)] px-3 py-1 text-xs font-semibold text-[#9BE7FF]">
                      Fit {player.fitScore}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{player.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Ideal Systems</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {context.idealSystems.map((system) => (
                  <span key={system} className="rounded-full border border-[rgba(0,255,156,0.18)] bg-[rgba(0,255,156,0.08)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#B6FFD8]">
                    {system}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Ideal Clubs</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {context.idealClubs.map((club) => (
                  <span key={club} className="rounded-full border border-[rgba(168,85,247,0.2)] bg-[rgba(168,85,247,0.08)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#E9D5FF]">
                    {club}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Season Trends</p>
          <p className="mt-2 text-sm text-gray-400">Performance curve against projected market movement.</p>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={context.seasonTrends}>
                <defs>
                  <linearGradient id="performanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#00C2FF" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="marketFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="season" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="performance" domain={[40, 100]} tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="market" orientation="right" tickFormatter={formatMarketTick} tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0A1B35", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", color: "#ffffff" }}
                  formatter={(value: number, name: string) => (name === "market" ? [`EUR ${formatMarketTick(value)}`, "Market"] : [value, "Performance"])}
                />
                <Area yAxisId="performance" type="monotone" dataKey="performance" stroke="#00C2FF" fill="url(#performanceFill)" strokeWidth={2} />
                <Area yAxisId="market" type="monotone" dataKey="market" stroke="#A855F7" fill="url(#marketFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
