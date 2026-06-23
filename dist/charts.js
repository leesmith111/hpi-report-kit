// src/charts.jsx
import { BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer, Cell, PieChart, Pie, LabelList, Line, LineChart, ComposedChart, CartesianGrid } from "recharts";
import { jsx, jsxs } from "react/jsx-runtime";
var STATUS_COLORS = {
  "Existing": "#1f2a4d",
  "Under Construction": "#f59e0b",
  "Proposed": "#4a7fc4"
};
var LOAD_COLORS = {
  Cross: "#1f2a4d",
  Front: "#4a7fc4",
  Rear: "#f59e0b",
  Side: "#94a3b8",
  "N/A": "#cbd5e1",
  Unknown: "#e2e8f0"
};
var VACANCY_TYPE_COLORS = {
  "1st GEN": "#1f2a4d",
  "2nd GEN": "#94a3b8",
  Sublease: "#f59e0b",
  Unknown: "#cbd5e1"
};
var GEN_COLORS = { "1st GEN": "#1f2a4d", "2nd GEN": "#94a3b8" };
var LEASE_COLORS = { New: "#1f2a4d", Renewal: "#4a7fc4", Expansion: "#8b5cf6", Sublease: "#f59e0b", "Owner User": "#db2777" };
var OWNER_COLORS = { Institutional: "#1f2a4d", "Local / Private": "#4a7fc4", Unspecified: "#94a3b8" };
function fmtSfShort(n) {
  if (n == null || !Number.isFinite(n)) return "";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "K";
  return String(Math.round(n));
}
function shortSubmarket(name) {
  if (!name) return "";
  const s = String(name);
  if (s === "North Fort Worth") return "North FW";
  if (s === "South Fort Worth") return "South FW";
  if (s === "East Fort Worth") return "East FW";
  if (s === "NE Tarrant / Alliance") return "NE Tarrant";
  if (s.includes(" / ")) return s.split(" / ")[0];
  return s.length > 14 ? s.slice(0, 12) + "\u2026" : s;
}
var COMMON_AXIS = {
  stroke: "#cbd5e1",
  tick: { fontSize: 12, fill: "#475569" },
  tickLine: { stroke: "#cbd5e1" },
  axisLine: { stroke: "#cbd5e1" }
};
var TREND_AXIS = { stroke: "#cbd5e1", tick: { fontSize: 11, fill: "#475569" }, tickLine: { stroke: "#cbd5e1" }, axisLine: { stroke: "#cbd5e1" } };
function StatusBarChart({ data }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", width: "100%", height: "100%", alignItems: "center", gap: "12px" }, children: [
    /* @__PURE__ */ jsx("div", { style: { flex: "1 1 60%", height: "100%" }, children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 18, right: 12, bottom: 8, left: 16 }, children: [
      /* @__PURE__ */ jsx(XAxis, { dataKey: "name", ...COMMON_AXIS, interval: 0, tickFormatter: (n) => n === "Under Construction" ? "UC" : n }),
      /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...COMMON_AXIS }),
      /* @__PURE__ */ jsxs(Bar, { dataKey: "sf", isAnimationActive: false, radius: [3, 3, 0, 0], children: [
        data.map((d, i) => /* @__PURE__ */ jsx(Cell, { fill: STATUS_COLORS[d.name] || "#94a3b8" }, i)),
        /* @__PURE__ */ jsx(LabelList, { dataKey: "sf", position: "top", formatter: fmtSfShort, style: { fontSize: 11, fill: "#334155" } })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { style: { flex: "0 0 36%", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }, children: data.map((d) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "2px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: "12px", height: "12px", borderRadius: "2px", background: STATUS_COLORS[d.name] || "#94a3b8", flexShrink: 0 } }),
        /* @__PURE__ */ jsx("span", { style: { color: "#1e293b", fontWeight: 500 }, children: d.name })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { paddingLeft: "18px", color: "#475569", fontVariantNumeric: "tabular-nums" }, children: [
        (d.count || 0).toLocaleString(),
        " ",
        d.count === 1 ? "bldg" : "bldgs",
        " \xB7 ",
        fmtSfShort(d.sf),
        " SF"
      ] })
    ] }, d.name)) })
  ] });
}
function SubmarketStackedBarChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 12, right: 16, bottom: 8, left: 16 }, layout: "horizontal", children: [
    /* @__PURE__ */ jsx(XAxis, { dataKey: "name", ...COMMON_AXIS, interval: 0, height: 22, tickFormatter: shortSubmarket }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...COMMON_AXIS }),
    /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 12 }, iconSize: 9 }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "Existing", stackId: "s", fill: STATUS_COLORS.Existing, isAnimationActive: false }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "Under Construction", stackId: "s", fill: STATUS_COLORS["Under Construction"], isAnimationActive: false }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "Proposed", stackId: "s", fill: STATUS_COLORS.Proposed, isAnimationActive: false, radius: [3, 3, 0, 0], children: /* @__PURE__ */ jsx(LabelList, { dataKey: "total", position: "top", formatter: fmtSfShort, style: { fontSize: 11, fill: "#334155" } }) })
  ] }) });
}
function DonutWithLegend({ data, colors }) {
  const total = data.reduce((s, d) => s + (Number(d.sf) || 0), 0);
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", width: "100%", height: "100%", alignItems: "center", gap: "12px" }, children: [
    /* @__PURE__ */ jsx("div", { style: { flex: "0 0 50%", height: "100%" }, children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsx(PieChart, { children: /* @__PURE__ */ jsx(Pie, { data, dataKey: "sf", nameKey: "name", cx: "50%", cy: "50%", innerRadius: "45%", outerRadius: "85%", paddingAngle: 1.5, stroke: "#ffffff", strokeWidth: 2, isAnimationActive: false, children: data.map((d, i) => /* @__PURE__ */ jsx(Cell, { fill: colors[d.name] || "#cbd5e1" }, i)) }) }) }) }),
    /* @__PURE__ */ jsx("div", { style: { flex: "1 1 auto", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }, children: data.map((d) => {
      const pct = total > 0 ? Number(d.sf) / total * 100 : 0;
      return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: "12px", height: "12px", borderRadius: "2px", background: colors[d.name] || "#cbd5e1", flexShrink: 0 } }),
        /* @__PURE__ */ jsx("span", { style: { flex: 1, color: "#1e293b", fontWeight: 500 }, children: d.name }),
        /* @__PURE__ */ jsxs("span", { style: { color: "#475569", fontVariantNumeric: "tabular-nums" }, children: [
          pct.toFixed(0),
          "%"
        ] }),
        /* @__PURE__ */ jsx("span", { style: { color: "#94a3b8", fontSize: "12px", fontVariantNumeric: "tabular-nums", minWidth: "44px", textAlign: "right" }, children: fmtSfShort(d.sf) })
      ] }, d.name);
    }) })
  ] });
}
function LoadConfigPieChart({ data }) {
  return /* @__PURE__ */ jsx(DonutWithLegend, { data, colors: LOAD_COLORS });
}
function VacancyTypePieChart({ data }) {
  return /* @__PURE__ */ jsx(DonutWithLegend, { data, colors: VACANCY_TYPE_COLORS });
}
function VacancyByGenerationChart({ data }) {
  return /* @__PURE__ */ jsx(DonutWithLegend, { data, colors: GEN_COLORS });
}
function SupplyByStatusChart({ data }) {
  return /* @__PURE__ */ jsx(DonutWithLegend, { data, colors: STATUS_COLORS });
}
function OwnershipChart({ data }) {
  return /* @__PURE__ */ jsx(DonutWithLegend, { data, colors: OWNER_COLORS });
}
function LeasingByTypeChart({ data }) {
  return /* @__PURE__ */ jsx(DonutWithLegend, { data, colors: LEASE_COLORS });
}
function RateHistogramChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 16, right: 16, bottom: 8, left: 16 }, children: [
    /* @__PURE__ */ jsx(XAxis, { dataKey: "label", ...COMMON_AXIS, interval: 0, height: 22 }),
    /* @__PURE__ */ jsx(YAxis, { ...COMMON_AXIS, allowDecimals: false }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "#4a7fc4", isAnimationActive: false, radius: [2, 2, 0, 0], children: /* @__PURE__ */ jsx(LabelList, { dataKey: "count", position: "top", style: { fontSize: 11, fill: "#334155" } }) })
  ] }) });
}
function VacancyBySubmarketChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 12, right: 16, bottom: 8, left: 16 }, barGap: 2, barCategoryGap: 20, children: [
    /* @__PURE__ */ jsx(XAxis, { dataKey: "name", ...COMMON_AXIS, interval: 0, height: 22, tickFormatter: shortSubmarket }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...COMMON_AXIS }),
    /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 12 }, iconSize: 9 }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "direct", name: "Direct", fill: "#1f2a4d", isAnimationActive: false, radius: [2, 2, 0, 0] }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "sublease", name: "Sublease", fill: "#f59e0b", isAnimationActive: false, radius: [2, 2, 0, 0] })
  ] }) });
}
function VacancyRateBySubmarketChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 12, right: 16, bottom: 8, left: 16 }, barGap: 2, barCategoryGap: 20, children: [
    /* @__PURE__ */ jsx(XAxis, { dataKey: "name", ...COMMON_AXIS, interval: 0, height: 22, tickFormatter: shortSubmarket }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: (v) => `${v.toFixed(0)}%`, ...COMMON_AXIS }),
    /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 12 }, iconSize: 9 }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "direct", name: "Direct", fill: "#1f2a4d", isAnimationActive: false, radius: [2, 2, 0, 0] }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "sublease", name: "Sublease", fill: "#f59e0b", isAnimationActive: false, radius: [2, 2, 0, 0] })
  ] }) });
}
function LeasingByQuarterChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 18, right: 16, bottom: 8, left: 16 }, children: [
    /* @__PURE__ */ jsx(XAxis, { dataKey: "name", ...COMMON_AXIS, interval: 0, height: 22 }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...COMMON_AXIS }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "sf", fill: "#4a7fc4", isAnimationActive: false, radius: [2, 2, 0, 0], children: /* @__PURE__ */ jsx(LabelList, { dataKey: "sf", position: "top", formatter: fmtSfShort, style: { fontSize: 11, fill: "#334155" } }) })
  ] }) });
}
function LeasingBySubmarketChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, layout: "vertical", margin: { top: 12, right: 40, bottom: 12, left: 8 }, children: [
    /* @__PURE__ */ jsx(XAxis, { type: "number", tickFormatter: fmtSfShort, ...COMMON_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "name", tick: { fontSize: 12, fill: "#475569" }, tickLine: { stroke: "#cbd5e1" }, axisLine: { stroke: "#cbd5e1" }, width: 140, tickFormatter: (t) => t.length > 18 ? t.split(" / ")[0] : t }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "sf", fill: "#4a7fc4", isAnimationActive: false, barSize: 16, radius: [0, 2, 2, 0], children: /* @__PURE__ */ jsx(LabelList, { dataKey: "sf", position: "right", formatter: fmtSfShort, style: { fontSize: 11, fill: "#475569" } }) })
  ] }) });
}
function LeasingYoYChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 18, right: 16, bottom: 8, left: 16 }, barGap: 2, barCategoryGap: 20, children: [
    /* @__PURE__ */ jsx(XAxis, { dataKey: "name", ...COMMON_AXIS, interval: 0, height: 22, tickFormatter: shortSubmarket }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...COMMON_AXIS }),
    /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 12 }, iconSize: 9 }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "sfThis", name: "This Year", fill: "#1f2a4d", isAnimationActive: false, radius: [2, 2, 0, 0] }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "sfLast", name: "Last Year", fill: "#94a3b8", isAnimationActive: false, radius: [2, 2, 0, 0] })
  ] }) });
}
function HSizeBars({ data, color }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, layout: "vertical", margin: { top: 8, right: 52, bottom: 8, left: 8 }, barCategoryGap: 10, children: [
    /* @__PURE__ */ jsx(XAxis, { type: "number", tickFormatter: fmtSfShort, ...COMMON_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "name", width: 70, tick: { fontSize: 12, fill: "#475569" }, tickLine: false, axisLine: { stroke: "#cbd5e1" } }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "sf", fill: color, isAnimationActive: false, radius: [0, 3, 3, 0], barSize: 18, children: /* @__PURE__ */ jsx(LabelList, { dataKey: "sf", position: "right", formatter: fmtSfShort, style: { fontSize: 11, fill: "#334155" } }) })
  ] }) });
}
function VacancyBySizeChart({ data }) {
  return /* @__PURE__ */ jsx(HSizeBars, { data, color: "#e11d48" });
}
function UcBySizeChart({ data }) {
  return /* @__PURE__ */ jsx(HSizeBars, { data, color: "#f59e0b" });
}
function TopOwnersChart({ data }) {
  const ordered = [...data].reverse();
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: ordered, layout: "vertical", margin: { top: 6, right: 52, bottom: 6, left: 8 }, children: [
    /* @__PURE__ */ jsx(XAxis, { type: "number", tickFormatter: fmtSfShort, ...COMMON_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "name", width: 120, tick: { fontSize: 11, fill: "#475569" }, tickLine: { stroke: "#cbd5e1" }, axisLine: { stroke: "#cbd5e1" } }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "sf", fill: "#1f2a4d", isAnimationActive: false, barSize: 11, radius: [0, 2, 2, 0], children: /* @__PURE__ */ jsx(LabelList, { dataKey: "sf", position: "right", formatter: fmtSfShort, style: { fontSize: 11, fill: "#475569" } }) })
  ] }) });
}
var TopTenantsChart = TopOwnersChart;
var TopBuildingsByLeasingChart = TopOwnersChart;
function BuildingSizeChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 18, right: 16, bottom: 8, left: 16 }, children: [
    /* @__PURE__ */ jsx(XAxis, { dataKey: "name", ...COMMON_AXIS, interval: 0, height: 22 }),
    /* @__PURE__ */ jsx(YAxis, { ...COMMON_AXIS, allowDecimals: false }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "#4a7fc4", isAnimationActive: false, radius: [2, 2, 0, 0], children: /* @__PURE__ */ jsx(LabelList, { dataKey: "count", position: "top", style: { fontSize: 11, fill: "#334155" } }) })
  ] }) });
}
function VBar({ data, color, tickFmt }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 18, right: 16, bottom: 8, left: 16 }, children: [
    /* @__PURE__ */ jsx(XAxis, { dataKey: "name", ...COMMON_AXIS, interval: 0, height: 22, tickFormatter: tickFmt }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...COMMON_AXIS }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "sf", fill: color, isAnimationActive: false, radius: [3, 3, 0, 0], children: /* @__PURE__ */ jsx(LabelList, { dataKey: "sf", position: "top", formatter: fmtSfShort, style: { fontSize: 11, fill: "#334155" } }) })
  ] }) });
}
function SubmarketSfBarChart({ data }) {
  return /* @__PURE__ */ jsx(VBar, { data, color: "#4a7fc4", tickFmt: shortSubmarket });
}
function DeliveriesBySubmarketChart({ data }) {
  return /* @__PURE__ */ jsx(VBar, { data, color: "#10b981", tickFmt: shortSubmarket });
}
function DeliveriesByQuarterChart({ data }) {
  return /* @__PURE__ */ jsx(VBar, { data, color: "#10b981" });
}
function TrendsLeasingChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(ComposedChart, { data, margin: { top: 16, right: 16, bottom: 8, left: 8 }, children: [
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "quarter", ...TREND_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { yAxisId: "sf", tickFormatter: fmtSfShort, ...TREND_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { yAxisId: "ct", orientation: "right", ...TREND_AXIS }),
    /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 12 }, iconSize: 9 }),
    /* @__PURE__ */ jsx(Bar, { yAxisId: "sf", dataKey: "leasingSf", name: "Leased SF", fill: "#4a7fc4", isAnimationActive: false, radius: [3, 3, 0, 0] }),
    /* @__PURE__ */ jsx(Line, { yAxisId: "ct", type: "monotone", dataKey: "leasingCount", name: "Deals", stroke: "#f59e0b", strokeWidth: 2, dot: { r: 3 }, isAnimationActive: false })
  ] }) });
}
function TrendsVacancyRateChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data, margin: { top: 16, right: 16, bottom: 8, left: 8 }, children: [
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "quarter", ...TREND_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: (v) => (v * 100).toFixed(0) + "%", domain: [0, "auto"], ...TREND_AXIS }),
    /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "vacancyRate", name: "Vacancy Rate", stroke: "#e11d48", strokeWidth: 2.5, dot: { r: 3 }, isAnimationActive: false, connectNulls: true })
  ] }) });
}
function TrendsVacantTypeChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 16, right: 16, bottom: 8, left: 8 }, children: [
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "quarter", ...TREND_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...TREND_AXIS }),
    /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 12 }, iconSize: 9 }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "directVacantSf", name: "Direct", stackId: "v", fill: "#1f2a4d", isAnimationActive: false }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "subleaseSf", name: "Sublease", stackId: "v", fill: "#f59e0b", isAnimationActive: false, radius: [3, 3, 0, 0] })
  ] }) });
}
function TrendsAbsorptionChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 16, right: 16, bottom: 8, left: 8 }, children: [
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "quarter", ...TREND_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...TREND_AXIS }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "absorption", name: "Net SF", isAnimationActive: false, radius: [3, 3, 0, 0], children: data.map((row, i) => /* @__PURE__ */ jsx(Cell, { fill: (row.absorption ?? 0) < 0 ? "#e11d48" : "#10b981" }, i)) })
  ] }) });
}
function TrendsDeliveriesChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 18, right: 16, bottom: 8, left: 8 }, children: [
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "quarter", ...TREND_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...TREND_AXIS }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "deliveredSf", name: "Delivered SF", fill: "#10b981", isAnimationActive: false, radius: [3, 3, 0, 0], children: /* @__PURE__ */ jsx(LabelList, { dataKey: "deliveredSf", position: "top", formatter: fmtSfShort, style: { fontSize: 11, fill: "#334155" } }) })
  ] }) });
}
function TrendsSignedRateChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data, margin: { top: 16, right: 16, bottom: 8, left: 8 }, children: [
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "quarter", ...TREND_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: (v) => "$" + Number(v).toFixed(2), domain: ["auto", "auto"], ...TREND_AXIS }),
    /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "signedRate", name: "Avg Rate", stroke: "#8b5cf6", strokeWidth: 2.5, dot: { r: 3 }, isAnimationActive: false, connectNulls: true })
  ] }) });
}
function TrendsPipelineChart({ data }) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, margin: { top: 16, right: 16, bottom: 8, left: 8 }, children: [
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "quarter", ...TREND_AXIS }),
    /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtSfShort, ...TREND_AXIS }),
    /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 12 }, iconSize: 9 }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "ucSf", name: "Under Construction", stackId: "p", fill: "#f59e0b", isAnimationActive: false }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "proposedSf", name: "Proposed", stackId: "p", fill: "#4a7fc4", isAnimationActive: false, radius: [3, 3, 0, 0] })
  ] }) });
}
function ChartBox({ width, height, children }) {
  return /* @__PURE__ */ jsx("div", { style: { width: `${width}px`, height: `${height}px`, background: "#ffffff", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }, children });
}
var CHART_TITLE_H = 44;
function TitledChartBox({ width, height, title, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { width: `${width}px`, height: `${height}px`, background: "#ffffff", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }, children: [
    /* @__PURE__ */ jsx("div", { style: { flex: "0 0 auto", padding: "6px 14px 6px", fontSize: "15px", fontWeight: 700, color: "#1f2a4d", letterSpacing: "0.2px", lineHeight: 1.25 }, children: title }),
    /* @__PURE__ */ jsx("div", { style: { flex: "1 1 auto", minHeight: 0 }, children })
  ] });
}
export {
  BuildingSizeChart,
  CHART_TITLE_H,
  ChartBox,
  DeliveriesByQuarterChart,
  DeliveriesBySubmarketChart,
  LeasingByQuarterChart,
  LeasingBySubmarketChart,
  LeasingByTypeChart,
  LeasingYoYChart,
  LoadConfigPieChart,
  OwnershipChart,
  RateHistogramChart,
  StatusBarChart,
  SubmarketSfBarChart,
  SubmarketStackedBarChart,
  SupplyByStatusChart,
  TitledChartBox,
  TopBuildingsByLeasingChart,
  TopOwnersChart,
  TopTenantsChart,
  TrendsAbsorptionChart,
  TrendsDeliveriesChart,
  TrendsLeasingChart,
  TrendsPipelineChart,
  TrendsSignedRateChart,
  TrendsVacancyRateChart,
  TrendsVacantTypeChart,
  UcBySizeChart,
  VacancyByGenerationChart,
  VacancyBySizeChart,
  VacancyBySubmarketChart,
  VacancyRateBySubmarketChart,
  VacancyTypePieChart
};
