import { defineConfig } from 'tsup';

// Pre-builds every entry to ESM in dist/ (committed), so the two consumer apps
// never have to transpile this package's JSX. All host-provided libs are
// externalized — react/react-dom/recharts resolve to the HOST's single copy
// (prevents the duplicate-React / invalid-hooks trap), and the heavy export
// libs (pptxgenjs/jspdf/exceljs/html2canvas) stay as runtime imports the host
// bundler resolves. JSX uses the automatic runtime (react/jsx-runtime) which
// exists in both React 18 and 19.
export default defineConfig({
  entry: {
    select: 'src/select.js',
    aggregate: 'src/aggregate.js',
    canon: 'src/canon.js',
    format: 'src/format.js',
    charts: 'src/charts.jsx',
    snapshot: 'src/snapshot.js',
    pptx: 'src/pptx.js',
    pdf: 'src/pdf.js',
    excel: 'src/excel.js',
    assets: 'src/assets.js',
  },
  format: ['esm'],
  target: 'es2020',
  splitting: false,
  clean: true,
  dts: false,
  sourcemap: false,
  external: [
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    'recharts',
    'pptxgenjs',
    'jspdf',
    'jspdf-autotable',
    'html2canvas',
    'exceljs',
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
