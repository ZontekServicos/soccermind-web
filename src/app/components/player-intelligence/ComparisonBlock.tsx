import { WinnerBadge } from "./WinnerBadge";
import { t as translate } from "../../../i18n";

export interface ComparisonMetricItem {
  label: string;
  valueA: number;
  valueB: number;
  inverse?: boolean;
  format?: (value: number) => string;
}

interface ComparisonBlockProps {
  title: string;
  description: string;
  nameA: string;
  nameB: string;
  items: ComparisonMetricItem[];
  forcedWinner?: "A" | "B" | "DRAW" | "playerA" | "playerB" | "draw";
}

function getWinner(valueA: number, valueB: number, inverse = false): "A" | "B" | "DRAW" {
  if (Math.abs(valueA - valueB) < 0.01) {
    return "DRAW";
  }

  if (inverse) {
    return valueA < valueB ? "A" : "B";
  }

  return valueA > valueB ? "A" : "B";
}

function normalizeWinner(value: ComparisonBlockProps["forcedWinner"]) {
  if (value === "playerA") return "A";
  if (value === "playerB") return "B";
  if (value === "draw") return "DRAW";
  return value ?? "DRAW";
}

function getWidth(value: number, maxValue: number) {
  if (maxValue <= 0) {
    return 8;
  }

  return Math.max(8, Math.min(100, (value / maxValue) * 100));
}

export function ComparisonBlock({
  title,
  description,
  nameA,
  nameB,
  items,
  forcedWinner,
}: ComparisonBlockProps) {
  const visibleItems = items.slice(0, 5);
  const totalA = visibleItems.reduce((sum, item) => sum + (item.inverse ? 100 - item.valueA : item.valueA), 0);
  const totalB = visibleItems.reduce((sum, item) => sum + (item.inverse ? 100 - item.valueB : item.valueB), 0);
  const blockWinner = forcedWinner ? normalizeWinner(forcedWinner) : getWinner(totalA, totalB);

  return (
    <section className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">{title}</p>
          <p className="mt-2 text-sm text-gray-400">{description}</p>
        </div>
        <WinnerBadge winner={blockWinner} nameA={nameA} nameB={nameB} label={title} />
      </div>

      <div className="mt-4 space-y-4">
        {visibleItems.map((item) => {
          const maxValue = Math.max(item.valueA, item.valueB, 1);
          const metricWinner = getWinner(item.valueA, item.valueB, item.inverse);
          const format = item.format ?? ((value: number) => value.toFixed(0));

          return (
            <div key={item.label} className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,20,42,0.68)] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">{item.label}</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                  {metricWinner === "DRAW"
                    ? translate("comparison.balanced")
                    : `${metricWinner === "A" ? nameA : nameB} ${translate("comparison.edge")}`}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="text-left">
                  <p className={`text-lg font-semibold ${metricWinner === "A" ? "text-[#9BE7FF]" : "text-white"}`}>{format(item.valueA)}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#0EA5E9,#38BDF8)]" style={{ width: `${getWidth(item.valueA, maxValue)}%` }} />
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{translate("comparison.vs")}</span>

                <div className="text-right">
                  <p className={`text-lg font-semibold ${metricWinner === "B" ? "text-[#E9D5FF]" : "text-white"}`}>{format(item.valueB)}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                    <div className="ml-auto h-full rounded-full bg-[linear-gradient(90deg,#A855F7,#C084FC)]" style={{ width: `${getWidth(item.valueB, maxValue)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
