interface WinnerBadgeProps {
  winner: "A" | "B" | "DRAW";
  nameA: string;
  nameB: string;
  label?: string;
}

function resolveWinnerLabel(winner: "A" | "B" | "DRAW", nameA: string, nameB: string) {
  if (winner === "A") return nameA;
  if (winner === "B") return nameB;
  return "Balanced";
}

function resolveWinnerTone(winner: "A" | "B" | "DRAW") {
  if (winner === "A") {
    return "border-[rgba(0,194,255,0.24)] bg-[rgba(0,194,255,0.10)] text-[#9BE7FF]";
  }

  if (winner === "B") {
    return "border-[rgba(168,85,247,0.24)] bg-[rgba(168,85,247,0.10)] text-[#E9D5FF]";
  }

  return "border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-gray-300";
}

export function WinnerBadge({
  winner,
  nameA,
  nameB,
  label = "Winner",
}: WinnerBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${resolveWinnerTone(winner)}`}
    >
      {label}: {resolveWinnerLabel(winner, nameA, nameB)}
    </span>
  );
}

