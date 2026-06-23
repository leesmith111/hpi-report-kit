// src/canon.js
var CANONICAL_MAP = {
  // NE Tarrant / Alliance
  "Alliance": "NE Tarrant / Alliance",
  "NE Tarrant/Alliance": "NE Tarrant / Alliance",
  "NE Tarrant / Alliance": "NE Tarrant / Alliance",
  // North Fort Worth
  "North Fort Worth": "North Fort Worth",
  "Meacham Fld/Fossil Cr": "North Fort Worth",
  "N Central Fort Worth": "North Fort Worth",
  "N Central Ft Worth": "North Fort Worth",
  // South Fort Worth
  "South Fort Worth": "South Fort Worth",
  "East Fort Worth": "South Fort Worth",
  "East Ft Worth": "South Fort Worth",
  "Mansfield": "South Fort Worth",
  "S Central Tarrant County": "South Fort Worth",
  "S Cen. Tarrant Cnty": "South Fort Worth",
  "S Central Fort Worth": "South Fort Worth",
  // West Fort Worth
  "West Fort Worth": "West Fort Worth",
  "West Tarrant": "West Fort Worth",
  "Southwest Tarrant": "West Fort Worth",
  "SW Tarrant": "West Fort Worth",
  // Great SW / Arlington
  "Great SW/Arlington": "Great SW/Arlington",
  "Great Southwest/Arlington": "Great SW/Arlington",
  "Great Southwest / Arlington": "Great SW/Arlington",
  "Great SW / Arlington": "Great SW/Arlington",
  "GSW/Arlington": "Great SW/Arlington",
  "Great SW Ind": "Great SW/Arlington",
  "Arlington": "Great SW/Arlington",
  "Grand Prairie": "Great SW/Arlington",
  // DFW Airport
  "DFW Airport": "DFW Airport",
  "DFW Airport Ind": "DFW Airport",
  "D/FW Airport": "DFW Airport",
  "DFW Airport/Grapevine": "DFW Airport",
  "Grapevine": "DFW Airport",
  "Euless": "DFW Airport",
  "Coppell": "DFW Airport"
};
function toCanonicalSubmarket(s) {
  if (s == null) return s;
  const trimmed = String(s).trim();
  return CANONICAL_MAP[trimmed] || trimmed;
}
export {
  CANONICAL_MAP,
  toCanonicalSubmarket
};
