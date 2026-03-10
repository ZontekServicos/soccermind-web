import { useRouteError, Link } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError() as any;

  return (
    <div className="flex h-screen bg-[#07142A] items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl text-[#00C2FF] mb-4">
          {error?.status || "Erro"}
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          {error?.statusText || error?.message || "Página não encontrada"}
        </p>
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-[#00C2FF] text-[#07142A] rounded-lg hover:bg-[#00A8E0] transition-colors inline-block"
        >
          Voltar para Dashboard
        </Link>
      </div>
    </div>
  );
}