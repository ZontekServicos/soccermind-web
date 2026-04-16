import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Lock, CheckCircle } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { FormField, AuthButton, AlertMessage } from "../components/AuthFormFields";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  // Supabase envia o link com hash: /reset-password#access_token=...&type=recovery
  // onAuthStateChange dispara PASSWORD_RECOVERY quando o hash é processado
  const [isRecoverySession, setIsRecoverySession] = useState(
    () => typeof window !== "undefined" && window.location.hash.includes("type=recovery"),
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecoverySession(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      // O token não é passado explicitamente — o Supabase usa a sessão
      // estabelecida a partir do hash da URL do e-mail de recuperação.
      await updatePassword("", password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecoverySession) {
    return (
      <AuthLayout title="Link Inválido" showBackToHome={false}>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[rgba(255,80,80,0.12)] border border-[rgba(255,80,80,0.3)] flex items-center justify-center mx-auto">
            <span className="text-3xl">✕</span>
          </div>
          <p className="text-sm text-gray-400/90 leading-relaxed">
            Este link de redefinição é inválido ou já expirou. Solicite um novo link abaixo.
          </p>
          <AuthButton onClick={() => navigate("/forgot-password")}>
            Solicitar novo link
          </AuthButton>
          <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <Link to="/" className="text-sm text-gray-500 hover:text-[#00C2FF] transition-colors">
              Voltar para o login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout title="Senha Redefinida" showBackToHome={false}>
        <div className="text-center space-y-7">
          <div className="w-20 h-20 rounded-full bg-[rgba(0,255,156,0.12)] border border-[rgba(0,255,156,0.3)] flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-[#00FF9C]" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Senha Atualizada com Sucesso!</h2>
            <p className="text-sm text-gray-400/90 leading-relaxed">
              Sua senha foi redefinida. Agora você pode fazer login com a nova senha.
            </p>
          </div>
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
        {error && <AlertMessage type="error" message={error} onClose={() => setError("")} />}

        {/* Requisitos */}
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

        <div className="pt-1">
          <AuthButton
            type="submit"
            isLoading={isLoading}
            disabled={!password || !confirmPassword || password !== confirmPassword}
          >
            Redefinir Senha
          </AuthButton>
        </div>

        <div className="text-center pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <Link to="/" className="text-sm text-gray-500 hover:text-[#00C2FF] transition-colors">
            Voltar para o login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
