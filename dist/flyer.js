// src/flyer.js
var FLYER_W = 8.5;
var FLYER_H = 11;
var BASE = {
  ACCENT: "0071AD",
  // per-property brand color (Mark IV blue default)
  ACCENT_DARK: "164A73",
  // name-chip / darker companion
  INK: "3F4448",
  // body text dark gray
  GRAY: "787E85",
  // secondary text / light title word
  LIGHT: "F2F5F8",
  // light panel fill
  RULE: "D4D8DC",
  // spec-row underrules
  WHITE: "FFFFFF",
  FONT: "Montserrat",
  // referenced by name (house flyers' geometric sans); falls back if absent
  MX: 0.55,
  // side margin
  HEADER_H: 1.55,
  // interior-page photo band
  FOOTER_Y: 10.02
};
function flyerTheme(overrides = {}) {
  return { ...BASE, ...overrides };
}
function splitSpecs(specs, { charsPerLine = 26 } = {}) {
  const weight = (s) => 1 + (String(s?.[1] ?? "").length > charsPerLine ? 1 : 0);
  const total = specs.reduce((a, s) => a + weight(s), 0);
  const left = [];
  let acc = 0;
  for (const s of specs) {
    if (acc < total / 2) {
      left.push(s);
      acc += weight(s);
    } else break;
  }
  return [left, specs.slice(left.length)];
}
function rect(slide, x, y, w, h, color, opts = {}) {
  slide.addShape("rect", { x, y, w, h, fill: { color }, line: { type: "none" }, ...opts });
}
function text(slide, T, x, y, w, h, str, { size = 10, bold = false, color = T.INK, align = "left", valign = "middle", wrap = true, italic = false, charSpacing, hyperlink, lineSpacingMultiple = 1 } = {}) {
  slide.addText(
    [{ text: String(str ?? ""), options: { fontFace: T.FONT, fontSize: size, bold, italic, color, charSpacing, hyperlink } }],
    { x, y, w, h, align, valign, wrap, margin: 0, lineSpacingMultiple }
  );
}
function addSectionTitle(slide, T, boldWord, lightWord, { x = 0.6, y, size = 21 } = {}) {
  slide.addText([
    { text: String(boldWord).toUpperCase(), options: { fontFace: T.FONT, fontSize: size, bold: true, color: T.INK } },
    ...lightWord ? [{ text: ` ${String(lightWord).toUpperCase()}`, options: { fontFace: T.FONT, fontSize: size, bold: false, color: T.GRAY } }] : []
  ], { x, y, w: 6.5, h: 0.45, align: "left", valign: "middle", margin: 0, wrap: false });
}
function img(slide, data, x, y, w, h) {
  if (!data) return;
  slide.addImage({ data, x, y, w, h, sizing: { type: "contain", w, h } });
}
async function createFlyerDeck({ author = "HPI" } = {}) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const deck = new PptxGenJS();
  deck.defineLayout({ name: "HPI_FLYER", width: FLYER_W, height: FLYER_H });
  deck.layout = "HPI_FLYER";
  deck.author = author;
  deck.company = "HPI";
  return deck;
}
function addFlyerFooter(slide, T, { leasedByLogo, contacts = [], ownedByLogo, leasedByLabel = "LEASED BY", contactLabel = "CONTACT", ownedByLabel = "OWNED BY" } = {}) {
  const y = T.FOOTER_Y;
  text(slide, T, T.MX, y, 1.6, 0.2, leasedByLabel, { size: 9, bold: true, color: T.ACCENT, valign: "top" });
  img(slide, leasedByLogo, T.MX, y + 0.24, 1.55, 0.55);
  text(slide, T, 2.35, y, 1.2, 0.2, contactLabel, { size: 9, bold: true, color: T.ACCENT, valign: "top" });
  contacts.slice(0, 3).forEach((c, i) => {
    slide.addText([
      { text: `${c.name}`, options: { fontFace: T.FONT, fontSize: 8.5, bold: true, color: T.INK } },
      { text: ` | ${[c.phone, c.email].filter(Boolean).join(" | ")}`, options: { fontFace: T.FONT, fontSize: 8.5, color: T.INK } }
    ], { x: 2.35, y: y + 0.24 + i * 0.21, w: 4.1, h: 0.2, align: "left", valign: "middle", margin: 0, wrap: false });
  });
  if (ownedByLogo) {
    text(slide, T, 6.65, y, 1.3, 0.2, ownedByLabel, { size: 9, bold: true, color: T.ACCENT, valign: "top" });
    img(slide, ownedByLogo, 6.65, y + 0.24, 1.3, 0.55);
  }
}
function nameChip(slide, T, name, { x, y, w, h, size = 13 }) {
  slide.addText(String(name).toUpperCase(), {
    x,
    y,
    w,
    h,
    shape: "rect",
    fill: { color: T.ACCENT_DARK },
    line: { type: "none" },
    fontFace: T.FONT,
    fontSize: size,
    bold: true,
    color: T.WHITE,
    align: "center",
    valign: "middle",
    margin: [4, 6, 4, 6],
    lineSpacingMultiple: 1.05
  });
}
function addressBar(slide, T, address, { x, y, w, h = 0.32, size = 10 }) {
  slide.addText(String(address).toUpperCase(), {
    x,
    y,
    w,
    h,
    shape: "rect",
    fill: { color: T.ACCENT },
    line: { type: "none" },
    fontFace: T.FONT,
    fontSize: size,
    bold: false,
    color: T.WHITE,
    align: "center",
    valign: "middle",
    margin: 0,
    wrap: false
  });
}
function addFlyerPage(deck, { theme, name, address, headerPhoto, footer }) {
  const T = theme;
  const s = deck.addSlide();
  s.background = { color: T.WHITE };
  if (headerPhoto) {
    s.addImage({ data: headerPhoto, x: 0, y: 0, w: FLYER_W, h: T.HEADER_H, sizing: { type: "cover", w: FLYER_W, h: T.HEADER_H } });
  } else {
    rect(s, 0, 0, FLYER_W, T.HEADER_H, T.LIGHT);
  }
  nameChip(s, T, name, { x: 0.32, y: 0.26, w: 1.95, h: 1 });
  if (address) addressBar(s, T, address, { x: 2.62, y: 0.26, w: 5.55 });
  if (footer) addFlyerFooter(s, T, footer);
  return s;
}
function addFlyerCover(deck, { theme, name, address, photo, saleLine = "FOR LEASE", subLine, features = [], featuresTitle = ["PROPERTY", "FEATURES"], locatorImage, footer }) {
  const T = theme;
  const s = deck.addSlide();
  s.background = { color: T.WHITE };
  const photoH = 6.15;
  if (photo) s.addImage({ data: photo, x: 0, y: 0, w: FLYER_W, h: photoH, sizing: { type: "cover", w: FLYER_W, h: photoH } });
  else rect(s, 0, 0, FLYER_W, photoH, T.LIGHT);
  nameChip(s, T, name, { x: 0.3, y: 0.34, w: 2.55, h: 1.35, size: 17 });
  rect(s, 0.42, 4.92, 0.07, 1, T.ACCENT);
  slide_banner(s, T, saleLine, subLine);
  if (address) addressBar(s, T, address, { x: 0.75, y: 5.98, w: 5.9, h: 0.34 });
  addSectionTitle(s, T, featuresTitle[0], featuresTitle[1], { x: 0.6, y: 6.55 });
  features.slice(0, 8).forEach((f, i) => {
    slide_bullet(s, T, f, 0.66, 7.08 + i * 0.36, 3.85);
  });
  img(s, locatorImage, 4.65, 6.55, 3.3, 3.15);
  if (footer) addFlyerFooter(s, T, footer);
  return s;
}
function slide_banner(s, T, saleLine, subLine) {
  s.addText([
    { text: String(saleLine).toUpperCase(), options: { fontFace: T.FONT, fontSize: 26, bold: true, color: T.WHITE, breakLine: true } },
    ...subLine ? [{ text: String(subLine).toUpperCase(), options: { fontFace: T.FONT, fontSize: 20, bold: true, color: T.WHITE } }] : []
  ], { x: 0.62, y: 4.86, w: 7.5, h: 1.05, align: "left", valign: "middle", margin: 0, lineSpacingMultiple: 1.05, shadow: { type: "outer", blur: 3, offset: 1, angle: 45, color: "000000", opacity: 0.45 } });
}
function slide_bullet(s, T, str, x, y, w) {
  s.addText([
    { text: "\u2022  ", options: { fontFace: T.FONT, fontSize: 10.5, bold: true, color: T.ACCENT } },
    { text: String(str), options: { fontFace: T.FONT, fontSize: 10.5, bold: true, color: T.INK } }
  ], { x, y, w, h: 0.36, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1 });
}
function addFlyerSpecsPage(deck, { theme, name, address, headerPhoto, footer, title = ["PROPERTY", "OVERVIEW"], specs = [], photo }) {
  const T = theme;
  const s = addFlyerPage(deck, { theme, name, address, headerPhoto, footer });
  addSectionTitle(s, T, title[0], title[1], { y: 1.92 });
  const [left, right] = splitSpecs(specs);
  const colX = [0.6, 4.45], colW = 3.55, labelW = 1.55;
  const top = 2.5;
  const long = (v) => String(v ?? "").length > 26;
  ;
  [left, right].forEach((col, ci) => {
    let y = top;
    for (const [label, value] of col) {
      const rh = long(value) ? 0.52 : 0.32;
      text(s, T, colX[ci], y, labelW, rh, label, { size: 10, bold: true, color: T.ACCENT });
      text(s, T, colX[ci] + labelW + 0.1, y, colW - labelW - 0.1, rh, value, { size: 10, color: T.INK });
      rect(s, colX[ci], y + rh + 0.02, colW, 0.012, T.RULE);
      y += rh + 0.09;
    }
  });
  const maxRows = Math.max(left.length, right.length);
  const photoTop = top + maxRows * 0.45 + 0.25;
  if (photo) {
    s.addImage({ data: photo, x: 0, y: Math.min(photoTop, 6.4), w: FLYER_W, h: T.FOOTER_Y - 0.25 - Math.min(photoTop, 6.4), sizing: { type: "cover", w: FLYER_W, h: T.FOOTER_Y - 0.25 - Math.min(photoTop, 6.4) } });
  }
  return s;
}
function addFlyerImagePage(deck, { theme, name, address, headerPhoto, footer, title, image, cta, bullets = [] }) {
  const T = theme;
  const s = addFlyerPage(deck, { theme, name, address, headerPhoto, footer });
  addSectionTitle(s, T, title[0], title[1], { y: 1.92 });
  if (cta?.text) {
    s.addText(String(cta.text).toUpperCase(), {
      x: 5.35,
      y: 1.95,
      w: 2.8,
      h: 0.38,
      shape: "rect",
      fill: { color: T.ACCENT },
      line: { type: "none" },
      fontFace: T.FONT,
      fontSize: 11,
      bold: false,
      color: T.WHITE,
      align: "center",
      valign: "middle",
      margin: 0,
      ...cta.url ? { hyperlink: { url: cta.url } } : {}
    });
  }
  img(s, image, 0.32, 2.5, FLYER_W - 0.64, T.FOOTER_Y - 0.3 - 2.5);
  if (bullets.length) {
    const bh = Math.min(0.34 * bullets.length + 0.24, 3.2);
    const by = T.FOOTER_Y - 0.45 - bh;
    rect(s, 0.5, by, 3.35, bh, T.ACCENT, { transparency: 8 });
    bullets.slice(0, 8).forEach((b, i) => {
      s.addText([
        { text: "\u2022  ", options: { fontFace: T.FONT, fontSize: 8.5, bold: true, color: T.WHITE } },
        { text: String(b), options: { fontFace: T.FONT, fontSize: 8.5, bold: true, color: T.WHITE } }
      ], { x: 0.62, y: by + 0.12 + i * 0.34, w: 3.15, h: 0.34, align: "left", valign: "top", margin: 0 });
    });
  }
  return s;
}
function addFlyerDisclosurePage(deck, { theme, image }) {
  const T = theme || BASE;
  const s = deck.addSlide();
  s.background = { color: T.WHITE };
  img(s, image, 0.4, 0.4, FLYER_W - 0.8, FLYER_H - 0.8);
  return s;
}
export {
  FLYER_H,
  FLYER_W,
  addFlyerCover,
  addFlyerDisclosurePage,
  addFlyerFooter,
  addFlyerImagePage,
  addFlyerPage,
  addFlyerSpecsPage,
  addSectionTitle,
  createFlyerDeck,
  flyerTheme,
  splitSpecs
};
