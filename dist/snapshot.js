// src/snapshot.js
var RENDER_SETTLE_MS = 180;
async function renderChartToPng(node, { width = 700, height = 360, backgroundColor = "#ffffff", scale = 3 } = {}) {
  const { createRoot } = await import("react-dom/client");
  const { default: html2canvas } = await import("html2canvas");
  const host = document.createElement("div");
  Object.assign(host.style, {
    position: "fixed",
    left: "-99999px",
    top: "0",
    width: `${width}px`,
    height: `${height}px`,
    background: backgroundColor,
    zIndex: "-1"
  });
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(node);
    await new Promise((r) => setTimeout(r, RENDER_SETTLE_MS));
    const canvas = await html2canvas(host, {
      useCORS: true,
      backgroundColor,
      scale,
      logging: false,
      windowWidth: width,
      windowHeight: height
    });
    return canvas.toDataURL("image/png");
  } finally {
    root.unmount();
    host.remove();
  }
}
async function renderChartsSequential(specs) {
  const out = [];
  for (const spec of specs) {
    const png = await renderChartToPng(spec.node, spec);
    out.push({ ...spec, png });
  }
  return out;
}
export {
  renderChartToPng,
  renderChartsSequential
};
