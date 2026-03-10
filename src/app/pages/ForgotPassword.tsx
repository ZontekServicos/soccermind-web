import { useState } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { FormField, AuthButton, AlertMessage } from "../components/AuthFormFields";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forgot.error_generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("forgot.title")}
      subtitle={t("forgot.subtitle")}
      showBackToHome={false}
      key={language}
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Error Message */}
        {error && <AlertMessage type="error" message={error} onClose={() => setError("")} />}

        {/* Success Message */}
        {success && (
          <AlertMessage
            type="success"
            message={t("forgot.success_message")}
            onClose={() => setSuccess(false)}
          />
        )}

        {!success ? (
          <>
            {/* Info */}
            <div className="bg-[rgba(0,194,255,0.05)] border border-[rgba(0,194,255,0.15)] rounded-[14px] p-4 backdrop-blur-sm">
              <p className="text-sm text-gray-400/90 leading-relaxed">
                {t("forgot.info")}
              </p>
            </div>

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

            {/* Submit Button */}
            <div className="pt-1">
              <AuthButton type="submit" isLoading={isLoading}>
                {t("forgot.submit")}
              </AuthButton>
            </div>
          </>
        ) : (
          <>
            {/* Success Instructions */}
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[rgba(0,255,156,0.12)] border border-[rgba(0,255,156,0.3)] flex items-center justify-center mx-auto">
                <span className="text-3xl">✓</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">{t("forgot.success_title")}</h3>
                <p className="text-sm text-gray-400/90 leading-relaxed">
                  {t("forgot.success_text")} <strong className="text-[#00C2FF]">{email}</strong>
                </p>
                <p className="text-xs text-gray-500/80">
                  {t("forgot.success_spam")}
                </p>
              </div>

              {/* Resend Button */}
              <AuthButton type="button" variant="secondary" onClick={() => setSuccess(false)}>
                {t("forgot.resend")}
              </AuthButton>
            </div>
          </>
        )}

        {/* Back to Login */}
        <div className="text-center pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-[#00C2FF] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("forgot.back_login")}
          </Link>
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-xs text-gray-600/80 mb-2">{t("forgot.need_help")}</p>
          <a
            href="https://wa.me/5511913267962"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00C2FF]/90 hover:text-[#00C2FF] transition-colors font-medium"
          >
            {t("forgot.contact_support")}
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}