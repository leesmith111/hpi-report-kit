// Pure data aggregators + KPI helpers for reports. No React, no DOM, no fetch —
// they take already-fetched rows and return plain data the chart components and
// KPI strips consume. Vendored from ftw-cre-platform exportCharts.jsx (the
// aggregator half) + standardReports.jsx (the KPI calc helpers), so both apps
// compute identical numbers.

// ───────────────────────── Inventory (status / load / vacancy-type / rate) ──
export function aggregateInventoryCharts(buildings, rateSummary) {
  let existingSf = 0, ucSf = 0, proposedSf = 0;
  let existingCount = 0, ucCount = 0, proposedCount = 0;
  const submarkets = new Map();
  const loadConfigs = new Map();
  let missingLoadSf = 0;
  const vacancyTypeBuckets = { '1st GEN': 0, '2nd GEN': 0, Sublease: 0, Unknown: 0 };
  const buildingMidRates = [];

  for (const b of buildings) {
    const sf = Number(b.total_sf) || 0;
    const avail = Number(b.sf_available) || 0;
    const sub = Math.max(0, Math.min(Number(b.sublease_sf) || 0, avail));
    const direct = Math.max(0, avail - sub);

    if (b.status === 'Existing')                { existingSf += sf; existingCount++; }
    else if (b.status === 'Under Construction') { ucSf += sf; ucCount++; }
    else if (b.status === 'Proposed')           { proposedSf += sf; proposedCount++; }

    const sm = b.submarket || 'Unknown';
    if (!submarkets.has(sm)) submarkets.set(sm, { name: sm, Existing: 0, 'Under Construction': 0, Proposed: 0, total: 0 });
    const smRow = submarkets.get(sm);
    if (b.status === 'Existing') smRow.Existing += sf;
    else if (b.status === 'Under Construction') smRow['Under Construction'] += sf;
    else if (b.status === 'Proposed') smRow.Proposed += sf;
    smRow.total += sf;

    const lc = (b.load_config || '').trim();
    if (lc) {
      if (!loadConfigs.has(lc)) loadConfigs.set(lc, { name: lc, sf: 0 });
      loadConfigs.get(lc).sf += sf;
    } else {
      missingLoadSf += sf;
    }

    if (b.status === 'Existing' && avail > 0) {
      if (sub > 0) vacancyTypeBuckets.Sublease += sub;
      if (direct > 0) {
        const vt = b.vacancy_type === '1st GEN' || b.vacancy_type === '2nd GEN' ? b.vacancy_type : 'Unknown';
        vacancyTypeBuckets[vt] += direct;
      }
    }

    const rs = rateSummary?.[b.id];
    if (rs && (rs.minRate != null || rs.maxRate != null)) {
      const lo = rs.minRate != null ? Number(rs.minRate) : null;
      const hi = rs.maxRate != null ? Number(rs.maxRate) : null;
      const mid = lo != null && hi != null ? (lo + hi) / 2 : (lo ?? hi);
      if (mid != null && Number.isFinite(mid)) buildingMidRates.push(mid);
    }
  }

  const statusBars = [
    { name: 'Existing', sf: existingSf, count: existingCount },
    { name: 'Under Construction', sf: ucSf, count: ucCount },
    { name: 'Proposed', sf: proposedSf, count: proposedCount },
  ].filter(r => r.sf > 0);

  const submarketBars = [...submarkets.values()].sort((a, b) => b.total - a.total);

  const LOAD_ORDER = ['Cross', 'Front', 'Rear', 'Side', 'N/A', 'Unknown'];
  const loadBars = [...loadConfigs.values()].sort((a, b) => {
    const ai = LOAD_ORDER.indexOf(a.name);
    const bi = LOAD_ORDER.indexOf(b.name);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  if (missingLoadSf > 0) loadBars.push({ name: 'Unknown', sf: missingLoadSf });

  const vacancyTypeBars = Object.entries(vacancyTypeBuckets)
    .filter(([, v]) => v > 0)
    .map(([name, sf]) => ({ name, sf }));

  let rateHistogram = [];
  if (buildingMidRates.length > 0) {
    const binSize = 0.5;
    const lo = Math.floor(Math.min(...buildingMidRates) * 2) / 2;
    const hiRaw = Math.ceil(Math.max(...buildingMidRates) * 2) / 2;
    const hi = hiRaw > lo ? hiRaw : lo + binSize;
    const bins = [];
    for (let x = lo; x < hi; x += binSize) bins.push({ x0: x, x1: x + binSize, count: 0, label: `$${x.toFixed(2)}` });
    for (const m of buildingMidRates) {
      const idx = Math.max(0, Math.min(bins.length - 1, Math.floor((m - lo) / binSize)));
      bins[idx].count++;
    }
    rateHistogram = bins.filter(b => b.count > 0);
  }

  return { statusBars, submarketBars, loadBars, vacancyTypeBars, rateHistogram };
}

// ───────────────────────── Vacancy ──
export function aggregateVacancyBySubmarket(buildings) {
  const map = new Map();
  for (const b of buildings) {
    if (b.status !== 'Existing') continue;
    const avail = Number(b.sf_available) || 0;
    if (avail <= 0) continue;
    const sub = Math.max(0, Math.min(Number(b.sublease_sf) || 0, avail));
    const direct = Math.max(0, avail - sub);
    const sm = b.submarket || 'Unknown';
    if (!map.has(sm)) map.set(sm, { name: sm, direct: 0, sublease: 0 });
    const row = map.get(sm);
    row.direct += direct;
    row.sublease += sub;
  }
  return [...map.values()]
    .map(r => ({ ...r, total: r.direct + r.sublease }))
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function aggregateVacancyByGeneration(buildings) {
  let g1 = 0, g2 = 0;
  for (const b of buildings) {
    if (b.status !== 'Existing') continue;
    const avail = Number(b.sf_available) || 0;
    if (avail <= 0) continue;
    if (b.vacancy_type === '1st GEN') g1 += avail;
    else if (b.vacancy_type === '2nd GEN') g2 += avail;
  }
  const out = [];
  if (g1 > 0) out.push({ name: '1st GEN', sf: g1 });
  if (g2 > 0) out.push({ name: '2nd GEN', sf: g2 });
  return out;
}

export function aggregateVacancyRateBySubmarket(buildings) {
  const map = new Map();
  for (const b of buildings) {
    if (b.status !== 'Existing') continue;
    const sm = b.submarket || 'Unknown';
    if (!map.has(sm)) map.set(sm, { name: sm, existingSf: 0, direct: 0, sublease: 0 });
    const row = map.get(sm);
    const sf = Number(b.total_sf) || 0;
    const avail = Number(b.sf_available) || 0;
    const sub = Math.max(0, Math.min(Number(b.sublease_sf) || 0, avail));
    row.existingSf += sf;
    row.direct += Math.max(0, avail - sub);
    row.sublease += sub;
  }
  return [...map.values()]
    .filter(r => r.existingSf > 0)
    .map(r => ({ name: r.name, direct: (r.direct / r.existingSf) * 100, sublease: (r.sublease / r.existingSf) * 100 }))
    .sort((a, b) => (b.direct + b.sublease) - (a.direct + a.sublease));
}

// ───────────────────────── Size tranches ──
const SIZE_TRANCHES = [
  { label: '≤100K',    min: 0,       max: 100000 },
  { label: '100–250K', min: 100000,  max: 250000 },
  { label: '250–500K', min: 250000,  max: 500000 },
  { label: '500K–1M',  min: 500000,  max: 1000000 },
  { label: '1M+',      min: 1000000, max: Infinity },
];
export function aggregateBuildingSizeDistribution(buildings, { existingOnly = false } = {}) {
  const rows = SIZE_TRANCHES.map(t => ({ name: t.label, count: 0, sf: 0 }));
  for (const b of buildings) {
    if (existingOnly && b.status !== 'Existing') continue;
    const sf = Number(b.total_sf) || 0;
    if (sf <= 0) continue;
    const idx = SIZE_TRANCHES.findIndex(t => sf >= t.min && sf < t.max);
    if (idx >= 0) { rows[idx].count += 1; rows[idx].sf += sf; }
  }
  return rows.filter(r => r.count > 0);
}

const VAC_SIZE_TRANCHES = [
  { label: '< 50K',    min: 0,       max: 50000 },
  { label: '50–100K',  min: 50000,   max: 100000 },
  { label: '100–250K', min: 100000,  max: 250000 },
  { label: '250–500K', min: 250000,  max: 500000 },
  { label: '500K–1M',  min: 500000,  max: 1000000 },
  { label: '1M+',      min: 1000000, max: Infinity },
];
function trancheBy(rows, valueField) {
  const out = VAC_SIZE_TRANCHES.map(t => ({ name: t.label, sf: 0, count: 0 }));
  for (const b of rows) {
    const size = Number(b.total_sf) || 0;
    if (size <= 0) continue;
    const idx = VAC_SIZE_TRANCHES.findIndex(t => size >= t.min && size < t.max);
    if (idx < 0) continue;
    const v = Number(b[valueField]) || 0;
    if (v <= 0) continue;
    out[idx].sf += v; out[idx].count++;
  }
  return out.filter(r => r.sf > 0);
}
export function aggregateVacancyBySize(buildings) {
  return trancheBy(buildings.filter(b => b.status === 'Existing'), 'sf_available');
}
export function aggregateUcBySize(buildings) {
  return trancheBy(buildings.filter(b => b.status === 'Under Construction'), 'total_sf');
}

// ───────────────────────── Ownership ──
export function aggregateOwnership(buildings) {
  const map = new Map();
  for (const b of buildings) {
    const o = b.ownership_type || 'Unspecified';
    if (!map.has(o)) map.set(o, { name: o, sf: 0, count: 0 });
    const row = map.get(o);
    row.sf += Number(b.total_sf) || 0;
    row.count += 1;
  }
  return [...map.values()].filter(r => r.sf > 0).sort((a, b) => b.sf - a.sf);
}

export function aggregateTopOwners(buildings, { limit = 10 } = {}) {
  const map = new Map();
  for (const b of buildings) {
    if (b.status === 'Proposed') continue;
    const o = (b.owner || '').trim();
    if (!o) continue;
    if (!map.has(o)) map.set(o, { name: o, sf: 0, count: 0 });
    const row = map.get(o);
    row.sf += Number(b.total_sf) || 0;
    row.count += 1;
  }
  return [...map.values()].sort((a, b) => b.sf - a.sf).slice(0, limit);
}

// ───────────────────────── Leasing ──
const LEASE_TYPE_ORDER = ['New', 'Renewal', 'Expansion', 'Sublease', 'Owner User'];

export function aggregateLeasingByQuarter(deals) {
  const map = new Map();
  for (const d of deals) {
    const q = d.quarter || 'Unknown';
    if (!map.has(q)) map.set(q, { name: q, deals: 0, sf: 0 });
    const row = map.get(q);
    row.deals += 1;
    row.sf += Number(d.rba) || 0;
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function aggregateLeasingBySubmarket(deals) {
  const map = new Map();
  for (const d of deals) {
    const sm = d.submarket || 'Unknown';
    if (!map.has(sm)) map.set(sm, { name: sm, deals: 0, sf: 0 });
    const row = map.get(sm);
    row.deals += 1;
    row.sf += Number(d.rba) || 0;
  }
  return [...map.values()].sort((a, b) => b.sf - a.sf);
}

export function aggregateLeasingByType(deals) {
  const map = new Map();
  for (const d of deals) {
    if (!LEASE_TYPE_ORDER.includes(d.type)) continue;
    if (!map.has(d.type)) map.set(d.type, { name: d.type, sf: 0, count: 0 });
    const row = map.get(d.type);
    row.sf += Number(d.rba) || 0;
    row.count += 1;
  }
  return [...map.values()].filter(r => r.sf > 0).sort((a, b) => b.sf - a.sf);
}

export function aggregateLeasingYoYBySubmarket(deals) {
  const thisYear = new Date().getFullYear();
  const lastYear = thisYear - 1;
  const map = new Map();
  for (const d of deals) {
    const sm = d.submarket || 'Unknown';
    if (!map.has(sm)) map.set(sm, { name: sm, sfThis: 0, sfLast: 0 });
    const row = map.get(sm);
    const sf = Number(d.rba) || 0;
    if (Number(d.year) === thisYear) row.sfThis += sf;
    else if (Number(d.year) === lastYear) row.sfLast += sf;
  }
  return [...map.values()]
    .filter(r => r.sfThis > 0 || r.sfLast > 0)
    .sort((a, b) => (b.sfThis + b.sfLast) - (a.sfThis + a.sfLast));
}

export function aggregateTopTenants(deals, { limit = 10 } = {}) {
  const map = new Map();
  for (const d of deals) {
    const t = (d.tenant || '').trim();
    if (!t || /^tbd$/i.test(t)) continue;
    if (!map.has(t)) map.set(t, { name: t, sf: 0, count: 0 });
    const row = map.get(t);
    row.sf += Number(d.rba) || 0;
    row.count += 1;
  }
  return [...map.values()].sort((a, b) => b.sf - a.sf).slice(0, limit);
}

export function aggregateTopBuildingsByLeasing(deals, { limit = 10 } = {}) {
  const map = new Map();
  for (const d of deals) {
    const name = d.building_name || d.address || 'Unknown';
    if (!map.has(name)) map.set(name, { name, sf: 0, count: 0 });
    const row = map.get(name);
    row.sf += Number(d.rba) || 0;
    row.count += 1;
  }
  return [...map.values()].sort((a, b) => b.sf - a.sf).slice(0, limit);
}

// ───────────────────────── Status / deliveries by submarket / quarter ──
function bySubmarketSf(rows, sfField) {
  const map = new Map();
  for (const r of rows) {
    const sm = r.submarket || 'Unknown';
    if (!map.has(sm)) map.set(sm, { name: sm, sf: 0, count: 0 });
    const row = map.get(sm);
    row.sf += Number(r[sfField]) || 0;
    row.count += 1;
  }
  return [...map.values()].filter(r => r.sf > 0).sort((a, b) => b.sf - a.sf);
}
export function aggregateStatusBySubmarket(buildings, status) {
  return bySubmarketSf(buildings.filter(b => b.status === status), 'total_sf');
}
export function aggregateDeliveriesBySubmarket(deliveries) {
  return bySubmarketSf(deliveries, 'total_sf_at_delivery');
}
function quarterKey(s) { const m = String(s || '').match(/(\d{4}).*Q([1-4])/); return m ? Number(m[1]) * 4 + Number(m[2]) : 0; }
function quarterFromIso(iso) { if (!iso) return null; const d = new Date(iso); if (isNaN(d)) return null; return `${d.getFullYear()} Q${Math.floor(d.getMonth() / 3) + 1}`; }
export function aggregateDeliveriesByQuarter(deliveries) {
  const map = new Map();
  for (const d of deliveries) {
    const q = d.quarter_delivered || quarterFromIso(d.delivered_at) || 'Unknown';
    if (!map.has(q)) map.set(q, { name: q, sf: 0, count: 0 });
    const row = map.get(q);
    row.sf += Number(d.total_sf_at_delivery) || 0;
    row.count += 1;
  }
  return [...map.values()].sort((a, b) => quarterKey(a.name) - quarterKey(b.name));
}

// ───────────────────────── KPI calc helpers (from standardReports.jsx) ──
export function existingAgg(buildings) {
  const ex = buildings.filter(b => b.status === 'Existing');
  let existingSf = 0, direct = 0, sub = 0, vacantCount = 0;
  for (const b of ex) {
    const sf = Number(b.total_sf) || 0; existingSf += sf;
    const a = Number(b.sf_available) || 0;
    if (a > 0) vacantCount++;
    const s = Math.max(0, Math.min(Number(b.sublease_sf) || 0, a));
    direct += Math.max(0, a - s); sub += s;
  }
  return { existingCount: ex.length, existingSf, direct, sub, vacantCount, vacantSf: direct + sub };
}
export const statusSf = (b, s) => b.filter(x => x.status === s).reduce((a, x) => a + (Number(x.total_sf) || 0), 0);
export const statusCount = (b, s) => b.filter(x => x.status === s).length;
export const daysOnMarket = (b) => b.vacancy_start_date ? Math.floor((Date.now() - new Date(b.vacancy_start_date).getTime()) / 86400000) : null;
export const normPct = (v) => (v == null ? null : Number(v) > 1 ? Number(v) / 100 : Number(v));
export function deliveryPrePct(d) {
  const p = normPct(d.percent_leased_at_delivery);
  if (p != null) return p;
  const tot = Number(d.total_sf_at_delivery) || 0, av = d.sf_available_at_delivery;
  if (tot > 0 && av != null && av !== '') return Math.max(0, Math.min(1, (tot - Number(av)) / tot));
  return null;
}
export const deliveryPreSf = (d) => { const p = deliveryPrePct(d); return p != null ? Math.round((Number(d.total_sf_at_delivery) || 0) * p) : 0; };
