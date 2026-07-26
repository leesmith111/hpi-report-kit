// Parity demo — rebuilds representative Gemini 35 pitch slides from the NEW
// hpi-report-kit/pitch primitives using the real deck's data, so the output can
// be compared side-by-side (and probed headlessly) against
// Downloads/HPI_Gemini_35_Pitch_.pptx. Node-run: `node scripts/demo-pitch.mjs [out.pptx]`.
import { createDeck } from '../src/pptx.js';
import {
  addPitchSlide, addVelocityBandSlides, addLeasingVelocitySlide,
  addBuildingSpecSlide, addLeaseUpPlanSlide, addProspectPipelineSlide, addLeaseCompsSlide,
} from '../src/pitch.js';

const OUT = process.argv[2] || 'C:/Users/leecs/Downloads/_kit_pitch_demo.pptx';

const deck = await createDeck({ author: 'HPI' });

// --- slide 1: Leasing Velocity hero (real slide-4 data) ---------------------
addLeasingVelocitySlide(deck, {
  section: '01  ·  MARKET',
  title: 'LEASING VELOCITY',
  subtitle: 'North Fort Worth · 2024–2026 YTD',
  page: 4,
  subtotalLabel: 'GEMINI-COMPETITIVE SUBTOTAL',
  years: [
    {
      label: '2024', totalSf: 1997715, dealCount: 13, fitCount: 7,
      fitLabel: '7 of 13 deals fit Gemini 35',
      deals: [
        { tenant: 'Makesy Logistics', sf: 40404 }, { tenant: 'Barsco', sf: 25517 },
        { tenant: 'MEI Rigging & Crating', sf: 64866 }, { tenant: 'Brandt Engineering', sf: 65566 },
        { tenant: 'JBI Electric', sf: 44140 }, { tenant: 'BMS', sf: 64800 },
        { tenant: 'Tesla', sf: 47500 },
      ],
    },
    {
      label: '2025', totalSf: 3420371, dealCount: 18, fitCount: 11,
      fitLabel: '11 of 18 deals fit Gemini 35',
      deals: [
        { tenant: 'Rio Grande Pacific Tech.', sf: 27525 }, { tenant: 'Trane', sf: 90000 },
        { tenant: 'Gateway Tire', sf: 85950 }, { tenant: 'King Street Studios', sf: 80680 },
        { tenant: 'ID Technology', sf: 66721 }, { tenant: 'Hussman Corporation', sf: 40750 },
        { tenant: 'Custom Truck One Source', sf: 63795 }, { tenant: 'Nationwide Trailers', sf: 96362 },
        { tenant: 'NuEnergy', sf: 27000 }, { tenant: 'New Haven', sf: 24837 },
        { tenant: 'Carrier', sf: 26096 },
      ],
    },
    {
      label: '2026 YTD', totalSf: 904609, dealCount: 9, fitCount: 5,
      fitLabel: '5 of 9 deals fit Gemini 35',
      deals: [
        { tenant: 'American Infrastructure Mfg', sf: 93198 }, { tenant: 'ITS Logistics', sf: 90000 },
        { tenant: 'J&L Solar', sf: 52580 }, { tenant: 'WR Meadows', sf: 49786 },
        { tenant: 'Fulfill.net', sf: 41094 },
      ],
    },
  ],
  takeaway: "Across 2024–2026 YTD, 23 North Fort Worth deals landed in Gemini 35's size range — a proven, repeating band of demand.",
});

// --- slide 2: one Deal Velocity band table ----------------------------------
addVelocityBandSlides(deck, [{
  label: '20–60K SF',
  years: [
    {
      year: 2026,
      deals: [
        { tenant: 'J&L Solar', address: '3320 Keller Hicks Rd', submarket: 'North Fort Worth', signDate: '2026-04-15', sf: 52580, rate: 11.50, ti: 10, escalation: 4 },
        { tenant: 'WR Meadows', address: '5220 Alliance Gateway', submarket: 'North Fort Worth', signDate: '2026-02-01', sf: 49786, rate: 10.95, ti: 6, escalation: 3.5 },
      ],
    },
    {
      year: 2025,
      deals: [
        { tenant: 'Hussman Corporation', address: '13650 Independence Pkwy', submarket: 'North Fort Worth', signDate: '2025-06-12', sf: 40750, rate: 12.25, ti: 25, escalation: 4 },
        { tenant: 'Rio Grande Pacific Tech.', address: '4440 Blue Mound Rd', submarket: 'North Fort Worth', signDate: '2025-10-03', sf: 27525, rate: null, ti: null, escalation: '' },
        { tenant: 'NuEnergy', address: '3401 Meacham Blvd', submarket: 'North Fort Worth', signDate: '2025-04-22', sf: 27000, rate: 12.00, ti: 8.37, escalation: 4 },
      ],
    },
    {
      year: 2024,
      deals: [
        { tenant: 'Barsco', address: '2600 Gravel Dr', submarket: 'North Fort Worth', signDate: '2024-08-19', sf: 25517, rate: 11.75, ti: 18, escalation: 3.5 },
        { tenant: 'Makesy Logistics', address: '15100 Grand River Rd', submarket: 'North Fort Worth', signDate: '2024-05-30', sf: 40404, rate: 10.50, ti: 12, escalation: 4 },
      ],
    },
  ],
}], { section: '01  ·  MARKET', startPage: 5 });

// --- slide 3: Building 1 spec slide (real slide-12 data) --------------------
addBuildingSpecSlide(deck, {
  section: '03  ·  THE ASSET',
  title: 'BUILDING 1',
  subtitle: 'Pricing & Turnkey Detail',
  page: 12,
  stats: [
    { value: '119,012 SF', label: 'TOTAL RBA' }, { value: '39,671 SF', label: 'DIVISIBLE TO' },
    { value: 'Rear-Load', label: 'LOADING' }, { value: "32'", label: 'CLEAR HEIGHT' },
    { value: '32', label: 'DOCK DOORS' }, { value: '150', label: 'AUTO PARKS' },
    { value: "130'", label: 'TRUCK COURT' },
  ],
  planCaption: 'PROPOSED DEMISING PLAN — 3-TENANT SPLIT',
  refComps: {
    subtitle: 'NFW DEMISED-SUITE COMPS · 2- & 3-TENANT · AVG $12.25 NNN',
    rows: [
      { tenant: 'Hussman Corp.', sf: 40750, signed: "Jun '25", rate: 12.25, ti: 25.00 },
      { tenant: 'Linear Labs', sf: 28179, signed: "May '26", rate: 12.75, ti: 0.00 },
      { tenant: 'Carrier', sf: 26096, signed: "Feb '25", rate: 12.50, ti: 3.00 },
      { tenant: 'NuEnergy', sf: 27000, signed: "Apr '25", rate: 12.00, ti: 8.37 },
      { tenant: 'Barsco', sf: 25517, signed: "Aug '24", rate: 11.75, ti: 18.00 },
    ],
  },
  mla: {
    cols: ['FULL BLDG', '2 TENANTS', '3 TENANTS'],
    rows: [
      ['Suite Size', ['119,012', '59,506', '39,671']],
      ['Lease Term', ['63 mo', '86 mo', '86 mo']],
      ['Free Rent', ['3 mo', '2 mo', '2 mo']],
      ['Quoted Rate (NNN)', ['$9.75', '$10.50', '$12.00']],
      ['Annual Escalations', ['3.5%', '4.0%', '4.0%']],
      ['TI Allowance', ['$13.00', '$16.00', '$20.00']],
    ],
  },
  ti: {
    cols: ['FULL BLDG', '2 TENANTS', '3 TENANTS'],
    rows: [
      ['Office (@ $150/SF)', ['$535,554', '$401,666', '$357,036']],
      ['LED Lighting (@ $1.50)', ['$173,162', '$85,242', '$55,936']],
      ['Dock Equipment (@ $25K)', ['$400,000', '$100,000', '$62,500']],
      ['Power / Elec. / Architect', ['$125,000', '$125,000', '$125,000']],
      ['Demising Wall', ['—', '$43,000', '$43,000']],
      ['Fees & Contingency', ['$313,365', '$191,746', '$163,442']],
    ],
    total: ['$1,547,080', '$946,654', '$806,913'],
    psf: ['$13.00', '$15.91', '$20.34'],
  },
  footnote: 'Leasing assumptions & turnkey TI costs per HPI Market Leasing Assumptions (Gemini 2.17.26); specifications per architectural site plan; reference comps are recent disclosed-rate North Fort Worth signed leases.',
});

// --- slide 4: Lease-Up Plan (real slide-14 content) -------------------------
addLeaseUpPlanSlide(deck, {
  section: '04  ·  EXECUTION',
  title: 'LEASE-UP PLAN',
  subtitle: 'Path to 100%',
  page: 14,
  intro: 'A six-part plan to full occupancy — canvass the rollover pipeline before delivery, close with spec suites, and hold the line on rate.',
  steps: [
    { title: 'PRE-COMPLETION CANVASS', desc: 'Direct pursuit of every 2027–2029 rollover, 25–150K SF in the corridor (next page) — before they engage a tenant rep.' },
    { title: 'SPEC SUITE AS THE CLOSER', desc: 'One finished spec office per building at delivery; mid-size tenants lease what they can walk and see.' },
    { title: 'BROKER SATURATION', desc: 'On-site launch event, quarterly broker updates, and top-25 tenant-rep one-on-ones inside the first 60 days.' },
    { title: 'PRICE TO THE BAND', desc: 'Hold the splits at premium pricing; use full-building flexibility to chase the single-user whale without repricing the park.' },
    { title: 'INSTITUTIONAL REPORTING', desc: 'A weekly activity dashboard — tour log, comp movement — the same feed we run across our current FW assignments.' },
    { title: '12-MONTH CHECKPOINTS', desc: "Demising triggers pre-agreed: if a building isn't 50% committed by month 9, the split scenario activates automatically." },
  ],
  quote: 'Our goal is simple: the park is 100% leased inside 12 months of shell completion — at rates that set the new benchmark.',
  attribution: 'HPI FORT WORTH  ·  INDUSTRIAL AGENCY',
});

// --- slide 5: Prospect Pipeline ---------------------------------------------
addProspectPipelineSlide(deck, {
  section: '04  ·  EXECUTION',
  title: 'PROSPECT PIPELINE',
  subtitle: '2027–2029 Rollovers',
  page: 16,
  kpis: [
    { value: '85', label: 'Rollover Leases' },
    { value: '5.9M SF', label: 'Expiring 2027–2029' },
    { value: '31', label: 'In-Corridor Targets' },
  ],
  rows: Array.from({ length: 30 }, (_, i) => ({
    tenant: `Target Tenant ${i + 1}`, building: `${4400 + i * 12} Blue Mound Rd`,
    sf: 28000 + i * 3100, exp: `202${7 + Math.floor(i / 12)}-0${(i % 9) + 1}-28`,
  })),
  footnote: 'Tracked lease expirations 25–150K SF, North Fort Worth corridor. Source: HPI Fort Worth market database.',
});

// --- slide 6: Lease Comps ----------------------------------------------------
addLeaseCompsSlide(deck, {
  section: '01  ·  MARKET',
  title: 'LEASE COMPS',
  subtitle: 'North Fort Worth · 2024–2026',
  page: 17,
  rows: [
    { signDate: '2026-05-11', tenant: 'Linear Labs', building: 'Meacham Business Center', sf: 28179, rate: 12.75, escalation: 4, ti: 0, freeMonths: 0, termMonths: 62 },
    { signDate: '2026-02-01', tenant: 'WR Meadows', building: 'Alliance Gateway 5220', sf: 49786, rate: 10.95, escalation: 3.5, ti: 6, freeMonths: 2, termMonths: 84 },
    { signDate: '2025-06-12', tenant: 'Hussman Corporation', building: 'Independence Pkwy 13650', sf: 40750, rate: 12.25, escalation: 4, ti: 25, freeMonths: 3, termMonths: 126 },
    { signDate: '2025-04-22', tenant: 'NuEnergy', building: 'Meacham Blvd 3401', sf: 27000, rate: 12.00, escalation: 4, ti: 8.37, freeMonths: 1, termMonths: 60 },
    { signDate: '2025-02-14', tenant: 'Carrier', building: 'Fossil Creek Tech Center', sf: 26096, rate: 12.50, escalation: '$0.30/SF', ti: 3, freeMonths: 0, termMonths: 36 },
    { signDate: '2024-08-19', tenant: 'Barsco', building: 'Gravel Dr 2600', sf: 25517, rate: 11.75, escalation: 3.5, ti: 18, freeMonths: 2, termMonths: 90 },
  ],
  footnote: 'All leases 30K–200K SF with disclosed economics, North Fort Worth submarket, signed January 2024 – July 2026. Source: HPI Fort Worth market database.',
});

await deck.writeFile({ fileName: OUT });
console.log('wrote', OUT);
