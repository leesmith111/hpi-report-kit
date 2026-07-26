import test from 'node:test';
import assert from 'node:assert/strict';
import {
  flyerTheme, splitSpecs, addFlyerFooter, addFlyerPage, addFlyerCover,
  addFlyerSpecsPage, addFlyerImagePage, addFlyerDisclosurePage, FLYER_W, FLYER_H,
} from '../src/flyer.js';

test('flyerTheme: defaults + per-property override', () => {
  const t = flyerTheme();
  assert.equal(t.ACCENT, '0071AD');
  assert.equal(t.FONT, 'Montserrat');
  const orange = flyerTheme({ ACCENT: 'E87722', FONT: 'Arial' });
  assert.equal(orange.ACCENT, 'E87722');
  assert.equal(orange.FONT, 'Arial');
  assert.equal(orange.ACCENT_DARK, '164A73'); // untouched tokens survive
});

test('splitSpecs: balances columns, weighting long values double', () => {
  const short = (n) => Array.from({ length: n }, (_, i) => [`L${i}`, 'v']);
  const [l, r] = splitSpecs(short(10));
  assert.equal(l.length, 5); assert.equal(r.length, 5);
  // one long value on the left pulls the split point earlier
  const specs = [['A', 'x'.repeat(40)], ['B', 'v'], ['C', 'v'], ['D', 'v']];
  const [l2, r2] = splitSpecs(specs);
  assert.equal(l2.length + r2.length, 4);
  assert.ok(l2.length <= 3);
  assert.deepEqual(splitSpecs([]), [[], []]);
});

function stubDeck() {
  const deck = {
    slides: [],
    addSlide() {
      const slide = { texts: [], shapes: [], images: [] };
      slide.addText = (runs, opts) => slide.texts.push({ runs, opts });
      slide.addShape = (kind, opts) => slide.shapes.push({ kind, opts });
      slide.addImage = (opts) => slide.images.push(opts);
      deck.slides.push(slide);
      return slide;
    },
  };
  return deck;
}
const flat = (slide) => slide.texts.map(t => (Array.isArray(t.runs) ? t.runs.map(r => r.text).join('') : String(t.runs))).join('\n');
const T = flyerTheme();
const FOOTER = {
  leasedByLogo: 'data:image/png;base64,l', ownedByLogo: 'data:image/png;base64,o',
  contacts: [{ name: 'George Jennings', phone: '817.632.6151', email: 'gj@hpitx.com' }],
};
const CHROME = { theme: T, name: 'Mark IV Distribution Center', address: '5651 Mark IV Parkway | Fort Worth, Texas 76131', headerPhoto: 'data:image/png;base64,h', footer: FOOTER };

test('addFlyerPage: chrome = header photo, name chip, address bar, footer', () => {
  const deck = stubDeck();
  const s = addFlyerPage(deck, CHROME);
  const all = flat(s);
  assert.match(all, /MARK IV DISTRIBUTION CENTER/);      // chip uppercases
  assert.match(all, /5651 MARK IV PARKWAY/);             // address bar uppercases
  assert.match(all, /LEASED BY/); assert.match(all, /CONTACT/); assert.match(all, /OWNED BY/);
  assert.match(all, /George Jennings/);
  // header photo covers full width
  const hdr = s.images.find(i => i.x === 0 && i.y === 0 && i.w === FLYER_W);
  assert.ok(hdr);
  // chip is an accent-dark shape-backed text
  const chip = s.texts.find(t => t.opts?.fill?.color === T.ACCENT_DARK);
  assert.ok(chip);
  // address bar accent fill
  assert.ok(s.texts.some(t => t.opts?.fill?.color === T.ACCENT));
});

test('addFlyerCover: banner, features bullets, locator, no interior header band', () => {
  const deck = stubDeck();
  const s = addFlyerCover(deck, {
    ...CHROME, headerPhoto: undefined, photo: 'data:image/png;base64,hero',
    saleLine: 'For Lease', subLine: '122,779 SF of Class A Warehouse Space',
    features: ['Ability to Fully Secure Truck Court', 'ESFR Sprinkler System'],
    locatorImage: 'data:image/png;base64,map',
  });
  const all = flat(s);
  assert.match(all, /FOR LEASE/);
  assert.match(all, /122,779 SF OF CLASS A WAREHOUSE SPACE/);
  assert.match(all, /PROPERTY FEATURES/);
  assert.match(all, /ESFR Sprinkler System/);
  // hero covers the top 6.15in
  const hero = s.images.find(i => i.y === 0 && i.w === FLYER_W);
  assert.ok(hero && hero.h > 6);
  // locator sits right column
  assert.ok(s.images.some(i => i.x > 4 && i.y > 6));
});

test('addFlyerSpecsPage: two balanced columns with accent labels + underrules', () => {
  const deck = stubDeck();
  const specs = [
    ['Warehouse SF', '122,779 SF'], ['Spec Office SF', '3,073 SF'], ['Land Area', '7.8 Acres'],
    ['Clear Height', "32'"], ['Dock-High Doors', "Twenty-Five (25) 9'x10'"], ['Auto Parking', '124'],
  ];
  const s = addFlyerSpecsPage(deck, { ...CHROME, specs, photo: 'data:image/png;base64,p' });
  const all = flat(s);
  assert.match(all, /PROPERTY OVERVIEW/);
  assert.match(all, /122,779 SF/);
  assert.match(all, /Auto Parking/);
  // labels are accent bold
  const lab = s.texts.find(t => Array.isArray(t.runs) && t.runs[0]?.text === 'Warehouse SF');
  assert.equal(lab.runs[0].options.color, T.ACCENT);
  assert.equal(lab.runs[0].options.bold, true);
  // underrules exist (thin rule-colored rects)
  assert.ok(s.shapes.filter(sh => sh.opts.fill?.color === T.RULE).length >= specs.length);
  // right column starts at 4.45
  const rightLab = s.texts.find(t => t.opts?.x === 4.45);
  assert.ok(rightLab);
});

test('addFlyerImagePage: title, hyperlinked CTA chip, bullet overlay card', () => {
  const deck = stubDeck();
  const s = addFlyerImagePage(deck, {
    ...CHROME, title: ['SITE', 'PLAN'], image: 'data:image/png;base64,plan',
    cta: { text: 'Click for Virtual Tour', url: 'https://example.com/tour' },
    bullets: ['0.5 Mile North of Highway 820', '23 Miles to DFW Airport'],
  });
  const all = flat(s);
  assert.match(all, /SITE PLAN/);
  assert.match(all, /CLICK FOR VIRTUAL TOUR/);
  assert.match(all, /23 Miles to DFW Airport/);
  const ctaBox = s.texts.find(t => t.opts?.hyperlink?.url === 'https://example.com/tour');
  assert.ok(ctaBox);
  assert.equal(ctaBox.opts.fill.color, T.ACCENT);
  // overlay card = accent rect near the footer
  assert.ok(s.shapes.some(sh => sh.opts.fill?.color === T.ACCENT && sh.opts.y > 6));
});

test('addFlyerDisclosurePage: full-page contained image, no chrome', () => {
  const deck = stubDeck();
  const s = addFlyerDisclosurePage(deck, { theme: T, image: 'data:image/png;base64,iabs' });
  assert.equal(s.texts.length, 0);
  assert.equal(s.images.length, 1);
  assert.ok(s.images[0].w === FLYER_W - 0.8 && s.images[0].h === FLYER_H - 0.8);
});

test('addFlyerFooter: omits OWNED BY block when no owner logo', () => {
  const deck = stubDeck();
  const s = deck.addSlide();
  addFlyerFooter(s, T, { contacts: [{ name: 'A', phone: '1' }] });
  const all = flat(s);
  assert.match(all, /LEASED BY/);
  assert.ok(!/OWNED BY/.test(all));
});
