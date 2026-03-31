import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const languages = [
  { code: "pt-BR" as const, label: "PT", flag: "BR", name: "Português" },
  { code: "en-US" as const, label: "EN", flag: "US", name: "English" },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLang = languages.find((lang) => lang.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (!isOpen) {
      return;
    }

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
    setTimeout(() => {
      setIsOpen(false);
    }, 50);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-3 py-2 transition-all duration-200 hover:border-[rgba(0,194,255,0.2)] hover:bg-[rgba(255,255,255,0.05)]"
        aria-label="Selecionar idioma"
      >
        <Globe className="h-4 w-4 text-gray-400 transition-colors group-hover:text-[#00C2FF]" />
        <span className="text-sm font-medium text-gray-300">{currentLang.label}</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-[9999] mt-2 w-48 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(10,20,40,0.95)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleLanguageChange(lang.code);
              }}
              className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors ${
                language === lang.code
                  ? "bg-[rgba(0,194,255,0.1)] text-[#00C2FF]"
                  : "text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
              }`}
            >
              <span className="text-xs font-semibold tracking-[0.18em] text-gray-400">{lang.flag}</span>
              <span className="flex-1 text-left font-medium">{lang.name}</span>
              {language === lang.code ? <span className="h-1.5 w-1.5 rounded-full bg-[#00C2FF] shadow-[0_0_8px_rgba(0,194,255,0.6)]" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
