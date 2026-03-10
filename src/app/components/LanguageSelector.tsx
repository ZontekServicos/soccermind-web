import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const languages = [
  { code: "pt" as const, label: "PT", flag: "🇧🇷", name: "Português" },
  { code: "en" as const, label: "EN", flag: "🇺🇸", name: "English" },
  { code: "es" as const, label: "ES", flag: "🇪🇸", name: "Español" },
  { code: "de" as const, label: "DE", flag: "🇩🇪", name: "Deutsch" },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((lang) => lang.code === language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Use setTimeout to allow click handlers to fire first
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleLanguageChange = (langCode: "pt" | "en" | "es" | "de") => {
    setLanguage(langCode);
    // Close dropdown after a small delay to ensure the language change is processed
    setTimeout(() => {
      setIsOpen(false);
    }, 50);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,194,255,0.2)] transition-all duration-200 group"
        aria-label="Selecionar idioma"
      >
        <Globe className="w-4 h-4 text-gray-400 group-hover:text-[#00C2FF] transition-colors" />
        <span className="text-sm font-medium text-gray-300">{currentLang.label}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[rgba(10,20,40,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden z-[9999]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLanguageChange(lang.code);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer ${
                language === lang.code
                  ? "bg-[rgba(0,194,255,0.1)] text-[#00C2FF]"
                  : "text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1 text-left font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] shadow-[0_0_8px_rgba(0,194,255,0.6)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
