// src/format.js
function fmtSf(n) {
  if (n == null) return "\u2014";
  const num = Number(n);
  if (isNaN(num)) return "\u2014";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(0) + "K";
  return num.toLocaleString();
}
function fmtDate(d) {
  if (!d) return "\u2014";
  if (typeof d === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    if (m) {
      const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// src/csdeck.js
var sumSf = (rows) => rows.reduce((a, b) => a + (Number(b.total_sf) || 0), 0);
var sumAvail = (rows) => rows.reduce((a, b) => a + (Number(b.sf_available) || 0), 0);
var rateStr = (n) => n != null && Number.isFinite(Number(n)) ? "$" + Number(n).toFixed(2) : "\u2014";
var STATUS_RANK = { "Existing": 0, "Under Construction": 1, "Proposed": 2 };
var statusRank = (s) => STATUS_RANK[s] ?? 3;
var commTime = (c) => {
  const t = c?.comm_date ? new Date(c.comm_date).getTime() : NaN;
  return Number.isFinite(t) ? t : -Infinity;
};
var DELIVERY_RE = /^(estimated\s+)?(q[1-4]\s*)?\d{4}$/i;
var stripEst = (s) => String(s).replace(/^estimated\s+/i, "").trim();
function deliveryStr(b) {
  const qd = String(b.quarter_delivered || "").trim();
  if (qd) return stripEst(qd);
  const vt = String(b.vacancy_type || "").trim();
  if (vt && DELIVERY_RE.test(vt)) return stripEst(vt);
  return null;
}
function genOrDelivery(b) {
  if (b.status === "Existing") {
    const avail = Number(b.sf_available) || 0;
    return avail > 0 && (b.vacancy_type === "1st GEN" || b.vacancy_type === "2nd GEN") ? b.vacancy_type : "\u2014";
  }
  const d = deliveryStr(b);
  return d ? `${d} (exp.)` : "\u2014";
}
var SUPPLY_HEAD = ["Building", "Submarket", "Total SF", "Available", "Gen", "Status", "Asking $/SF", "Owner"];
function supplyRow(cs, b, mark) {
  const rate = rateStr(cs.ratesByBuilding?.[b.id]?.rate);
  return [
    (mark ? "\u2605 " : "") + (b.building_name || b.address || "\u2014"),
    b.submarket || "\u2014",
    fmtSf(b.total_sf),
    (Number(b.sf_available) || 0) > 0 ? fmtSf(b.sf_available) : "\u2014",
    genOrDelivery(b),
    b.status || "\u2014",
    rate,
    b.owner || "\u2014"
  ];
}
function competitorsFor(cs, subject) {
  const map = cs.competitorsBySubject;
  if (map && Array.isArray(map[subject.id])) return map[subject.id];
  return cs.competitors || [];
}
var SUPPLY_COLW = [2.7, 1.3, 1, 1, 0.95, 1.3, 1.15, 2.83];
var COMPS_COLW = [2.8, 2.6, 3.2, 1.1, 1.1, 1.43];
var monthYear = () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long", year: "numeric" });
function csHeader(cs) {
  const market = cs.market || "Fort Worth";
  const scopeBits = [cs.submarket, cs.radiusMi != null ? `${cs.radiusMi} mi radius` : null, monthYear()].filter(Boolean);
  return { eyebrow: `${market} Industrial \u2014 Competitive Set`, meta: scopeBits.join(" \xB7 ") };
}
function subjectLabel(cs) {
  if (cs.projectName) return cs.projectName;
  if (cs.subjects?.length === 1) return cs.subjects[0].building_name || cs.subjects[0].address || "Subject";
  if (cs.subjects?.length > 1) return `${cs.subjects.length} Subject Buildings`;
  return "Subject";
}
var SUBJECT_KPIS = [
  { key: "cs-subjects", label: "Subject Buildings", value: (cs) => cs.subjects.length.toLocaleString() },
  { key: "cs-subject-sf", label: "Subject SF", value: (cs) => fmtSf(sumSf(cs.subjects)) },
  { key: "cs-subject-avail", label: "Subject Available SF", value: (cs) => fmtSf(sumAvail(cs.subjects)) },
  { key: "cs-competing", label: "Competing Buildings", value: (cs) => cs.competitors.length.toLocaleString() },
  { key: "cs-comps", label: "Comparable Comps", value: (cs) => cs.comps.length.toLocaleString() },
  { key: "cs-avg-rate", label: "Avg Comp Rate", value: (cs) => {
    const r = cs.comps.map((c) => Number(c.start_rate)).filter((x) => x > 0);
    return r.length ? "$" + (r.reduce((a, b) => a + b, 0) / r.length).toFixed(2) : "\u2014";
  } }
];
function subjectKpis(cs) {
  return SUBJECT_KPIS.map((k) => ({ label: k.label, value: k.value(cs) }));
}
function subjectSupplyTable(cs, subject) {
  const compRows = [...competitorsFor(cs, subject)].sort((a, b) => statusRank(a.status) - statusRank(b.status) || (Number(b.total_sf) || 0) - (Number(a.total_sf) || 0)).map((b) => supplyRow(cs, b, false));
  return { head: SUPPLY_HEAD, rows: [supplyRow(cs, subject, true), ...compRows] };
}
function competingSupplyTablesBySubject(cs) {
  return (cs.subjects || []).map((s) => ({
    subjectId: s.id,
    title: s.building_name || s.address || "Subject",
    ...subjectSupplyTable(cs, s)
  }));
}
function competingSupplyTable(cs) {
  const subjectRows = (cs.subjects || []).map((b) => supplyRow(cs, b, true));
  const compRows = [...cs.competitors || []].sort((a, b) => statusRank(a.status) - statusRank(b.status) || (Number(b.total_sf) || 0) - (Number(a.total_sf) || 0)).map((b) => supplyRow(cs, b, false));
  return { head: SUPPLY_HEAD, rows: [...subjectRows, ...compRows] };
}
function compsTable(cs) {
  const rows = [...cs.comps].sort((a, b) => commTime(b) - commTime(a)).map((c) => [
    c.tenant || "\u2014",
    c.owner || "\u2014",
    c.building_name || c.address || "\u2014",
    fmtSf(c.leased_sf),
    rateStr(c.start_rate),
    fmtDate(c.comm_date)
  ]);
  return { head: ["Tenant", "Landlord", "Building", "SF", "Rate", "Comm."], rows };
}
export {
  COMPS_COLW,
  SUBJECT_KPIS,
  SUPPLY_COLW,
  SUPPLY_HEAD,
  competingSupplyTable,
  competingSupplyTablesBySubject,
  compsTable,
  csHeader,
  subjectKpis,
  subjectLabel,
  subjectSupplyTable
};
