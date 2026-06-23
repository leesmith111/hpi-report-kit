// Centralized number/date formatters — the single source of truth shared by
// both apps' report output (vendored from ftw-cre-platform/src/utils/formatters).
// FTW imports these from the kit (Phase 3) so on-screen and report formatting
// can never diverge.

// Full numeric format with commas: 1234567 → "1,234,567"
export function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString();
}

// Compact SF format: 1250000 → "1.3M", 45000 → "45K"
export function fmtSf(n) {
  if (n == null) return '—';
  const num = Number(n);
  if (isNaN(num)) return '—';
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(0) + 'K';
  return num.toLocaleString();
}

// Currency with 2 decimals: 12.50 → "$12.50"
export function fmtCurrency(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Currency with no decimals: 12500000 → "$12,500,000"
export function fmtMoney(n) {
  if (n == null) return '—';
  return '$' + Math.round(Number(n)).toLocaleString();
}

// Percent: 0.0932 → "9.32%"
export function fmtPct(n, decimals = 2) {
  if (n == null) return '—';
  return (Number(n) * 100).toFixed(decimals) + '%';
}

// Alias for backward compat — pages used pct() with 1 decimal
export const pct = (n) => fmtPct(n, 1);

// Cap rate / occupancy are stored inconsistently — some rows as a fraction
// (0.0590 = 5.9%), some as a whole percent (5.10 = 5.1%). Normalize: magnitude
// ≤ 1 is treated as a fraction (×100), anything larger as already-percent.
export function fmtRatePct(v, decimals = 2) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const p = Math.abs(n) <= 1 ? n * 100 : n;
  return p.toFixed(decimals) + '%';
}

// Date: "2025-11-15" → "Nov 15, 2025"
// Date-only strings parse as UTC midnight in JS, which shifts back a day in
// negative-offset timezones (CST shows Nov 14 for "2025-11-15"). Parse the
// YYYY-MM-DD prefix manually as local time so the display matches what was entered.
export function fmtDate(d) {
  if (!d) return '—';
  if (typeof d === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    if (m) {
      const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Date-range filter test, comparing 'YYYY-MM-DD' prefixes as strings — never
// via new Date(), whose UTC-midnight parse shifts date-only values back a day
// in CST. No bounds → everything passes; a row with no date is EXCLUDED while a
// date range is active.
export function dateInRange(value, min, max) {
  if (!min && !max) return true;
  if (!value) return false;
  const d = String(value).slice(0, 10);
  if (min && d < String(min).slice(0, 10)) return false;
  if (max && d > String(max).slice(0, 10)) return false;
  return true;
}

// Annual rent bumps / escalations. Stored as free text. Display rule:
//   • contains "$"  → shown exactly as entered (explicit dollar escalation)
//   • numeric       → percent with 2 decimals (<1 treated as decimal)
//   • other text    → passed through unchanged ("TBD", "CPI", "-", etc.)
export function fmtBumps(val) {
  if (val == null) return '—';
  const s = String(val).trim();
  if (s === '') return '—';
  if (s.includes('$')) return s;
  const n = Number(s.replace(/%/g, '').trim());
  if (Number.isFinite(n) && /\d/.test(s)) {
    const p = Math.abs(n) < 1 ? n * 100 : n;
    return `${p.toFixed(2)}%`;
  }
  return s;
}

// Date with time: "2025-11-15T14:30:00Z" → "Nov 15, 2025, 2:30 PM"
export function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
