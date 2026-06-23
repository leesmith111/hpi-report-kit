import test from 'node:test';
import assert from 'node:assert/strict';
import { selectCompetitors, selectLeaseComps, pickRepresentativeRate, sizeBand, haversineMi } from '../src/select.js';

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
