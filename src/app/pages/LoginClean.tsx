import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Mail, Lock } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { FormField, CheckboxField, AuthButton, AlertMessage } from "../components/AuthFormFields";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * LOGIN - CLEAN VERSION
 * Versão minimalista e clean do login Soccer Mind
 * Foco em simplicidade e clareza
 */
export default function LoginClean() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();

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
    <AuthLayout backgroundVariant="subtle">
      <form onSubmit={handleSubmit} className="space-y-6">
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
        <FormField
          id="password"
          type="password"
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
        <div className="flex items-center justify-between">
          <CheckboxField id="remember" label={t("login.remember_me")} checked={rememberMe} onChange={setRememberMe} />
          <Link
            to="/forgot-password"
            className="text-sm text-[#00C2FF]/90 hover:text-[#00C2FF] transition-colors font-medium"
          >
            {t("login.forgot_password")}
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-1">
          <AuthButton type="submit" isLoading={isLoading}>
            {t("login.submit_button")}
          </AuthButton>
        </div>

        {/* Divider */}
        <div className="relative pt-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[rgba(255,255,255,0.06)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[rgba(10,20,40,0.7)] px-4 text-gray-600">{t("login.new_to_platform")}</span>
          </div>
        </div>

        {/* Contact Link */}
        <div className="text-center space-y-1.5">
          <p className="text-sm text-gray-500/80">{t("login.no_account")}</p>
          <a
            href="https://wa.me/5511913267962"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#00C2FF]/90 hover:text-[#00C2FF] font-medium transition-colors group"
          >
            {t("login.contact_team")}
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}