import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Mail, Lock } from "lucide-react";
import { motion } from "motion/react";
import { AuthLayout } from "../components/AuthLayout";
import { FormField, CheckboxField, AuthButton, AlertMessage, PasswordField } from "../components/AuthFormFields";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.error_generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout backgroundVariant="premium" key={language}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Message */}
        {error && <AlertMessage type="error" message={error} onClose={() => setError("")} />}

        {/* Email Field */}
        <FormField
          id="email"
          type="email"
          label={t("login.email")}
          placeholder={t("login.email_placeholder")}
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isLoading}
        />

        {/* Password Field */}
        <PasswordField
          id="password"
          label={t("login.password")}
          placeholder={t("login.password_placeholder")}
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isLoading}
        />

        {/* Remember Me & Forgot Password */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <CheckboxField id="remember" label={t("login.remember_me")} checked={rememberMe} onChange={setRememberMe} />
          <Link
            to="/forgot-password"
            className="text-sm text-[#67E8F9] hover:text-[#00C2FF] transition-all duration-200 font-semibold"
          >
            {t("login.forgot_password")}
          </Link>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          className="pt-1"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AuthButton type="submit" isLoading={isLoading}>
            {t("login.submit_button")}
          </AuthButton>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="relative pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span
              className="px-4 py-1 text-xs font-semibold text-gray-400/70 uppercase tracking-widest"
              style={{
                background: "rgba(15, 24, 48, 0.8)",
                backdropFilter: "blur(10px)",
                borderRadius: "20px",
              }}
            >
              {t("login.new_to_platform")}
            </span>
          </div>
        </motion.div>

        {/* Contact Link */}
        <motion.div
          className="text-center space-y-2 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p className="text-sm text-gray-400/80 font-medium">{t("login.no_account")}</p>
          <motion.a
            href="https://wa.me/5511913267962"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[15px] text-[#00C6FF] hover:text-[#67E8F9] font-bold transition-all duration-200 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t("login.contact_team")}
            <motion.span
              className="inline-block"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.a>
        </motion.div>
      </form>
    </AuthLayout>
  );
}