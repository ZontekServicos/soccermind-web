import { apiFetch, type ApiEnvelope } from "../../app/services/api";
import type { CompareViewModel } from "../compare";
import type { ExecutiveReportModel } from "../reports";
import type { PlayerExtended } from "../../app/types/player";

export interface DecisionSummary {
  decision: string;
  confidence: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | string;
  winner?: string;
}

export interface ExplainabilityItem {
  metric: string;
  impact: string;
}

export interface ReportMeta {
  generatedInMs: number;
}

export interface StoredScoutReport {
  id: string;
  type: "REPORT" | "COMPARISON";
  title: string;
  description: string;
  content: {
    mode?: "single_player" | "comparison";
    reportModel?: ExecutiveReportModel;
    comparisonData?: CompareViewModel;
    decisionSummary?: DecisionSummary;
    metrics?: Record<string, unknown>;
    explainability?: ExplainabilityItem[] | Record<string, unknown>;
    insights?: string[];
    aiNarrative?: string;
    recommendation?: string;
    player?: Record<string, unknown>;
    generatedAt?: string;
    meta?: ReportMeta;
  };
  players: Array<Partial<PlayerExtended> & Record<string, unknown>>;
  analyst: string;
  status: "COMPLETED" | "IN_PROGRESS";
  createdAt: string;
  updatedAt: string;
}

export interface CreateScoutReportPayload {
  type: "REPORT" | "COMPARISON";
  title: string;
  description?: string;
  analyst?: string;
  status?: "COMPLETED" | "IN_PROGRESS";
  content: Record<string, unknown>;
  players: Array<Record<string, unknown>>;
}

export function createComparisonScoutReportPayload(params: {
  title: string;
  description?: string;
  analyst?: string;
  reportModel: ExecutiveReportModel;
  comparisonData: CompareViewModel;
  players: PlayerExtended[];
}): CreateScoutReportPayload {
  return {
    type: "COMPARISON",
    title: params.title,
    description: params.description ?? params.reportModel.executiveSummary,
    analyst: params.analyst,
    status: "COMPLETED",
    players: params.players.map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      club: player.club,
      league: player.league ?? null,
      nationality: player.nationality,
      overall: player.overallRating,
      potential: player.potential,
      marketValue: player.marketValue,
    })),
    content: {
      mode: "comparison",
      reportModel: params.reportModel,
      comparisonData: params.comparisonData,
      decisionSummary: {
        decision: params.reportModel.recommendationSummary,
        confidence: params.reportModel.winner === "DRAW" ? 63 : 82,
        riskLevel:
          params.reportModel.winner === "A"
            ? params.comparisonData.risk.playerA.riskLevel
            : params.reportModel.winner === "B"
              ? params.comparisonData.risk.playerB.riskLevel
              : "MEDIUM",
        winner: params.reportModel.winner,
      },
      metrics: {
        winner: params.reportModel.winner,
        metrics: params.reportModel.metrics,
      },
      explainability: [
        {
          metric: "Decisao principal",
          impact: params.reportModel.recommendationSummary,
        },
        {
          metric: "Risco comparado",
          impact: params.reportModel.riskOverview,
        },
        {
          metric: "Leitura executiva",
          impact: params.reportModel.executiveSummary,
        },
      ],
      insights: params.reportModel.takeaways,
      aiNarrative: params.reportModel.aiNarrative.join("\n\n"),
    },
  };
}

export async function getScoutReports(): Promise<ApiEnvelope<StoredScoutReport[]>> {
  return apiFetch<StoredScoutReport[]>("/scout-reports");
}

export async function getScoutReportById(id: string): Promise<ApiEnvelope<StoredScoutReport>> {
  return apiFetch<StoredScoutReport>(`/scout-reports/${id}`);
}

export async function createScoutReport(payload: CreateScoutReportPayload): Promise<ApiEnvelope<StoredScoutReport>> {
  return apiFetch<StoredScoutReport>("/scout-reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateScoutReport(payload: {
  playerIds: string[];
  players?: string[];
  title?: string;
  description?: string;
  analyst?: string;
}): Promise<ApiEnvelope<StoredScoutReport>> {
  return apiFetch<StoredScoutReport>("/scout-reports/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteScoutReport(id: string): Promise<ApiEnvelope<{ id: string; message: string }>> {
  return apiFetch<{ id: string; message: string }>(`/scout-reports/${id}`, {
    method: "DELETE",
  });
}
