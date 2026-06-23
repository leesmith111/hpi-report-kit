// src/canon.js
var CANONICAL_MAP = {
  // NE Tarrant / Alliance
  "Alliance": "NE Tarrant / Alliance",
  "NE Tarrant/Alliance": "NE Tarrant / Alliance",
  "NE Tarrant / Alliance": "NE Tarrant / Alliance",
  // North Fort Worth
  "North Fort Worth": "North Fort Worth",
  "Meacham Fld/Fossil Cr": "North Fort Worth",
  "N Central Fort Worth": "North Fort Worth",
  "N Central Ft Worth": "North Fort Worth",
  // South Fort Worth
  "South Fort Worth": "South Fort Worth",
  "East Fort Worth": "South Fort Worth",
  "East Ft Worth": "South Fort Worth",
  "Mansfield": "South Fort Worth",
  "S Central Tarrant County": "South Fort Worth",
  "S Cen. Tarrant Cnty": "South Fort Worth",
  "S Central Fort Worth": "South Fort Worth",
  // West Fort Worth
  "West Fort Worth": "West Fort Worth",
  "West Tarrant": "West Fort Worth",
  "Southwest Tarrant": "West Fort Worth",
  "SW Tarrant": "West Fort Worth",
  // Great SW / Arlington
  "Great SW/Arlington": "Great SW/Arlington",
  "Great Southwest/Arlington": "Great SW/Arlington",
  "Great Southwest / Arlington": "Great SW/Arlington",
  "Great SW / Arlington": "Great SW/Arlington",
  "GSW/Arlington": "Great SW/Arlington",
  "Great SW Ind": "Great SW/Arlington",
  "Arlington": "Great SW/Arlington",
  "Grand Prairie": "Great SW/Arlington",
  // DFW Airport
  "DFW Airport": "DFW Airport",
  "DFW Airport Ind": "DFW Airport",
  "D/FW Airport": "DFW Airport",
  "DFW Airport/Grapevine": "DFW Airport",
  "Grapevine": "DFW Airport",
  "Euless": "DFW Airport",
  "Coppell": "DFW Airport"
};
function toCanonicalSubmarket(s) {
  if (s == null) return s;
  const trimmed = String(s).trim();
  return CANONICAL_MAP[trimmed] || trimmed;
}

// src/select.js
var SUPPLY_STATUSES = ["Existing", "Under Construction"];
var EARTH_MI = 3958.8;
function haversineMi(aLat, aLng, bLat, bLng) {
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat), lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}
function coord(v) {
  if (v == null || v === "") return NaN;
  return Number(v);
}
function sizeBand(sf, bandPct) {
  const s = Number(sf) || 0;
  const f = (Number(bandPct) || 0) / 100;
  return { min: Math.max(0, Math.round(s * (1 - f))), max: Math.round(s * (1 + f)) };
}
function selectCompetitors(subject, buildings, { bandPct = 35, radiusMi = 5, excludeIds = [], canon = toCanonicalSubmarket } = {}) {
  const sf = Number(subject?.total_sf) || 0;
  if (sf <= 0) return [];
  const { min, max } = sizeBand(sf, bandPct);
  const exclude = new Set([subject.id, ...excludeIds].filter((v) => v != null));
  const sLat = coord(subject?.latitude), sLng = coord(subject?.longitude);
  const haveSubjectCoords = Number.isFinite(sLat) && Number.isFinite(sLng);
  const sub = canon(subject.submarket);
  const radius = Number(radiusMi) || 0;
  return buildings.filter((b) => {
    if (exclude.has(b.id)) return false;
    if (!SUPPLY_STATUSES.includes(b.status)) return false;
    const offerable = b.status !== "Existing" || (Number(b.sf_available) || 0) > 0;
    if (!offerable) return false;
    const bsf = Number(b.total_sf) || 0;
    if (bsf < min || bsf > max) return false;
    if (haveSubjectCoords) {
      const bLat = coord(b.latitude), bLng = coord(b.longitude);
      if (!Number.isFinite(bLat) || !Number.isFinite(bLng)) return false;
      return haversineMi(sLat, sLng, bLat, bLng) <= radius;
    }
    return canon(b.submarket) === sub;
  });
}
function selectLeaseComps(subjects, comps, {
  bandPct = 35,
  months = 24,
  radiusMi = 0,
  now = /* @__PURE__ */ new Date(),
  excludeIncomplete = true,
  canon = toCanonicalSubmarket
} = {}) {
  const subs = new Set(
    (subjects || []).map((s) => canon(s.submarket)).filter(Boolean)
  );
  const subjPts = (subjects || []).map((s) => ({ lat: coord(s.latitude), lng: coord(s.longitude) })).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const radius = Number(radiusMi) || 0;
  const useRadius = radius > 0 && subjPts.length > 0;
  const sfs = (subjects || []).map((s) => Number(s.total_sf) || 0).filter((n) => n > 0);
  const minSf = sfs.length ? Math.min(...sfs) : 0;
  const maxSf = sfs.length ? Math.max(...sfs) : 0;
  const f = (Number(bandPct) || 0) / 100;
  const lo = Math.max(0, Math.round(minSf * (1 - f)));
  const hi = maxSf > 0 ? Math.round(maxSf * (1 + f)) : Infinity;
  let cutoff = null;
  if (months) {
    cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - Number(months));
  }
  const inSubmarket = (c) => !subs.size || subs.has(canon(c.submarket));
  return (comps || []).filter((c) => {
    if (excludeIncomplete && c.incomplete === true) return false;
    const sf = Number(c.leased_sf) || 0;
    if (sf <= 0 || sf < lo || sf > hi) return false;
    if (cutoff) {
      const raw = c.comm_date || c.sign_date;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime()) && d < cutoff) return false;
      }
    }
    if (useRadius) {
      const clat = coord(c.latitude), clng = coord(c.longitude);
      if (Number.isFinite(clat) && Number.isFinite(clng)) {
        return subjPts.some((p) => haversineMi(p.lat, p.lng, clat, clng) <= radius);
      }
      return inSubmarket(c);
    }
    return inSubmarket(c);
  }).sort((a, b) => recencyKey(b) - recencyKey(a));
}
function recencyKey(c) {
  const d = new Date(c.comm_date || c.sign_date || 0).getTime();
  return Number.isFinite(d) ? d : 0;
}
function pickRepresentativeRate(building, ratesList) {
  const id = building?.id;
  if (id == null) return null;
  const rows = (ratesList || []).filter((r) => r.building_id === id && r.quoted_rate != null);
  if (!rows.length) return null;
  const avail = Number(building.sf_available) || 0;
  const fitting = avail > 0 ? rows.filter((r) => (Number(r.available_sf) || 0) <= avail * 1.05) : [];
  const pool = (fitting.length ? fitting : rows).slice().sort((a, b) => (Number(b.available_sf) || 0) - (Number(a.available_sf) || 0));
  const best = pool[0];
  const rateVals = rows.map((r) => Number(r.quoted_rate)).filter(Number.isFinite);
  return {
    rate: Number(best.quoted_rate),
    opex: best.opex != null ? Number(best.opex) : null,
    ti: best.ti ?? null,
    structure: best.structure || null,
    min: rateVals.length ? Math.min(...rateVals) : null,
    max: rateVals.length ? Math.max(...rateVals) : null
  };
}
export {
  haversineMi,
  pickRepresentativeRate,
  selectCompetitors,
  selectLeaseComps,
  sizeBand
};
