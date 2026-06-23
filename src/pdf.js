// Branded combined PDF composer (jsPDF). The "everything in one document"
// deliverable: branded cover → KPI cards → chart grid → competitive-set supply
// tables → comparable comps → leasing activity. Browser-only (jsPDF + the
// chart PNGs from ./snapshot). New in the kit (FTW's pdfReport.js is a different,
// map-centric export); the jspdf-autotable resolver pattern is ported from there
// so it survives the v5 ESM interop (never `doc.autoTable(...)`).
import { LOGO } from './assets.js';

// RGB brand palette.
const NAVY = [31, 42, 77];
const SLATE = [51, 65, 85];
const MUTED = [100, 116, 139];
const BORDER = [226, 232, 240];
const CARD_BG = [248, 250, 252];
const WHITE = [255, 255, 255];

const PAGE_W = 297, PAGE_H = 210, MARGIN = 14; // landscape A4, mm
const CONTENT_W = PAGE_W - 2 * MARGIN;

// jspdf-autotable v5 dropped the doc.autoTable prototype method in some build
// targets; the supported form is the functional autoTable(doc, opts). Resolve
// the callable defensively across default / named / nested-default exports.
async function loadAutoTable() {
  const mod = await import('jspdf-autotable');
  const fn = [mod.default, mod.autoTable, mod.default?.autoTable].find((f) => typeof f === 'function');
  if (!fn) throw new Error('jspdf-autotable: could not resolve the autoTable function');
  return fn;
}

const num = (n) => (n == null || n === '' ? '—' : n);

// Branded cover page (navy field, white logo + title block).
function drawCover(doc, { market = 'FORT WORTH', title = '', date = '' }) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  // Logo top-left.
  try { doc.addImage(LOGO, 'PNG', MARGIN, MARGIN, 42, 18, undefined, 'FAST'); } catch { /* logo optional */ }
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  let y = PAGE_H / 2 - 8;
  if (market) { doc.setFontSize(30); doc.text(String(market).toUpperCase(), PAGE_W / 2, y, { align: 'center' }); y += 14; }
  if (title) { doc.setFontSize(22); doc.text(String(title).toUpperCase(), PAGE_W / 2, y, { align: 'center' }); y += 12; }
  if (date) { doc.setFontSize(14); doc.setTextColor(203, 213, 225); doc.text(String(date).toUpperCase(), PAGE_W / 2, y, { align: 'center' }); }
}

// Titled content header band on the current page; returns the y where body starts.
function header(doc, { eyebrow, title, meta }) {
  let y = MARGIN;
  doc.setFont('helvetica', 'bold');
  if (eyebrow) {
    doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(String(eyebrow).toUpperCase(), MARGIN, y + 3);
    y += 6;
  }
  if (title) {
    doc.setFontSize(16); doc.setTextColor(...NAVY);
    doc.text(String(title), MARGIN, y + 5);
    if (meta) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
      doc.text(String(meta), PAGE_W - MARGIN, y + 4, { align: 'right' });
    }
    y += 9;
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 4;
  }
  return y;
}

// Row(s) of KPI cards. kpis: [{ label, value }]. Returns y below.
function drawKpiCards(doc, kpis, y, { perRow = 6, h = 18, gap = 3 } = {}) {
  if (!kpis.length) return y;
  const cardW = (CONTENT_W - gap * (perRow - 1)) / perRow;
  kpis.forEach((k, i) => {
    const col = i % perRow, row = Math.floor(i / perRow);
    const x = MARGIN + col * (cardW + gap);
    const cy = y + row * (h + gap);
    doc.setFillColor(...CARD_BG); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3);
    doc.roundedRect(x, cy, cardW, h, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...MUTED);
    doc.text(String(k.label || '').toUpperCase(), x + 3, cy + 5, { maxWidth: cardW - 6 });
    doc.setFontSize(13); doc.setTextColor(...SLATE);
    doc.text(String(k.value ?? '—'), x + 3, cy + 13, { maxWidth: cardW - 6 });
  });
  const rows = Math.ceil(kpis.length / perRow);
  return y + rows * (h + gap);
}

// Grid of chart PNGs (2-up). charts: [{ label, png }].
function drawChartGrid(doc, charts, startY, { perRow = 2, gap = 6 } = {}) {
  if (!charts.length) return;
  const cellW = (CONTENT_W - gap * (perRow - 1)) / perRow;
  const cellH = cellW * 0.62;
  let y = startY;
  charts.forEach((c, i) => {
    const col = i % perRow;
    if (col === 0 && i > 0) y += cellH + gap;
    if (y + cellH > PAGE_H - MARGIN) {
      doc.addPage();
      y = header(doc, { eyebrow: 'Market Analytics', title: 'Charts (continued)' });
    }
    const x = MARGIN + col * (cellW + gap);
    try { doc.addImage(c.png, 'PNG', x, y, cellW, cellH, undefined, 'FAST'); } catch { /* skip bad png */ }
  });
}

// One autotable. opts mirror the deck table: { title, head, rows }.
function drawTable(doc, autoTable, { title, head, rows }, startY) {
  let y = startY;
  if (title) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
    doc.text(String(title), MARGIN, y + 4);
    y += 7;
  }
  autoTable(doc, {
    head: [head],
    body: rows.map((r) => r.map(num)),
    startY: y,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN + 6 },
    styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak', textColor: SLATE },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'grid',
    tableLineColor: BORDER,
    tableLineWidth: 0.1,
  });
  return doc.lastAutoTable?.finalY ?? y;
}

function stampFooters(doc) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    if (p === 1) continue; // cover has no footer
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('HPI', MARGIN, PAGE_H - 6);
    doc.text(`${p} / ${pages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
  }
}

// Build the combined branded PDF. Returns a jsPDF doc (call downloadPdf or
// doc.save). Inputs:
//   meta:    { market, title, date }
//   kpis:    [{ label, value }]
//   charts:  [{ label, png }]   (PNG data URLs from renderChartToPng)
//   cs:      competitive-set object (CompetitiveSetModal.buildCompSet shape) — optional
//   supplyTables / compsTable / leasingTable: pre-built { title, head, rows } — optional
export async function buildCombinedPdf({ meta = {}, kpis = [], charts = [], supplyTables = [], compsTable = null, leasingTable = null } = {}) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = await loadAutoTable();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Cover.
  drawCover(doc, meta);

  // KPI + charts page.
  if (kpis.length || charts.length) {
    doc.addPage();
    let y = header(doc, { eyebrow: `${meta.market || 'Fort Worth'} Industrial`, title: meta.title || 'Market Report', meta: meta.date });
    if (kpis.length) y = drawKpiCards(doc, kpis, y) + 4;
    if (charts.length) drawChartGrid(doc, charts, y);
  }

  // Competitive-set supply tables (one per subject).
  for (const t of supplyTables) {
    if (!t?.rows?.length) continue;
    doc.addPage();
    const y = header(doc, { eyebrow: `${meta.market || 'Fort Worth'} Industrial — Competitive Set`, title: t.title || 'Competing Supply', meta: meta.date });
    drawTable(doc, autoTable, { head: t.head, rows: t.rows }, y);
  }

  // Comparable comps.
  if (compsTable?.rows?.length) {
    doc.addPage();
    const y = header(doc, { eyebrow: `${meta.market || 'Fort Worth'} Industrial — Competitive Set`, title: 'Comparable Lease Comps', meta: meta.date });
    drawTable(doc, autoTable, { head: compsTable.head, rows: compsTable.rows }, y);
  }

  // YTD leasing activity.
  if (leasingTable?.rows?.length) {
    doc.addPage();
    const y = header(doc, { eyebrow: `${meta.market || 'Fort Worth'} Industrial`, title: 'YTD Leasing Activity', meta: meta.date });
    drawTable(doc, autoTable, { head: leasingTable.head, rows: leasingTable.rows }, y);
  }

  stampFooters(doc);
  return doc;
}

export function downloadPdf(doc, filename) {
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
