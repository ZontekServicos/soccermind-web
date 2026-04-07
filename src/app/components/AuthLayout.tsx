import { Link } from "react-router";
import { memo, ReactNode } from "react";
import logo from "../../assets/logo.png";
import soccerMindLogo from "../../assets/hero-image.png";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";

const fallbackImage = "/placeholder.png";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackToHome?: boolean;
  backgroundVariant?: "subtle" | "premium";
}

export const AuthLayout = memo(({ children, subtitle, showBackToHome = false }: AuthLayoutProps) => {
  const { t, language } = useLanguage();

  const displaySubtitle = subtitle || t("login.subtitle");

  return (
    <div
      className="min-h-screen relative flex flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 20% 20%, rgba(0,194,255,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(122,92,255,0.10) 0%, transparent 55%), linear-gradient(135deg, #0A0E27 0%, #0F1830 50%, #141B3A 100%)",
      }}
      key={language}
    >
      {/* Static ambient light — no animation, GPU-safe */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(0,194,255,0.5) 0%, rgba(0,194,255,0) 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-[20%] -right-32 w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(122,92,255,0.6) 0%, rgba(122,92,255,0) 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute -bottom-20 left-1/2 w-[450px] h-[450px] rounded-full opacity-12"
          style={{
            background: "radial-gradient(circle, rgba(0,255,156,0.4) 0%, rgba(0,255,156,0) 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, rgba(10,14,39,0.35) 100%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 lg:p-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link to="/" className="inline-block group">
            <div className="flex items-center gap-3">
              <img
                src={soccerMindLogo}
                alt="Soccer Mind"
                className="h-14 lg:h-16 w-14 lg:w-16 object-contain transition-transform duration-200 group-hover:scale-105"
                style={{ filter: "drop-shadow(0 4px 16px rgba(0,194,255,0.35))" }}
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
              <div className="flex flex-col">
                <span
                  className="font-black text-[20px] lg:text-[22px] leading-none tracking-tight"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #FFFFFF 0%, #00C6FF 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Soccer Mind
                </span>
                <span className="text-[9px] lg:text-[10px] font-bold text-[#00C6FF]/80 uppercase tracking-[0.15em] mt-0.5">
                  AI Platform
                </span>
              </div>
            </div>
          </Link>

          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-[440px]">
          <div className="relative">
            {/* Card glow — static */}
            <div className="absolute -inset-1 bg-gradient-to-br from-[#00C2FF]/20 via-[#7A5CFF]/10 to-transparent rounded-[26px] blur-xl opacity-60" />

            {/* Glassmorphism card */}
            <div
              className="relative rounded-[24px] p-8"
              style={{
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.37), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {/* Inner gradient */}
              <div
                className="absolute inset-0 rounded-[24px] pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,194,255,0.1) 0%, transparent 50%, rgba(122,92,255,0.08) 100%)",
                }}
              />

              {/* Title */}
              <div className="text-center mb-6">
                <h1
                  className="text-[32px] lg:text-[36px] font-black mb-3 tracking-tight leading-none"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #FFFFFF 0%, #00C6FF 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Bem-vindo
                </h1>
                <p className="text-[14px] text-gray-400/80 font-light tracking-wide">
                  {displaySubtitle}
                </p>
              </div>

              {/* Form */}
              <div className="relative z-10">{children}</div>
            </div>
          </div>

          {showBackToHome && (
            <div className="text-center mt-4">
              <Link
                to="/"
                className="text-sm text-gray-400/70 hover:text-[#00C2FF] transition-colors duration-200 inline-flex items-center gap-2 group"
              >
                <span className="transition-transform group-hover:-translate-x-1">←</span>
                Voltar
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-xs text-gray-500/60">© 2026 Soccer Mind. {t("login.footer")}</p>
      </footer>
    </div>
  );
});

AuthLayout.displayName = "AuthLayout";
