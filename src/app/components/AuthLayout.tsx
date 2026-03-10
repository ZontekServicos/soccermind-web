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

export const AuthLayout = memo(({ children, title, subtitle, showBackToHome = false, backgroundVariant = "subtle" }: AuthLayoutProps) => {
  const { t, language } = useLanguage();
  
  // Use translation keys if title/subtitle not provided
  const displayTitle = title || t("login.title");
  const displaySubtitle = subtitle || t("login.subtitle");
  
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col relative overflow-hidden" key={language}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[var(--nav-bg)] to-[var(--background)]" />
        
        {/* Logo Background - Watermark */}
        {backgroundVariant === "subtle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src={soccerMindLogo} 
              alt="" 
              className="w-[800px] max-w-[70vw] opacity-[0.03] blur-[1px] mix-blend-overlay select-none"
              style={{ transform: 'translateY(-5%)' }}
              onError={(event) => {
                event.currentTarget.src = fallbackImage;
              }}
            />
          </div>
        )}

        {backgroundVariant === "premium" && (
          <>
            {/* Main Logo - Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={soccerMindLogo} 
                alt="" 
                className="w-[900px] max-w-[75vw] opacity-[0.06] blur-[0.5px] mix-blend-soft-light select-none"
                style={{ transform: 'translateY(-5%)' }}
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
            </div>
            
            {/* Glow Effect around Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[600px] h-[600px] bg-[#00C2FF] opacity-[0.02] blur-[150px] rounded-full" />
            </div>
          </>
        )}
        
        {/* Subtle Glow Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00C2FF] opacity-[0.03] blur-[120px] rounded-full" />
        
        {/* Subtle Glow Bottom Right */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#7A5CFF] opacity-[0.02] blur-[100px] rounded-full" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 194, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 194, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link to="/" className="inline-block group">
            <img 
              src={logo} 
              alt="Soccer Mind" 
              className="h-7 lg:h-8 mix-blend-screen opacity-90 group-hover:opacity-100 transition-opacity" 
              onError={(event) => {
                event.currentTarget.src = fallbackImage;
              }}
            />
          </Link>
          
          {/* Language Selector */}
          <div className="flex items-center">
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-12">
        <div className="w-full max-w-[520px]">
          {/* Card Container with Premium Design */}
          <div className="relative">
            {/* Glow Effect Behind Card */}
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,194,255,0.08)] to-transparent blur-3xl opacity-40" />
            
            {/* Main Card */}
            <div className="relative bg-[rgba(10,20,40,0.7)] backdrop-blur-xl rounded-[20px] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 lg:p-12">
              {/* Subtle Inner Border */}
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent pointer-events-none" />
              
              {/* Title Section */}
              <div className="text-center mb-10">
                <h1 className="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
                  {displayTitle}
                </h1>
                {displaySubtitle && (
                  <p className="text-sm lg:text-base text-gray-400">
                    {displaySubtitle}
                  </p>
                )}
              </div>

              {/* Form Content */}
              <div className="relative z-10">
                {children}
              </div>
            </div>
          </div>

          {/* Back to Home - Hidden now since / is login */}
          {showBackToHome && (
            <div className="text-center mt-6">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-[#00C2FF] transition-colors inline-flex items-center gap-1"
              >
                ← Voltar
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center space-y-2">
        <p className="text-xs text-gray-600">
          © 2026 Soccer Mind. {t("login.footer")}
        </p>
      </footer>
    </div>
  );
});

AuthLayout.displayName = "AuthLayout";
