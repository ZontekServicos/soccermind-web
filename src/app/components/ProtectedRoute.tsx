import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Aguarda a sessão Supabase ser lida do storage antes de decidir
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#07142A]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00C2FF] animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Sem sessão Supabase válida → redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
