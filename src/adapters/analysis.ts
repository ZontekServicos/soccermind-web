import { mapCompareResponse, type CompareViewModel } from "./compare";
type UnknownRecord = Record<string, unknown>;

export interface AnalysisPlayerViewModel {
  id: string;
  name: string;
  club: string;
  positions: string[];
  order: number;
}

export interface AnalysisViewModel {
  id: string;
  title: string;
  description: string;
  date: string;
  playerAId: string | null;
  playerBId: string | null;
  type: "comparison" | "report";
  typeLabel: string;
  players: string[];
  playerDetails: AnalysisPlayerViewModel[];
  user: string;
  club: string;
  status: "completed" | "in_progress" | "archived";
  statusLabel: string;
  canDelete: boolean;
  isLegacy: boolean;
  sourceOrigin: "analysis" | "scout_report";
  sourceLabel: string;
  deleteManagedBy: "analysis" | "scout_report";
  deleteHint: string;
}

export interface AnalysisDetailViewModel extends AnalysisViewModel {
  reportContent: {
    mode: "comparison" | "single_player";
    canExportPdf: boolean;
    contentStatus: "ready" | "partial";
    contentMessage: string;
    comparisonData: CompareViewModel | null;
    playerReportData: {
      player: {
        id: string;
        name: string;
        position: string | null;
        club: string | null;
        league: string | null;
        age: number | null;
      };
      metrics: {
        overall: number;
        potential: number;
        marketValue: number | null;
        riskScore: number;
        riskLevel: string;
        liquidityScore: number;
        capitalEfficiency: number;
        tier: string;
        recommendation: string;
      };
      aiNarrative: string;
    } | null;
  } | null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function mapType(value: unknown): AnalysisViewModel["type"] {
  return value === "COMPARISON" ? "comparison" : "report";
}

function mapStatus(value: unknown): AnalysisViewModel["status"] {
  switch (value) {
    case "COMPLETED":
      return "completed";
    case "ARCHIVED":
      return "archived";
    default:
      return "in_progress";
  }
}

function mapPlayers(value: unknown): AnalysisPlayerViewModel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((player, index) => ({
      id: toText(player.id, `player-${index}`),
      name: toText(player.name, "Jogador"),
      club: toText(player.club, ""),
      positions: Array.isArray(player.positions) ? player.positions.filter((item): item is string => typeof item === "string") : [],
      order: typeof player.order === "number" ? player.order : index,
    }))
    .sort((a, b) => a.order - b.order);
}

export function mapAnalysisResponse(source: unknown): AnalysisViewModel {
  const record = isRecord(source) ? source : {};
  const players = mapPlayers(record.players);
  const sourceMetadata = isRecord(record.sourceMetadata) ? record.sourceMetadata : {};
  const deletePolicy = isRecord(record.deletePolicy) ? record.deletePolicy : {};
  const isLegacy = sourceMetadata.legacy === true;
  const canDelete = record.canDelete === true || deletePolicy.canDelete === true;
  const deleteManagedBy =
    record.deleteManagedBy === "scout_report" || record.deleteManagedBy === "analysis"
      ? record.deleteManagedBy
      : deletePolicy.managedBy === "SCOUT_REPORT"
        ? "scout_report"
        : "analysis";

  return {
    id: toText(record.id, "N/A"),
    title: toText(record.title, "Analise"),
    description: toText(record.description, ""),
    date: toText(record.createdAt, new Date().toISOString()),
    playerAId: record.playerAId == null ? null : toText(record.playerAId, ""),
    playerBId: record.playerBId == null ? null : toText(record.playerBId, ""),
    type: mapType(record.type),
    typeLabel: toText(record.typeLabel, record.type === "COMPARISON" ? "Comparacao" : "Relatorio"),
    players: players.map((player) => player.name),
    playerDetails: players,
    user: toText(record.analyst, "Sistema SoccerMind"),
    club: players.map((player) => player.club).find(Boolean) ?? "SoccerMind",
    status: mapStatus(record.status),
    statusLabel: toText(record.statusLabel, "Em andamento"),
    canDelete,
    isLegacy,
    sourceOrigin: sourceMetadata.origin === "ANALYSIS" ? "analysis" : "scout_report",
    sourceLabel: isLegacy ? "Legado ScoutReport" : "Central Analysis",
    deleteManagedBy,
    deleteHint: toText(
      record.deleteHint ?? deletePolicy.reason,
      canDelete
        ? "Entrada persistida em Analysis; exclusao disponivel."
        : "Entrada protegida; exclusao indisponivel no momento.",
    ),
  };
}

export function mapAnalysisDetailResponse(source: unknown): AnalysisDetailViewModel {
  const base = mapAnalysisResponse(source);
  const record = isRecord(source) ? source : {};
  const reportContentRecord = isRecord(record.reportContent) ? record.reportContent : null;
  const comparisonData = reportContentRecord?.comparisonData
    ? mapCompareResponse(reportContentRecord.comparisonData)
    : null;
  const playerReportRecord = isRecord(reportContentRecord?.playerReportData) ? reportContentRecord.playerReportData : null;

  return {
    ...base,
    reportContent: reportContentRecord
      ? {
          mode: reportContentRecord.mode === "single_player" ? "single_player" : "comparison",
          canExportPdf: reportContentRecord.canExportPdf === true,
          contentStatus: reportContentRecord.contentStatus === "partial" ? "partial" : "ready",
          contentMessage: toText(reportContentRecord.contentMessage, ""),
          comparisonData,
          playerReportData: playerReportRecord
            ? {
                player: {
                  id: toText(playerReportRecord.player && isRecord(playerReportRecord.player) ? playerReportRecord.player.id : null, base.playerAId ?? "player"),
                  name: toText(playerReportRecord.player && isRecord(playerReportRecord.player) ? playerReportRecord.player.name : null, "Jogador"),
                  position:
                    playerReportRecord.player && isRecord(playerReportRecord.player)
                      ? toText(playerReportRecord.player.position, "") || null
                      : null,
                  club:
                    playerReportRecord.player && isRecord(playerReportRecord.player)
                      ? toText(playerReportRecord.player.club, "") || null
                      : null,
                  league:
                    playerReportRecord.player && isRecord(playerReportRecord.player)
                      ? toText(playerReportRecord.player.league, "") || null
                      : null,
                  age:
                    playerReportRecord.player && isRecord(playerReportRecord.player) && typeof playerReportRecord.player.age === "number"
                      ? playerReportRecord.player.age
                      : null,
                },
                metrics: {
                  overall:
                    playerReportRecord.metrics && isRecord(playerReportRecord.metrics) && typeof playerReportRecord.metrics.overall === "number"
                      ? playerReportRecord.metrics.overall
                      : 0,
                  potential:
                    playerReportRecord.metrics && isRecord(playerReportRecord.metrics) && typeof playerReportRecord.metrics.potential === "number"
                      ? playerReportRecord.metrics.potential
                      : 0,
                  marketValue:
                    playerReportRecord.metrics && isRecord(playerReportRecord.metrics) && typeof playerReportRecord.metrics.marketValue === "number"
                      ? playerReportRecord.metrics.marketValue
                      : null,
                  riskScore:
                    playerReportRecord.metrics && isRecord(playerReportRecord.metrics) && typeof playerReportRecord.metrics.riskScore === "number"
                      ? playerReportRecord.metrics.riskScore
                      : 0,
                  riskLevel:
                    playerReportRecord.metrics && isRecord(playerReportRecord.metrics)
                      ? toText(playerReportRecord.metrics.riskLevel, "MEDIUM")
                      : "MEDIUM",
                  liquidityScore:
                    playerReportRecord.metrics && isRecord(playerReportRecord.metrics) && typeof playerReportRecord.metrics.liquidityScore === "number"
                      ? playerReportRecord.metrics.liquidityScore
                      : 0,
                  capitalEfficiency:
                    playerReportRecord.metrics && isRecord(playerReportRecord.metrics) && typeof playerReportRecord.metrics.capitalEfficiency === "number"
                      ? playerReportRecord.metrics.capitalEfficiency
                      : 0,
                  tier:
                    playerReportRecord.metrics && isRecord(playerReportRecord.metrics)
                      ? toText(playerReportRecord.metrics.tier, "PROSPECT")
                      : "PROSPECT",
                  recommendation:
                    playerReportRecord.metrics && isRecord(playerReportRecord.metrics)
                      ? toText(playerReportRecord.metrics.recommendation, "")
                      : "",
                },
                aiNarrative: toText(playerReportRecord.aiNarrative, base.description),
              }
            : null,
        }
      : null,
  };
}
