// Flyer parity demo — rebuilds the Mark IV Parkway flyer from the NEW
// hpi-report-kit/flyer primitives using imagery + copy extracted from the real
// PDF (Downloads/_markiv_flyer_assets, via scripts noted in the session).
// Compare side-by-side with "Flyers_unzip/Mark IV Parkway flyer.pdf".
// Node-run: `node scripts/demo-flyer.mjs [out.pptx]`.
import { readFileSync } from 'node:fs';
import {
  flyerTheme, createFlyerDeck, addFlyerCover, addFlyerSpecsPage,
  addFlyerImagePage, addFlyerDisclosurePage,
} from '../src/flyer.js';

const OUT = process.argv[2] || 'C:/Users/leecs/Downloads/_kit_flyer_demo.pptx';
const A = 'C:/Users/leecs/Downloads/_markiv_flyer_assets';
const png = (name) => `data:image/png;base64,${readFileSync(`${A}/${name}`).toString('base64')}`;

const T = flyerTheme();  // Mark IV blue is the default accent
const chrome = {
  theme: T,
  name: 'Mark IV\nDistribution\nCenter',
  address: '5651 Mark IV Parkway | Fort Worth, Texas 76131',
  headerPhoto: png('header_band.png'),
  footer: {
    leasedByLogo: png('logo_leasedby.png'),
    ownedByLogo: png('logo_ownedby.png'),
    contacts: [
      { name: 'George Jennings', phone: '817.632.6151', email: 'gjennings@holtlunsford.com' },
      { name: 'Matt Carthey', phone: '817.710.1111', email: 'mcarthey@holtlunsford.com' },
    ],
  },
};

const deck = await createFlyerDeck({ author: 'HPI' });

addFlyerCover(deck, {
  ...chrome,
  photo: png('hero.png'),
  saleLine: 'For Lease',
  subLine: '122,779 SF of Class A Warehouse Space',
  features: [
    'Centrally Located at I-35W & Loop 820 in North Fort Worth',
    'Ability to Fully Secure Truck Court',
    'Located on 7.8 Acres',
    'Zoned “K” Heavy Industrial',
    'Spec Office in Place',
    'ESFR Sprinkler System',
    'Multiple Points of Ingress/Egress',
  ],
  locatorImage: png('locator.png'),
});

addFlyerSpecsPage(deck, {
  ...chrome,
  specs: [
    ['Warehouse SF', '122,779 SF'],
    ['Spec Office SF', '3,073 SF'],
    ['Land Area', '7.8 Acres'],
    ['Bay Size', '60’ x 52’'],
    ['Shell Construction', 'Completed April 2022'],
    ['Column Spacing', "52' x 50'"],
    ['Clear Height', "32'"],
    ['Roof', 'R-12 Poly-Iso Insulation with 60 Mil TPO Membrane'],
    ['Warehouse Lighting', "30 FC on 10' Whips"],
    ['Sprinkler', 'ESFR with Type 17 Heads'],
    ['Building Slab', '6" Thick 4000 PSI Concrete'],
    ['Dock-High Doors', "Twenty-Five (25) 9'x10'"],
    ['Dock Equipment', 'Nine (9) 35,000 lbs mechanical dock levers'],
    ['Drive In Door', "One (1) 13' x 14' with ramp"],
    ['Shell Electrical', '1600Amp, 480Y/277V 3 Phase Main Service Panel'],
    ['Truck Court Depth', "180'"],
    ['Auto Parking', '124'],
    ['Trailer Parking', '31'],
  ],
  photo: png('specs_photo.png'),
});

addFlyerImagePage(deck, {
  ...chrome, title: ['Site', 'Plan'], image: png('siteplan.png'),
  cta: { text: 'Click for Virtual Tour', url: 'https://my.matterport.com/show/?m=example' },
});

addFlyerImagePage(deck, {
  ...chrome, title: ['Amenities', 'Map'], image: png('amenities.png'),
});

addFlyerImagePage(deck, {
  ...chrome, title: ['Ingress/Egress', 'Map'], image: png('ingress.png'),
  bullets: [
    '0.5 Mile North of Highway 820',
    '1.5 Miles West of I-35',
    'At the corner of Mark IV Parkway and Cantrell Sansom Road',
    'Easy DFW metroplex access',
    '4.5 Miles to Meacham Airport',
    '23 Miles to DFW Airport',
  ],
});

addFlyerDisclosurePage(deck, { theme: T, image: png('iabs.png') });

await deck.writeFile({ fileName: OUT });
console.log('wrote', OUT);
