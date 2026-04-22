/**
 * Unified player avatar component.
 * Sizes: sm (h-11 w-11), md (h-14 w-14), lg (h-18 w-18)
 * Border color is driven by overall rating.
 */
import { useState } from "react";

const SPORTMONKS_PLACEHOLDER = "placeholder.png";

function borderColor(overall: number | null): string {
  const v = overall ?? 0;
  if (v >= 80) return "rgba(0,255,156,0.6)";
  if (v >= 70) return "rgba(251,191,36,0.5)";
  return "rgba(0,194,255,0.35)";
}

const SIZE_CLASSES = {
  sm: { outer: "h-11 w-11 rounded-[12px]", text: "text-base",  border: "1.5px" },
  md: { outer: "h-14 w-14 rounded-[14px]", text: "text-lg",    border: "2px" },
  lg: { outer: "h-18 w-18 rounded-[16px]", text: "text-xl",    border: "2px" },
};

interface PlayerAvatarProps {
  name: string;
  image: string | null;
  overall: number | null;
  size?: keyof typeof SIZE_CLASSES;
}

export function PlayerAvatar({ name, image, overall, size = "md" }: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hasImage = !!image && !image.includes(SPORTMONKS_PLACEHOLDER) && !failed;
  const bc = borderColor(overall);
  const s = SIZE_CLASSES[size];

  if (hasImage) {
    return (
      <div
        className={`flex-shrink-0 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] ${s.outer}`}
        style={{ border: `${s.border} solid ${bc}` }}
      >
        <img
          src={image!}
          alt={name}
          className="h-full w-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center overflow-hidden font-bold shadow-[0_4px_12px_rgba(0,0,0,0.4)] ${s.outer} ${s.text}`}
      style={{
        background: "linear-gradient(135deg, rgba(0,194,255,0.22) 0%, rgba(122,92,255,0.22) 100%)",
        border: `${s.border} solid ${bc}`,
      }}
    >
      <span className="text-white">{initials}</span>
    </div>
  );
}
