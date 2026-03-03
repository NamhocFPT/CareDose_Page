// CareDose Traffic Dashboard (GitHub Pages friendly)
// Real data via GoatCounter visitor-counter JSON endpoints (no DB needed).
//
// Setup:
// 1) Create a site at https://goatcounter.com (hosted is free).
// 2) In GoatCounter site settings, enable: “Allow adding visitor counts on your website”
//    (required for /counter/*.json endpoints).
// 3) In analytics.html, set: window.CAREDOSE_GOATCOUNTER_CODE = "YOURCODE"
//
// Notes:
// - GoatCounter visitor-counter returns *pageview counts* (not unique visitors).
// - The /counter endpoint is cached ~30 minutes, so numbers won't update instantly.

const fmt = (n) => (Number(n) || 0).toLocaleString("en-US");

/** Parse GoatCounter's JSON count string (e.g. "12,345") into number */
function parseCountString(countStr) {
  if (typeof countStr === "number") return countStr;
  if (!countStr) return 0;
  return Number(String(countStr).replaceAll(",", "").replaceAll(" ", "")) || 0;
}

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function shortLabel(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function getGoatCode() {
  const code = window.CAREDOSE_GOATCOUNTER_CODE;
  if (!code || code === "YOUR_GOATCOUNTER_CODE") return null;
  return code;
}

function counterUrl(code, path, { start, end } = {}) {
  // path must include leading "/" or be "TOTAL" (case-sensitive)
  const base = `https://${code}.goatcounter.com/counter/`;
  const encPath = encodeURIComponent(path);
  const url = new URL(`${base}${encPath}.json`);
  if (start) url.searchParams.set("start", start);
  if (end) url.searchParams.set("end", end);
  return url.toString();
}

async function fetchCount(code, path, { start, end } = {}) {
  const url = counterUrl(code, path, { start, end });
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return 0; // no views yet
    throw new Error(`GoatCounter fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return parseCountString(data.count);
}

/**
 * Build daily series for N days ending today (inclusive).
 * We query each day using start=end=YYYY-MM-DD (public counter supports start/end).
 */
async function buildDailySeries(code, days) {
  const today = new Date();
  const startDate = addDays(today, -(days - 1));
  const series = [];

  // Sequential requests (small N: 7 or 30)
  for (let i = 0; i < days; i++) {
    const d = addDays(startDate, i);
    const iso = toISODate(d);
    const c = await fetchCount(code, "TOTAL", { start: iso, end: iso });
    series.push({ date: shortLabel(d), pageviews: c });
  }
  return series;
}

function sumSeries(series) {
  return series.reduce((acc, x) => acc + (Number(x.pageviews) || 0), 0);
}

function setText(sel, value) {
  const el = document.querySelector(sel);
  if (el) el.textContent = value;
}

function setLoading(isLoading) {
  const el = document.getElementById("loading");
  if (!el) return;
  el.style.display = isLoading ? "inline-flex" : "none";
}

function showBanner(show) {
  const el = document.getElementById("gcBanner");
  if (!el) return;
  el.style.display = show ? "block" : "none";
}

function setKpiFromSeries(range, series, allTime) {
  const totalRange = sumSeries(series);
  const avgPerDay = totalRange / Math.max(1, series.length);

  // Map to existing KPI slots in analytics.html
  setText("#kpi-total", fmt(totalRange));          // Total Visits (range)
  setText("#kpi-unique", fmt(allTime));            // All‑time Visits
  setText("#kpi-time", fmt(Math.round(avgPerDay)));// Avg Visits / Day
  setText("#kpi-ref", (range === "7" ? "Last 7 days" : "Last 30 days") + " • GoatCounter public counter JSON");
}
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width));
  const cssH = Math.max(1, Math.round(rect.height));

  // set internal buffer size
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
  return ctx;
}

function drawLineChartFromSeries(series) {
  const canvas = document.getElementById("lineChart");
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;
  ctx.clearRect(0, 0, w, h);
  const padL = 40, padR = 16, padT = 16, padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const maxV = Math.max(...series.map(d => d.pageviews), 1);

  // Axes
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, h - padB);
  ctx.lineTo(w - padR, h - padB);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Line
  ctx.beginPath();
  series.forEach((d, i) => {
    const x = padL + (i * plotW) / Math.max(1, series.length - 1);
    const y = padT + (1 - d.pageviews / maxV) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineWidth = 2;
  ctx.stroke();

  // Labels: first/mid/last
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.globalAlpha = 0.8;
  const idxs = [0, Math.floor((series.length - 1) / 2), series.length - 1];
  idxs.forEach((i) => {
    const d = series[i];
    const x = padL + (i * plotW) / Math.max(1, series.length - 1);
    ctx.fillText(d.date, Math.max(2, x - 14), h - 10);
  });
  ctx.globalAlpha = 1;
}

function drawBarChartPlaceholder() {
  const canvas = document.getElementById("barChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.85;
  ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText("Device breakdown requires authenticated API.", 12, 26);
  ctx.fillText("Use GoatCounter dashboard for devices/referrers.", 12, 46);
  ctx.globalAlpha = 1;
}

function renderTopPagesPlaceholder() {
  const box = document.getElementById("topPages");
  if (!box) return;
  box.innerHTML = `
    <div class="row" style="padding:12px 0;">
      <div style="flex:1;">
        <div class="path">Top pages</div>
        <div class="muted small" style="font-weight:800;">
          Not available via public counter JSON.
        </div>
      </div>
      <div class="meta">
        <div class="n">—</div>
      </div>
    </div>
  `;
}

function renderDeviceDetailsPlaceholder() {
  const box = document.getElementById("deviceDetails");
  if (!box) return;
  box.innerHTML = `
    <div class="muted small">
      Device/referrer details are shown in the GoatCounter dashboard.
    </div>
  `;
}

const state = { series7: [], series30: [], allTime: 0, ready: false };

async function loadRealData() {
  const code = getGoatCode();
  if (!code) {
    showBanner(true);
    throw new Error("Missing GoatCounter code. Set window.CAREDOSE_GOATCOUNTER_CODE in analytics.html");
  }
  showBanner(false);

  const allTime = await fetchCount(code, "TOTAL");
  const series7 = await buildDailySeries(code, 7);
  const series30 = await buildDailySeries(code, 30);

  state.series7 = series7;
  state.series30 = series30;
  state.allTime = allTime;
  state.ready = true;
}

function setRange(range) {
  document.querySelectorAll("#filters .chip").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.range === range);
  });

  const series = range === "7" ? state.series7 : state.series30;
  setKpiFromSeries(range, series, state.allTime);
  drawLineChartFromSeries(series);
  drawBarChartPlaceholder();
  renderTopPagesPlaceholder();
  renderDeviceDetailsPlaceholder();
}

(async () => {
  try {
    setLoading(true);
    await loadRealData();
    setRange("7");

    const filters = document.getElementById("filters");
    if (filters) {
      filters.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-range]");
        if (!btn) return;
        setRange(btn.dataset.range);
      });
    }
  } catch (err) {
    console.error(err);
    showBanner(true);
    setText("#kpi-total", "—");
    setText("#kpi-unique", "—");
    setText("#kpi-time", "—");
    setText("#kpi-ref", "Setup required");
    drawBarChartPlaceholder();
    renderTopPagesPlaceholder();
    renderDeviceDetailsPlaceholder();
  } finally {
    setLoading(false);
  }
})();
