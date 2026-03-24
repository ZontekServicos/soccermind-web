import type { PlayerProfileModel } from "../mappers/player.mapper";
import type { PlayerReportMetrics, PlayerReportResult } from "../../services/players";

type PdfFont = "F1" | "F2";
type PdfPage = string[];

type PlayerReportPdfModel = {
  title: string;
  subtitle: string;
  filename: string;
  generatedAt: Date;
  generatedDateLabel: string;
  generatedDateTimeLabel: string;
  analyst: string;
  player: PlayerProfileModel;
  metrics: PlayerReportMetrics;
  aiNarrative: string[];
  recommendation: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 38;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const COLORS = {
  background: "#07142A",
  backgroundAlt: "#0D2137",
  card: "#10233C",
  cardMuted: "#0A1B31",
  border: "#1F385A",
  cyan: "#00C2FF",
  purple: "#A855F7",
  success: "#00FF9C",
  warning: "#F4C95D",
  danger: "#FF4D4F",
  white: "#FFFFFF",
  textMuted: "#98A9C0",
  textSoft: "#D6E1EE",
};

function normalizePdfText(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/[^\x20-\xFF]/g, " ");
}

function escapePdfText(value: string) {
  return normalizePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safeHex = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  const red = Number.parseInt(safeHex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(safeHex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(safeHex.slice(4, 6), 16) / 255;

  return `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)}`;
}

function toLatin1Bytes(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function measureTextWidth(text: string, fontSize: number) {
  return normalizePdfText(text).length * fontSize * 0.52;
}

function wrapText(text: string, fontSize: number, maxWidth: number) {
  const paragraphs = normalizePdfText(text)
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [""];
  }

  const lines: string[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (!current || measureTextWidth(candidate, fontSize) <= maxWidth) {
        current = candidate;
        return;
      }

      lines.push(current);
      current = word;
    });

    if (current) {
      lines.push(current);
    }

    if (paragraphIndex < paragraphs.length - 1) {
      lines.push("");
    }
  });

  return lines;
}

function createPdf() {
  const pages: PdfPage[] = [[]];
  let currentPageIndex = 0;

  function addPage() {
    pages.push([]);
    currentPageIndex = pages.length - 1;
  }

  function page() {
    return pages[currentPageIndex];
  }

  function drawFilledRect(x: number, top: number, width: number, height: number, fill: string) {
    const y = PAGE_HEIGHT - top - height;
    page().push(`${hexToRgb(fill)} rg`);
    page().push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
  }

  function drawStrokeRect(x: number, top: number, width: number, height: number, stroke: string, lineWidth = 1) {
    const y = PAGE_HEIGHT - top - height;
    page().push(`${lineWidth.toFixed(2)} w`);
    page().push(`${hexToRgb(stroke)} RG`);
    page().push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
  }

  function drawLine(x1: number, top1: number, x2: number, top2: number, stroke: string, lineWidth = 1) {
    const y1 = PAGE_HEIGHT - top1;
    const y2 = PAGE_HEIGHT - top2;
    page().push(`${lineWidth.toFixed(2)} w`);
    page().push(`${hexToRgb(stroke)} RG`);
    page().push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  function drawText(text: string, x: number, top: number, fontSize: number, color: string, font: PdfFont = "F1") {
    const y = PAGE_HEIGHT - top - fontSize;
    page().push("BT");
    page().push(`/${font} ${fontSize.toFixed(2)} Tf`);
    page().push(`${hexToRgb(color)} rg`);
    page().push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
    page().push(`(${escapePdfText(text)}) Tj`);
    page().push("ET");
  }

  function drawTextBlock(
    text: string,
    x: number,
    top: number,
    width: number,
    fontSize: number,
    color: string,
    lineHeight: number,
    font: PdfFont = "F1",
  ) {
    const lines = wrapText(text, fontSize, width);
    lines.forEach((line, index) => {
      drawText(line, x, top + index * lineHeight, fontSize, color, font);
    });
    return lines.length * lineHeight;
  }

  function drawBadge(text: string, x: number, top: number, background: string, color: string, minWidth = 80) {
    const width = Math.max(minWidth, measureTextWidth(text, 9.5) + 22);
    drawFilledRect(x, top, width, 24, background);
    drawText(text.toUpperCase(), x + 11, top + 7, 9.5, color, "F2");
    return width;
  }

  return {
    pages,
    addPage,
    drawFilledRect,
    drawStrokeRect,
    drawLine,
    drawText,
    drawTextBlock,
    drawBadge,
  };
}

function buildPdfDocument(pages: PdfPage[]) {
  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  let nextObjectNumber = 5;
  const getByteLength = (value: string) => toLatin1Bytes(value).length;

  pages.forEach((pageCommands) => {
    const pageObjectNumber = nextObjectNumber;
    const contentObjectNumber = nextObjectNumber + 1;
    nextObjectNumber += 2;

    const content = `${pageCommands.join("\n")}\n`;
    const contentLength = getByteLength(content);

    objects[pageObjectNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
    objects[contentObjectNumber] = `<< /Length ${contentLength} >>\nstream\n${content}endstream`;
    pageObjectNumbers.push(pageObjectNumber);
  });

  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = getByteLength(pdf);
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = getByteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return toLatin1Bytes(pdf);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatMarketValue(value: number | null) {
  if (!value || !Number.isFinite(value)) {
    return "Nao informado";
  }

  if (value >= 1_000_000) {
    return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `EUR ${(value / 1_000).toFixed(0)}K`;
  }

  return `EUR ${value.toFixed(0)}`;
}

function mapTierColor(tier: string) {
  switch (tier) {
    case "ELITE":
      return COLORS.purple;
    case "PREMIUM":
      return COLORS.cyan;
    case "STANDARD":
      return COLORS.success;
    default:
      return COLORS.warning;
  }
}

function buildPlayerReportPdfModel(report: PlayerReportResult, options?: { analyst?: string }) {
  const generatedAt = new Date(report.createdAt);
  return {
    title: "Player Report",
    subtitle: report.player.name,
    filename: `player-report-${slugify(report.player.name)}.pdf`,
    generatedAt,
    generatedDateLabel: formatDate(generatedAt),
    generatedDateTimeLabel: formatDateTime(generatedAt),
    analyst: options?.analyst ?? "Sistema SoccerMind",
    player: report.player,
    metrics: report.metrics,
    aiNarrative: (report.aiNarrative ?? "Narrativa indisponivel.")
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    recommendation: report.recommendation,
  } satisfies PlayerReportPdfModel;
}

function drawPageFrame(pdf: ReturnType<typeof createPdf>, pageNumber: number, title: string) {
  pdf.drawFilledRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, COLORS.background);
  pdf.drawFilledRect(PAGE_MARGIN, 26, CONTENT_WIDTH, 24, COLORS.cardMuted);
  pdf.drawText("SOCCERMIND", PAGE_MARGIN + 14, 33, 11, COLORS.white, "F2");
  pdf.drawText("Intelligence Platform", PAGE_MARGIN + 112, 33, 10, COLORS.cyan, "F1");
  pdf.drawBadge(`Page ${pageNumber}`, PAGE_WIDTH - PAGE_MARGIN - 74, 28, COLORS.card, COLORS.textSoft, 74);
  pdf.drawLine(PAGE_MARGIN, 60, PAGE_MARGIN + 180, 60, COLORS.cyan, 2);
  pdf.drawLine(PAGE_MARGIN + 180, 60, PAGE_MARGIN + 320, 60, COLORS.purple, 2);
  pdf.drawText(title, PAGE_MARGIN, 76, 22, COLORS.white, "F2");
  pdf.drawText("Player Report", PAGE_WIDTH - PAGE_MARGIN - 110, 82, 11, COLORS.cyan, "F2");
}

function drawFooter(pdf: ReturnType<typeof createPdf>, model: PlayerReportPdfModel) {
  const top = 782;
  pdf.drawLine(PAGE_MARGIN, top, PAGE_WIDTH - PAGE_MARGIN, top, COLORS.border, 1);
  pdf.drawText("� 2026 SoccerMind � Inteligencia Estrategica", PAGE_MARGIN, top + 10, 9, COLORS.textMuted, "F1");
  pdf.drawText(`Analista: ${model.analyst}`, PAGE_WIDTH - PAGE_MARGIN - 180, top + 10, 9, COLORS.textMuted, "F1");
}

function drawCover(pdf: ReturnType<typeof createPdf>, model: PlayerReportPdfModel) {
  const tierColor = mapTierColor(model.metrics.tier);

  pdf.drawFilledRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, COLORS.background);
  pdf.drawFilledRect(0, 0, PAGE_WIDTH, 220, "#091A32");
  pdf.drawText("SOCCERMIND", PAGE_MARGIN, 62, 22, COLORS.white, "F2");
  pdf.drawText("Intelligence Platform", PAGE_MARGIN, 88, 12, COLORS.cyan, "F1");
  pdf.drawLine(PAGE_MARGIN, 116, PAGE_MARGIN + 150, 116, COLORS.cyan, 3);
  pdf.drawLine(PAGE_MARGIN + 150, 116, PAGE_MARGIN + 308, 116, COLORS.purple, 3);
  pdf.drawText(model.title, PAGE_MARGIN, 172, 28, COLORS.white, "F2");
  pdf.drawText(model.subtitle, PAGE_MARGIN, 226, 25, COLORS.textSoft, "F2");
  pdf.drawBadge(model.metrics.tier, PAGE_MARGIN, 260, tierColor, COLORS.background, 120);

  pdf.drawFilledRect(PAGE_MARGIN, 330, CONTENT_WIDTH, 170, COLORS.cardMuted);
  pdf.drawStrokeRect(PAGE_MARGIN, 330, CONTENT_WIDTH, 170, COLORS.border, 1);
  pdf.drawText(`${model.player.position || "-"} � ${model.player.team || "Sem clube"}`, PAGE_MARGIN + 24, 356, 16, COLORS.white, "F2");
  pdf.drawText(`${model.player.league || "Sem liga"} � ${model.player.nationality || "-"}`, PAGE_MARGIN + 24, 382, 12, COLORS.textSoft, "F1");
  pdf.drawText(`Idade: ${model.player.age}`, PAGE_MARGIN + 24, 410, 12, COLORS.textSoft, "F1");
  pdf.drawText(`Data de geracao: ${model.generatedDateTimeLabel}`, PAGE_MARGIN + 24, 436, 12, COLORS.textSoft, "F1");
  pdf.drawText(`Analista: ${model.analyst}`, PAGE_MARGIN + 24, 462, 12, COLORS.textSoft, "F1");

  drawFooter(pdf, model);
}

function drawMetricsPage(pdf: ReturnType<typeof createPdf>, model: PlayerReportPdfModel) {
  drawPageFrame(pdf, 2, "Metricas e Perfil");

  const cards = [
    ["Overall", `${model.metrics.overall}`],
    ["Potencial", `${model.metrics.potential}`],
    ["Valor de mercado", formatMarketValue(model.metrics.marketValue)],
    ["Arquetipo", model.metrics.archetype],
    ["Risco estrutural", `${model.metrics.riskScore.toFixed(1)} � ${model.metrics.riskLevel}`],
    ["Risco financeiro", model.metrics.financialRisk.toFixed(1)],
    ["Liquidez", model.metrics.liquidityScore.toFixed(1)],
    ["Capital Efficiency", model.metrics.capitalEfficiency.toFixed(1)],
  ];

  cards.forEach(([label, value], index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = PAGE_MARGIN + col * ((CONTENT_WIDTH - 16) / 2 + 16);
    const y = 124 + row * 84;
    const width = (CONTENT_WIDTH - 16) / 2;
    pdf.drawFilledRect(x, y, width, 68, index % 2 === 0 ? COLORS.card : COLORS.cardMuted);
    pdf.drawStrokeRect(x, y, width, 68, COLORS.border, 1);
    pdf.drawText(label, x + 16, y + 14, 10, COLORS.textMuted, "F1");
    pdf.drawText(String(value), x + 16, y + 34, 16, COLORS.white, "F2");
  });

  pdf.drawFilledRect(PAGE_MARGIN, 476, CONTENT_WIDTH, 120, COLORS.cardMuted);
  pdf.drawStrokeRect(PAGE_MARGIN, 476, CONTENT_WIDTH, 120, COLORS.border, 1);
  pdf.drawText("Atributos principais", PAGE_MARGIN + 18, 494, 15, COLORS.white, "F2");
  const attributes = [
    ["PAC", model.player.pac],
    ["SHO", model.player.sho],
    ["PAS", model.player.pas],
    ["DRI", model.player.dri],
    ["DEF", model.player.def],
    ["PHY", model.player.phy],
  ];

  attributes.forEach(([label, value], index) => {
    const x = PAGE_MARGIN + 18 + index * 80;
    pdf.drawText(String(label), x, 528, 10, COLORS.textMuted, "F1");
    pdf.drawText(String(value ?? "-"), x, 548, 19, COLORS.cyan, "F2");
  });

  pdf.drawFilledRect(PAGE_MARGIN, 620, CONTENT_WIDTH, 84, COLORS.card);
  pdf.drawStrokeRect(PAGE_MARGIN, 620, CONTENT_WIDTH, 84, COLORS.border, 1);
  pdf.drawText("Resumo de risco", PAGE_MARGIN + 18, 638, 14, COLORS.white, "F2");
  pdf.drawTextBlock(model.metrics.riskSummary, PAGE_MARGIN + 18, 664, CONTENT_WIDTH - 36, 11, COLORS.textSoft, 16);

  drawFooter(pdf, model);
}

function drawNarrativePage(pdf: ReturnType<typeof createPdf>, model: PlayerReportPdfModel) {
  pdf.addPage();
  drawPageFrame(pdf, 3, "Analise da IA");

  pdf.drawFilledRect(PAGE_MARGIN, 120, CONTENT_WIDTH, 420, COLORS.card);
  pdf.drawFilledRect(PAGE_MARGIN, 120, 8, 420, COLORS.cyan);
  pdf.drawStrokeRect(PAGE_MARGIN, 120, CONTENT_WIDTH, 420, COLORS.border, 1);
  pdf.drawText("Narrativa de scouting", PAGE_MARGIN + 24, 138, 15, COLORS.white, "F2");
  pdf.drawTextBlock(model.aiNarrative.join("\n\n"), PAGE_MARGIN + 24, 170, CONTENT_WIDTH - 48, 11, COLORS.textSoft, 17);

  pdf.drawFilledRect(PAGE_MARGIN, 566, CONTENT_WIDTH, 108, COLORS.cardMuted);
  pdf.drawStrokeRect(PAGE_MARGIN, 566, CONTENT_WIDTH, 108, COLORS.border, 1);
  pdf.drawText("Recomendacao executiva", PAGE_MARGIN + 18, 584, 14, COLORS.purple, "F2");
  pdf.drawTextBlock(model.recommendation, PAGE_MARGIN + 18, 612, CONTENT_WIDTH - 36, 12, COLORS.white, 18, "F2");

  pdf.drawFilledRect(PAGE_MARGIN, 696, CONTENT_WIDTH, 58, COLORS.card);
  pdf.drawStrokeRect(PAGE_MARGIN, 696, CONTENT_WIDTH, 58, COLORS.border, 1);
  pdf.drawText(
    `Projecao de crescimento: indice ${model.metrics.growthProjection.growthIndex} � proxima temporada ${model.metrics.growthProjection.expectedOverallNextSeason} � pico ${model.metrics.growthProjection.expectedPeak}`,
    PAGE_MARGIN + 18,
    716,
    11,
    COLORS.textSoft,
    "F1",
  );

  drawFooter(pdf, model);
}

function drawClosingPage(pdf: ReturnType<typeof createPdf>, model: PlayerReportPdfModel) {
  pdf.addPage();
  drawPageFrame(pdf, 4, "Confidencialidade");
  pdf.drawFilledRect(PAGE_MARGIN, 160, CONTENT_WIDTH, 180, COLORS.cardMuted);
  pdf.drawStrokeRect(PAGE_MARGIN, 160, CONTENT_WIDTH, 180, COLORS.border, 1);
  pdf.drawText("Uso confidencial", PAGE_MARGIN + 18, 182, 18, COLORS.white, "F2");
  pdf.drawTextBlock(
    "Este material foi gerado para uso interno da plataforma SoccerMind e deve apoiar exclusivamente decisoes de scouting, investimento esportivo e priorizacao de shortlist.",
    PAGE_MARGIN + 18,
    220,
    CONTENT_WIDTH - 36,
    12,
    COLORS.textSoft,
    18,
  );

  pdf.drawFilledRect(PAGE_MARGIN, 394, CONTENT_WIDTH, 120, COLORS.card);
  pdf.drawStrokeRect(PAGE_MARGIN, 394, CONTENT_WIDTH, 120, COLORS.border, 1);
  pdf.drawText("SOCCERMIND", PAGE_MARGIN + 18, 420, 18, COLORS.white, "F2");
  pdf.drawText("Intelligence Platform", PAGE_MARGIN + 18, 446, 11, COLORS.cyan, "F1");
  pdf.drawText(`Data: ${model.generatedDateLabel}`, PAGE_MARGIN + 270, 420, 11, COLORS.textMuted, "F1");
  pdf.drawText(`Analista: ${model.analyst}`, PAGE_MARGIN + 270, 446, 11, COLORS.white, "F2");
  pdf.drawText("� 2026 SoccerMind � Inteligencia Estrategica", PAGE_MARGIN + 18, 476, 10, COLORS.textMuted, "F1");

  drawFooter(pdf, model);
}

export function buildPlayerReportPdf(report: PlayerReportResult, options?: { analyst?: string }) {
  const model = buildPlayerReportPdfModel(report, options);
  const pdf = createPdf();
  drawCover(pdf, model);
  pdf.addPage();
  drawMetricsPage(pdf, model);
  drawNarrativePage(pdf, model);
  drawClosingPage(pdf, model);
  return buildPdfDocument(pdf.pages);
}

export function downloadPlayerReportPdf(report: PlayerReportResult, options?: { analyst?: string }) {
  const pdfContent = buildPlayerReportPdf(report, options);
  const blob = new Blob([pdfContent], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const model = buildPlayerReportPdfModel(report, options);
  anchor.href = url;
  anchor.download = model.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
