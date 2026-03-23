import { buildExecutiveReportModel, formatExecutiveMetric, type ExecutiveReportModel, type ExecutiveReportMetric } from "./executiveReport";

type PdfFont = "F1" | "F2";
type PdfPage = string[];

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
  draw: "#7D8CA4",
};

function normalizePdfText(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, "\"")
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
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  const red = Number.parseInt(safeHex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(safeHex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(safeHex.slice(4, 6), 16) / 255;

  return `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)}`;
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

function splitIntoBullets(text: string) {
  return text
    .split(/(?:\n|(?<=[.!?])\s+)/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 16)
    .slice(0, 4);
}

function splitTextIntoParagraphs(text: string) {
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getStatusColor(tone: ExecutiveReportModel["statusTone"]) {
  if (tone === "success") return COLORS.success;
  if (tone === "warning") return COLORS.warning;
  if (tone === "danger") return COLORS.danger;
  return COLORS.cyan;
}

function getWinnerLabel(metric: ExecutiveReportMetric, report: ExecutiveReportModel) {
  if (metric.winner === "A") {
    return report.subtitle.split(" vs ")[0] ?? "Player A";
  }

  if (metric.winner === "B") {
    return report.subtitle.split(" vs ")[1] ?? "Player B";
  }

  return "Draw";
}

function getRiskTone(report: ExecutiveReportModel) {
  const text = report.riskOverview.toLowerCase();
  if (text.includes("high") || text.includes("alto")) {
    return { label: "HIGH", color: COLORS.danger };
  }

  if (text.includes("medium") || text.includes("medio") || text.includes("médio")) {
    return { label: "MEDIUM", color: COLORS.warning };
  }

  return { label: "LOW", color: COLORS.success };
}

function toLatin1Bytes(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xFF;
  }
  return bytes;
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

function drawPageFrame(pdf: ReturnType<typeof createPdf>, pageNumber: number, title: string, accent: string) {
  pdf.drawFilledRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, COLORS.background);
  pdf.drawFilledRect(PAGE_MARGIN, 26, CONTENT_WIDTH, 24, COLORS.cardMuted);
  pdf.drawText("SOCCERMIND", PAGE_MARGIN + 14, 33, 11, COLORS.white, "F2");
  pdf.drawText("Intelligence Platform", PAGE_MARGIN + 112, 33, 10, COLORS.cyan, "F1");
  pdf.drawBadge(`Page ${pageNumber}`, PAGE_WIDTH - PAGE_MARGIN - 74, 28, COLORS.card, COLORS.textSoft, 74);
  pdf.drawLine(PAGE_MARGIN, 60, PAGE_MARGIN + 180, 60, COLORS.cyan, 2);
  pdf.drawLine(PAGE_MARGIN + 180, 60, PAGE_MARGIN + 320, 60, COLORS.purple, 2);
  pdf.drawText(title, PAGE_MARGIN, 76, 22, COLORS.white, "F2");
  pdf.drawText("Executive Report", PAGE_WIDTH - PAGE_MARGIN - 132, 82, 11, accent, "F2");
}

function drawFooter(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel, compact = false) {
  const top = compact ? 770 : 782;
  pdf.drawLine(PAGE_MARGIN, top, PAGE_WIDTH - PAGE_MARGIN, top, COLORS.border, 1);
  pdf.drawText("© 2026 SoccerMind · Inteligência Estratégica", PAGE_MARGIN, top + 10, 9, COLORS.textMuted, "F1");
  pdf.drawText(`Analista: ${report.analyst}`, PAGE_WIDTH - PAGE_MARGIN - 170, top + 10, 9, COLORS.textMuted, "F1");
}

function drawCover(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel) {
  pdf.drawFilledRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, COLORS.background);
  pdf.drawFilledRect(0, 0, PAGE_WIDTH, 220, "#091A32");
  pdf.drawFilledRect(PAGE_MARGIN, 44, CONTENT_WIDTH, 1, COLORS.border);
  pdf.drawText("SOCCERMIND", PAGE_MARGIN, 62, 22, COLORS.white, "F2");
  pdf.drawText("Intelligence Platform", PAGE_MARGIN, 88, 12, COLORS.cyan, "F1");
  pdf.drawLine(PAGE_MARGIN, 116, PAGE_MARGIN + 150, 116, COLORS.cyan, 3);
  pdf.drawLine(PAGE_MARGIN + 150, 116, PAGE_MARGIN + 308, 116, COLORS.purple, 3);
  pdf.drawText(report.title, PAGE_MARGIN, 172, 30, COLORS.white, "F2");
  pdf.drawText(report.subtitle, PAGE_MARGIN, 228, 24, COLORS.textSoft, "F2");
  pdf.drawText("Data de geração", PAGE_MARGIN, 306, 10, COLORS.textMuted, "F1");
  pdf.drawText(report.generatedDateLabel, PAGE_MARGIN, 324, 15, COLORS.white, "F2");
  pdf.drawText("Status", PAGE_MARGIN + 250, 306, 10, COLORS.textMuted, "F1");
  pdf.drawBadge(report.status, PAGE_MARGIN + 250, 318, getStatusColor(report.statusTone), COLORS.background, 94);
  pdf.drawFilledRect(PAGE_MARGIN, 396, CONTENT_WIDTH, 152, COLORS.cardMuted);
  pdf.drawStrokeRect(PAGE_MARGIN, 396, CONTENT_WIDTH, 152, COLORS.border, 1);
  pdf.drawText("Relatório executivo premium de decisão esportiva", PAGE_MARGIN + 24, 424, 16, COLORS.cyan, "F2");
  pdf.drawTextBlock(
    "Comparativo estratégico com leitura de performance, eficiência de capital, risco estrutural e narrativa orientada à decisão para contexto de scouting executivo.",
    PAGE_MARGIN + 24,
    456,
    CONTENT_WIDTH - 48,
    12,
    COLORS.textSoft,
    18,
  );
  pdf.drawText(`Analista responsável: ${report.analyst}`, PAGE_MARGIN, 700, 11, COLORS.white, "F2");
  pdf.drawText("© 2026 SoccerMind · Inteligência Estratégica", PAGE_MARGIN, 780, 9, COLORS.textMuted, "F1");
}

function drawRecommendationSummaryPage(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel) {
  pdf.addPage();
  drawPageFrame(pdf, 2, "Recommendation & Executive Summary", COLORS.purple);

  pdf.drawFilledRect(PAGE_MARGIN, 118, CONTENT_WIDTH, 58, COLORS.card);
  pdf.drawStrokeRect(PAGE_MARGIN, 118, CONTENT_WIDTH, 58, COLORS.border, 1);
  pdf.drawText("Recommendation", PAGE_MARGIN + 18, 134, 12, COLORS.textMuted, "F1");
  pdf.drawBadge(report.recommendationLabel, PAGE_MARGIN + 18, 146, report.winner === "DRAW" ? COLORS.cyan : COLORS.purple, COLORS.white, 200);

  pdf.drawFilledRect(PAGE_MARGIN, 192, CONTENT_WIDTH, 122, COLORS.cardMuted);
  pdf.drawStrokeRect(PAGE_MARGIN, 192, CONTENT_WIDTH, 122, COLORS.border, 1);
  pdf.drawTextBlock(report.recommendationSummary, PAGE_MARGIN + 18, 214, CONTENT_WIDTH - 36, 14, COLORS.white, 22, "F2");

  pdf.drawFilledRect(PAGE_MARGIN, 334, CONTENT_WIDTH, 182, COLORS.card);
  pdf.drawStrokeRect(PAGE_MARGIN, 334, CONTENT_WIDTH, 182, COLORS.border, 1);
  pdf.drawText("Executive Summary", PAGE_MARGIN + 18, 352, 15, COLORS.white, "F2");
  pdf.drawTextBlock(report.executiveSummary, PAGE_MARGIN + 18, 382, CONTENT_WIDTH - 36, 11.5, COLORS.textSoft, 17);

  const insights = report.insights.length > 0 ? report.insights : splitIntoBullets(report.executiveSummary).map((content, index) => ({
    title: `Key Insight ${index + 1}`,
    content,
    tone: index % 2 === 0 ? "cyan" as const : "violet" as const,
  }));

  pdf.drawText("Key Insights", PAGE_MARGIN, 548, 15, COLORS.white, "F2");
  insights.slice(0, 3).forEach((insight, index) => {
    const top = 572 + index * 64;
    const accent = insight.tone === "emerald" ? COLORS.success : insight.tone === "violet" ? COLORS.purple : COLORS.cyan;
    pdf.drawFilledRect(PAGE_MARGIN, top, CONTENT_WIDTH, 52, COLORS.cardMuted);
    pdf.drawFilledRect(PAGE_MARGIN, top, 6, 52, accent);
    pdf.drawStrokeRect(PAGE_MARGIN, top, CONTENT_WIDTH, 52, COLORS.border, 1);
    pdf.drawText(insight.title, PAGE_MARGIN + 18, top + 10, 11, COLORS.white, "F2");
    pdf.drawTextBlock(insight.content, PAGE_MARGIN + 18, top + 26, CONTENT_WIDTH - 34, 10, COLORS.textSoft, 14);
  });

  drawFooter(pdf, report);
}

function drawMetricsPage(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel) {
  pdf.addPage();
  drawPageFrame(pdf, 3, "Comparative Metrics", COLORS.cyan);

  const playerAName = report.subtitle.split(" vs ")[0] ?? "Player A";
  const playerBName = report.subtitle.split(" vs ")[1] ?? "Player B";
  const tableTop = 126;
  const rowHeight = 50;
  const metricWidth = 190;
  const valueWidth = 105;
  const winnerWidth = CONTENT_WIDTH - metricWidth - valueWidth * 2;

  pdf.drawFilledRect(PAGE_MARGIN, tableTop, CONTENT_WIDTH, 42, COLORS.backgroundAlt);
  pdf.drawStrokeRect(PAGE_MARGIN, tableTop, CONTENT_WIDTH, 42, COLORS.border, 1);
  pdf.drawText("Metric", PAGE_MARGIN + 12, tableTop + 13, 11, COLORS.white, "F2");
  pdf.drawText(playerAName, PAGE_MARGIN + metricWidth + 12, tableTop + 13, 11, COLORS.cyan, "F2");
  pdf.drawText(playerBName, PAGE_MARGIN + metricWidth + valueWidth + 12, tableTop + 13, 11, COLORS.purple, "F2");
  pdf.drawText("Winner", PAGE_MARGIN + metricWidth + valueWidth * 2 + 12, tableTop + 13, 11, COLORS.white, "F2");

  report.metrics.forEach((metric, index) => {
    const top = tableTop + 42 + index * rowHeight;
    const fill = index % 2 === 0 ? COLORS.card : COLORS.cardMuted;
    const winnerColor = metric.winner === "DRAW" ? COLORS.draw : COLORS.success;

    pdf.drawFilledRect(PAGE_MARGIN, top, CONTENT_WIDTH, rowHeight, fill);
    pdf.drawStrokeRect(PAGE_MARGIN, top, CONTENT_WIDTH, rowHeight, COLORS.border, 0.8);
    pdf.drawText(metric.label, PAGE_MARGIN + 12, top + 15, 10.5, COLORS.white, "F2");
    pdf.drawText(formatExecutiveMetric(metric, metric.a), PAGE_MARGIN + metricWidth + 12, top + 15, 10.5, metric.winner === "A" ? COLORS.cyan : COLORS.textSoft, metric.winner === "A" ? "F2" : "F1");
    pdf.drawText(formatExecutiveMetric(metric, metric.b), PAGE_MARGIN + metricWidth + valueWidth + 12, top + 15, 10.5, metric.winner === "B" ? COLORS.purple : COLORS.textSoft, metric.winner === "B" ? "F2" : "F1");
    pdf.drawBadge(getWinnerLabel(metric, report), PAGE_MARGIN + metricWidth + valueWidth * 2 + 12, top + 12, winnerColor, metric.winner === "DRAW" ? COLORS.white : COLORS.background, winnerWidth - 24);
  });

  pdf.drawFilledRect(PAGE_MARGIN, 584, CONTENT_WIDTH, 120, COLORS.cardMuted);
  pdf.drawStrokeRect(PAGE_MARGIN, 584, CONTENT_WIDTH, 120, COLORS.border, 1);
  pdf.drawText("Strategic Metric Read", PAGE_MARGIN + 18, 602, 14, COLORS.white, "F2");
  pdf.drawTextBlock(
    "As métricas abaixo preservam o conjunto completo do relatório e destacam, em leitura executiva, qual nome combina melhor retorno esportivo, risco absorvível e liquidez estratégica.",
    PAGE_MARGIN + 18,
    630,
    CONTENT_WIDTH - 36,
    11,
    COLORS.textSoft,
    17,
  );

  drawFooter(pdf, report);
}

function drawAnalysisRiskPage(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel) {
  pdf.addPage();
  drawPageFrame(pdf, 4, "Detailed Analysis & Risk", COLORS.purple);

  pdf.drawFilledRect(PAGE_MARGIN, 124, CONTENT_WIDTH, 182, COLORS.card);
  pdf.drawStrokeRect(PAGE_MARGIN, 124, CONTENT_WIDTH, 182, COLORS.border, 1);
  pdf.drawText("Comparative Analysis", PAGE_MARGIN + 18, 142, 15, COLORS.white, "F2");
  pdf.drawTextBlock(report.comparativeAnalysis, PAGE_MARGIN + 18, 170, CONTENT_WIDTH - 36, 11, COLORS.textSoft, 17);

  const riskTone = getRiskTone(report);
  pdf.drawFilledRect(PAGE_MARGIN, 330, CONTENT_WIDTH, 110, COLORS.cardMuted);
  pdf.drawStrokeRect(PAGE_MARGIN, 330, CONTENT_WIDTH, 110, COLORS.border, 1);
  pdf.drawText("Risk Overview", PAGE_MARGIN + 18, 348, 15, COLORS.white, "F2");
  pdf.drawBadge(riskTone.label, PAGE_MARGIN + CONTENT_WIDTH - 110, 342, riskTone.color, COLORS.background, 92);
  pdf.drawTextBlock(report.riskOverview, PAGE_MARGIN + 18, 378, CONTENT_WIDTH - 36, 11, COLORS.textSoft, 17);

  const narrativeText = splitTextIntoParagraphs(report.aiNarrative.join("\n\n")).join("\n\n");
  pdf.drawFilledRect(PAGE_MARGIN, 464, CONTENT_WIDTH, 220, COLORS.card);
  pdf.drawFilledRect(PAGE_MARGIN, 464, 8, 220, COLORS.cyan);
  pdf.drawStrokeRect(PAGE_MARGIN, 464, CONTENT_WIDTH, 220, COLORS.border, 1);
  pdf.drawText("AI Narrative", PAGE_MARGIN + 24, 482, 15, COLORS.white, "F2");
  pdf.drawTextBlock(narrativeText, PAGE_MARGIN + 24, 512, CONTENT_WIDTH - 48, 11, COLORS.textSoft, 17);

  drawFooter(pdf, report);
}

function drawClosingPage(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel) {
  pdf.addPage();
  drawPageFrame(pdf, 5, "Executive Closing", COLORS.cyan);

  pdf.drawText("Executive Takeaways", PAGE_MARGIN, 126, 18, COLORS.white, "F2");
  report.takeaways.slice(0, 5).forEach((takeaway, index) => {
    const top = 160 + index * 72;
    pdf.drawFilledRect(PAGE_MARGIN, top, CONTENT_WIDTH, 54, COLORS.card);
    pdf.drawStrokeRect(PAGE_MARGIN, top, CONTENT_WIDTH, 54, COLORS.border, 1);
    pdf.drawFilledRect(PAGE_MARGIN + 16, top + 18, 8, 8, COLORS.cyan);
    pdf.drawTextBlock(takeaway, PAGE_MARGIN + 36, top + 14, CONTENT_WIDTH - 56, 11, COLORS.textSoft, 16);
  });

  pdf.drawLine(PAGE_MARGIN, 558, PAGE_WIDTH - PAGE_MARGIN, 558, COLORS.border, 1);
  pdf.drawText("Confidencialidade", PAGE_MARGIN, 580, 13, COLORS.white, "F2");
  pdf.drawTextBlock(
    "Este relatório é de uso exclusivo interno. Gerado automaticamente pela plataforma SoccerMind.",
    PAGE_MARGIN,
    606,
    CONTENT_WIDTH,
    11.5,
    COLORS.textSoft,
    18,
  );

  pdf.drawFilledRect(PAGE_MARGIN, 678, CONTENT_WIDTH, 84, COLORS.cardMuted);
  pdf.drawStrokeRect(PAGE_MARGIN, 678, CONTENT_WIDTH, 84, COLORS.border, 1);
  pdf.drawText("SOCCERMIND", PAGE_MARGIN + 18, 698, 16, COLORS.white, "F2");
  pdf.drawText("Intelligence Platform", PAGE_MARGIN + 18, 720, 10.5, COLORS.cyan, "F1");
  pdf.drawText(`Data: ${report.generatedDateLabel}`, PAGE_MARGIN + 260, 698, 10.5, COLORS.textMuted, "F1");
  pdf.drawText(`Analista: ${report.analyst}`, PAGE_MARGIN + 260, 720, 10.5, COLORS.white, "F2");

  drawFooter(pdf, report, true);
}

export function buildExecutiveReportPdf(report: ExecutiveReportModel) {
  const pdf = createPdf();
  drawCover(pdf, report);
  drawRecommendationSummaryPage(pdf, report);
  drawMetricsPage(pdf, report);
  drawAnalysisRiskPage(pdf, report);
  drawClosingPage(pdf, report);
  return buildPdfDocument(pdf.pages);
}

export function downloadExecutiveReportPdf(report: ExecutiveReportModel) {
  const pdfContent = buildExecutiveReportPdf(report);
  const blob = new Blob([pdfContent], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = report.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createExecutiveReportPdfFromPlayers(params: Parameters<typeof buildExecutiveReportModel>[0]) {
  const report = buildExecutiveReportModel(params);
  downloadExecutiveReportPdf(report);
}
