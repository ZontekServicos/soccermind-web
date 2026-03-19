import { getDataSource } from "../config/data-source";

export interface ProfileUpsell {
  id: string;
  title: string;
  description: string;
  status: "Ativo" | "Inativo" | "Pendente";
  activatedDate: string;
  iconKey: "analytics" | "dashboard" | "compare" | "integration";
  color: string;
  category: string;
}

const MOCK_UPSELLS: ProfileUpsell[] = [
  {
    id: "1",
    title: "Analise Avancada com IA",
    description: "Relatorios preditivos com Machine Learning",
    status: "Ativo",
    activatedDate: "2025-01-15",
    iconKey: "analytics",
    color: "#00C2FF",
    category: "Analytics",
  },
  {
    id: "2",
    title: "Dashboard Premium",
    description: "Visualizacoes personalizadas e metricas exclusivas",
    status: "Ativo",
    activatedDate: "2025-01-01",
    iconKey: "dashboard",
    color: "#00FF9C",
    category: "Visualizacao",
  },
  {
    id: "3",
    title: "Comparacao Ilimitada",
    description: "Compare ate 10 jogadores simultaneamente",
    status: "Ativo",
    activatedDate: "2025-01-01",
    iconKey: "compare",
    color: "#7A5CFF",
    category: "Analytics",
  },
  {
    id: "4",
    title: "API de Integracao",
    description: "Conecte aos seus sistemas internos de gestao",
    status: "Ativo",
    activatedDate: "2025-02-10",
    iconKey: "integration",
    color: "#00FF9C",
    category: "Integracao",
  },
];

export async function getProfileUpsells() {
  const source = getDataSource("profile");

  if (source === "api") {
    return {
      data: MOCK_UPSELLS,
      meta: { source: "mock-fallback" as const },
    };
  }

  return {
    data: MOCK_UPSELLS,
    meta: { source: "mock" as const },
  };
}
