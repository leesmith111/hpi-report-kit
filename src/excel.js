// Excel (.xlsx) builders. Server-OR-client safe (exceljs only). The CP35
// marketing-report + market-sheet logic is shared by agency-hub (imported from
// the kit); the competitive-set sheet builders render the same supply + comps
// tables the deck shows, as workbook sheets. All sheets get a consistent,
// professional treatment: navy header band, banded rows, hairline borders,
// frozen header, autofilter, and right-aligned numeric formatting.
import ExcelJS from 'exceljs';
import { fmtSf } from './format.js';

const NAVY = 'FF1F2A4D';       // section bands + numbers/titles text
const HEADER = 'FF24315A';     // column-header fill
const BAND = 'FFF3F6FB';       // zebra band
const LABEL_BG = 'FFEDEFF5';   // property-block label fill
const BORDER = 'FFD7DEEA';     // hairline grid
const WHITE = 'FFFFFFFF';

const thin = { style: 'thin', color: { argb: BORDER } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

// ── shared styling helpers ──────────────────────────────────────────────────
function styleHeaderCells(row, nCols) {
  for (let c = 1; c <= nCols; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = allBorders;
  }
  row.height = 22;
}

// Borders + zebra banding + per-column number formats over a data range.
function styleDataRange(ws, firstRow, lastRow, nCols, numFmts = {}) {
  for (let r = firstRow; r <= lastRow; r++) {
    const row = ws.getRow(r);
    const band = (r - firstRow) % 2 === 1;
    for (let c = 1; c <= nCols; c++) {
      const cell = row.getCell(c);
      cell.border = allBorders;
      cell.alignment = { vertical: 'middle', horizontal: numFmts[c] ? 'right' : 'left' };
      if (band) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BAND } };
      if (numFmts[c]) cell.numFmt = numFmts[c];
    }
  }
}

// Auto column widths from header + cell text (numeric columns padded for commas/$).
function autoWidths(ws, columns, rows, numFmts = {}) {
  columns.forEach((label, i) => {
    let w = String(label ?? '').length;
    for (const r of rows) { const v = Array.isArray(r) ? r[i] : r[i]; const s = v == null ? '' : String(v); if (s.length > w) w = s.length; }
    const pad = numFmts[i + 1] ? 5 : 3;
    ws.getColumn(i + 1).width = Math.min(44, Math.max(11, w + pad));
  });
}

const CP35_NCOL = 10;

// Canonical CP35 section column sets.
export const CP35_SECTIONS = [
  { key: 'proposals_out', title: 'SECTION I: ACTIVE DEALS - PROPOSALS OUT',
    columns: ['Proposed Tenant Name', 'Date', 'SF', 'Proposed Avg. Rate/SF', 'Quoted Rate/SF', "Proposed TI's/SF", 'Term', 'CoBroker', 'Targeted Commencement', 'Comments'] },
  { key: 'tours', title: 'SECTION II: TOURS',
    columns: ['Tenant Name', 'Date', 'SF', 'Proposal Requested', 'Quoted Rate/SF', "Quoted TI's/SF", 'Term', 'CoBroker', 'Targeted Commencement', 'Comments'] },
  { key: 'prospects', title: 'SECTION III: PROSPECT TRACKING',
    columns: ['Tenant Name', 'Date', 'SF Needed', 'Current Rate/SF', 'Quoted Rate/SF', "Quoted TI's/SF", 'Term', 'CoBroker', 'Targeted Commencement', 'Comments'] },
  { key: 'stale', title: 'Stale Deals',
    columns: ['Tenant Name', 'Date', 'Sq. Ft.', 'Rate/SF', 'Quoted Rate/SF', "TI's/SF", 'Term', 'CoBroker', 'Targeted Commencement', 'Comments'] },
  { key: 'dead', title: 'Dead Deals',
    columns: ['Tenant Name', 'Date', 'Sq. Ft.', 'Rate/SF', 'Quoted Rate/SF', "TI's/SF", 'Term', 'CoBroker', 'Targeted Commencement', 'Comments'] },
];

// Excel sheet names: ≤31 chars, no \ / ? * [ ] :, unique within the workbook.
function safeSheetName(wb, raw) {
  const base = (String(raw || 'Building').replace(/[\\/?*[\]:]/g, ' ').trim() || 'Building').slice(0, 28);
  let name = base, i = 2;
  while (wb.getWorksheet(name)) name = `${base.slice(0, 27)} ${i++}`;
  return name;
}

export function addMarketingReportSheet(wb, { property = {}, sections = [] } = {}, name = 'Marketing Report') {
  const ws = wb.addWorksheet(safeSheetName(wb, name), { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 28 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 13 }, { width: 9 }, { width: 24 }, { width: 20 }, { width: 42 }];

  // Property header block — bold labels on a light fill; numbers + % formatted.
  const kv = (label, value, fmt) => {
    const r = ws.addRow([label, value]);
    const l = r.getCell(1), v = r.getCell(2);
    l.font = { bold: true, color: { argb: NAVY } };
    l.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LABEL_BG } };
    l.border = allBorders; v.border = allBorders;
    if (fmt) { v.numFmt = fmt; v.alignment = { horizontal: 'right' }; }
    return r;
  };
  kv('Ownership:', property.ownership || '');                       // row 1
  kv('Building:', property.building || '');                         // row 2
  kv('Date:', property.date || '');                                 // row 3
  ws.addRow([]);                                                    // row 4
  const psf = kv('Property S.F.:', property.property_sf ?? '', '#,##0');   // row 5
  const vac = kv('Vacant S.F.:', property.vacant_sf ?? '', '#,##0');      // row 6
  const pctVac = kv('% Vacant:', { formula: `IFERROR(B${vac.number}/B${psf.number},0)` }, '0.0%');  // row 7
  kv('% Occupied:', { formula: `1-B${pctVac.number}` }, '0.0%');    // row 8

  const byKey = Object.fromEntries(sections.map((s) => [s.key, s]));
  for (const def of CP35_SECTIONS) {
    ws.addRow([]);
    // Section band (merged navy across all columns).
    const sh = ws.addRow([def.title]);
    ws.mergeCells(sh.number, 1, sh.number, CP35_NCOL);
    for (let c = 1; c <= CP35_NCOL; c++) {
      const cell = sh.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
      cell.font = { bold: true, color: { argb: WHITE }, size: 11 };
      cell.border = allBorders;
    }
    sh.height = 20;
    // Column header.
    const ch = ws.addRow(def.columns);
    for (let c = 1; c <= CP35_NCOL; c++) {
      const cell = ch.getCell(c);
      cell.font = { bold: true, color: { argb: NAVY }, size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BAND } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = allBorders;
    }
    ch.height = 26;
    const rows = byKey[def.key]?.rows || [];
    const firstData = ch.number + 1;
    if (rows.length) {
      for (const r of rows) ws.addRow(Array.isArray(r) ? r : def.columns.map((_, i) => r[i] ?? ''));
      styleDataRange(ws, firstData, ws.rowCount, CP35_NCOL, { 3: '#,##0' });
    } else {
      const er = ws.addRow(['(none)']);
      er.getCell(1).font = { italic: true, color: { argb: 'FF94A3B8' } };
      er.getCell(1).border = allBorders;
    }
  }
  return ws;
}

export function buildMarketingReport({ property = {}, sections = [] } = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Agency Hub';
  addMarketingReportSheet(wb, { property, sections });
  return wb;
}

const numOr0 = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// Combined portfolio report. A Portfolio Summary sheet is added ONLY for a true
// multi-building portfolio — a single building gets just its own sheet (a
// one-row summary is noise).
export function buildCombinedReport({ project = {}, buildings = [] } = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Agency Hub';

  const sorted = [...buildings].sort((a, b) => {
    const pa = a.property?.project || '', pb = b.property?.project || '';
    return (pa === '' ? 1 : 0) - (pb === '' ? 1 : 0) || pa.localeCompare(pb);
  });

  if (buildings.length > 1) {
    const ws = wb.addWorksheet('Portfolio Summary', { views: [{ showGridLines: false }] });
    const title = ws.addRow([`${project.name || 'Portfolio'} — Marketing Report`]);
    ws.mergeCells(1, 1, 1, 8); title.getCell(1).font = { bold: true, size: 14, color: { argb: NAVY } }; title.height = 24;
    const sub = ws.addRow([`${buildings.length} buildings`]); sub.getCell(1).font = { italic: true, color: { argb: 'FF64748B' } };
    ws.addRow([]);

    const cols = ['Building', 'Project', 'Total SF', 'Vacant SF', '% Vacant', 'Proposals Out', 'Tours', 'Prospects'];
    const headerRow = ws.addRow(cols);
    styleHeaderCells(headerRow, cols.length);
    const firstData = headerRow.number + 1;
    let tSf = 0, tVac = 0, tProp = 0, tTour = 0, tPros = 0;
    for (const b of sorted) {
      const p = b.property || {}, byKey = Object.fromEntries((b.sections || []).map((s) => [s.key, (s.rows || []).length]));
      const sf = numOr0(p.property_sf), vac = numOr0(p.vacant_sf);
      ws.addRow([p.building || '', p.project || '', sf || '', vac || '', sf ? vac / sf : '', byKey.proposals_out || 0, byKey.tours || 0, byKey.prospects || 0]);
      tSf += sf; tVac += vac; tProp += byKey.proposals_out || 0; tTour += byKey.tours || 0; tPros += byKey.prospects || 0;
    }
    const lastData = ws.rowCount;
    styleDataRange(ws, firstData, lastData, cols.length, { 3: '#,##0', 4: '#,##0', 5: '0.0%', 6: '#,##0', 7: '#,##0', 8: '#,##0' });
    const totals = ws.addRow(['TOTAL', '', tSf || '', tVac || '', tSf ? tVac / tSf : '', tProp, tTour, tPros]);
    totals.eachCell((c, n) => {
      c.font = { bold: true, color: { argb: NAVY } };
      c.border = { top: { style: 'medium', color: { argb: NAVY } }, bottom: thin, left: thin, right: thin };
      if ([3, 4, 6, 7, 8].includes(n)) { c.numFmt = '#,##0'; c.alignment = { horizontal: 'right' }; }
      if (n === 5) { c.numFmt = '0.0%'; c.alignment = { horizontal: 'right' }; }
    });
    autoWidths(ws, cols, sorted.map((b) => [b.property?.building, b.property?.project]), { 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 });
    ws.views = [{ state: 'frozen', ySplit: headerRow.number, showGridLines: false }];
    ws.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: headerRow.number, column: cols.length } };
  }

  for (const b of sorted) addMarketingReportSheet(wb, b, b.property?.building || 'Building');
  return wb;
}

// Generic styled table sheet (FTW market data + competitive-set tables). Pass
// numFmts as { 1-based-col: 'excelFormat' } for numeric columns.
export function addTableSheet(wb, name, title, columns, rows = [], { numFmts = {} } = {}) {
  const ws = wb.addWorksheet(safeSheetName(wb, name), { views: [{ showGridLines: false }] });
  const titleRow = ws.addRow([title]); ws.mergeCells(1, 1, 1, columns.length);
  titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: NAVY } }; titleRow.height = 22;
  ws.addRow([]);
  const headerRow = ws.addRow(columns);
  styleHeaderCells(headerRow, columns.length);
  const firstData = headerRow.number + 1;
  for (const r of rows) ws.addRow(Array.isArray(r) ? r : columns.map((_, i) => r[i] ?? ''));
  styleDataRange(ws, firstData, ws.rowCount, columns.length, numFmts);
  autoWidths(ws, columns, rows, numFmts);
  ws.views = [{ state: 'frozen', ySplit: headerRow.number, showGridLines: false }];
  ws.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: headerRow.number, column: columns.length } };
  return ws;
}

// FTW NUMERIC arrive as strings over JSON; dates as ISO. Coerce so Excel stores
// real numbers/dates. Date kept MM/DD/YYYY from the date part only (no UTC shift).
const num = (v) => { const n = Number(v); return Number.isFinite(n) && v != null && v !== '' ? n : ''; };
const xlDate = (v) => {
  if (!v) return '';
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : String(v);
};
const sub = (r) => r.submarket || r.micro_market || '';

const LEASE_COMP_COLS = ['Building', 'Submarket', 'Tenant', 'SF Leased', 'Start Rate/SF', 'Structure', 'Sign Date', 'Comm Date', 'Term (mo)', 'TI/SF', 'Escalation', 'Owner'];
const LEASE_COMP_FMTS = { 4: '#,##0', 5: '$#,##0.00', 9: '#,##0', 10: '$#,##0.00' };
const leaseCompRow = (r) => [
  r.building_name || '', sub(r), r.tenant || '', num(r.leased_sf), num(r.start_rate), r.structure || '',
  xlDate(r.sign_date), xlDate(r.comm_date), num(r.term), num(r.ti), r.escalation || '', r.owner || '',
];

const LEASING_COLS = ['Building', 'Submarket', 'Tenant', 'SF', 'Rate/SF', 'Type', 'Sign Date', 'Comm Date', 'Term (mo)', 'TI/SF', 'Owner'];
const LEASING_FMTS = { 4: '#,##0', 5: '$#,##0.00', 9: '#,##0', 10: '$#,##0.00' };
const leasingRow = (r) => [
  r.building_name || '', sub(r), r.tenant || '', num(r.rba), num(r.rate), r.type || '',
  xlDate(r.sign_date), xlDate(r.comm_date), num(r.term), num(r.ti), r.owner || '',
];

const matchesSubmarket = (r, submarket) =>
  !submarket || [r.submarket, r.micro_market].some((s) => String(s || '').toLowerCase().trim() === submarket.toLowerCase().trim());
const byNewest = (a, b) => String(b.sign_date || '').localeCompare(String(a.sign_date || ''));

// Append FTW market sheets. `includeLeaseComps:false` skips the broad lease-comps
// dump (callers that prefer the curated per-property competitive comps instead).
export function addMarketSheets(wb, { leaseComps = [], leasing = [], submarket = '', limit = 200, includeLeaseComps = true } = {}) {
  const la = leasing.filter((r) => matchesSubmarket(r, submarket)).sort(byNewest).slice(0, limit);
  const scope = submarket ? ` — ${submarket}` : '';
  let leaseCompCount = 0;
  if (includeLeaseComps) {
    const lc = leaseComps.filter((r) => matchesSubmarket(r, submarket)).sort(byNewest).slice(0, limit);
    addTableSheet(wb, 'Lease Comps', `FTW Lease Comps${scope}`, LEASE_COMP_COLS, lc.map(leaseCompRow), { numFmts: LEASE_COMP_FMTS });
    leaseCompCount = lc.length;
  }
  addTableSheet(wb, 'YTD Leasing Activity', `FTW Leasing Activity${scope}`, LEASING_COLS, la.map(leasingRow), { numFmts: LEASING_FMTS });
  return { leaseCompCount, leasingCount: la.length };
}

// ───────────────────────── Competitive-set sheets ──
const rateCell = (n) => (n != null && Number.isFinite(Number(n)) ? Number(n) : '');
const SUPPLY_COLS = ['Building', 'Submarket', 'Total SF', 'Available SF', 'Status', 'Gen / Delivery', 'Asking $/SF', 'Owner'];
const SUPPLY_FMTS = { 3: '#,##0', 4: '#,##0', 7: '$#,##0.00' };
function supplyRowXl(cs, b, mark) {
  const gen = b.status === 'Existing'
    ? ((Number(b.sf_available) || 0) > 0 && (b.vacancy_type === '1st GEN' || b.vacancy_type === '2nd GEN') ? b.vacancy_type : '')
    : (b.quarter_delivered ? `${b.quarter_delivered} (exp.)` : '');
  return [
    (mark ? '★ ' : '') + (b.building_name || b.address || ''),
    b.submarket || '', num(b.total_sf), (Number(b.sf_available) || 0) > 0 ? num(b.sf_available) : '',
    b.status || '', gen, rateCell(cs.ratesByBuilding?.[b.id]?.rate), b.owner || '',
  ];
}
const CS_COMP_COLS = ['Tenant', 'Landlord', 'Building', 'Submarket', 'SF', 'Start Rate/SF', 'Comm Date', 'Term (mo)'];
const CS_COMP_FMTS = { 5: '#,##0', 6: '$#,##0.00', 8: '#,##0' };

export function addCompetitiveSetSheets(wb, cs, { label = '' } = {}) {
  if (!cs) return { supplyCount: 0, compCount: 0 };
  const STATUS_RANK = { 'Existing': 0, 'Under Construction': 1, 'Proposed': 2 };
  const rank = (s) => (STATUS_RANK[s] ?? 3);
  const subjectRows = (cs.subjects || []).map((b) => supplyRowXl(cs, b, true));
  const compRows = [...(cs.competitors || [])]
    .sort((a, b) => rank(a.status) - rank(b.status) || (Number(b.total_sf) || 0) - (Number(a.total_sf) || 0))
    .map((b) => supplyRowXl(cs, b, false));
  const scope = label ? ` — ${label}` : (cs.submarket ? ` — ${cs.submarket}` : '');
  addTableSheet(wb, 'Competitive Set', `Competing Supply${scope}`, SUPPLY_COLS, [...subjectRows, ...compRows], { numFmts: SUPPLY_FMTS });

  const compRow = (c) => [c.tenant || '', c.owner || '', c.building_name || c.address || '', sub(c), num(c.leased_sf), num(c.start_rate), xlDate(c.comm_date), num(c.term)];
  const byRecency = (a, b) => new Date(b.comm_date || b.sign_date || 0) - new Date(a.comm_date || a.sign_date || 0);
  let compCount = 0;
  // Comparable lease comps — ONE sheet PER subject building when compsBySubject is
  // provided (the curated ~20/property list), else a single combined sheet.
  if (cs.compsBySubject && Object.keys(cs.compsBySubject).length) {
    for (const s of (cs.subjects || [])) {
      const listed = (cs.compsBySubject[s.id] || []).slice().sort(byRecency);
      if (!listed.length) continue;
      const name = s.building_name || s.address || 'Subject';
      addTableSheet(wb, `Comps ${name}`, `Comparable Lease Comps — ${name}`, CS_COMP_COLS, listed.map(compRow), { numFmts: CS_COMP_FMTS });
      compCount += listed.length;
    }
  } else {
    const comps = [...(cs.comps || [])].sort(byRecency).map(compRow);
    addTableSheet(wb, 'Comparable Lease Comps', `Comparable Lease Comps${scope}`, CS_COMP_COLS, comps, { numFmts: CS_COMP_FMTS });
    compCount = comps.length;
  }
  return { supplyCount: subjectRows.length + compRows.length, compCount };
}

export async function reportBuffer(input) {
  return buildMarketingReport(input).xlsx.writeBuffer();
}

export { fmtSf };
