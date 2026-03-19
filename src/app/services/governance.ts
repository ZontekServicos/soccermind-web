import { getDataSource } from "../config/data-source";

export interface GovernanceRecord {
  id: string;
  date: string;
  requestedBy: string;
  role: string;
  player: string;
  action: string;
  justification: string;
  status: "Aprovado" | "Pendente" | "Em Análise" | "Reprovado";
  approvedBy?: string;
  area: string;
  version: string;
  lastUpdate: string;
  createdBy: string;
  reviewedBy?: string;
}

const MOCK_GOVERNANCE_RECORDS: GovernanceRecord[] = [
  {
    id: "GOV-2026-001",
    date: "2026-02-20T14:35:00",
    requestedBy: "João Silva",
    role: "Diretor Executivo",
    player: "Gabriel Barbosa",
    action: "Análise Comparativa Completa",
    justification:
      "Avaliação para renovação contratual. Necessário comparar com opções do mercado antes da decisão final.",
    status: "Aprovado",
    approvedBy: "Ricardo Santos (Presidente)",
    area: "Gestão de Elenco",
    version: "1.2",
    lastUpdate: "2026-02-21T10:15:00",
    createdBy: "João Silva",
    reviewedBy: "Maria Oliveira",
  },
  {
    id: "GOV-2026-002",
    date: "2026-02-18T11:20:00",
    requestedBy: "Maria Oliveira",
    role: "Scout Chefe",
    player: "Vitor Roque",
    action: "Relatório de Risco Estrutural",
    justification:
      "Monitoramento de ativo estratégico. Verificar evolução no clube europeu e possibilidade de retorno.",
    status: "Aprovado",
    approvedBy: "João Silva (Diretor Executivo)",
    area: "Scouting",
    version: "1.0",
    lastUpdate: "2026-02-18T16:45:00",
    createdBy: "Maria Oliveira",
    reviewedBy: "Carlos Mendes",
  },
  {
    id: "GOV-2026-003",
    date: "2026-02-15T09:15:00",
    requestedBy: "Carlos Mendes",
    role: "Diretor Financeiro",
    player: "Pedro Guilherme",
    action: "Análise de Capital Efficiency",
    justification: "Avaliação de custo-benefício para planejamento orçamentário 2026/2027.",
    status: "Em Análise",
    area: "Financeiro",
    version: "1.0",
    lastUpdate: "2026-02-16T14:30:00",
    createdBy: "Carlos Mendes",
  },
  {
    id: "GOV-2026-004",
    date: "2026-02-12T16:45:00",
    requestedBy: "João Silva",
    role: "Diretor Executivo",
    player: "Luiz Henrique",
    action: "Relatório Completo de Liquidez",
    justification:
      "Análise de oportunidade de mercado. Clube europeu demonstrou interesse e necessitamos avaliar o timing ideal de venda.",
    status: "Aprovado",
    approvedBy: "Ricardo Santos (Presidente)",
    area: "Gestão de Elenco",
    version: "1.1",
    lastUpdate: "2026-02-13T11:20:00",
    createdBy: "João Silva",
    reviewedBy: "Maria Oliveira",
  },
  {
    id: "GOV-2026-005",
    date: "2026-02-10T13:30:00",
    requestedBy: "Maria Oliveira",
    role: "Scout Chefe",
    player: "Gabriel Barbosa",
    action: "Atualização de Anti-Flop Index",
    justification: "Monitoramento trimestral de performance. Verificar se métricas se mantêm dentro do esperado.",
    status: "Aprovado",
    approvedBy: "João Silva (Diretor Executivo)",
    area: "Scouting",
    version: "1.0",
    lastUpdate: "2026-02-10T17:00:00",
    createdBy: "Maria Oliveira",
  },
];

export async function getGovernanceRecords() {
  const source = getDataSource("governance");

  if (source === "api") {
    return {
      data: MOCK_GOVERNANCE_RECORDS,
      meta: { source: "mock-fallback" as const },
    };
  }

  return {
    data: MOCK_GOVERNANCE_RECORDS,
    meta: { source: "mock" as const },
  };
}
