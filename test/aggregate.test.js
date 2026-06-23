import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateInventoryCharts, aggregateVacancyBySubmarket, aggregateVacancyRateBySubmarket,
  aggregateLeasingByQuarter, aggregateTopOwners, existingAgg, statusSf, daysOnMarket,
} from '../src/aggregate.js';

const BUILDINGS = [
  { id: 1, status: 'Existing', total_sf: 100000, sf_available: 20000, sublease_sf: 5000, submarket: 'North Fort Worth', load_config: 'Cross', vacancy_type: '1st GEN', owner: 'Prologis' },
  { id: 2, status: 'Existing', total_sf: 200000, sf_available: 0, sublease_sf: 0, submarket: 'North Fort Worth', load_config: 'Rear', owner: 'Prologis' },
  { id: 3, status: 'Under Construction', total_sf: 150000, sf_available: 0, submarket: 'South Fort Worth', owner: 'Hillwood' },
  { id: 4, status: 'Proposed', total_sf: 300000, sf_available: 0, submarket: 'South Fort Worth', owner: 'Crow' },
];

test('aggregateInventoryCharts: status bars + vacancy buckets', () => {
  const inv = aggregateInventoryCharts(BUILDINGS, {});
  const byName = Object.fromEntries(inv.statusBars.map(r => [r.name, r]));
  assert.equal(byName['Existing'].sf, 300000);
  assert.equal(byName['Existing'].count, 2);
  assert.equal(byName['Under Construction'].sf, 150000);
  assert.equal(byName['Proposed'].sf, 300000);
  // building 1: avail 20000, sublease 5000 → direct 15000 (1st GEN), sublease 5000
  const vt = Object.fromEntries(inv.vacancyTypeBars.map(r => [r.name, r.sf]));
  assert.equal(vt['1st GEN'], 15000);
  assert.equal(vt['Sublease'], 5000);
});

test('existingAgg: direct/sublease/vacant split', () => {
  const e = existingAgg(BUILDINGS);
  assert.equal(e.existingSf, 300000);
  assert.equal(e.direct, 15000);
  assert.equal(e.sub, 5000);
  assert.equal(e.vacantSf, 20000);
  assert.equal(e.vacantCount, 1);
});

test('aggregateVacancyBySubmarket only counts existing-with-availability', () => {
  const out = aggregateVacancyBySubmarket(BUILDINGS);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, 'North Fort Worth');
  assert.equal(out[0].direct, 15000);
  assert.equal(out[0].sublease, 5000);
});

test('aggregateVacancyRateBySubmarket returns percentages', () => {
  const out = aggregateVacancyRateBySubmarket(BUILDINGS);
  const nfw = out.find(r => r.name === 'North Fort Worth');
  // existingSf 300000, direct 15000 → 5%, sublease 5000 → 1.667%
  assert.ok(Math.abs(nfw.direct - 5) < 1e-9);
  assert.ok(Math.abs(nfw.sublease - (5000 / 300000) * 100) < 1e-9);
});

test('statusSf + aggregateTopOwners exclude Proposed appropriately', () => {
  assert.equal(statusSf(BUILDINGS, 'Under Construction'), 150000);
  const owners = aggregateTopOwners(BUILDINGS);
  // Crow is Proposed-only → excluded; Prologis 300000, Hillwood 150000
  assert.deepEqual(owners.map(o => o.name), ['Prologis', 'Hillwood']);
});

test('aggregateLeasingByQuarter buckets by quarter', () => {
  const deals = [
    { quarter: '2026 Q1', rba: 50000 },
    { quarter: '2026 Q1', rba: 25000 },
    { quarter: '2026 Q2', rba: 10000 },
  ];
  const out = aggregateLeasingByQuarter(deals);
  assert.deepEqual(out.map(r => [r.name, r.sf, r.deals]), [['2026 Q1', 75000, 2], ['2026 Q2', 10000, 1]]);
});

test('daysOnMarket null when no vacancy_start_date', () => {
  assert.equal(daysOnMarket({}), null);
  assert.ok(daysOnMarket({ vacancy_start_date: '2026-01-01' }) > 0);
});
