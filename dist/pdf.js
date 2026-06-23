// src/assets.js
var LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAR4AAACqCAMAAABMO9AzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAK7UExURQAAAECAvz15uj95vDx5uUB1tUKDxUaEz0SAyUSBykOAyD94uzx4vEJ7w0B4vUB5vj94vD94vESAvEN+x0F6wUF7wkF6wTp1uzx3xEB4vUB5vT94vUJ5vWeTyv///////////////////////////////////////////////////////////////zOAzEN5v0F5vj93vVWGwtfh8P////////////////////////////////////////////////////////////////////////39/f////////////////39/f////////////////////7+/v////7+/v////////////////////////////////7+/v////39/f////39/f7+/v////7+/vz8/P////////////v7+/7+/v////////////7+/v39/f////////////////////v7+/////39/f////////39/f////////////////////39/f////7+/v39/f////////39/f7+/v////////7+/v////39/f7+/v////z8/P////////v7+/////39/f////7+/v////////////7+/v////////r6+v////////7+/v////////////////7+/v////////////7+/v////////////7+/v////////7+/v////z8/P////////////////////////////39/f7+/v////7+/v////////////7+/v7+/v7+/v////////////////7+/v39/f////////////////7+/v39/f7+/v39/f////////z8/Pz8/P////7+/vv7+/////39/f////7+/vz8/P7+/v39/f///////////////////////////////////////xC+WOkAAADpdFJOUwAIOzk3GCP////2cSL////1aiL////1aR7n4OHZdCAlHQQcJhoLISQVDAIZHgMKUE5NVJm+vL6TFI7Bv4E5pcC6tKygkX5oUjsfAX+7mQ2l/8/EtVHi9deyiVwqsv7WEqXIG69O4PSFOqz9EfzTg/m3QtPRQbF3witrLS44R2ac4fxmSxB79Aps+0R191ZV6WJE2mk+1Wq+QcwWEy/F4/7so6in6WkHltJIrj3JglPe5U/Xx83n+g9YmL4t2klQZNT/v+6N7erXkTTz2c6ref2QYGZjWTP6RUWi+61N3akFQ2hOayBbRmdVZVfyjAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAA7pJREFUeF7t2/lXlFUcx/GnxdTUNLXSsjAIFM1Ka6hscS1q1HpKi3JpIbQyzDbT0tByN0sro7CIUnFrUSvMcikzrFzTFnNpmfY/o/O9w4Dzvc+5McejNOd5v37kfuYy583hHAYGzwMAAAAAAAAAAAAAAAAAAAAAIASOO/4E24mN9CysTmrcxNL05GZ6FlbNW5xiadnqVD0LK/I4kceJPE7kcSKPE3mcyONEHifyOJHHiTxO5HEijxN5nMjjRB4n8ji1btPWctrpZ+hZWLVrf6blrA5nn5Nh66gfK87NzNK7jIys88xZdk7Ama1TTmbn3C76YqOr3orzu+nZ0XPBhRdZuve4+JKIJe9S/Vhx2eU99TASueJKc3bV1b30SZDeffr263/NtfnXXR/Vtw8YqMeRSN6gG/TsGMu90Q9wk56JzJv1TAw2Z0Nu0R93ubXgttuHDku+ffgIvfJ9/447k0fHXO5d+imJu/VMFPbSM3GPOSsaqT/+X0b1vPe+w2+/f7ReyJfpgcMnDaDB8vh+8ZgHc+puJ49l7EMP195OngCPFCVuJ0+QRx+ruZ08gcZlxm8nT6Dix+O3kyfY+AnmhhDmeSLjybiJk54qmTxFH8c9/Yy5IYR5ptY9OBqNTps+Qw+MQTNlEO48xqzZeiHi313k8br21Qsxco6ckcfzntULMfc5OSKP5z0/T0/EfDkij+e98KKeiJfkiDyet+BlPRGlcpT+eV7RM5FSnlcL9ESYH3zSKU/ZzIWW114v1zORUp6iN/TE9/2KoXKUTnnefGuRZfG4JXomUspTWawn8snMLzXSKU8KUsmzdJleiOWT5Iw83oqg7y1/ZaGckeftd/TAeNcchjpPNDfrvWWr9Lmxeo1ZhDDP++UfJHxYULVWH8ct/sjcEMI89VG1Lv5EyBPo45o/o5MnyCeJdzuQJ0DZ+sQTSac8GzbmWzZ9+pmeiSPJs/nzTrVPJJ3yBL8kTfkVu9vmLV9k191OniRrq4ebFxMJ5KlVMWrrl199nXx7CPNsq96iVG+tmrJ9x85dC6x30IUvz+5v9pQk2/vtdxu/X2ilEeHL88M+fYVD+PLM/lFf4UAeJ/I4kceJPE7kcSKPE3mcyONEHifyOJHH6X+aZ79/wFJRrmeiMC9g6h80Z4d+ss9GzzVvGqynn8cW6wsOjChr6Dy//Foas1Tm65nI/u13PYzFSleYsz/+tK+pLKn5f4B6+etv/fhYrPKfpXoGAAAAAAAAAAAAAAAAAAAAAAAAAAAAADi6/gVmnDX5BQPNkAAAAABJRU5ErkJggg==";

// src/pdf.js
var NAVY = [31, 42, 77];
var SLATE = [51, 65, 85];
var MUTED = [100, 116, 139];
var BORDER = [226, 232, 240];
var CARD_BG = [248, 250, 252];
var WHITE = [255, 255, 255];
var PAGE_W = 297;
var PAGE_H = 210;
var MARGIN = 14;
var CONTENT_W = PAGE_W - 2 * MARGIN;
async function loadAutoTable() {
  const mod = await import("jspdf-autotable");
  const fn = [mod.default, mod.autoTable, mod.default?.autoTable].find((f) => typeof f === "function");
  if (!fn) throw new Error("jspdf-autotable: could not resolve the autoTable function");
  return fn;
}
var num = (n) => n == null || n === "" ? "\u2014" : n;
function drawCover(doc, { market = "FORT WORTH", title = "", date = "" }) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  try {
    doc.addImage(LOGO, "PNG", MARGIN, MARGIN, 42, 18, void 0, "FAST");
  } catch {
  }
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  let y = PAGE_H / 2 - 8;
  if (market) {
    doc.setFontSize(30);
    doc.text(String(market).toUpperCase(), PAGE_W / 2, y, { align: "center" });
    y += 14;
  }
  if (title) {
    doc.setFontSize(22);
    doc.text(String(title).toUpperCase(), PAGE_W / 2, y, { align: "center" });
    y += 12;
  }
  if (date) {
    doc.setFontSize(14);
    doc.setTextColor(203, 213, 225);
    doc.text(String(date).toUpperCase(), PAGE_W / 2, y, { align: "center" });
  }
}
function header(doc, { eyebrow, title, meta }) {
  let y = MARGIN;
  doc.setFont("helvetica", "bold");
  if (eyebrow) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(String(eyebrow).toUpperCase(), MARGIN, y + 3);
    y += 6;
  }
  if (title) {
    doc.setFontSize(16);
    doc.setTextColor(...NAVY);
    doc.text(String(title), MARGIN, y + 5);
    if (meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(String(meta), PAGE_W - MARGIN, y + 4, { align: "right" });
    }
    y += 9;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 4;
  }
  return y;
}
function drawKpiCards(doc, kpis, y, { perRow = 6, h = 18, gap = 3 } = {}) {
  if (!kpis.length) return y;
  const cardW = (CONTENT_W - gap * (perRow - 1)) / perRow;
  kpis.forEach((k, i) => {
    const col = i % perRow, row = Math.floor(i / perRow);
    const x = MARGIN + col * (cardW + gap);
    const cy = y + row * (h + gap);
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cy, cardW, h, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(String(k.label || "").toUpperCase(), x + 3, cy + 5, { maxWidth: cardW - 6 });
    doc.setFontSize(13);
    doc.setTextColor(...SLATE);
    doc.text(String(k.value ?? "\u2014"), x + 3, cy + 13, { maxWidth: cardW - 6 });
  });
  const rows = Math.ceil(kpis.length / perRow);
  return y + rows * (h + gap);
}
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
      y = header(doc, { eyebrow: "Market Analytics", title: "Charts (continued)" });
    }
    const x = MARGIN + col * (cellW + gap);
    try {
      doc.addImage(c.png, "PNG", x, y, cellW, cellH, void 0, "FAST");
    } catch {
    }
  });
}
function drawTable(doc, autoTable, { title, head, rows }, startY) {
  let y = startY;
  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(String(title), MARGIN, y + 4);
    y += 7;
  }
  autoTable(doc, {
    head: [head],
    body: rows.map((r) => r.map(num)),
    startY: y,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN + 6 },
    styles: { fontSize: 8, cellPadding: 1.5, overflow: "linebreak", textColor: SLATE },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: "grid",
    tableLineColor: BORDER,
    tableLineWidth: 0.1
  });
  return doc.lastAutoTable?.finalY ?? y;
}
function stampFooters(doc) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    if (p === 1) continue;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text("HPI", MARGIN, PAGE_H - 6);
    doc.text(`${p} / ${pages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: "right" });
  }
}
async function buildCombinedPdf({ meta = {}, kpis = [], charts = [], supplyTables = [], compsTable = null, leasingTable = null } = {}) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = await loadAutoTable();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  drawCover(doc, meta);
  if (kpis.length || charts.length) {
    doc.addPage();
    let y = header(doc, { eyebrow: `${meta.market || "Fort Worth"} Industrial`, title: meta.title || "Market Report", meta: meta.date });
    if (kpis.length) y = drawKpiCards(doc, kpis, y) + 4;
    if (charts.length) drawChartGrid(doc, charts, y);
  }
  for (const t of supplyTables) {
    if (!t?.rows?.length) continue;
    doc.addPage();
    const y = header(doc, { eyebrow: `${meta.market || "Fort Worth"} Industrial \u2014 Competitive Set`, title: t.title || "Competing Supply", meta: meta.date });
    drawTable(doc, autoTable, { head: t.head, rows: t.rows }, y);
  }
  if (compsTable?.rows?.length) {
    doc.addPage();
    const y = header(doc, { eyebrow: `${meta.market || "Fort Worth"} Industrial \u2014 Competitive Set`, title: "Comparable Lease Comps", meta: meta.date });
    drawTable(doc, autoTable, { head: compsTable.head, rows: compsTable.rows }, y);
  }
  if (leasingTable?.rows?.length) {
    doc.addPage();
    const y = header(doc, { eyebrow: `${meta.market || "Fort Worth"} Industrial`, title: "YTD Leasing Activity", meta: meta.date });
    drawTable(doc, autoTable, { head: leasingTable.head, rows: leasingTable.rows }, y);
  }
  stampFooters(doc);
  return doc;
}
function downloadPdf(doc, filename) {
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
export {
  buildCombinedPdf,
  downloadPdf
};
