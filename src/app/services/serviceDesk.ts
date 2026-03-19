import { getDataSource } from "../config/data-source";

export interface ServiceDeskTicket {
  id: string;
  type: string;
  category: string;
  status: "open" | "in_progress" | "resolved";
  priority: "high" | "medium" | "low";
  date: string;
  assignee: string;
  title: string;
  description: string;
}

const MOCK_TICKETS: ServiceDeskTicket[] = [
  {
    id: "TK-001",
    type: "ticket.create_user",
    category: "user_management",
    status: "open",
    priority: "high",
    date: "2026-03-01",
    assignee: "Suporte Soccer Mind",
    title: "Criar novo login de usuario",
    description: "Preciso criar um novo usuario para o novo scout do clube com permissoes de analise",
  },
  {
    id: "TK-002",
    type: "ticket.technical_support",
    category: "platform",
    status: "in_progress",
    priority: "medium",
    date: "2026-03-02",
    assignee: "Equipe Tecnica",
    title: "Suporte tecnico - Exportacao de relatorios",
    description: "Erro ao exportar relatorio de analise de jogadores em formato PDF",
  },
  {
    id: "TK-003",
    type: "ticket.request_training",
    category: "platform",
    status: "resolved",
    priority: "low",
    date: "2026-02-28",
    assignee: "Time de Onboarding",
    title: "Treinamento para novos gestores",
    description: "Solicitacao de treinamento para novos gestores da equipe tecnica",
  },
  {
    id: "TK-004",
    type: "ticket.change_permissions",
    category: "user_management",
    status: "open",
    priority: "medium",
    date: "2026-03-03",
    assignee: "Suporte Soccer Mind",
    title: "Alterar permissoes de acesso",
    description: "Alterar permissoes de acesso do usuario Joao Silva para incluir relatorios",
  },
  {
    id: "TK-005",
    type: "ticket.request_module",
    category: "commercial",
    status: "in_progress",
    priority: "high",
    date: "2026-03-04",
    assignee: "Time Comercial",
    title: "Solicitar novo modulo - Analise Tatica",
    description: "Interesse em contratar modulo de analise tatica avancada para a equipe",
  },
];

export async function getServiceDeskTickets() {
  const source = getDataSource("serviceDesk");

  if (source === "api") {
    return {
      data: MOCK_TICKETS,
      meta: { source: "mock-fallback" as const },
    };
  }

  return {
    data: MOCK_TICKETS,
    meta: { source: "mock" as const },
  };
}
