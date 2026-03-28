import type { ReactNode } from "react";

interface SectionCardProps {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "cyan" | "green" | "purple" | "amber";
  aside?: ReactNode;
  children: ReactNode;
}

const accentStyles = {
  cyan: {
    border: "border-[rgba(0,194,255,0.22)]",
    glow: "shadow-[0_18px_50px_rgba(0,194,255,0.08)]",
    line: "bg-[#00C2FF]",
    eyebrow: "text-[#9BE7FF]",
  },
  green: {
    border: "border-[rgba(0,255,156,0.18)]",
    glow: "shadow-[0_18px_50px_rgba(0,255,156,0.08)]",
    line: "bg-[#00FF9C]",
    eyebrow: "text-[#B6FFD8]",
  },
  purple: {
    border: "border-[rgba(168,85,247,0.22)]",
    glow: "shadow-[0_18px_50px_rgba(168,85,247,0.10)]",
    line: "bg-[#A855F7]",
    eyebrow: "text-[#D8B4FE]",
  },
  amber: {
    border: "border-[rgba(251,191,36,0.2)]",
    glow: "shadow-[0_18px_50px_rgba(251,191,36,0.08)]",
    line: "bg-[#FBBF24]",
    eyebrow: "text-[#FDE68A]",
  },
};

export function SectionCard({
  eyebrow,
  title,
  description,
  accent = "cyan",
  aside,
  children,
}: SectionCardProps) {
  const style = accentStyles[accent];

  return (
    <section className={`relative overflow-hidden rounded-[26px] border bg-[linear-gradient(180deg,rgba(11,24,48,0.98),rgba(7,20,42,0.98))] ${style.border} ${style.glow}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
      <div className="flex flex-col gap-5 border-b border-[rgba(255,255,255,0.06)] px-6 py-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className={`text-[11px] uppercase tracking-[0.28em] ${style.eyebrow}`}>{eyebrow}</p>
          <div className="flex items-center gap-3">
            <div className={`h-9 w-1 rounded-full ${style.line}`} />
            <div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
        </div>
        {aside}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}
