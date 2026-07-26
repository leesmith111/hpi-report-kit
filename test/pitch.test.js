import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pitchTheme, fmtDateShort, fmtMoneyPsf, fmtEscalation, fmtSfInt, fmtMonths,
  truncate, tablePitch, tableFontSize, splitEstimate, summarizeVelocityYear,
  addPitchSlide, addVelocityBandSlides, addLeasingVelocitySlide,
  addBuildingSpecSlide, addLeaseUpPlanSlide, addProspectPipelineSlide,
  addLeaseCompsSlide, VELOCITY_COLS, LEASE_COMP_COLS,
} from '../src/pitch.js';

// ---- pure helpers ----------------------------------------------------------

test('fmtDateShort: ISO -> M/D/YY, passthrough, blank', () => {
  assert.equal(fmtDateShort('2026-05-01'), '5/1/26');
  assert.equal(fmtDateShort('2024-12-31'), '12/31/24');
  assert.equal(fmtDateShort(''), '—');
  assert.equal(fmtDateShort(null), '—');
  assert.equal(fmtDateShort("Jun '25"), "Jun '25");
});

test('fmtMoneyPsf / fmtSfInt / fmtMonths / fmtEscalation', () => {
  assert.equal(fmtMoneyPsf(9.75), '$9.75');
  assert.equal(fmtMoneyPsf(12), '$12.00');
  assert.equal(fmtMoneyPsf(null), '—');
  assert.equal(fmtSfInt(119012), '119,012');
  assert.equal(fmtSfInt(null), '—');
  assert.equal(fmtMonths(63), '63 mo');
  assert.equal(fmtMonths(2.5), '2.5 mo');
  assert.equal(fmtMonths(0), '0');
  assert.equal(fmtMonths(null), '—');
  assert.equal(fmtEscalation(3.5), '3.5%');
  assert.equal(fmtEscalation('4.0%'), '4%');
  assert.equal(fmtEscalation('$0.30/SF'), '$0.30/SF');
  assert.equal(fmtEscalation(''), '—');
});

test('truncate: ellipsis with trailing-space strip', () => {
  assert.equal(truncate('short', 10), 'short');
  assert.equal(truncate('a very long tenant name', 12), 'a very long…');
});

test('tablePitch/tableFontSize: adaptive density matches deck build rules', () => {
  // roomy table caps at 0.238
  assert.equal(tablePitch(10), 0.238);
  // dense table shrinks; font follows
  const dense = tablePitch(35);
  assert.ok(dense < 0.15);
  assert.equal(tableFontSize(0.2), 7.8);
  assert.equal(tableFontSize(0.16), 7.0);
  assert.equal(tableFontSize(0.13), 6.8);
});

test('splitEstimate: single trailing star only', () => {
  assert.deepEqual(splitEstimate('24,729 SF*'), { body: '24,729 SF', starred: true });
  assert.deepEqual(splitEstimate('plain'), { body: 'plain', starred: false });
  assert.deepEqual(splitEstimate('lit**'), { body: 'lit**', starred: false });
});

test('summarizeVelocityYear: count / avg SF per deal / disclosed-rate avg only', () => {
  const s = summarizeVelocityYear([
    { sf: 30000, rate: 10 },
    { sf: 50000, rate: null },
    { sf: 40000, rate: 12 },
  ]);
  assert.equal(s.n, 3);
  assert.equal(s.avgSf, 40000);
  assert.equal(s.avgRate, 11);
  assert.deepEqual(summarizeVelocityYear([]), { n: 0, avgSf: null, avgRate: null });
});

// ---- slide builders (structural smoke against a stub deck) -----------------

function stubDeck() {
  const deck = {
    _assets: { logo: 'data:image/png;base64,x' },
    slides: [],
    addSlide() {
      const slide = { texts: [], shapes: [], images: [], tables: [] };
      slide.addText = (runs, opts) => slide.texts.push({ runs, opts });
      slide.addShape = (kind, opts) => slide.shapes.push({ kind, opts });
      slide.addImage = (opts) => slide.images.push(opts);
      slide.addTable = (body, opts) => slide.tables.push({ body, opts });
      deck.slides.push(slide);
      return slide;
    },
  };
  return deck;
}
const flatText = (slide) => slide.texts.map(t => (Array.isArray(t.runs) ? t.runs.map(r => r.text).join('') : String(t.runs))).join('\n');

test('addPitchSlide: chrome = title+subtitle runs, gold rule, footer, page, logo', () => {
  const deck = stubDeck();
  const s = addPitchSlide(deck, { section: '02 · The Asset', title: 'BUILDING 1', subtitle: 'North Park', page: 12 });
  const all = flatText(s);
  assert.match(all, /02 · THE ASSET/);
  assert.match(all, /BUILDING 1 {2}North Park/);
  assert.match(all, /HPI REAL ESTATE SERVICES & INVESTMENTS/);
  assert.match(all, /\b12\b/);
  assert.equal(s.images.length, 1);
  // gold short rule under the title
  assert.ok(s.shapes.some(sh => sh.opts.fill?.color === pitchTheme.GOLD && sh.opts.w === 0.85));
  // title runs: navy serif bold + gold subtitle
  const title = s.texts.find(t => Array.isArray(t.runs) && t.runs[0]?.text === 'BUILDING 1');
  assert.equal(title.runs[0].options.color, pitchTheme.NAVY);
  assert.equal(title.runs[0].options.fontFace, pitchTheme.SERIF);
  assert.equal(title.runs[1].options.color, pitchTheme.GOLD);
});

test('addVelocityBandSlides: one slide per band, per-year gold TOTAL rows', () => {
  const deck = stubDeck();
  const deals26 = [{ tenant: 'Acme', address: '100 Main St', submarket: 'N FW', signDate: '2026-03-01', sf: 40000, rate: 11.5, ti: 8, escalation: 4 }];
  const deals25 = [
    { tenant: 'Beta Logistics', address: '200 Elm', submarket: 'N FW', signDate: '2025-06-15', sf: 30000, rate: null, ti: null, escalation: '' },
    { tenant: null, address: null, submarket: 'N FW', signDate: '2025-01-02', sf: 50000, rate: 10, ti: 5, escalation: 3.5 },
  ];
  const slides = addVelocityBandSlides(deck, [
    { label: '20–60K SF', years: [{ year: 2026, deals: deals26 }, { year: 2025, deals: deals25 }] },
    { label: '60–100K SF', years: [{ year: 2026, deals: deals26 }] },
  ], { section: '01 · Market', startPage: 5 });
  assert.equal(slides.length, 2);
  const all = flatText(slides[0]);
  assert.match(all, /2026 TOTAL — 1 DEALS/);
  assert.match(all, /2025 TOTAL — 2 DEALS/);
  assert.match(all, /Undisclosed/);          // null tenant fallback
  assert.match(all, /\$11\.50/);
  assert.match(all, /disclosed-rate deals only/); // footnote
  // TOTAL rows are gold + bold
  const totalRun = slides[0].texts.find(t => Array.isArray(t.runs) && /TOTAL — 2 DEALS/.test(t.runs[0].text));
  assert.equal(totalRun.runs[0].options.color, pitchTheme.GOLD);
  assert.equal(totalRun.runs[0].options.bold, true);
  // header band renders every column header
  for (const c of VELOCITY_COLS) assert.match(all, new RegExp(c.header));
  // page numbers increment per band
  assert.match(flatText(slides[1]), /\b6\b/);
});

test('addLeasingVelocitySlide: 3 year columns + scaled bars + subtotal + takeaway', () => {
  const deck = stubDeck();
  const yr = (label, totalSf, deals) => ({ label, totalSf, dealCount: deals.length + 2, fitCount: deals.length, deals });
  const s = addLeasingVelocitySlide(deck, {
    years: [
      yr('2024', 1997715, [{ tenant: 'Makesy', sf: 40404 }]),
      yr('2025', 3420371, [{ tenant: 'Trane', sf: 90000 }, { tenant: 'Gateway Tire', sf: 85950 }]),
      yr('2026 YTD', 904609, [{ tenant: 'ITS Logistics', sf: 90000 }]),
    ],
    subtotalLabel: 'GEMINI-COMPETITIVE SUBTOTAL',
    takeaway: '23 deals landed in the size range.',
  });
  const all = flatText(s);
  assert.match(all, /2\.00M SF/);   // 1,997,715 -> 2.00M
  assert.match(all, /3\.42M SF/);
  assert.match(all, /905K SF/);     // 904,609 rounds to 905K
  assert.match(all, /1 of 3 deals fit/);
  assert.match(all, /GEMINI-COMPETITIVE SUBTOTAL/);
  assert.match(all, /175,950 SF/);  // 2025 subtotal
  assert.match(all, /23 deals landed/);
  // gold bar fill scaled: 2025 is the max -> full-width fill exists
  const goldBars = s.shapes.filter(sh => sh.opts.fill?.color === pitchTheme.GOLD && sh.opts.h === 0.10);
  assert.equal(goldBars.length, 3);
  const widths = goldBars.map(b => b.opts.w);
  assert.equal(Math.max(...widths), 3.83 - 0.32); // the max year fills the track
});

test('addBuildingSpecSlide: stat bar, matrices with TOTAL/PSF, estimate star runs', () => {
  const deck = stubDeck();
  const s = addBuildingSpecSlide(deck, {
    title: 'BUILDING 2',
    stats: [{ value: '74,187 SF', label: 'TOTAL RBA' }, { value: '24,729 SF*', label: 'DIVISIBLE TO' }],
    planCaption: 'PROPOSED DEMISING PLAN',
    refComps: { subtitle: 'TOP NFW COMPS', rows: [{ tenant: 'Carrier', sf: 26096, signed: "Feb '25", rate: 12.5, ti: 3 }] },
    mla: { cols: ['FULL BLDG', '2 TENANTS*'], rows: [['Suite Size', ['74,187', '37,094']], ['Quoted Rate (NNN)', ['$10.50', '$11.25']]] },
    ti: { cols: ['FULL BLDG'], rows: [['Office (@ $150/SF)', ['$500,762']]], total: ['$1,231,472'], psf: ['$16.60'] },
    footnote: 'Per HPI MLA.',
  });
  const all = flatText(s);
  assert.match(all, /TOTAL RBA/);
  assert.match(all, /PROPOSED DEMISING PLAN/);
  assert.match(all, /Per HPI MLA\./);
  // estimate star on the stat value became its own gold run
  const stat = s.texts.find(t => Array.isArray(t.runs) && t.runs[0]?.text === '24,729 SF');
  assert.equal(stat.runs[1].text, '*');
  assert.equal(stat.runs[1].options.color, pitchTheme.GOLD);
  // 3 tables: ref comps + MLA + TI
  assert.equal(s.tables.length, 3);
  const tiTable = s.tables[2];
  const tiFlat = JSON.stringify(tiTable.body);
  assert.match(tiFlat, /TOTAL COST/);
  assert.match(tiFlat, /COST \/ SF/);
  assert.match(tiFlat, /\$16\.60/);
  // MLA header cell '2 TENANTS*' carries the gold-star rich run
  const mlaFlat = JSON.stringify(s.tables[1].body);
  assert.match(mlaFlat, /2 TENANTS/);
  assert.match(mlaFlat, new RegExp(pitchTheme.GOLD));
});

test('addLeaseUpPlanSlide: 6 numbered steps + quote band', () => {
  const deck = stubDeck();
  const steps = Array.from({ length: 6 }, (_, i) => ({ title: `STEP ${i + 1}`, desc: `Do thing ${i + 1}.` }));
  const s = addLeaseUpPlanSlide(deck, { intro: 'A six-part plan.', steps, quote: '100% leased in 12 months.', attribution: 'HPI FORT WORTH' });
  const all = flatText(s);
  for (let i = 1; i <= 6; i++) assert.match(all, new RegExp(`STEP ${i}`));
  assert.match(all, /^01$/m);
  assert.match(all, /^06$/m);
  assert.match(all, /100% leased in 12 months\./);
  assert.match(all, /HPI FORT WORTH/);
});

test('addProspectPipelineSlide: KPIs + 30 rows split into two 15-row columns', () => {
  const deck = stubDeck();
  const rows = Array.from({ length: 30 }, (_, i) => ({ tenant: `Tenant ${i + 1}`, building: `Bldg ${i + 1}`, sf: 10000 + i, exp: '2027-06-30' }));
  const s = addProspectPipelineSlide(deck, {
    kpis: [{ value: '85', label: 'Rollovers' }, { value: '5.9M SF', label: 'Expiring' }],
    rows,
  });
  const all = flatText(s);
  assert.match(all, /Tenant 1\b/);
  assert.match(all, /Tenant 16\b/);   // second column starts
  assert.match(all, /Tenant 30\b/);
  assert.match(all, /ROLLOVERS/);
  // two navy header bands (one per column)
  const navyBands = s.shapes.filter(sh => sh.opts.fill?.color === pitchTheme.NAVY && sh.opts.h === 0.30);
  assert.equal(navyBands.length, 2);
});

test('addLeaseCompsSlide: gold rate column + adaptive pitch', () => {
  const deck = stubDeck();
  const rows = Array.from({ length: 20 }, (_, i) => ({
    signDate: '2025-03-01', tenant: `T${i}`, building: `B${i}`, sf: 45000,
    rate: 10.5, escalation: 4, ti: 8, freeMonths: 2, termMonths: 63,
  }));
  const s = addLeaseCompsSlide(deck, { rows, footnote: 'Source: HPI.' });
  const all = flatText(s);
  assert.match(all, /Source: HPI\./);
  for (const c of LEASE_COMP_COLS) assert.match(all, new RegExp(c.header));
  const rateRun = s.texts.find(t => Array.isArray(t.runs) && t.runs[0]?.text === '$10.50');
  assert.equal(rateRun.runs[0].options.color, pitchTheme.GOLD);
  assert.equal(rateRun.runs[0].options.bold, true);
  assert.match(all, /63 mo/);
});
