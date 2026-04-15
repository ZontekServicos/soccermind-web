import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const languages = [
  { code: "pt-BR" as const, label: "PT", flag: "🇧🇷", name: "Português" },
  { code: "en-US" as const, label: "EN", flag: "🇺🇸", name: "English" },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLang = languages.find((lang) => lang.code === language) ?? languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (!isOpen) return;
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode: "pt-BR" | "en-US") => {
    setLanguage(langCode);
    setTimeout(() => setIsOpen(false), 50);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="group flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 transition-all duration-200 hover:border-[rgba(0,194,255,0.22)] hover:bg-white/[0.055]"
        aria-label="Selecionar idioma"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] leading-none">{currentLang.flag}</span>
        <span className="text-[12px] font-semibold tracking-[0.12em] text-white/70 transition-colors group-hover:text-white/90">
          {currentLang.label}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-white/30 transition-all duration-200 group-hover:text-white/50 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[9999] mt-2 w-44 overflow-hidden rounded-xl border border-white/[0.10] bg-[rgba(8,16,32,0.96)] shadow-[0_10px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {/* top shimmer */}
          <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

          {languages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLanguageChange(lang.code);
                }}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[rgba(0,194,255,0.09)] text-[#00C2FF]"
                    : "text-white/60 hover:bg-white/[0.045] hover:text-white/90"
                }`}
              >
                <span className="text-[16px] leading-none">{lang.flag}</span>
                <span className="text-[11px] font-bold tracking-[0.16em] opacity-80">{lang.label}</span>
                <span className="flex-1 text-left text-[12px] font-medium">{lang.name}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00C2FF] shadow-[0_0_6px_rgba(0,194,255,0.7)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
