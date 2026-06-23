# hpi-report-kit

Shared HPI report-rendering kit. One source of truth for the branded report
output used by **ftw-cre-platform** and **agency-hub**, so the two apps don't
drift.

The kit **never fetches data** — each host supplies the rows. The kit only
selects (competitive set), aggregates, and renders.

## Entry points

| Subpath | Env | Contents |
|---|---|---|
| `hpi-report-kit/select` | server + client | `selectCompetitors`, `selectLeaseComps`, `pickRepresentativeRate`, `sizeBand`, `haversineMi` |
| `hpi-report-kit/aggregate` | server + client | pure chart/KPI aggregators (`aggregateInventoryCharts`, leasing/owner/tenant/vacancy aggs, `existingAgg`, `statusSf`, …) |
| `hpi-report-kit/canon` | server + client | `toCanonicalSubmarket` + `CANONICAL_MAP` (default DFW submarket rollups) |
| `hpi-report-kit/format` | server + client | `fmtSf`, `fmtPct`, `fmtDate`, `fmtBumps`, `fmtRatePct`, … |
| `hpi-report-kit/charts` | **client** | Recharts components + `TitledChartBox`, `ChartBox`, `CHART_TITLE_H` |
| `hpi-report-kit/snapshot` | **client** | `renderChartToPng`, `renderChartsSequential` (React → PNG via html2canvas) |
| `hpi-report-kit/pptx` | **client** | pptxgenjs deck primitives + `addCompetitiveSetSlides` (brand assets baked in) |
| `hpi-report-kit/pdf` | **client** | `buildCombinedPdf` — branded combined PDF (jsPDF) |
| `hpi-report-kit/excel` | server + client | exceljs builders: CP35 marketing report + market/competitive-set sheets |
| `hpi-report-kit/assets` | any | base64 brand background + logo |

**Server functions must import only `/select`, `/aggregate`, `/canon`,
`/format`, `/excel`.** The `/charts` `/snapshot` `/pptx` `/pdf` entries pull in
browser-only libs (React/recharts/html2canvas/pptxgenjs/jsPDF).

## Consuming it

Both apps install a tag-pinned git dependency (this repo is public):

```jsonc
"hpi-report-kit": "github:leesmith111/hpi-report-kit#v0.1.0"
```

Then add the peer libs you actually use (each app installs its own copy):
`react`, `react-dom`, `recharts`, `pptxgenjs`, `jspdf`, `jspdf-autotable`,
`html2canvas`, `exceljs`.

## Building / releasing

`dist/` is **committed** so Vercel installs run no build step.

```bash
npm install
npm test          # node:test — selection + aggregator parity + autotable resolver
npm run build     # tsup → dist/
git add dist && git commit -m "build" && git tag vX.Y.Z && git push --tags
```

Bump = retag here, then bump the `#vX.Y.Z` ref + reinstall (commit the lockfile)
in each consumer app.
