import { buildExecutiveReportModel, formatExecutiveMetric, type ExecutiveReportModel } from "./executiveReport";

type PdfFont = "F1" | "F2";
type PdfPage = string[];

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 46;

function normalizePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\x20-\x7E]/g, " ");
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

function wrapText(text: string, fontSize: number, maxWidth: number) {
  const words = normalizePdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  const averageCharWidth = fontSize * 0.52;
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length * averageCharWidth <= maxWidth || !current) {
      current = candidate;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  return lines;
}

function createPdf() {
  const pages: PdfPage[] = [[]];
  let currentPageIndex = 0;
  let cursorY = PAGE_MARGIN;

  function addPage() {
    pages.push([]);
    currentPageIndex = pages.length - 1;
    cursorY = PAGE_MARGIN;
  }

  function page() {
    return pages[currentPageIndex];
  }

  function ensureSpace(height: number) {
    if (cursorY + height <= PAGE_HEIGHT - PAGE_MARGIN) {
      return;
    }

    addPage();
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

  function drawText(text: string, x: number, top: number, fontSize: number, color: string, font: PdfFont = "F1") {
    const y = PAGE_HEIGHT - top - fontSize;
    page().push("BT");
    page().push(`/${font} ${fontSize.toFixed(2)} Tf`);
    page().push(`${hexToRgb(color)} rg`);
    page().push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
    page().push(`(${escapePdfText(text)}) Tj`);
    page().push("ET");
  }

  function drawParagraph(text: string, fontSize = 11, color = "#314152", lineHeight = 16) {
    const lines = wrapText(text, fontSize, PAGE_WIDTH - PAGE_MARGIN * 2);
    const blockHeight = lines.length * lineHeight + 4;
    ensureSpace(blockHeight);

    lines.forEach((line, index) => {
      drawText(line, PAGE_MARGIN, cursorY + index * lineHeight, fontSize, color, "F1");
    });

    cursorY += blockHeight;
  }

  function drawSectionHeading(title: string, accent = "#00C2FF") {
    ensureSpace(40);
    drawText(title, PAGE_MARGIN, cursorY, 15, "#07142A", "F2");
    drawFilledRect(PAGE_MARGIN, cursorY + 24, 82, 3, accent);
    cursorY += 34;
  }

  function drawBulletList(items: string[]) {
    items.forEach((item) => {
      const lines = wrapText(item, 10.5, PAGE_WIDTH - PAGE_MARGIN * 2 - 16);
      const height = Math.max(16, lines.length * 15);
      ensureSpace(height);
      drawText("-", PAGE_MARGIN, cursorY, 12, "#00C2FF", "F2");
      lines.forEach((line, index) => {
        drawText(line, PAGE_MARGIN + 14, cursorY + index * 15, 10.5, "#314152", "F1");
      });
      cursorY += height;
    });
  }

  return {
    pages,
    get cursorY() {
      return cursorY;
    },
    set cursorY(value: number) {
      cursorY = value;
    },
    addPage,
    ensureSpace,
    drawFilledRect,
    drawStrokeRect,
    drawText,
    drawParagraph,
    drawSectionHeading,
    drawBulletList,
  };
}

function buildPdfDocument(pages: PdfPage[]) {
  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = "";
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;

  let nextObjectNumber = 5;

  pages.forEach((pageCommands) => {
    const pageObjectNumber = nextObjectNumber;
    const contentObjectNumber = nextObjectNumber + 1;
    nextObjectNumber += 2;

    const content = `${pageCommands.join("\n")}\n`;
    const contentLength = new TextEncoder().encode(content).length;

    objects[pageObjectNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
    objects[contentObjectNumber] = `<< /Length ${contentLength} >>\nstream\n${content}endstream`;

    pageObjectNumbers.push(pageObjectNumber);
  });

  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = new TextEncoder().encode(pdf).length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

function drawCover(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel) {
  pdf.drawFilledRect(0, 0, PAGE_WIDTH, 178, "#07142A");
  pdf.drawFilledRect(0, 178, PAGE_WIDTH, 10, "#00C2FF");
  pdf.drawText("SOCCERMIND", PAGE_MARGIN, 32, 12, "#7FDBFF", "F2");
  pdf.drawText(report.title, PAGE_MARGIN, 58, 28, "#FFFFFF", "F2");
  pdf.drawText(report.subtitle, PAGE_MARGIN, 94, 18, "#D7E8F7", "F1");
  pdf.drawText(`Generated: ${report.generatedAtLabel}`, PAGE_MARGIN, 124, 10.5, "#9FB6CC", "F1");
  pdf.drawText(
    `Recommendation: ${report.recommendationLabel}`,
    PAGE_MARGIN,
    142,
    10.5,
    "#9BF6D3",
    "F2",
  );

  pdf.cursorY = 212;
}

function drawMetricTable(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel) {
  const rowHeight = 24;
  const tableTop = pdf.cursorY;
  const labelWidth = 190;
  const valueWidth = 104;
  const winnerWidth = 105;
  const totalWidth = labelWidth + valueWidth + valueWidth + winnerWidth;

  pdf.ensureSpace(rowHeight * (report.metrics.length + 2));
  pdf.drawSectionHeading("Comparative Metrics", "#7A5CFF");
  pdf.drawFilledRect(PAGE_MARGIN, pdf.cursorY, totalWidth, rowHeight, "#EAF1F9");
  pdf.drawText("Metric", PAGE_MARGIN + 10, pdf.cursorY + 6, 10, "#07142A", "F2");
  pdf.drawText(report.subtitle.split(" vs ")[0] ?? "Player A", PAGE_MARGIN + labelWidth + 10, pdf.cursorY + 6, 10, "#07142A", "F2");
  pdf.drawText(report.subtitle.split(" vs ")[1] ?? "Player B", PAGE_MARGIN + labelWidth + valueWidth + 10, pdf.cursorY + 6, 10, "#07142A", "F2");
  pdf.drawText("Winner", PAGE_MARGIN + labelWidth + valueWidth * 2 + 10, pdf.cursorY + 6, 10, "#07142A", "F2");
  pdf.cursorY += rowHeight;

  report.metrics.forEach((metric, index) => {
    const fill = index % 2 === 0 ? "#FFFFFF" : "#F8FBFF";
    pdf.drawFilledRect(PAGE_MARGIN, pdf.cursorY, totalWidth, rowHeight, fill);
    pdf.drawStrokeRect(PAGE_MARGIN, pdf.cursorY, totalWidth, rowHeight, "#D8E5F2", 0.5);
    pdf.drawText(metric.label, PAGE_MARGIN + 10, pdf.cursorY + 6, 9.5, "#243447", "F1");
    pdf.drawText(formatExecutiveMetric(metric, metric.a), PAGE_MARGIN + labelWidth + 10, pdf.cursorY + 6, 9.5, metric.winner === "A" ? "#00A9E8" : "#243447", metric.winner === "A" ? "F2" : "F1");
    pdf.drawText(formatExecutiveMetric(metric, metric.b), PAGE_MARGIN + labelWidth + valueWidth + 10, pdf.cursorY + 6, 9.5, metric.winner === "B" ? "#6E50F8" : "#243447", metric.winner === "B" ? "F2" : "F1");
    pdf.drawText(
      metric.winner === "DRAW" ? "Draw" : metric.winner === "A" ? "Player A" : "Player B",
      PAGE_MARGIN + labelWidth + valueWidth * 2 + 10,
      pdf.cursorY + 6,
      9.5,
      "#243447",
      "F1",
    );
    pdf.cursorY += rowHeight;
  });

  pdf.cursorY = Math.max(pdf.cursorY, tableTop + rowHeight * (report.metrics.length + 1) + 14);
}

function drawInsights(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel) {
  pdf.drawSectionHeading("Key Insights", "#00C2FF");
  const cardWidth = PAGE_WIDTH - PAGE_MARGIN * 2;

  report.insights.forEach((insight) => {
    const accent = insight.tone === "violet" ? "#7A5CFF" : insight.tone === "emerald" ? "#00B87C" : "#00C2FF";
    const lines = wrapText(insight.content, 10.5, cardWidth - 26);
    const cardHeight = 38 + lines.length * 15;
    pdf.ensureSpace(cardHeight + 10);
    pdf.drawFilledRect(PAGE_MARGIN, pdf.cursorY, cardWidth, cardHeight, "#F9FCFF");
    pdf.drawStrokeRect(PAGE_MARGIN, pdf.cursorY, cardWidth, cardHeight, "#D8E5F2", 0.8);
    pdf.drawFilledRect(PAGE_MARGIN, pdf.cursorY, 5, cardHeight, accent);
    pdf.drawText(insight.title, PAGE_MARGIN + 16, pdf.cursorY + 10, 11, "#07142A", "F2");
    lines.forEach((line, index) => {
      pdf.drawText(line, PAGE_MARGIN + 16, pdf.cursorY + 28 + index * 15, 10.5, "#314152", "F1");
    });
    pdf.cursorY += cardHeight + 10;
  });
}

function drawRecommendation(pdf: ReturnType<typeof createPdf>, report: ExecutiveReportModel) {
  pdf.drawSectionHeading("Recommendation", "#00B87C");
  const lines = wrapText(report.recommendationSummary, 11, PAGE_WIDTH - PAGE_MARGIN * 2 - 24);
  const boxHeight = 48 + lines.length * 16;
  pdf.ensureSpace(boxHeight + 12);
  pdf.drawFilledRect(PAGE_MARGIN, pdf.cursorY, PAGE_WIDTH - PAGE_MARGIN * 2, boxHeight, "#ECFFF6");
  pdf.drawStrokeRect(PAGE_MARGIN, pdf.cursorY, PAGE_WIDTH - PAGE_MARGIN * 2, boxHeight, "#ACE7CF", 1);
  pdf.drawText(report.recommendationLabel, PAGE_MARGIN + 14, pdf.cursorY + 12, 13, "#0D6A4E", "F2");
  lines.forEach((line, index) => {
    pdf.drawText(line, PAGE_MARGIN + 14, pdf.cursorY + 34 + index * 16, 11, "#245243", "F1");
  });
  pdf.cursorY += boxHeight + 8;
}

export function buildExecutiveReportPdf(report: ExecutiveReportModel) {
  const pdf = createPdf();
  drawCover(pdf, report);

  pdf.drawSectionHeading("Executive Summary");
  pdf.drawParagraph(report.executiveSummary);

  drawInsights(pdf, report);
  drawMetricTable(pdf, report);

  pdf.drawSectionHeading("Comparative Analysis", "#7A5CFF");
  pdf.drawParagraph(report.comparativeAnalysis);

  pdf.drawSectionHeading("Risk Overview", "#FF5A74");
  pdf.drawParagraph(report.riskOverview);

  pdf.drawSectionHeading("AI Narrative", "#7A5CFF");
  report.aiNarrative.forEach((paragraph) => {
    pdf.drawParagraph(paragraph);
  });

  drawRecommendation(pdf, report);

  pdf.drawSectionHeading("Executive Takeaways", "#00C2FF");
  pdf.drawBulletList(report.takeaways);

  return buildPdfDocument(pdf.pages);
}

export function downloadExecutiveReportPdf(report: ExecutiveReportModel) {
  const pdfContent = buildExecutiveReportPdf(report);
  const blob = new Blob([new TextEncoder().encode(pdfContent)], { type: "application/pdf" });
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
