// Competitive-set CONTENT builders — pure (format-only, NO brand assets), split
// out of pptx.js so the report builder UI can import the subject KPIs + supply /
// comps tables for live previews and catalogs WITHOUT pulling the 2.3 MB base64
// deck background into its bundle. pptx.js re-exports all of this (so existing
// `hpi-report-kit/pptx` consumers are unchanged) and adds addCompetitiveSetSlides
// (the asset-using deck assembly) on top.
import { fmtSf, fmtDate } from './format.js';

const sumSf = (rows) => rows.reduce((a, b) => a + (Number(b.total_sf) || 0), 0);
const sumAvail = (rows) => rows.reduce((a, b) => a + (Number(b.sf_available) || 0), 0);
const rateStr = (n) => (n != null && Number.isFinite(Number(n)) ? '$' + Number(n).toFixed(2) : '—');

const STATUS_RANK = { 'Existing': 0, 'Under Construction': 1, 'Proposed': 2 };
const statusRank = (s) => (STATUS_RANK[s] ?? 3);
const commTime = (c) => { const t = c?.comm_date ? new Date(c.comm_date).getTime() : NaN; return Number.isFinite(t) ? t : -Infinity; };

const DELIVERY_RE = /^(estimated\s+)?(q[1-4]\s*)?\d{4}$/i;
const stripEst = (s) => String(s).replace(/^estimated\s+/i, '').trim();
function deliveryStr(b) {
  const qd = String(b.quarter_delivered || '').trim();
  if (qd) return stripEst(qd);
  const vt = String(b.vacancy_type || '').trim();
  if (vt && DELIVERY_RE.test(vt)) return stripEst(vt);
  return null;
}
function genOrDelivery(b) {
  if (b.status === 'Existing') {
    const avail = Number(b.sf_available) || 0;
    return (avail > 0 && (b.vacancy_type === '1st GEN' || b.vacancy_type === '2nd GEN')) ? b.vacancy_type : '—';
  }
  const d = deliveryStr(b);
  return d ? `${d} (exp.)` : '—';
}

export const SUPPLY_HEAD = ['Building', 'Submarket', 'Total SF', 'Available', 'Gen', 'Status', 'Asking $/SF', 'Owner'];
function supplyRow(cs, b, mark) {
  const rate = rateStr(cs.ratesByBuilding?.[b.id]?.rate);
  return [
    (mark ? '★ ' : '') + (b.building_name || b.address || '—'),
    b.submarket || '—', fmtSf(b.total_sf),
    (Number(b.sf_available) || 0) > 0 ? fmtSf(b.sf_available) : '—',
    genOrDelivery(b), b.status || '—', rate, b.owner || '—',
  ];
}
function competitorsFor(cs, subject) {
  const map = cs.competitorsBySubject;
  if (map && Array.isArray(map[subject.id])) return map[subject.id];
  return cs.competitors || [];
}

// Column widths (inches; sum = printable width) — exported so addCompetitiveSetSlides uses them.
export const SUPPLY_COLW = [2.7, 1.3, 1.0, 1.0, 0.95, 1.3, 1.15, 2.83];
export const COMPS_COLW = [2.8, 2.6, 3.2, 1.1, 1.1, 1.43];

const monthYear = () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export function csHeader(cs) {
  const market = cs.market || 'Fort Worth';
  const scopeBits = [cs.submarket, cs.radiusMi != null ? `${cs.radiusMi} mi radius` : null, monthYear()].filter(Boolean);
  return { eyebrow: `${market} Industrial — Competitive Set`, meta: scopeBits.join(' · ') };
}

export function subjectLabel(cs) {
  if (cs.projectName) return cs.projectName;
  if (cs.subjects?.length === 1) return cs.subjects[0].building_name || cs.subjects[0].address || 'Subject';
  if (cs.subjects?.length > 1) return `${cs.subjects.length} Subject Buildings`;
  return 'Subject';
}

// Subject summary KPIs. value(cs) so callers can surface individually or as a strip.
export const SUBJECT_KPIS = [
  { key: 'cs-subjects', label: 'Subject Buildings', value: cs => cs.subjects.length.toLocaleString() },
  { key: 'cs-subject-sf', label: 'Subject SF', value: cs => fmtSf(sumSf(cs.subjects)) },
  { key: 'cs-subject-avail', label: 'Subject Available SF', value: cs => fmtSf(sumAvail(cs.subjects)) },
  { key: 'cs-competing', label: 'Competing Buildings', value: cs => cs.competitors.length.toLocaleString() },
  { key: 'cs-comps', label: 'Comparable Comps', value: cs => cs.comps.length.toLocaleString() },
  { key: 'cs-avg-rate', label: 'Avg Comp Rate', value: cs => { const r = cs.comps.map(c => Number(c.start_rate)).filter(x => x > 0); return r.length ? '$' + (r.reduce((a, b) => a + b, 0) / r.length).toFixed(2) : '—'; } },
];
export function subjectKpis(cs) { return SUBJECT_KPIS.map(k => ({ label: k.label, value: k.value(cs) })); }

export function subjectSupplyTable(cs, subject) {
  const compRows = [...competitorsFor(cs, subject)]
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || (Number(b.total_sf) || 0) - (Number(a.total_sf) || 0))
    .map(b => supplyRow(cs, b, false));
  return { head: SUPPLY_HEAD, rows: [supplyRow(cs, subject, true), ...compRows] };
}

export function competingSupplyTablesBySubject(cs) {
  return (cs.subjects || []).map(s => ({
    subjectId: s.id,
    title: s.building_name || s.address || 'Subject',
    ...subjectSupplyTable(cs, s),
  }));
}

export function competingSupplyTable(cs) {
  const subjectRows = (cs.subjects || []).map(b => supplyRow(cs, b, true));
  const compRows = [...(cs.competitors || [])]
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || (Number(b.total_sf) || 0) - (Number(a.total_sf) || 0))
    .map(b => supplyRow(cs, b, false));
  return { head: SUPPLY_HEAD, rows: [...subjectRows, ...compRows] };
}

export function compsTable(cs) {
  const rows = [...cs.comps]
    .sort((a, b) => commTime(b) - commTime(a))
    .map(c => [
      c.tenant || '—', c.owner || '—', c.building_name || c.address || '—',
      fmtSf(c.leased_sf), rateStr(c.start_rate), fmtDate(c.comm_date),
    ]);
  return { head: ['Tenant', 'Landlord', 'Building', 'SF', 'Rate', 'Comm.'], rows };
}
