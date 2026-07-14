import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectCompetitors, selectLeaseComps, pickRepresentativeRate, sizeBand, haversineMi,
  isFirstGenBuilding, isNewDevelopment, isFirstGenComp,
} from '../src/select.js';

const SUBJECT = { id: 1, total_sf: 100000, status: 'Existing', sf_available: 20000, submarket: 'Alliance', latitude: 32.9, longitude: -97.3 };

const BUILDINGS = [
  SUBJECT,
  { id: 2, total_sf: 110000, status: 'Existing', sf_available: 30000, submarket: 'NE Tarrant / Alliance', latitude: 32.91, longitude: -97.31 }, // in band, near, available → competes
  { id: 3, total_sf: 105000, status: 'Existing', sf_available: 0, submarket: 'Alliance', latitude: 32.9, longitude: -97.3 }, // no availability → excluded
  { id: 4, total_sf: 108000, status: 'Under Construction', sf_available: 0, submarket: 'Alliance', latitude: 32.9, longitude: -97.3 }, // UC future supply → competes
  { id: 5, total_sf: 300000, status: 'Existing', sf_available: 50000, submarket: 'Alliance', latitude: 32.9, longitude: -97.3 }, // out of size band → excluded
  { id: 6, total_sf: 100000, status: 'Existing', sf_available: 10000, submarket: 'Alliance', latitude: 33.9, longitude: -98.3 }, // too far → excluded
  { id: 7, total_sf: 100000, status: 'Proposed', sf_available: 0, submarket: 'Alliance', latitude: 32.9, longitude: -97.3 }, // proposed → never competes
];

test('sizeBand computes ± window', () => {
  assert.deepEqual(sizeBand(100000, 35), { min: 65000, max: 135000 });
  assert.deepEqual(sizeBand(0, 35), { min: 0, max: 0 });
});

test('haversineMi is ~0 for same point and positive otherwise', () => {
  assert.equal(haversineMi(32.9, -97.3, 32.9, -97.3), 0);
  assert.ok(haversineMi(32.9, -97.3, 33.9, -98.3) > 50);
});

test('selectCompetitors: existing-with-availability + UC within band & radius', () => {
  const out = selectCompetitors(SUBJECT, BUILDINGS, { bandPct: 35, radiusMi: 5 });
  const ids = out.map(b => b.id).sort();
  assert.deepEqual(ids, [2, 4]); // 3 (no avail), 5 (size), 6 (far), 7 (proposed) all excluded; subject excluded
});

test('selectCompetitors: submarket fallback when subject lacks coordinates', () => {
  const noCoords = { ...SUBJECT, latitude: null, longitude: null };
  const out = selectCompetitors(noCoords, BUILDINGS, { bandPct: 35, radiusMi: 5 });
  // 6 is far but same canonical submarket → now included; 2 & 4 still in.
  assert.deepEqual(out.map(b => b.id).sort(), [2, 4, 6]);
});

test('selectCompetitors: injected canon overrides default rollup', () => {
  // A canon that maps everything to a single bucket → submarket fallback always matches.
  const noCoords = { ...SUBJECT, latitude: null, longitude: null, submarket: 'Zzz' };
  const allOne = () => 'BUCKET';
  const out = selectCompetitors(noCoords, BUILDINGS, { radiusMi: 5, canon: allOne });
  assert.deepEqual(out.map(b => b.id).sort(), [2, 4, 6]);
});

test('selectLeaseComps: size band + recency + submarket via default canon', () => {
  const now = new Date('2026-06-01T00:00:00Z');
  const comps = [
    { id: 'a', leased_sf: 95000, submarket: 'Alliance', comm_date: '2026-01-15', incomplete: false }, // in band, recent → keep
    { id: 'b', leased_sf: 95000, submarket: 'Alliance', comm_date: '2022-01-15', incomplete: false }, // too old → drop
    { id: 'c', leased_sf: 400000, submarket: 'Alliance', comm_date: '2026-01-15', incomplete: false }, // too big → drop
    { id: 'd', leased_sf: 95000, submarket: 'Dallas CBD', comm_date: '2026-01-15', incomplete: false }, // wrong submarket → drop
    { id: 'e', leased_sf: 95000, submarket: 'Alliance', comm_date: '2026-03-15', incomplete: true }, // incomplete → drop
  ];
  const out = selectLeaseComps([SUBJECT], comps, { bandPct: 35, months: 24, now });
  assert.deepEqual(out.map(c => c.id), ['a']);
});

test('selectLeaseComps: radiusMi filters by proximity, crossing submarket labels', () => {
  const now = new Date('2026-06-01T00:00:00Z')
  const comps = [
    { id: 'near', leased_sf: 95000, submarket: 'Other Submarket', latitude: 32.91, longitude: -97.31, comm_date: '2026-01-15' }, // near, different submarket → in (radius)
    { id: 'far', leased_sf: 95000, submarket: 'Alliance', latitude: 33.9, longitude: -98.3, comm_date: '2026-01-15' },          // same submarket but far → out (radius)
    { id: 'nocoord', leased_sf: 95000, submarket: 'Alliance', comm_date: '2026-01-15' },                                        // no coords → submarket fallback → in
  ]
  const out = selectLeaseComps([SUBJECT], comps, { bandPct: 35, months: 24, radiusMi: 5, now })
  assert.deepEqual(out.map(c => c.id).sort(), ['near', 'nocoord'])
})

// ---- First-generation / new-development filtering -------------------------
const FG_NOW = new Date('2026-06-01T00:00:00Z'); // first-gen window ≥2021, new-dev ≥2024

test('isFirstGenBuilding: tag wins, else 5-yr vintage, else excluded', () => {
  assert.equal(isFirstGenBuilding({ status: 'Under Construction' }, { now: FG_NOW }), true);
  assert.equal(isFirstGenBuilding({ status: 'Proposed' }, { now: FG_NOW }), true);
  assert.equal(isFirstGenBuilding({ status: 'Existing', vacancy_type: '1st GEN', construction_year: 2005 }, { now: FG_NOW }), true); // tag beats old vintage
  assert.equal(isFirstGenBuilding({ status: 'Existing', vacancy_type: '2nd GEN', construction_year: 2025 }, { now: FG_NOW }), false); // tag beats new vintage
  assert.equal(isFirstGenBuilding({ status: 'Existing', quarter_delivered: '2023 Q2' }, { now: FG_NOW }), true); // untagged, within 5 yrs
  assert.equal(isFirstGenBuilding({ status: 'Existing', construction_year: 2015 }, { now: FG_NOW }), false); // untagged, too old
  assert.equal(isFirstGenBuilding({ status: 'Existing' }, { now: FG_NOW }), false); // no vintage, no tag → excluded
});

test('isNewDevelopment: UC/Proposed or delivered within 2 yrs', () => {
  assert.equal(isNewDevelopment({ status: 'Proposed' }, { now: FG_NOW }), true);
  assert.equal(isNewDevelopment({ status: 'Existing', construction_year: 2025 }, { now: FG_NOW }), true);
  assert.equal(isNewDevelopment({ status: 'Existing', construction_year: 2023 }, { now: FG_NOW }), false); // 3 yrs → not the trigger
  assert.equal(isNewDevelopment({ status: 'Existing' }, { now: FG_NOW }), false);
});

const FG_SUBJECT = { id: 100, total_sf: 100000, status: 'Proposed', submarket: 'Alliance', latitude: 32.9, longitude: -97.3 };
const FG_BUILDINGS = [
  FG_SUBJECT,
  { id: 101, total_sf: 100000, status: 'Existing', sf_available: 20000, quarter_delivered: '2023 Q1', latitude: 32.9, longitude: -97.3 }, // ≤5yr → keep
  { id: 102, total_sf: 100000, status: 'Existing', sf_available: 20000, construction_year: 2014, latitude: 32.9, longitude: -97.3 },       // old, untagged → drop
  { id: 103, total_sf: 100000, status: 'Existing', sf_available: 20000, vacancy_type: '1st GEN', construction_year: 2009, latitude: 32.9, longitude: -97.3 }, // tag → keep
  { id: 104, total_sf: 100000, status: 'Existing', sf_available: 20000, vacancy_type: '2nd GEN', construction_year: 2025, latitude: 32.9, longitude: -97.3 }, // tag → drop
  { id: 105, total_sf: 100000, status: 'Under Construction', sf_available: 0, latitude: 32.9, longitude: -97.3 },                          // new supply → keep
  { id: 106, total_sf: 100000, status: 'Existing', sf_available: 20000, latitude: 32.9, longitude: -97.3 },                                // no vintage/tag → drop
];

test('selectCompetitors: new-dev subject auto-filters to first-gen supply', () => {
  const ids = selectCompetitors(FG_SUBJECT, FG_BUILDINGS, { bandPct: 35, radiusMi: 5, now: FG_NOW }).map(b => b.id).sort();
  assert.deepEqual(ids, [101, 103, 105]); // 102 (old), 104 (2nd GEN), 106 (unknown) dropped
});

test('selectCompetitors: firstGenOnly:false opts a new-dev subject out', () => {
  const ids = selectCompetitors(FG_SUBJECT, FG_BUILDINGS, { bandPct: 35, radiusMi: 5, now: FG_NOW, firstGenOnly: false }).map(b => b.id).sort();
  assert.deepEqual(ids, [101, 102, 103, 104, 105, 106]); // every Existing-with-vacancy + UC returns
});

test('selectCompetitors: non-new-dev subject is unaffected (no filtering)', () => {
  const oldSubject = { ...FG_SUBJECT, status: 'Existing', construction_year: 2005 };
  const ids = selectCompetitors(oldSubject, FG_BUILDINGS, { bandPct: 35, radiusMi: 5, now: FG_NOW }).map(b => b.id).sort();
  assert.deepEqual(ids, [101, 102, 103, 104, 105, 106]);
});

test('selectLeaseComps: new-dev subject keeps only first-gen comps', () => {
  const comps = [
    { id: 'fg', leased_sf: 95000, submarket: 'Alliance', comm_date: '2026-01-15', built_reno: '2024' }, // first-gen building → keep
    { id: 'old', leased_sf: 95000, submarket: 'Alliance', comm_date: '2026-01-15', built_reno: '2012' }, // old building → drop
    { id: 'novint', leased_sf: 95000, submarket: 'Alliance', comm_date: '2026-01-15' },                   // no vintage → drop
  ];
  const ids = selectLeaseComps([FG_SUBJECT], comps, { bandPct: 35, months: 24, now: FG_NOW }).map(c => c.id);
  assert.deepEqual(ids, ['fg']);
  assert.equal(isFirstGenComp(comps[1], { now: FG_NOW }), false);
});

test('pickRepresentativeRate prefers the largest fitting quote + reports range', () => {
  const b = { id: 1, sf_available: 50000 };
  const rates = [
    { building_id: 1, quoted_rate: 9.5, available_sf: 20000 },
    { building_id: 1, quoted_rate: 8.75, available_sf: 48000 },
    { building_id: 2, quoted_rate: 99, available_sf: 1000 },
  ];
  const r = pickRepresentativeRate(b, rates);
  assert.equal(r.rate, 8.75); // largest fitting quote
  assert.equal(r.min, 8.75);
  assert.equal(r.max, 9.5);
  assert.equal(pickRepresentativeRate({ id: 9 }, rates), null);
});
