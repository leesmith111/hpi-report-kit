// Regenerate src/assets.js (base64 brand imagery) from the FTW public assets.
// Run: node scripts/gen-assets.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const PUB = resolve(here, '../../ftw-cre-platform/public');

const bg = readFileSync(resolve(PUB, 'report-bg.png')).toString('base64');
const logo = readFileSync(resolve(PUB, 'hpi-logo-white.png')).toString('base64');

const out =
`// AUTO-GENERATED from ftw-cre-platform/public brand assets. Do not edit by hand;
// regenerate with scripts/gen-assets.mjs if the brand imagery changes. Bundled as
// base64 so the deck/pdf builders do not depend on each host app serving the
// images at a public path.
export const BG = 'data:image/png;base64,${bg}';
export const LOGO = 'data:image/png;base64,${logo}';
`;

writeFileSync(resolve(here, '../src/assets.js'), out);
console.log(`assets.js written: ${(out.length / 1024 / 1024).toFixed(2)} MB`);
