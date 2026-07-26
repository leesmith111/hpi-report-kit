// Pitch-deck primitives — the HPI leasing-pitch design language (Garamond/navy/
// gold, "Gemini 35" structure). Layout specs are transcribed 1:1 from the FINAL
// Foundry pitch (HPI_Gemini_35_Pitch_.pptx, 2026-07-23) and the python-pptx
// scripts that built it (Downloads/Misc/_gemini_recolor/*.py). Browser-only,
// same conventions as ./pptx.js: use createDeck() from ./pptx.js first, then
// these builders add fully-chromed 13.333x7.5 slides.
//
// Fonts are referenced BY NAME (Garamond/Calibri) — not embedded — matching the
// hand-built decks (pptxgenjs cannot embed fonts natively).

// ---------------------------------------------------------------------------
// pitchTheme — design tokens (colors are pptxgenjs hex strings, no '#').
// ---------------------------------------------------------------------------
export const pitchTheme = {
  NAVY: '0A1836',      // titles, big numbers, table values
  NAVY_TX: '132448',   // body/table text navy
  GOLD: 'C4A04D',      // accents, rules, section tags, estimate stars
  MUTED: '5A6B8C',     // labels, footers, footnotes
  BAND: 'D9E2EE',      // header band fill
  BAND_LT: 'EEF2F7',   // zebra stripe / light card fill
  GRID: 'C9D6E5',      // table grid lines
  WHITE: 'FFFFFF',
  SERIF: 'Garamond',   // titles + big numbers + table values
  SANS: 'Calibri',     // labels + body rows
  // Slide geometry (inches)
  MARGIN_X: 0.62,
  CONTENT_W: 12.09,
  TITLE_Y: 0.68,
  RULE_Y: 1.38,
  FOOTER_Y: 7.14,
  FOOTER_TEXT: 'HPI REAL ESTATE SERVICES & INVESTMENTS',
};
const T = pitchTheme;

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests).
// ---------------------------------------------------------------------------

// 'YYYY-MM-DD' -> 'M/D/YY'. Anything unparseable passes through.
export function fmtDateShort(iso) {
  if (iso == null || iso === '') return '—';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso);
  return `${Number(m[2])}/${Number(m[3])}/${m[1].slice(2)}`;
}

// 9.75 -> '$9.75'; null -> em dash.
export function fmtMoneyPsf(v) {
  return v == null || v === '' ? '—' : `$${Number(v).toFixed(2)}`;
}

// '3.5' | 3.5 | '3.5%' -> '3.5%'; '$0.30/SF' passes through; blank -> em dash.
export function fmtEscalation(e) {
  if (e == null || e === '') return '—';
  const n = Number(String(e).replace(/%$/, ''));
  return Number.isFinite(n) ? `${parseFloat(n.toPrecision(6))}%` : String(e);
}

// Comma-grouped integer SF; null -> em dash.
export function fmtSfInt(v) {
  return v == null || v === '' ? '—' : `${Math.round(Number(v)).toLocaleString('en-US')}`;
}

export function truncate(s, n) {
  s = s == null ? '' : String(s);
  return s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+$/, '')}…`;
}

// Adaptive row pitch + font size for the full-height zebra tables (transcribed
// from rebuild_comps_v3.py / _velocity_rebuild.py).
export function tablePitch(nRows, { top = 1.95, bottom = 6.92, max = 0.238 } = {}) {
  return Math.min(max, (bottom - top) / Math.max(1, nRows));
}
export function tableFontSize(pitch) {
  return pitch >= 0.19 ? 7.8 : pitch >= 0.145 ? 7.0 : 6.8;
}

// Estimate marking: a single trailing '*' renders as a bold gold star
// (feedback_mark_estimates). '**' is literal. Returns { body, starred }.
export function splitEstimate(text) {
  const s = String(text ?? '');
  const starred = s.endsWith('*') && !s.endsWith('**');
  return { body: starred ? s.slice(0, -1) : s, starred };
}

// Per-year velocity summary rows: deal count, avg SF per deal, avg disclosed rate.
export function summarizeVelocityYear(deals) {
  const rated = deals.filter(d => d.rate != null && d.rate !== '');
  return {
    n: deals.length,
    avgSf: deals.length ? Math.round(deals.reduce((a, d) => a + Number(d.sf || 0), 0) / deals.length) : null,
    avgRate: rated.length ? rated.reduce((a, d) => a + Number(d.rate), 0) / rated.length : null,
  };
}

// ---------------------------------------------------------------------------
// Internal draw helpers.
// ---------------------------------------------------------------------------
function rect(slide, x, y, w, h, color) {
  slide.addShape('rect', { x, y, w, h, fill: { color }, line: { type: 'none' } });
}

function text(slide, x, y, w, h, str, { font = T.SANS, size = 10, bold = false, color = T.NAVY, align = 'left', italic = false, valign = 'middle', wrap = false, charSpacing } = {}) {
  const { body, starred } = splitEstimate(str);
  const runs = [{ text: body, options: { fontFace: font, fontSize: size, bold, italic, color, charSpacing } }];
  if (starred) runs.push({ text: '*', options: { fontFace: font, fontSize: size, bold: true, color: T.GOLD } });
  slide.addText(runs, { x, y, w, h, align, valign, wrap, margin: 0, lineSpacingMultiple: 1 });
}

// Rich-text table cell honoring the estimate star.
function cell(str, opts) {
  const { body, starred } = splitEstimate(str);
  if (!starred) return { text: body, options: opts };
  return {
    text: [
      { text: body, options: {} },
      { text: '*', options: { bold: true, color: T.GOLD } },
    ],
    options: opts,
  };
}

const GRID_BORDER = { type: 'solid', color: T.GRID, pt: 0.5 };
const NO_BORDER = { type: 'none' };
const GOLD_BOTTOM = [NO_BORDER, GRID_BORDER, { type: 'solid', color: T.GOLD, pt: 1.25 }, GRID_BORDER];

// ---------------------------------------------------------------------------
// addPitchSlide — blank slide with the full pitch chrome: section tag, Garamond
// title (+ gold subtitle run), short gold rule, HPI footer, page number, logo.
// Returns the slide. All content areas start at y ~1.5.
// ---------------------------------------------------------------------------
export function addPitchSlide(deck, { section, title, subtitle, page } = {}) {
  const s = deck.addSlide();
  s.background = { color: T.WHITE };
  if (section) {
    // e.g. '01  ·  MARKET'
    text(s, T.MARGIN_X, 0.40, 8, 0.24, String(section).toUpperCase(), { size: 10, bold: true, color: T.GOLD, charSpacing: 2 });
  }
  if (title) {
    const runs = [{ text: String(title), options: { fontFace: T.SERIF, fontSize: 31, bold: true, color: T.NAVY } }];
    if (subtitle) runs.push({ text: `  ${subtitle}`, options: { fontFace: T.SERIF, fontSize: 26, bold: false, color: T.GOLD } });
    s.addText(runs, { x: 0.60, y: T.TITLE_Y, w: 11.50, h: 0.54, align: 'left', valign: 'middle', margin: 0, wrap: false });
    rect(s, T.MARGIN_X, T.RULE_Y, 0.85, 0.03, T.GOLD);
  }
  text(s, T.MARGIN_X, T.FOOTER_Y, 6.0, 0.25, T.FOOTER_TEXT, { size: 7, bold: true, color: T.MUTED, valign: 'top' });
  if (page != null) {
    text(s, 12.30, T.FOOTER_Y, 0.45, 0.25, String(page), { size: 8, bold: true, color: T.MUTED, align: 'right', valign: 'top' });
  }
  if (deck._assets?.logo) {
    s.addImage({ data: deck._assets.logo, x: 12.06, y: 0.19, w: 0.64, h: 0.76, sizing: { type: 'contain', w: 0.64, h: 0.76 } });
  }
  return s;
}

// Column-header band for the full-width zebra tables: grey band + underrule +
// muted 7.5pt bold labels at each column x.
function columnHeaderBand(slide, cols, { y = 1.65, h = 0.30 } = {}) {
  rect(slide, T.MARGIN_X, y, T.CONTENT_W, h, T.BAND);
  rect(slide, T.MARGIN_X, y + h - 0.02, T.CONTENT_W, 0.02, T.NAVY_TX);
  for (const c of cols) {
    text(slide, c.x, y + 0.05, c.w, h - 0.10, c.header, { size: 7.5, bold: true, color: T.MUTED, align: c.align || 'left' });
  }
}

// ---------------------------------------------------------------------------
// addVelocityBandSlides — one "DEAL VELOCITY" slide per SF band: every tracked
// deal grouped by year (newest first) with a gold per-year TOTAL row, zebra
// striping, adaptive row pitch, sourced footnote.
// bands: [{ label ('20–60K SF'), years: [{ year, deals: [{ tenant, address,
//   submarket, signDate, sf, rate, ti, escalation }] }] }]
// ---------------------------------------------------------------------------
export const VELOCITY_COLS = [
  { key: 'year', header: 'YR', x: 0.673, w: 0.474, align: 'left' },
  { key: 'tenant', header: 'TENANT', x: 1.252, w: 2.514, align: 'left' },
  { key: 'address', header: 'ADDRESS', x: 3.871, w: 2.307, align: 'left' },
  { key: 'submarket', header: 'SUBMARKET', x: 6.283, w: 1.618, align: 'left' },
  { key: 'signDate', header: 'SIGNED', x: 8.007, w: 0.86, align: 'right' },
  { key: 'sf', header: 'SF', x: 8.972, w: 0.998, align: 'right' },
  { key: 'rate', header: 'RATE', x: 10.074, w: 0.929, align: 'right' },
  { key: 'ti', header: 'TI', x: 11.108, w: 0.722, align: 'right' },
  { key: 'escalation', header: 'ESC', x: 11.935, w: 0.722, align: 'right' },
];
const VEL_TOP = 1.95;
const VEL_BOTTOM = 6.92;
const DEFAULT_VEL_FOOTNOTE =
  'All tracked deals in the band shown; SF averages are per deal; rate averages reflect ' +
  'disclosed-rate deals only. Source: HPI Fort Worth market database.';

export function addVelocityBandSlides(deck, bands, { section, title = 'DEAL VELOCITY', footnote = DEFAULT_VEL_FOOTNOTE, startPage } = {}) {
  const slides = [];
  bands.forEach((band, bi) => {
    const s = addPitchSlide(deck, { section, title, subtitle: band.label, page: startPage != null ? startPage + bi : undefined });
    columnHeaderBand(s, VELOCITY_COLS);
    const nRows = band.years.reduce((a, y) => a + y.deals.length, 0) + band.years.length;
    const pitch = tablePitch(nRows, { top: VEL_TOP, bottom: VEL_BOTTOM });
    const size = tableFontSize(pitch);
    let i = 0;
    const row = (vals, { bold = false, color = T.NAVY } = {}) => {
      const top = VEL_TOP + i * pitch;
      if (i % 2 === 0) rect(s, T.MARGIN_X, top, T.CONTENT_W, pitch, T.BAND_LT);
      VELOCITY_COLS.forEach((c, k) => {
        if (vals[k] == null) return;
        text(s, c.x, top, c.w, pitch, vals[k], { size, bold, color, align: c.align });
      });
      i += 1;
    };
    for (const y of band.years) {
      for (const d of y.deals) {
        row([
          String(y.year), truncate(d.tenant || 'Undisclosed', 32), truncate(d.address || '—', 30),
          d.submarket || '', fmtDateShort(d.signDate), fmtSfInt(d.sf),
          fmtMoneyPsf(d.rate), fmtMoneyPsf(d.ti), fmtEscalation(d.escalation),
        ]);
      }
      const sum = summarizeVelocityYear(y.deals);
      row([
        null, `${y.year} TOTAL — ${sum.n} DEALS`, null, null, null,
        sum.avgSf != null ? fmtSfInt(sum.avgSf) : null,
        sum.avgRate != null ? fmtMoneyPsf(sum.avgRate) : null, null, null,
      ], { bold: true, color: T.GOLD });
    }
    if (footnote) {
      text(s, T.MARGIN_X, Math.min(VEL_TOP + nRows * pitch + 0.02, 6.94), 11.0, 0.18, footnote, { size: 6.5, italic: true, color: T.MUTED });
    }
    slides.push(s);
  });
  return slides;
}

// ---------------------------------------------------------------------------
// addLeasingVelocitySlide — the 3-column year hero ("LEASING VELOCITY" slide 4):
// per year a light card with big Garamond total, gold volume bar, fit line, a
// TENANT/SF mini-table of the subject-competitive deals + gold-ruled subtotal;
// full-width navy takeaway strip at the bottom.
// years (up to 3, oldest first): [{ label ('2024'), totalSf, dealCount,
//   fitCount, deals: [{ tenant, sf }] }]
// ---------------------------------------------------------------------------
export function addLeasingVelocitySlide(deck, { section, title = 'LEASING VELOCITY', subtitle, years, subtotalLabel = 'SUBJECT-COMPETITIVE SUBTOTAL', takeaway, page } = {}) {
  const s = addPitchSlide(deck, { section, title, subtitle, page });
  const COLS_X = [0.62, 4.75, 8.89];
  const CW = 3.83;
  const maxSf = Math.max(...years.map(y => Number(y.totalSf) || 0), 1);
  years.slice(0, 3).forEach((y, ci) => {
    const x = COLS_X[ci];
    // header card
    rect(s, x, 1.50, CW, 1.50, T.BAND_LT);
    rect(s, x, 1.50, CW, 0.03, T.GOLD);
    text(s, x + 0.16, 1.57, CW - 0.30, 0.36, y.label, { font: T.SERIF, size: 20, bold: true });
    const m = Number(y.totalSf) || 0;
    const big = m >= 995000 ? `${(m / 1e6).toFixed(2)}M SF` : `${Math.round(m / 1e3)}K SF`;
    text(s, x + 0.16, 1.95, CW - 0.30, 0.50, big, { font: T.SERIF, size: 30, bold: true });
    // volume bar: full track + gold fill scaled to the biggest year
    rect(s, x + 0.16, 2.50, CW - 0.32, 0.10, T.BAND);
    rect(s, x + 0.16, 2.50, Math.max(0.05, (CW - 0.32) * (m / maxSf)), 0.10, T.GOLD);
    text(s, x + 0.16, 2.63, CW - 0.30, 0.16, `${fmtSfInt(m)} SF total submarket leasing`, { size: 7.5, color: T.MUTED });
    if (y.fitCount != null && y.dealCount != null) {
      text(s, x + 0.16, 2.79, CW - 0.30, 0.18, y.fitLabel || `${y.fitCount} of ${y.dealCount} deals fit`, { size: 9.5, bold: true, color: T.NAVY_TX });
    }
    // mini-table header (navy band + gold left tab + underrule)
    rect(s, x, 3.12, CW, 0.30, T.NAVY);
    rect(s, x, 3.12, 0.05, 0.30, T.GOLD);
    rect(s, x, 3.40, CW, 0.02, T.GOLD);
    text(s, x + 0.12, 3.12, 2.83, 0.30, 'TENANT', { size: 7.5, bold: true, color: T.WHITE });
    text(s, x + CW - 0.80, 3.12, 0.68, 0.30, 'SF', { size: 7.5, bold: true, color: T.WHITE, align: 'right' });
    // rows
    const RH = 0.267;
    let ry = 3.46;
    for (let i = 0; i < y.deals.length; i++) {
      if (i % 2 === 0) rect(s, x, ry, CW, RH, T.BAND_LT);
      text(s, x + 0.12, ry, 2.88, RH, truncate(y.deals[i].tenant || 'Undisclosed', 27), { size: 9.5, color: T.NAVY_TX });
      text(s, x + CW - 0.89, ry, 0.77, RH, fmtSfInt(y.deals[i].sf), { size: 9.5, color: T.NAVY_TX, align: 'right' });
      ry += RH;
    }
    // subtotal
    rect(s, x, ry + 0.02, CW, 0.02, T.GOLD);
    const subtotal = y.deals.reduce((a, d) => a + Number(d.sf || 0), 0);
    text(s, x + 0.12, ry + 0.07, 2.63, 0.20, subtotalLabel, { size: 7, bold: true, color: T.MUTED });
    text(s, x + CW - 1.25, ry + 0.07, 1.13, 0.20, `${fmtSfInt(subtotal)} SF`, { size: 9, bold: true, align: 'right' });
  });
  if (takeaway) {
    rect(s, T.MARGIN_X, 6.80, 12.10, 0.28, T.NAVY);
    rect(s, T.MARGIN_X, 6.80, 0.06, 0.28, T.GOLD);
    text(s, 0.80, 6.80, 12.0, 0.28, takeaway, { size: 10.5, color: T.WHITE });
  }
  return s;
}

// ---------------------------------------------------------------------------
// addBuildingSpecSlide — the CP35-style building data slide (Gemini slides
// 12/13): spec STAT BAR under the title; hero site/demising plan (left) over a
// REFERENCE COMPS table; MARKET LEASING ASSUMPTIONS + TURNKEY TI DETAIL
// matrices (right); sourcing footnote. Values ending in a single '*' render
// the estimate gold star.
// ---------------------------------------------------------------------------
function matrixTable(slide, { x, y, w, title, cols, rows, lblFrac = 0.30, total, totalLabel = 'TOTAL COST', psf, psfLabel = 'COST / SF' }) {
  const lblW = w * lblFrac;
  const cw = (w - lblW) / cols.length;
  const colW = [lblW, ...cols.map(() => cw)];
  const body = [];
  body.push([cell(title, { colspan: colW.length, bold: true, color: T.WHITE, fill: { color: T.NAVY }, align: 'left', fontSize: 10.5, border: NO_BORDER })]);
  body.push([
    cell('', { fill: { color: T.WHITE }, border: GOLD_BOTTOM }),
    ...cols.map(c => cell(c, { bold: true, color: T.NAVY, fill: { color: T.WHITE }, align: 'center', fontSize: 8, border: GOLD_BOTTOM })),
  ]);
  rows.forEach(([lbl, vals], i) => {
    const fill = i % 2 === 0 ? T.WHITE : T.BAND_LT;
    body.push([
      cell(lbl, { bold: true, color: T.MUTED, fill: { color: T.BAND_LT }, fontSize: 8.5, border: GRID_BORDER }),
      ...vals.map(v => cell(v, { color: T.NAVY, fill: { color: fill }, align: 'center', fontFace: T.SERIF, fontSize: 10, border: GRID_BORDER })),
    ]);
  });
  if (total) {
    body.push([
      cell(totalLabel, { bold: true, color: T.WHITE, fill: { color: T.NAVY }, fontSize: 8.5, border: NO_BORDER }),
      ...total.map(v => cell(v, { bold: true, color: T.WHITE, fill: { color: T.NAVY }, align: 'center', fontFace: T.SERIF, fontSize: 10, border: NO_BORDER })),
    ]);
    body.push([
      cell(psfLabel, { bold: true, color: T.NAVY, fill: { color: T.GOLD }, fontSize: 8.5, border: NO_BORDER }),
      ...psf.map(v => cell(v, { bold: true, color: T.NAVY, fill: { color: T.GOLD }, align: 'center', fontFace: T.SERIF, fontSize: 10.5, border: NO_BORDER })),
    ]);
  }
  const rowH = [0.30, 0.25, ...rows.map(() => 0.212), ...(total ? [0.26, 0.28] : [])];
  slide.addTable(body, { x, y, w, colW, rowH, fontFace: T.SANS, valign: 'middle', margin: [2, 6, 2, 6], border: NO_BORDER });
  return y + rowH.reduce((a, b) => a + b, 0);
}

export function addBuildingSpecSlide(deck, { section, title, subtitle, page, stats = [], planImage, planCaption, refComps, mla, ti, footnote }) {
  const s = addPitchSlide(deck, { section, title, subtitle, page });
  // stat bar
  if (stats.length) {
    const bx = T.MARGIN_X, by = 1.6, bw = 12.1, bh = 0.56;
    rect(s, bx, by, bw, bh, T.BAND_LT);
    rect(s, bx, by, bw, 0.022, T.GOLD);
    const cw = bw / stats.length;
    stats.forEach((st, i) => {
      const cx = bx + i * cw;
      if (i > 0) rect(s, cx, by + 0.13, 0.012, bh - 0.26, T.GOLD);
      text(s, cx, by + 0.09, cw, 0.34, st.value, { font: T.SERIF, size: 15, bold: true, align: 'center', wrap: true });
      text(s, cx, by + 0.40, cw, 0.18, st.label, { size: 7, bold: true, color: T.GOLD, align: 'center', wrap: true });
    });
  }
  const LX = 0.62, LW = 5.55, RX = 6.55, RW = 6.17, PTOP = 2.44;
  if (planImage) {
    s.addImage({ data: planImage, x: LX, y: PTOP, w: LW, h: 2.48, sizing: { type: 'contain', w: LW, h: 2.48 } });
  }
  if (planCaption) text(s, LX, 5.02, LW, 0.2, planCaption, { size: 7.5, bold: true, color: T.GOLD });
  if (refComps) {
    const colW = [LW * 0.32, LW * 0.16, LW * 0.19, LW * 0.16, LW * 0.17];
    const aligns = ['left', 'center', 'center', 'center', 'center'];
    const body = [
      [cell(refComps.title || 'REFERENCE COMPS', { colspan: 5, bold: true, color: T.WHITE, fill: { color: T.NAVY }, fontSize: 10.5, border: NO_BORDER })],
      [cell(refComps.subtitle || '', { colspan: 5, bold: true, color: T.GOLD, fill: { color: T.BAND }, fontSize: 7.5, border: NO_BORDER })],
      ['TENANT', 'SF', 'SIGNED', 'RATE', 'TI'].map((h, j) => cell(h, { bold: true, color: T.NAVY, fill: { color: T.WHITE }, align: aligns[j], fontSize: 7.5, border: GOLD_BOTTOM })),
      ...refComps.rows.map((r, i) => {
        const fill = { color: i % 2 === 0 ? T.WHITE : T.BAND_LT };
        return [
          cell(r.tenant, { bold: true, color: T.NAVY, fill, fontSize: 8.5, border: GRID_BORDER }),
          cell(fmtSfInt(r.sf), { color: T.MUTED, fill, align: 'center', fontFace: T.SERIF, fontSize: 8, border: GRID_BORDER }),
          cell(r.signed, { color: T.MUTED, fill, align: 'center', fontFace: T.SERIF, fontSize: 8, border: GRID_BORDER }),
          cell(fmtMoneyPsf(r.rate), { bold: true, color: T.NAVY, fill, align: 'center', fontFace: T.SERIF, fontSize: 9.5, border: GRID_BORDER }),
          cell(fmtMoneyPsf(r.ti), { color: T.MUTED, fill, align: 'center', fontFace: T.SERIF, fontSize: 8, border: GRID_BORDER }),
        ];
      }),
    ];
    const rowH = [0.27, 0.19, 0.19, ...refComps.rows.map(() => 0.188)];
    s.addTable(body, { x: LX, y: 5.24, w: LW, colW, rowH, fontFace: T.SANS, valign: 'middle', margin: [2, 6, 2, 6], border: NO_BORDER });
  }
  let y2 = PTOP;
  if (mla) y2 = matrixTable(s, { x: RX, y: PTOP, w: RW, title: mla.title || 'MARKET LEASING ASSUMPTIONS', cols: mla.cols, rows: mla.rows, lblFrac: 0.30 });
  if (ti) matrixTable(s, { x: RX, y: y2 + 0.26, w: RW, title: ti.title || 'TURNKEY TI DETAIL', cols: ti.cols, rows: ti.rows, lblFrac: 0.38, total: ti.total, psf: ti.psf });
  if (footnote) text(s, LX, 6.88, 12.1, 0.3, footnote, { size: 6.0, italic: true, color: T.MUTED, valign: 'top', wrap: true });
  return s;
}

// ---------------------------------------------------------------------------
// addLeaseUpPlanSlide — the 6-step lease-up strategy narrative (Gemini slide
// 14): intro line, 3x2 grid of gold-numbered steps, full-width goal-quote band.
// steps: [{ title, desc }] (up to 6). quote/attribution optional.
// ---------------------------------------------------------------------------
export function addLeaseUpPlanSlide(deck, { section, title = 'LEASE-UP PLAN', subtitle, page, intro, steps = [], quote, attribution }) {
  const s = addPitchSlide(deck, { section, title, subtitle, page });
  if (intro) text(s, T.MARGIN_X, 1.62, 11.5, 0.35, intro, { size: 11.5, italic: true, color: T.MUTED, valign: 'top', wrap: true });
  const COLS_X = [0.62, 4.77, 8.92];
  const ROWS_Y = [2.35, 4.15];
  const CW = 3.7;
  steps.slice(0, 6).forEach((st, i) => {
    const cx = COLS_X[i % 3], cy = ROWS_Y[Math.floor(i / 3)];
    text(s, cx, cy, 0.95, 0.6, String(i + 1).padStart(2, '0'), { font: T.SERIF, size: 33, bold: true, color: T.GOLD, valign: 'top' });
    rect(s, cx + 0.02, cy + 0.66, 0.34, 0.02, T.GOLD);
    text(s, cx + 0.92, cy + 0.02, CW - 0.92, 0.55, st.title, { size: 12, bold: true, wrap: true });
    text(s, cx + 0.92, cy + 0.62, CW - 0.92, 1.0, st.desc, { size: 10, color: T.NAVY_TX, valign: 'top', wrap: true });
  });
  if (quote) {
    const by = 6.02, bh = 0.92;
    rect(s, T.MARGIN_X, by, 12.09, bh, T.BAND_LT);
    rect(s, T.MARGIN_X, by, 12.09, 0.022, T.GOLD);
    text(s, 0.8, by + 0.02, 1.0, 0.9, '“', { font: T.SERIF, size: 60, bold: true, color: T.GOLD });
    text(s, 1.55, by + 0.12, 8.9, bh - 0.24, quote, { font: T.SERIF, size: 15, italic: true, wrap: true });
    if (attribution) text(s, 10.5, by + 0.12, 2.05, bh - 0.24, attribution, { size: 8.5, bold: true, color: T.MUTED, align: 'right', wrap: true });
  }
  return s;
}

// ---------------------------------------------------------------------------
// addProspectPipelineSlide — the rollover/prospect pipeline slide (Gemini slide
// 16): up to 3 big headline stats, then the target list split into two 15-row
// TENANT/BUILDING/SF/EXP columns with zebra striping.
// kpis: [{ value, label }]; rows: [{ tenant, building, sf, exp }] (<= 30).
// ---------------------------------------------------------------------------
export const PIPELINE_COLS = [
  { key: 'tenant', header: 'TENANT', x: 0.04, w: 1.887, align: 'left' },
  { key: 'building', header: 'BUILDING', x: 2.007, w: 2.198, align: 'left' },
  { key: 'sf', header: 'SF', x: 4.285, w: 0.697, align: 'right' },
  { key: 'exp', header: 'EXP', x: 5.062, w: 0.748, align: 'right' },
];
export function addProspectPipelineSlide(deck, { section, title = 'PROSPECT PIPELINE', subtitle, page, kpis = [], rows = [], footnote }) {
  const s = addPitchSlide(deck, { section, title, subtitle, page });
  const KX = [0.62, 3.92, 7.22];
  kpis.slice(0, 3).forEach((k, i) => {
    text(s, KX[i], 1.60, 3.1, 0.55, String(k.value), { font: T.SERIF, size: 30, bold: true, valign: 'top' });
    text(s, KX[i], 2.18, 3.1, 0.20, String(k.label).toUpperCase(), { size: 8, bold: true, color: T.GOLD, valign: 'top' });
  });
  const TW = 5.85, RH = 0.253, TOP = 3.25;
  const tables = [{ dx: 0, rows: rows.slice(0, 15) }, { dx: 6.24, rows: rows.slice(15, 30) }];
  for (const tbl of tables) {
    if (!tbl.rows.length) continue;
    const x = T.MARGIN_X + tbl.dx;
    rect(s, x, TOP - 0.32, TW, 0.30, T.NAVY);
    rect(s, x, TOP - 0.32, 0.05, 0.30, T.GOLD);
    rect(s, x, TOP - 0.04, TW, 0.02, T.GOLD);
    PIPELINE_COLS.forEach(c => {
      text(s, x + c.x, TOP - 0.32, c.w, 0.30, c.header, { size: 7.5, bold: true, color: T.WHITE, align: c.align });
    });
    tbl.rows.forEach((r, j) => {
      const ty = TOP + j * RH;
      if (j % 2 === 0) rect(s, x, ty, TW, RH, T.BAND_LT);
      const vals = [truncate(r.tenant || 'Undisclosed', 24), truncate(r.building || '—', 28), fmtSfInt(r.sf), fmtDateShort(r.exp)];
      PIPELINE_COLS.forEach((c, k) => {
        text(s, x + c.x, ty, c.w, RH, vals[k], { size: 8.0, color: T.NAVY_TX, align: c.align });
      });
    });
  }
  if (footnote) text(s, T.MARGIN_X, 7.0 - 0.12, 11.5, 0.2, footnote, { size: 6.5, italic: true, color: T.MUTED });
  return s;
}

// ---------------------------------------------------------------------------
// addLeaseCompsSlide — the full-width signed-lease comps table (Gemini slide
// 17): SIGNED/TENANT/BUILDING/SF/RATE(gold)/ESC/TI/FREE/TERM, zebra rows,
// adaptive pitch, sourced footnote.
// rows: [{ signDate, tenant, building, sf, rate, escalation, ti, freeMonths, termMonths }]
// ---------------------------------------------------------------------------
export const LEASE_COMP_COLS = [
  { key: 'signDate', header: 'SIGNED', x: 0.66, w: 0.905, align: 'left' },
  { key: 'tenant', header: 'TENANT', x: 1.645, w: 2.382, align: 'left' },
  { key: 'building', header: 'BUILDING', x: 4.107, w: 3.015, align: 'left' },
  { key: 'sf', header: 'SF', x: 7.202, w: 1.046, align: 'right' },
  { key: 'rate', header: 'RATE', x: 8.328, w: 0.905, align: 'right' },
  { key: 'escalation', header: 'ESC', x: 9.313, w: 0.764, align: 'right' },
  { key: 'ti', header: 'TI', x: 10.157, w: 0.764, align: 'right' },
  { key: 'free', header: 'FREE', x: 11.001, w: 0.764, align: 'right' },
  { key: 'term', header: 'TERM', x: 11.845, w: 0.835, align: 'right' },
];
export function fmtMonths(v) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n ? `${parseFloat(n.toPrecision(6))} mo` : '0';
}
export function addLeaseCompsSlide(deck, { section, title = 'LEASE COMPS', subtitle, page, rows = [], footnote }) {
  const s = addPitchSlide(deck, { section, title, subtitle, page });
  columnHeaderBand(s, LEASE_COMP_COLS);
  const pitch = tablePitch(rows.length, { top: VEL_TOP, bottom: VEL_BOTTOM, max: 0.27 });
  const size = pitch >= 0.2 ? 8.19 : 7.6;
  rows.forEach((r, i) => {
    const top = VEL_TOP + i * pitch;
    if (i % 2 === 0) rect(s, T.MARGIN_X, top, 12.1, pitch, T.BAND_LT);
    const vals = [
      fmtDateShort(r.signDate), truncate(r.tenant || 'Undisclosed', 30), truncate(r.building || '—', 36),
      fmtSfInt(r.sf), fmtMoneyPsf(r.rate), fmtEscalation(r.escalation), fmtMoneyPsf(r.ti),
      fmtMonths(r.freeMonths), fmtMonths(r.termMonths),
    ];
    LEASE_COMP_COLS.forEach((c, k) => {
      const gold = c.key === 'rate';
      text(s, c.x, top, c.w, pitch, vals[k], { size, bold: gold, color: gold ? T.GOLD : T.NAVY, align: c.align });
    });
  });
  if (footnote) {
    text(s, T.MARGIN_X, VEL_TOP + rows.length * pitch + 0.02, 11.5, 0.2, footnote, { size: 7.0, italic: true, color: T.MUTED });
  }
  return s;
}
