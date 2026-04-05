import { Link } from "react-router";
import { memo, ReactNode } from "react";
import { motion } from "motion/react";
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

  const displaySubtitle = subtitle || t("login.subtitle");

  return (
    <div
      className="min-h-screen relative flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0A0E27 0%, #0F1830 50%, #141B3A 100%)" }}
      key={language}
    >
      {/* BLOBS ANIMADOS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Blob 1 - Azul Ciano */}
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(0,194,255,0.6) 0%, rgba(0,194,255,0) 70%)",
            filter: "blur(80px)",
          }}
          initial={{ x: -200, y: -200 }}
          animate={{ x: [-200, -100, -200], y: [-200, -100, -200], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Blob 2 - Roxo */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(122,92,255,0.7) 0%, rgba(122,92,255,0) 70%)",
            filter: "blur(90px)",
            right: "-150px",
            top: "20%",
          }}
          animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Blob 3 - Verde */}
        <motion.div
          className="absolute w-[550px] h-[550px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(0,255,156,0.5) 0%, rgba(0,255,156,0) 70%)",
            filter: "blur(100px)",
            left: "50%",
            bottom: "-100px",
          }}
          animate={{ x: [-50, 50, -50], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Noise Texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 0%, rgba(10,14,39,0.4) 100%)" }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-10 p-4 lg:p-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link to="/" className="inline-block group">
            <div className="flex items-center gap-3">
              <motion.img
                src={soccerMindLogo}
                alt="Soccer Mind"
                className="h-14 lg:h-16 w-14 lg:w-16 object-contain"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
                style={{ filter: "drop-shadow(0 4px 16px rgba(0, 194, 255, 0.4))" }}
                onError={(event) => { event.currentTarget.src = fallbackImage; }}
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
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          className="w-full max-w-[440px]"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <div className="relative">
            {/* Card Glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-[#00C2FF]/20 via-[#7A5CFF]/10 to-transparent rounded-[26px] blur-xl opacity-60" />

            {/* Glassmorphism Card */}
            <motion.div
              className="relative rounded-[24px] p-8"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(30px)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
              }}
              whileHover={{
                boxShadow: "0 12px 48px 0 rgba(0, 194, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)",
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Inner gradient */}
              <div
                className="absolute inset-0 rounded-[24px] pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(0,194,255,0.1) 0%, transparent 50%, rgba(122,92,255,0.08) 100%)",
                }}
              />

              {/* Title */}
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
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
              </motion.div>

              {/* Form */}
              <div className="relative z-10">{children}</div>
            </motion.div>
          </div>

          {showBackToHome && (
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Link
                to="/"
                className="text-sm text-gray-400/70 hover:text-[#00C2FF] transition-all duration-300 inline-flex items-center gap-2 group"
              >
                <span className="transition-transform group-hover:-translate-x-1">←</span>
                Voltar
              </Link>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="relative z-10 p-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <p className="text-xs text-gray-500/60">© 2026 Soccer Mind. {t("login.footer")}</p>
      </motion.footer>
    </div>
  );
});

AuthLayout.displayName = "AuthLayout";
