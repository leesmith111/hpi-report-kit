// PowerPoint (.pptx) deck engine — 16:9 slides, HPI-branded cover + back, and
// content primitives (section title, KPI strip, chart image, table) plus the
// competitive-set slides. Browser-only (pptxgenjs dynamically imported, charts
// arrive as PNG data URLs from ./snapshot). Vendored from ftw-cre-platform
// reportDeck.js + competitiveSetDeck.js; the one change is brand assets now come
// from ./assets (base64) instead of a host-relative fetch.
import { BG as ASSET_BG, LOGO as ASSET_LOGO } from './assets.js';

// 16:9 deck, inches.
export const DECK_W = 13.333;
export const DECK_H = 7.5;
const MARGIN = 0.55;

const NAVY = '1F2A4D';
const SLATE = '334155';
const MUTED = '64748B';
const FAINT = '94A3B8';
const CARD_BG = 'F8FAFC';
const BORDER = 'E2E8F0';
const WHITE = 'FFFFFF';
const FONT = 'Arial';

// Create a 16:9 deck with brand assets preloaded once.
export async function createDeck({ author = 'HPI' } = {}) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const deck = new PptxGenJS();
  deck.defineLayout({ name: 'HPI_WIDE', width: DECK_W, height: DECK_H });
  deck.layout = 'HPI_WIDE';
  deck.author = author;
  deck.company = 'HPI';
  deck._assets = { bg: ASSET_BG, logo: ASSET_LOGO };
  return deck;
}

// Cover slide — full-bleed photo (navy overlay baked into the asset), centered
// white title block, HPI logo bottom-right.
export function addCoverSlide(deck, { market = 'FORT WORTH', title = '', date = '' }) {
  const s = deck.addSlide();
  s.background = { data: deck._assets.bg };
  const lines = [];
  if (market) lines.push({ text: market.toUpperCase(), options: { fontSize: 30, bold: true, color: WHITE, breakLine: true } });
  if (title) lines.push({ text: title.toUpperCase(), options: { fontSize: 26, bold: true, color: WHITE, breakLine: true } });
  if (date) lines.push({ text: date.toUpperCase(), options: { fontSize: 22, bold: true, color: WHITE, breakLine: true } });
  s.addText(lines, { x: 1, y: 2.5, w: DECK_W - 2, h: 2.5, align: 'center', valign: 'middle', fontFace: FONT });
  s.addImage({ data: deck._assets.logo, x: DECK_W - 2.7, y: DECK_H - 1.3, w: 1.95, h: 0.85, sizing: { type: 'contain', w: 1.95, h: 0.85 } });
  return s;
}

// Back slide — same photo, centered HPI logo.
export function addBackSlide(deck) {
  const s = deck.addSlide();
  s.background = { data: deck._assets.bg };
  const w = 3.4, h = 1.5;
  s.addImage({ data: deck._assets.logo, x: (DECK_W - w) / 2, y: (DECK_H - h) / 2, w, h, sizing: { type: 'contain', w, h } });
  return s;
}

// Blank content slide with a titled header band; returns { slide, top }.
export function addContentSlide(deck, title, { eyebrow, meta } = {}) {
  const s = deck.addSlide();
  s.background = { color: WHITE };
  let top = MARGIN;
  if (eyebrow) {
    s.addText(String(eyebrow).toUpperCase(), { x: MARGIN, y: top, w: DECK_W - 2 * MARGIN, h: 0.22, fontSize: 9, bold: true, color: MUTED, charSpacing: 1, fontFace: FONT });
    top += 0.28;
  }
  if (title) {
    const metaW = 4.6;
    s.addText(title, { x: MARGIN, y: top, w: DECK_W - 2 * MARGIN - (meta ? metaW : 0), h: 0.5, fontSize: 18, bold: true, color: NAVY, fontFace: FONT });
    if (meta) {
      s.addText(String(meta), { x: DECK_W - MARGIN - metaW, y: top + 0.04, w: metaW, h: 0.42, fontSize: 10, color: MUTED, align: 'right', valign: 'middle', fontFace: FONT });
    }
    top += 0.52;
    s.addText('', { x: MARGIN, y: top, w: DECK_W - 2 * MARGIN, h: 0.014, fill: { color: BORDER }, line: { type: 'none' }, margin: 0 });
    top += 0.16;
  }
  return { slide: s, top };
}

// A row of KPI cards. kpis: [{ label, value, sub }]. Returns the y below the row.
export function addKpiStrip(slide, kpis, { x = MARGIN, y, w = DECK_W - 2 * MARGIN, h = 0.95, gap = 0.15 } = {}) {
  const n = kpis.length || 1;
  const cardW = (w - gap * (n - 1)) / n;
  kpis.forEach((k, i) => {
    const cx = x + i * (cardW + gap);
    slide.addText([
      { text: String(k.label || '').toUpperCase(), options: { fontSize: 8, color: MUTED, bold: true, breakLine: true } },
      { text: String(k.value ?? '—'), options: { fontSize: 17, color: SLATE, bold: true, breakLine: true } },
      ...(k.sub ? [{ text: String(k.sub), options: { fontSize: 8, color: FAINT } }] : []),
    ], {
      shape: 'roundRect', rectRadius: 0.06,
      x: cx, y, w: cardW, h,
      fill: { color: CARD_BG }, line: { color: BORDER, width: 0.75 },
      align: 'left', valign: 'top', fontFace: FONT, lineSpacingMultiple: 1,
      margin: [6, 9, 6, 9],
    });
  });
  return y + h;
}

// Place chart PNGs in a 1/2/4-up grid. images: [{ png, label }].
export function addChartGrid(slide, images, { x = MARGIN, y, w = DECK_W - 2 * MARGIN, h, perRow = 2, gap = 0.25, bakedTitle = false } = {}) {
  if (!images.length) return y;
  const rows = Math.ceil(images.length / perRow);
  const cellW = (w - gap * (perRow - 1)) / perRow;
  const cellH = (h - gap * (rows - 1)) / rows;
  images.forEach((img, i) => {
    const r = Math.floor(i / perRow), c = i % perRow;
    const cx = x + c * (cellW + gap);
    const cy = y + r * (cellH + gap);
    let labelH = 0;
    if (img.label && !bakedTitle) {
      slide.addText(String(img.label).toUpperCase(), { x: cx, y: cy, w: cellW, h: 0.3, fontSize: 9, bold: true, color: MUTED, fontFace: FONT });
      labelH = 0.34;
    }
    slide.addImage({ data: img.png, x: cx, y: cy + labelH, w: cellW, h: cellH - labelH, sizing: { type: 'contain', w: cellW, h: cellH - labelH } });
  });
  return y + h;
}

// Full-width table slide body. head: string[]; rows: string[][].
export function addTable(slide, head, rows, { x = MARGIN, y, w = DECK_W - 2 * MARGIN, fontSize = 9, colW } = {}) {
  const body = [
    head.map(h => ({ text: h, options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: fontSize - 1 } })),
    ...rows.map(r => r.map(c => ({ text: String(c ?? ''), options: { color: SLATE, fontSize } }))),
  ];
  slide.addTable(body, { x, y, w, colW, fontFace: FONT, border: { type: 'solid', color: BORDER, pt: 0.5 }, autoPage: true, autoPageRepeatHeader: true, valign: 'middle', rowH: 0.3 });
}

// Render a table across as many TITLED slides as it needs. Returns the page count.
export function addPaginatedTableSlides(deck, title, head, rows, { w = DECK_W - 2 * MARGIN, fontSize = 9, colW, bottomMargin = 0.45, header } = {}) {
  const top = MARGIN + (header?.eyebrow ? 0.96 : 0.68);
  const usableH = DECK_H - top - bottomMargin;
  const widths = colW || head.map(() => w / head.length);
  const lineH = (fontSize / 72) * 1.25;
  const charW = fontSize * 0.0092;
  const rowHeight = (cells) => {
    let lines = 1;
    cells.forEach((c, i) => {
      const cpl = Math.max(4, Math.floor((widths[i] || 1) / charW));
      lines = Math.max(lines, Math.ceil(String(c ?? '').length / cpl));
    });
    return Math.max(0.3, lines * lineH + 0.12);
  };
  const headerH = rowHeight(head) + 0.04;
  const pages = [];
  let cur = [], curH = headerH;
  for (const r of rows) {
    const rh = rowHeight(r);
    if (cur.length && curH + rh > usableH) { pages.push(cur); cur = []; curH = headerH; }
    cur.push(r); curH += rh;
  }
  if (cur.length) pages.push(cur);
  pages.forEach((chunk, i) => {
    const s = addContentSlide(deck, i === 0 ? title : `${title} (continued)`, header);
    addTable(s.slide, head, chunk, { y: s.top, w, fontSize, colW: widths });
  });
  return pages.length;
}

// Trigger the browser download.
export async function downloadDeck(deck, filename) {
  await deck.writeFile({ fileName: filename.endsWith('.pptx') ? filename : `${filename}.pptx` });
}

// ============================================================================
// Competitive-set slides — content builders (SUBJECT_KPIS, subjectKpis,
// subjectSupplyTable, competingSupplyTablesBySubject, competingSupplyTable,
// compsTable) live in ./csdeck.js (asset-free, so report-builder UIs can import
// them for live previews without the 2.3 MB deck background). Re-exported here so
// existing `hpi-report-kit/pptx` consumers are unchanged.
// ============================================================================
export * from './csdeck.js';
import {
  subjectKpis, competingSupplyTablesBySubject, compsTable,
  csHeader, subjectLabel, SUPPLY_COLW, COMPS_COLW,
} from './csdeck.js';

// Prepend the competitive-set pages to a deck (KPI strip + the two tables).
export function addCompetitiveSetSlides(deck, cs) {
  const subj = subjectLabel(cs);
  const header = csHeader(cs);
  const k = addContentSlide(deck, `Competitive Set — ${subj}`, header);
  addKpiStrip(k.slide, subjectKpis(cs), { y: k.top });

  for (const t of competingSupplyTablesBySubject(cs)) {
    if (t.rows.length) {
      addPaginatedTableSlides(deck, `Competing Supply — ${t.title}`, t.head, t.rows, { colW: SUPPLY_COLW, header });
    }
  }
  const comps = compsTable(cs);
  if (comps.rows.length) {
    addPaginatedTableSlides(deck, `Comparable Lease Comps — ${subj}`, comps.head, comps.rows, { colW: COMPS_COLW, header });
  }
}
