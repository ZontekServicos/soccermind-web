import { Card } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface ExecutiveCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  glowColor?: string;
}

export function ExecutiveCard({ title, icon: Icon, children, glowColor = "#00C2FF" }: ExecutiveCardProps) {
  return (
    <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.2)] p-6 relative overflow-hidden">
      {/* Glow effect */}
      <div
        className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 pointer-events-none"
        style={{ background: glowColor }}
      />

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: `${glowColor}20`,
            color: glowColor,
            boxShadow: `0 0 15px ${glowColor}40`,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg uppercase tracking-wider">{title}</h3>
      </div>

      <div className="relative z-10">{children}</div>
    </Card>
  );
}
