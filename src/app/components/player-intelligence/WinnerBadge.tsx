interface WinnerBadgeProps {
  winner: "A" | "B" | "DRAW" | "playerA" | "playerB" | "draw";
  nameA: string;
  nameB: string;
  label?: string;
}

function normalizeWinner(winner: WinnerBadgeProps["winner"]) {
  if (winner === "playerA") return "A";
  if (winner === "playerB") return "B";
  if (winner === "draw") return "DRAW";
  return winner;
}

function resolveWinnerLabel(winner: WinnerBadgeProps["winner"], nameA: string, nameB: string) {
  const normalized = normalizeWinner(winner);
  if (normalized === "A") return nameA;
  if (normalized === "B") return nameB;
  return "Balanced";
}

function resolveWinnerTone(winner: WinnerBadgeProps["winner"]) {
  const normalized = normalizeWinner(winner);
  if (normalized === "A") {
    return "border-[rgba(0,194,255,0.24)] bg-[rgba(0,194,255,0.10)] text-[#9BE7FF]";
  }

  if (normalized === "B") {
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
  const normalized = normalizeWinner(winner);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${resolveWinnerTone(winner)}`}
    >
      {label}: {resolveWinnerLabel(normalized, nameA, nameB)}
    </span>
  );
}
