import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Mail, Lock } from "lucide-react";
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
        <div className="flex items-center justify-between">
          <CheckboxField id="remember" label={t("login.remember_me")} checked={rememberMe} onChange={setRememberMe} />
          <Link
            to="/forgot-password"
            className="text-sm text-[#67E8F9] hover:text-[#00C2FF] transition-colors duration-200 font-semibold"
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
        <div className="relative pt-4">
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
        </div>

        {/* Contact Link */}
        <div className="text-center space-y-2 pt-2">
          <p className="text-sm text-gray-400/80 font-medium">{t("login.no_account")}</p>
          <a
            href="https://wa.me/5511913267962"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[15px] text-[#00C6FF] hover:text-[#67E8F9] font-bold transition-colors duration-200"
          >
            {t("login.contact_team")} →
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}