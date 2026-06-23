// Pure selection logic for the Competitive Set — DOM-free and unit-testable.
//   · selectCompetitors      — competing available supply near a subject building
//   · selectLeaseComps       — comparable signed leases for the whole project
//   · pickRepresentativeRate — best whole-building quote for a building
//   · sizeBand               — ± percentage SF window helper
//   · haversineMi            — great-circle distance between two lat/lng points
//
// "Competing supply" = Existing or Under Construction, within the size band, in
// close proximity (a radius around the subject), and actually offerable: Existing
// buildings need vacancy; UC counts as future supply regardless. Proposed is NOT
// competing supply. Defaults (±35% band, 5-mi radius, 24-month comp window) come
// from the product spec and are overridable.
//
// Vendored from ftw-cre-platform competitiveSetSelect.js. The one change for
// sharing: the submarket normalizer is INJECTED via the `canon` option (default
// = the kit's canon module). FTW passes its own toCanonicalSubmarket so its
// evolving full submarket map stays authoritative for FTW; agency-hub uses the
// default.
import { toCanonicalSubmarket as defaultCanon } from './canon.js';

const SUPPLY_STATUSES = ['Existing', 'Under Construction'];

const EARTH_MI = 3958.8;

// Great-circle distance in miles between two lat/lng points.
export function haversineMi(aLat, aLng, bLat, bLng) {
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat), lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Coordinate parse that treats null / '' / undefined as MISSING (NaN), unlike
// Number(null) === 0 which would otherwise place a coordinate-less building at
// (0,0) and silently defeat the same-submarket fallback below.
function coord(v) {
  if (v == null || v === '') return NaN;
  return Number(v);
}

// ± bandPct window around an SF figure, rounded to whole SF.
export function sizeBand(sf, bandPct) {
  const s = Number(sf) || 0;
  const f = (Number(bandPct) || 0) / 100;
  return { min: Math.max(0, Math.round(s * (1 - f))), max: Math.round(s * (1 + f)) };
}

// Competing buildings for a single subject: Existing/UC supply within the size
// band AND within radiusMi of the subject. Excludes the subject and any sibling
// subjects (excludeIds). Proximity is primary; falls back to same-submarket when
// the subject has no coordinates.
export function selectCompetitors(subject, buildings, { bandPct = 35, radiusMi = 5, excludeIds = [], canon = defaultCanon } = {}) {
  const sf = Number(subject?.total_sf) || 0;
  if (sf <= 0) return [];
  const { min, max } = sizeBand(sf, bandPct);
  const exclude = new Set([subject.id, ...excludeIds].filter(v => v != null));
  const sLat = coord(subject?.latitude), sLng = coord(subject?.longitude);
  const haveSubjectCoords = Number.isFinite(sLat) && Number.isFinite(sLng);
  const sub = canon(subject.submarket); // submarket fallback
  const radius = Number(radiusMi) || 0;
  return buildings.filter(b => {
    if (exclude.has(b.id)) return false;
    if (!SUPPLY_STATUSES.includes(b.status)) return false;
    // Existing must have availability to be "competing"; UC is future supply.
    const offerable = b.status !== 'Existing' || (Number(b.sf_available) || 0) > 0;
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

// Comparable signed leases for the project — leased SF within a band spanning the
// project's size range, recent enough, and geographically relevant. Location is
// proximity-first when `radiusMi > 0` and subjects have coordinates (a comp
// qualifies if it's within radiusMi of ANY subject — this crosses submarket
// label boundaries to catch genuinely nearby comps); comps lacking coordinates
// fall back to a same-submarket match. With radiusMi = 0 (default) it's the
// legacy submarket-only filter, so existing callers are unchanged.
// `now` is injectable so tests are deterministic.
export function selectLeaseComps(subjects, comps, {
  bandPct = 35, months = 24, radiusMi = 0, now = new Date(), excludeIncomplete = true, canon = defaultCanon,
} = {}) {
  const subs = new Set(
    (subjects || []).map(s => canon(s.submarket)).filter(Boolean),
  );
  const subjPts = (subjects || [])
    .map(s => ({ lat: coord(s.latitude), lng: coord(s.longitude) }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const radius = Number(radiusMi) || 0;
  const useRadius = radius > 0 && subjPts.length > 0;

  const sfs = (subjects || []).map(s => Number(s.total_sf) || 0).filter(n => n > 0);
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

  return (comps || []).filter(c => {
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
        return subjPts.some(p => haversineMi(p.lat, p.lng, clat, clng) <= radius);
      }
      return inSubmarket(c); // no comp coordinates → fall back to submarket match
    }
    return inSubmarket(c);
  }).sort((a, b) => recencyKey(b) - recencyKey(a));
}

function recencyKey(c) {
  const d = new Date(c.comm_date || c.sign_date || 0).getTime();
  return Number.isFinite(d) ? d : 0;
}

// Best representative quote for a building from the flat quoted_rates list
// (/api/rates?type=list). Prefers the largest quote that still fits the
// building's availability, and reports observed min/max for a range. Returns
// null when the building has no quote on file.
export function pickRepresentativeRate(building, ratesList) {
  const id = building?.id;
  if (id == null) return null;
  const rows = (ratesList || []).filter(r => r.building_id === id && r.quoted_rate != null);
  if (!rows.length) return null;
  const avail = Number(building.sf_available) || 0;
  const fitting = avail > 0
    ? rows.filter(r => (Number(r.available_sf) || 0) <= avail * 1.05)
    : [];
  const pool = (fitting.length ? fitting : rows)
    .slice()
    .sort((a, b) => (Number(b.available_sf) || 0) - (Number(a.available_sf) || 0));
  const best = pool[0];
  const rateVals = rows.map(r => Number(r.quoted_rate)).filter(Number.isFinite);
  return {
    rate: Number(best.quoted_rate),
    opex: best.opex != null ? Number(best.opex) : null,
    ti: best.ti ?? null,
    structure: best.structure || null,
    min: rateVals.length ? Math.min(...rateVals) : null,
    max: rateVals.length ? Math.max(...rateVals) : null,
  };
}
