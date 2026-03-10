import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Lock, CheckCircle } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { FormField, AuthButton, AlertMessage } from "../components/AuthFormFields";
import { useAuth } from "../contexts/AuthContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword } = useAuth();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (!token) {
      setError("Token inválido ou expirado");
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Senha Redefinida" showBackToHome={false}>
        <div className="text-center space-y-7">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-[rgba(0,255,156,0.12)] border border-[rgba(0,255,156,0.3)] flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-[#00FF9C]" />
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Senha Atualizada com Sucesso!</h2>
            <p className="text-sm text-gray-400/90 leading-relaxed">
              Sua senha foi redefinida. Agora você pode fazer login com a nova senha.
            </p>
          </div>

          {/* Login Button */}
          <div className="pt-2">
            <AuthButton onClick={() => navigate("/")}>Ir para Login</AuthButton>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Redefinir Senha" subtitle="Digite sua nova senha abaixo" showBackToHome={false}>
      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Error Message */}
        {error && <AlertMessage type="error" message={error} onClose={() => setError("")} />}

        {/* Password Requirements */}
        <div className="bg-[rgba(0,194,255,0.05)] border border-[rgba(0,194,255,0.15)] rounded-[14px] p-4 backdrop-blur-sm">
          <p className="text-sm text-gray-400/90 mb-3 font-semibold">Requisitos da senha:</p>
          <ul className="space-y-2 text-xs text-gray-500">
            <li className="flex items-center gap-2">
              <span className={password.length >= 8 ? "text-[#00FF9C]" : ""}>
                {password.length >= 8 ? "✓" : "○"}
              </span>
              Mínimo de 8 caracteres
            </li>
            <li className="flex items-center gap-2">
              <span className={/[A-Z]/.test(password) ? "text-[#00FF9C]" : ""}>
                {/[A-Z]/.test(password) ? "✓" : "○"}
              </span>
              Pelo menos uma letra maiúscula
            </li>
            <li className="flex items-center gap-2">
              <span className={/[0-9]/.test(password) ? "text-[#00FF9C]" : ""}>
                {/[0-9]/.test(password) ? "✓" : "○"}
              </span>
              Pelo menos um número
            </li>
          </ul>
        </div>

        {/* Password Field */}
        <FormField
          id="password"
          type="password"
          label="Nova Senha"
          placeholder="Digite sua nova senha"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={isLoading}
        />

        {/* Confirm Password Field */}
        <FormField
          id="confirmPassword"
          type="password"
          label="Confirmar Senha"
          placeholder="Digite novamente sua senha"
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={isLoading}
          error={confirmPassword && password !== confirmPassword ? "As senhas não coincidem" : undefined}
        />

        {/* Submit Button */}
        <div className="pt-1">
          <AuthButton
            type="submit"
            isLoading={isLoading}
            disabled={!password || !confirmPassword || password !== confirmPassword}
          >
            Redefinir Senha
          </AuthButton>
        </div>

        {/* Back to Login */}
        <div className="text-center pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <Link to="/" className="text-sm text-gray-500 hover:text-[#00C2FF] transition-colors">
            Voltar para o login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}