// src/format.js
function fmt(n) {
  if (n == null) return "\u2014";
  return Number(n).toLocaleString();
}
function fmtSf(n) {
  if (n == null) return "\u2014";
  const num = Number(n);
  if (isNaN(num)) return "\u2014";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(0) + "K";
  return num.toLocaleString();
}
function fmtCurrency(n) {
  if (n == null) return "\u2014";
  return "$" + Number(n).toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtMoney(n) {
  if (n == null) return "\u2014";
  return "$" + Math.round(Number(n)).toLocaleString();
}
function fmtPct(n, decimals = 2) {
  if (n == null) return "\u2014";
  return (Number(n) * 100).toFixed(decimals) + "%";
}
var pct = (n) => fmtPct(n, 1);
function fmtRatePct(v, decimals = 2) {
  if (v == null || v === "") return "\u2014";
  const n = Number(v);
  if (!Number.isFinite(n)) return "\u2014";
  const p = Math.abs(n) <= 1 ? n * 100 : n;
  return p.toFixed(decimals) + "%";
}
function fmtDate(d) {
  if (!d) return "\u2014";
  if (typeof d === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    if (m) {
      const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function dateInRange(value, min, max) {
  if (!min && !max) return true;
  if (!value) return false;
  const d = String(value).slice(0, 10);
  if (min && d < String(min).slice(0, 10)) return false;
  if (max && d > String(max).slice(0, 10)) return false;
  return true;
}
function fmtBumps(val) {
  if (val == null) return "\u2014";
  const s = String(val).trim();
  if (s === "") return "\u2014";
  if (s.includes("$")) return s;
  const n = Number(s.replace(/%/g, "").trim());
  if (Number.isFinite(n) && /\d/.test(s)) {
    const p = Math.abs(n) < 1 ? n * 100 : n;
    return `${p.toFixed(2)}%`;
  }
  return s;
}
function fmtDateTime(d) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
export {
  dateInRange,
  fmt,
  fmtBumps,
  fmtCurrency,
  fmtDate,
  fmtDateTime,
  fmtMoney,
  fmtPct,
  fmtRatePct,
  fmtSf,
  pct
};
