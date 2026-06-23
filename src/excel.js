// Excel (.xlsx) builders. Server-OR-client safe (exceljs only). The CP35
// marketing-report + market-sheet logic is moved here verbatim from agency-hub
// lib/excelReport.js (so agency-hub imports it from the kit); the competitive-set
// sheet builders are new — they render the same supply + comps tables the deck
// shows, as workbook sheets.
import ExcelJS from 'exceljs';
import { fmtSf } from './format.js';

const NAVY = 'FF1F2A4D';
const LIGHT = 'FFEDEFF5';
const WHITE = 'FFFFFFFF';

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

function styleSectionHeader(row) {
  row.eachCell({ includeEmpty: true }, (c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; c.font = { bold: true, color: { argb: WHITE } }; });
  row.height = 18;
}
function styleColumnHeader(row) {
  row.eachCell((c) => { c.font = { bold: true, color: { argb: NAVY } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }; c.border = { bottom: { style: 'thin', color: { argb: NAVY } } }; });
}

// Excel sheet names: ≤31 chars, no \ / ? * [ ] :, unique within the workbook.
function safeSheetName(wb, raw) {
  const base = (String(raw || 'Building').replace(/[\\/?*[\]:]/g, ' ').trim() || 'Building').slice(0, 28);
  let name = base, i = 2;
  while (wb.getWorksheet(name)) name = `${base.slice(0, 27)} ${i++}`;
  return name;
}

export function addMarketingReportSheet(wb, { property = {}, sections = [] } = {}, name = 'Marketing Report') {
  const ws = wb.addWorksheet(safeSheetName(wb, name), { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 26 }, { width: 12 }, { width: 16 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 10 }, { width: 24 }, { width: 18 }, { width: 40 }];

  const kv = (label, value) => { const r = ws.addRow([label, value]); r.getCell(1).font = { bold: true }; return r; };
  kv('Ownership:', property.ownership || '');
  kv('Building:', property.building || '');
  kv('Date:', property.date || '');
  ws.addRow([]);
  const psf = kv('     Property S.F.:', property.property_sf ?? '');
  const vac = kv('     Vacant S.F.:', property.vacant_sf ?? '');
  const pctVac = kv('     % Vacant:', { formula: `IFERROR(B${vac.number}/B${psf.number},0)` });
  pctVac.getCell(2).numFmt = '0%';
  kv('     % Occupied:', { formula: `1-B${pctVac.number}` }).getCell(2).numFmt = '0%';

  const byKey = Object.fromEntries(sections.map((s) => [s.key, s]));
  for (const def of CP35_SECTIONS) {
    ws.addRow([]);
    styleSectionHeader(ws.addRow([def.title]));
    styleColumnHeader(ws.addRow(def.columns));
    const rows = byKey[def.key]?.rows || [];
    for (const r of rows) {
      const arr = Array.isArray(r) ? r : def.columns.map((_, i) => r[i] ?? '');
      ws.addRow(arr);
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

export function buildCombinedReport({ project = {}, buildings = [] } = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Agency Hub';

  const ws = wb.addWorksheet('Portfolio Summary', { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 28 }, { width: 22 }, { width: 13 }, { width: 13 }, { width: 11 }, { width: 14 }, { width: 9 }, { width: 11 }];
  const title = ws.addRow([`${project.name || 'Portfolio'} — Marketing Report`]);
  ws.mergeCells(1, 1, 1, 8); title.getCell(1).font = { bold: true, size: 14, color: { argb: NAVY } };
  ws.addRow([`${buildings.length} building${buildings.length === 1 ? '' : 's'}`]);
  ws.addRow([]);

  const cols = ['Building', 'Project', 'Total SF', 'Vacant SF', '% Vacant', 'Proposals Out', 'Tours', 'Prospects'];
  styleColumnHeader(ws.addRow(cols));
  const sorted = [...buildings].sort((a, b) => {
    const pa = a.property?.project || '', pb = b.property?.project || '';
    return (pa === '' ? 1 : 0) - (pb === '' ? 1 : 0) || pa.localeCompare(pb);
  });
  let tSf = 0, tVac = 0, tProp = 0, tTour = 0, tPros = 0;
  for (const b of sorted) {
    const p = b.property || {}, byKey = Object.fromEntries((b.sections || []).map((s) => [s.key, (s.rows || []).length]));
    const sf = numOr0(p.property_sf), vac = numOr0(p.vacant_sf);
    const r = ws.addRow([p.building || '', p.project || '', sf || '', vac || '', sf ? vac / sf : '', byKey.proposals_out || 0, byKey.tours || 0, byKey.prospects || 0]);
    r.getCell(5).numFmt = '0%';
    tSf += sf; tVac += vac; tProp += byKey.proposals_out || 0; tTour += byKey.tours || 0; tPros += byKey.prospects || 0;
  }
  const totals = ws.addRow(['TOTAL', '', tSf || '', tVac || '', tSf ? tVac / tSf : '', tProp, tTour, tPros]);
  totals.eachCell((c) => { c.font = { bold: true }; c.border = { top: { style: 'thin', color: { argb: NAVY } } }; });
  totals.getCell(5).numFmt = '0%';

  for (const b of sorted) addMarketingReportSheet(wb, b, b.property?.building || 'Building');
  return wb;
}

// Generic styled table sheet (used for FTW-sourced market data + comp-set tables).
export function addTableSheet(wb, name, title, columns, rows = []) {
  const ws = wb.addWorksheet(safeSheetName(wb, name), { views: [{ showGridLines: false }] });
  const titleRow = ws.addRow([title]); ws.mergeCells(1, 1, 1, columns.length);
  titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: NAVY } };
  styleColumnHeader(ws.addRow(columns));
  for (const r of rows) ws.addRow(Array.isArray(r) ? r : columns.map((_, i) => r[i] ?? ''));
  ws.columns.forEach((c) => { if (!c.width) c.width = 16; });
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
const leaseCompRow = (r) => [
  r.building_name || '', sub(r), r.tenant || '', num(r.leased_sf), num(r.start_rate), r.structure || '',
  xlDate(r.sign_date), xlDate(r.comm_date), num(r.term), num(r.ti), r.escalation || '', r.owner || '',
];

const LEASING_COLS = ['Building', 'Submarket', 'Tenant', 'SF', 'Rate/SF', 'Type', 'Sign Date', 'Comm Date', 'Term (mo)', 'TI/SF', 'Owner'];
const leasingRow = (r) => [
  r.building_name || '', sub(r), r.tenant || '', num(r.rba), num(r.rate), r.type || '',
  xlDate(r.sign_date), xlDate(r.comm_date), num(r.term), num(r.ti), r.owner || '',
];

const matchesSubmarket = (r, submarket) =>
  !submarket || [r.submarket, r.micro_market].some((s) => String(s || '').toLowerCase().trim() === submarket.toLowerCase().trim());
const byNewest = (a, b) => String(b.sign_date || '').localeCompare(String(a.sign_date || ''));

// Append FTW market sheets (Lease Comps + YTD Leasing Activity). Filters to
// `submarket` when given, newest-first, capped at `limit` per sheet.
export function addMarketSheets(wb, { leaseComps = [], leasing = [], submarket = '', limit = 200 } = {}) {
  const lc = leaseComps.filter((r) => matchesSubmarket(r, submarket)).sort(byNewest).slice(0, limit);
  const la = leasing.filter((r) => matchesSubmarket(r, submarket)).sort(byNewest).slice(0, limit);
  const scope = submarket ? ` — ${submarket}` : '';
  addTableSheet(wb, 'Lease Comps', `FTW Lease Comps${scope}`, LEASE_COMP_COLS, lc.map(leaseCompRow));
  addTableSheet(wb, 'YTD Leasing Activity', `FTW Leasing Activity${scope}`, LEASING_COLS, la.map(leasingRow));
  return { leaseCompCount: lc.length, leasingCount: la.length };
}

// ───────────────────────── Competitive-set sheets (new) ──
const rateCell = (n) => (n != null && Number.isFinite(Number(n)) ? Number(n) : '');
const SUPPLY_COLS = ['Building', 'Submarket', 'Total SF', 'Available SF', 'Status', 'Gen / Delivery', 'Asking $/SF', 'Owner'];
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

// Add the competitive-set workbook sheets: one combined competing-supply sheet
// plus a comparable lease comps sheet, built from the same `cs` object the deck
// consumes (CompetitiveSetModal.buildCompSet shape).
export function addCompetitiveSetSheets(wb, cs, { label = '' } = {}) {
  if (!cs) return { supplyCount: 0, compCount: 0 };
  const STATUS_RANK = { 'Existing': 0, 'Under Construction': 1, 'Proposed': 2 };
  const rank = (s) => (STATUS_RANK[s] ?? 3);
  const subjectRows = (cs.subjects || []).map((b) => supplyRowXl(cs, b, true));
  const compRows = [...(cs.competitors || [])]
    .sort((a, b) => rank(a.status) - rank(b.status) || (Number(b.total_sf) || 0) - (Number(a.total_sf) || 0))
    .map((b) => supplyRowXl(cs, b, false));
  const scope = label ? ` — ${label}` : (cs.submarket ? ` — ${cs.submarket}` : '');
  addTableSheet(wb, 'Competitive Set', `Competing Supply${scope}`, SUPPLY_COLS, [...subjectRows, ...compRows]);

  const comps = [...(cs.comps || [])]
    .sort((a, b) => new Date(b.comm_date || b.sign_date || 0) - new Date(a.comm_date || a.sign_date || 0))
    .map((c) => [c.tenant || '', c.owner || '', c.building_name || c.address || '', sub(c), num(c.leased_sf), num(c.start_rate), xlDate(c.comm_date), num(c.term)]);
  addTableSheet(wb, 'Comparable Comps', `Comparable Lease Comps${scope}`, CS_COMP_COLS, comps);
  return { supplyCount: subjectRows.length + compRows.length, compCount: comps.length };
}

export async function reportBuffer(input) {
  return buildMarketingReport(input).xlsx.writeBuffer();
}

// re-export so consumers can format SF in custom sheets without a second import
export { fmtSf };
