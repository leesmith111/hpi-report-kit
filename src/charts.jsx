// Export-only chart components (pure: no drill-downs, tooltips, or animation) so
// they render deterministically inside snapshot's off-screen tree, then
// html2canvas grabs the painted SVG. Each accepts already-aggregated data (see
// ./aggregate) and a fixed width/height from the host box. Vendored from
// ftw-cre-platform exportCharts.jsx (the component half).

import { BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer, Cell, PieChart, Pie, LabelList, Line, LineChart, ComposedChart, CartesianGrid } from 'recharts';

const STATUS_COLORS = {
  'Existing':           '#1f2a4d',
  'Under Construction': '#f59e0b',
  'Proposed':           '#4a7fc4',
};
const LOAD_COLORS = {
  Cross:   '#1f2a4d',
  Front:   '#4a7fc4',
  Rear:    '#f59e0b',
  Side:    '#94a3b8',
  'N/A':   '#cbd5e1',
  Unknown: '#e2e8f0',
};
const VACANCY_TYPE_COLORS = {
  '1st GEN':  '#1f2a4d',
  '2nd GEN':  '#94a3b8',
  Sublease:   '#f59e0b',
  Unknown:    '#cbd5e1',
};
const GEN_COLORS = { '1st GEN': '#1f2a4d', '2nd GEN': '#94a3b8' };
const LEASE_COLORS = { New: '#1f2a4d', Renewal: '#4a7fc4', Expansion: '#8b5cf6', Sublease: '#f59e0b', 'Owner User': '#db2777' };
const OWNER_COLORS = { Institutional: '#1f2a4d', 'Local / Private': '#4a7fc4', Unspecified: '#94a3b8' };

function fmtSfShort(n) {
  if (n == null || !Number.isFinite(n)) return '';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return Math.round(n / 1_000) + 'K';
  return String(Math.round(n));
}

function shortSubmarket(name) {
  if (!name) return '';
  const s = String(name);
  if (s === 'North Fort Worth') return 'North FW';
  if (s === 'South Fort Worth') return 'South FW';
  if (s === 'East Fort Worth')  return 'East FW';
  if (s === 'NE Tarrant / Alliance') return 'NE Tarrant';
  if (s.includes(' / ')) return s.split(' / ')[0];
  return s.length > 14 ? s.slice(0, 12) + '…' : s;
}

const COMMON_AXIS = {
  stroke: '#cbd5e1',
  tick: { fontSize: 12, fill: '#475569' },
  tickLine: { stroke: '#cbd5e1' },
  axisLine: { stroke: '#cbd5e1' },
};
const TREND_AXIS = { stroke: '#cbd5e1', tick: { fontSize: 11, fill: '#475569' }, tickLine: { stroke: '#cbd5e1' }, axisLine: { stroke: '#cbd5e1' } };

export function StatusBarChart({ data }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: '1 1 60%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 12, bottom: 8, left: 16 }}>
            <XAxis dataKey="name" {...COMMON_AXIS} interval={0} tickFormatter={n => n === 'Under Construction' ? 'UC' : n} />
            <YAxis tickFormatter={fmtSfShort} {...COMMON_AXIS} />
            <Bar dataKey="sf" isAnimationActive={false} radius={[3, 3, 0, 0]}>
              {data.map((d, i) => <Cell key={i} fill={STATUS_COLORS[d.name] || '#94a3b8'} />)}
              <LabelList dataKey="sf" position="top" formatter={fmtSfShort} style={{ fontSize: 11, fill: '#334155' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ flex: '0 0 36%', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: STATUS_COLORS[d.name] || '#94a3b8', flexShrink: 0 }} />
              <span style={{ color: '#1e293b', fontWeight: 500 }}>{d.name}</span>
            </div>
            <div style={{ paddingLeft: '18px', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
              {(d.count || 0).toLocaleString()} {d.count === 1 ? 'bldg' : 'bldgs'} · {fmtSfShort(d.sf)} SF
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SubmarketStackedBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 16 }} layout="horizontal">
        <XAxis dataKey="name" {...COMMON_AXIS} interval={0} height={22} tickFormatter={shortSubmarket} />
        <YAxis tickFormatter={fmtSfShort} {...COMMON_AXIS} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconSize={9} />
        <Bar dataKey="Existing"           stackId="s" fill={STATUS_COLORS.Existing}             isAnimationActive={false} />
        <Bar dataKey="Under Construction" stackId="s" fill={STATUS_COLORS['Under Construction']} isAnimationActive={false} />
        <Bar dataKey="Proposed"           stackId="s" fill={STATUS_COLORS.Proposed}             isAnimationActive={false} radius={[3, 3, 0, 0]}>
          <LabelList dataKey="total" position="top" formatter={fmtSfShort} style={{ fontSize: 11, fill: '#334155' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutWithLegend({ data, colors }) {
  const total = data.reduce((s, d) => s + (Number(d.sf) || 0), 0);
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: '0 0 50%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="sf" nameKey="name" cx="50%" cy="50%" innerRadius="45%" outerRadius="85%" paddingAngle={1.5} stroke="#ffffff" strokeWidth={2} isAnimationActive={false}>
              {data.map((d, i) => <Cell key={i} fill={colors[d.name] || '#cbd5e1'} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
        {data.map(d => {
          const pct = total > 0 ? (Number(d.sf) / total) * 100 : 0;
          return (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: colors[d.name] || '#cbd5e1', flexShrink: 0 }} />
              <span style={{ flex: 1, color: '#1e293b', fontWeight: 500 }}>{d.name}</span>
              <span style={{ color: '#475569', fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</span>
              <span style={{ color: '#94a3b8', fontSize: '12px', fontVariantNumeric: 'tabular-nums', minWidth: '44px', textAlign: 'right' }}>{fmtSfShort(d.sf)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LoadConfigPieChart({ data }) { return <DonutWithLegend data={data} colors={LOAD_COLORS} />; }
export function VacancyTypePieChart({ data }) { return <DonutWithLegend data={data} colors={VACANCY_TYPE_COLORS} />; }
export function VacancyByGenerationChart({ data }) { return <DonutWithLegend data={data} colors={GEN_COLORS} />; }
export function SupplyByStatusChart({ data }) { return <DonutWithLegend data={data} colors={STATUS_COLORS} />; }
export function OwnershipChart({ data }) { return <DonutWithLegend data={data} colors={OWNER_COLORS} />; }
export function LeasingByTypeChart({ data }) { return <DonutWithLegend data={data} colors={LEASE_COLORS} />; }

export function RateHistogramChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 16 }}>
        <XAxis dataKey="label" {...COMMON_AXIS} interval={0} height={22} />
        <YAxis {...COMMON_AXIS} allowDecimals={false} />
        <Bar dataKey="count" fill="#4a7fc4" isAnimationActive={false} radius={[2, 2, 0, 0]}>
          <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: '#334155' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VacancyBySubmarketChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 16 }} barGap={2} barCategoryGap={20}>
        <XAxis dataKey="name" {...COMMON_AXIS} interval={0} height={22} tickFormatter={shortSubmarket} />
        <YAxis tickFormatter={fmtSfShort} {...COMMON_AXIS} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconSize={9} />
        <Bar dataKey="direct" name="Direct" fill="#1f2a4d" isAnimationActive={false} radius={[2, 2, 0, 0]} />
        <Bar dataKey="sublease" name="Sublease" fill="#f59e0b" isAnimationActive={false} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VacancyRateBySubmarketChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 16 }} barGap={2} barCategoryGap={20}>
        <XAxis dataKey="name" {...COMMON_AXIS} interval={0} height={22} tickFormatter={shortSubmarket} />
        <YAxis tickFormatter={v => `${v.toFixed(0)}%`} {...COMMON_AXIS} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconSize={9} />
        <Bar dataKey="direct" name="Direct" fill="#1f2a4d" isAnimationActive={false} radius={[2, 2, 0, 0]} />
        <Bar dataKey="sublease" name="Sublease" fill="#f59e0b" isAnimationActive={false} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LeasingByQuarterChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 18, right: 16, bottom: 8, left: 16 }}>
        <XAxis dataKey="name" {...COMMON_AXIS} interval={0} height={22} />
        <YAxis tickFormatter={fmtSfShort} {...COMMON_AXIS} />
        <Bar dataKey="sf" fill="#4a7fc4" isAnimationActive={false} radius={[2, 2, 0, 0]}>
          <LabelList dataKey="sf" position="top" formatter={fmtSfShort} style={{ fontSize: 11, fill: '#334155' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LeasingBySubmarketChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 12, right: 40, bottom: 12, left: 8 }}>
        <XAxis type="number" tickFormatter={fmtSfShort} {...COMMON_AXIS} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} tickLine={{ stroke: '#cbd5e1' }} axisLine={{ stroke: '#cbd5e1' }} width={140} tickFormatter={t => t.length > 18 ? t.split(' / ')[0] : t} />
        <Bar dataKey="sf" fill="#4a7fc4" isAnimationActive={false} barSize={16} radius={[0, 2, 2, 0]}>
          <LabelList dataKey="sf" position="right" formatter={fmtSfShort} style={{ fontSize: 11, fill: '#475569' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LeasingYoYChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 18, right: 16, bottom: 8, left: 16 }} barGap={2} barCategoryGap={20}>
        <XAxis dataKey="name" {...COMMON_AXIS} interval={0} height={22} tickFormatter={shortSubmarket} />
        <YAxis tickFormatter={fmtSfShort} {...COMMON_AXIS} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconSize={9} />
        <Bar dataKey="sfThis" name="This Year" fill="#1f2a4d" isAnimationActive={false} radius={[2, 2, 0, 0]} />
        <Bar dataKey="sfLast" name="Last Year" fill="#94a3b8" isAnimationActive={false} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function HSizeBars({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 52, bottom: 8, left: 8 }} barCategoryGap={10}>
        <XAxis type="number" tickFormatter={fmtSfShort} {...COMMON_AXIS} />
        <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: '#475569' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
        <Bar dataKey="sf" fill={color} isAnimationActive={false} radius={[0, 3, 3, 0]} barSize={18}>
          <LabelList dataKey="sf" position="right" formatter={fmtSfShort} style={{ fontSize: 11, fill: '#334155' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
export function VacancyBySizeChart({ data }) { return <HSizeBars data={data} color="#e11d48" />; }
export function UcBySizeChart({ data }) { return <HSizeBars data={data} color="#f59e0b" />; }

export function TopOwnersChart({ data }) {
  const ordered = [...data].reverse();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={ordered} layout="vertical" margin={{ top: 6, right: 52, bottom: 6, left: 8 }}>
        <XAxis type="number" tickFormatter={fmtSfShort} {...COMMON_AXIS} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#475569' }} tickLine={{ stroke: '#cbd5e1' }} axisLine={{ stroke: '#cbd5e1' }} />
        <Bar dataKey="sf" fill="#1f2a4d" isAnimationActive={false} barSize={11} radius={[0, 2, 2, 0]}>
          <LabelList dataKey="sf" position="right" formatter={fmtSfShort} style={{ fontSize: 11, fill: '#475569' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
// Top tenants / top buildings share TopOwnersChart's horizontal look.
export const TopTenantsChart = TopOwnersChart;
export const TopBuildingsByLeasingChart = TopOwnersChart;

export function BuildingSizeChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 18, right: 16, bottom: 8, left: 16 }}>
        <XAxis dataKey="name" {...COMMON_AXIS} interval={0} height={22} />
        <YAxis {...COMMON_AXIS} allowDecimals={false} />
        <Bar dataKey="count" fill="#4a7fc4" isAnimationActive={false} radius={[2, 2, 0, 0]}>
          <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: '#334155' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Vertical SF-by-name bar (data: { name, sf }).
function VBar({ data, color, tickFmt }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 18, right: 16, bottom: 8, left: 16 }}>
        <XAxis dataKey="name" {...COMMON_AXIS} interval={0} height={22} tickFormatter={tickFmt} />
        <YAxis tickFormatter={fmtSfShort} {...COMMON_AXIS} />
        <Bar dataKey="sf" fill={color} isAnimationActive={false} radius={[3, 3, 0, 0]}>
          <LabelList dataKey="sf" position="top" formatter={fmtSfShort} style={{ fontSize: 11, fill: '#334155' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
export function SubmarketSfBarChart({ data }) { return <VBar data={data} color="#4a7fc4" tickFmt={shortSubmarket} />; }
export function DeliveriesBySubmarketChart({ data }) { return <VBar data={data} color="#10b981" tickFmt={shortSubmarket} />; }
export function DeliveriesByQuarterChart({ data }) { return <VBar data={data} color="#10b981" />; }

// ───────────────────────── Trends (data = quarterly time series) ──
export function TrendsLeasingChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="quarter" {...TREND_AXIS} />
        <YAxis yAxisId="sf" tickFormatter={fmtSfShort} {...TREND_AXIS} />
        <YAxis yAxisId="ct" orientation="right" {...TREND_AXIS} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconSize={9} />
        <Bar yAxisId="sf" dataKey="leasingSf" name="Leased SF" fill="#4a7fc4" isAnimationActive={false} radius={[3, 3, 0, 0]} />
        <Line yAxisId="ct" type="monotone" dataKey="leasingCount" name="Deals" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function TrendsVacancyRateChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="quarter" {...TREND_AXIS} />
        <YAxis tickFormatter={v => (v * 100).toFixed(0) + '%'} domain={[0, 'auto']} {...TREND_AXIS} />
        <Line type="monotone" dataKey="vacancyRate" name="Vacancy Rate" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendsVacantTypeChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="quarter" {...TREND_AXIS} />
        <YAxis tickFormatter={fmtSfShort} {...TREND_AXIS} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconSize={9} />
        <Bar dataKey="directVacantSf" name="Direct" stackId="v" fill="#1f2a4d" isAnimationActive={false} />
        <Bar dataKey="subleaseSf" name="Sublease" stackId="v" fill="#f59e0b" isAnimationActive={false} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendsAbsorptionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="quarter" {...TREND_AXIS} />
        <YAxis tickFormatter={fmtSfShort} {...TREND_AXIS} />
        <Bar dataKey="absorption" name="Net SF" isAnimationActive={false} radius={[3, 3, 0, 0]}>
          {data.map((row, i) => <Cell key={i} fill={(row.absorption ?? 0) < 0 ? '#e11d48' : '#10b981'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendsDeliveriesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 18, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="quarter" {...TREND_AXIS} />
        <YAxis tickFormatter={fmtSfShort} {...TREND_AXIS} />
        <Bar dataKey="deliveredSf" name="Delivered SF" fill="#10b981" isAnimationActive={false} radius={[3, 3, 0, 0]}>
          <LabelList dataKey="deliveredSf" position="top" formatter={fmtSfShort} style={{ fontSize: 11, fill: '#334155' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendsSignedRateChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="quarter" {...TREND_AXIS} />
        <YAxis tickFormatter={v => '$' + Number(v).toFixed(2)} domain={['auto', 'auto']} {...TREND_AXIS} />
        <Line type="monotone" dataKey="signedRate" name="Avg Rate" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendsPipelineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="quarter" {...TREND_AXIS} />
        <YAxis tickFormatter={fmtSfShort} {...TREND_AXIS} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconSize={9} />
        <Bar dataKey="ucSf" name="Under Construction" stackId="p" fill="#f59e0b" isAnimationActive={false} />
        <Bar dataKey="proposedSf" name="Proposed" stackId="p" fill="#4a7fc4" isAnimationActive={false} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ───────────────────────── Layout wrappers for the off-screen host ──
export function ChartBox({ width, height, children }) {
  return (
    <div style={{ width: `${width}px`, height: `${height}px`, background: '#ffffff', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      {children}
    </div>
  );
}

// Height of the baked-in chart title strip (px). Chart keeps full height; the
// title adds on top so the PNG = title + chart as one image.
export const CHART_TITLE_H = 44;

export function TitledChartBox({ width, height, title, children }) {
  return (
    <div style={{ width: `${width}px`, height: `${height}px`, background: '#ffffff', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <div style={{ flex: '0 0 auto', padding: '6px 14px 6px', fontSize: '15px', fontWeight: 700, color: '#1f2a4d', letterSpacing: '0.2px', lineHeight: 1.25 }}>{title}</div>
      <div style={{ flex: '1 1 auto', minHeight: 0 }}>{children}</div>
    </div>
  );
}
