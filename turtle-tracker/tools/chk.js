
const DATA = [{"date":"2026-01-02","iwm":248.78,"realized":0,"unrealized":0,"total":0,"bench":0},{"date":"2026-01-09","iwm":260.23,"realized":0,"unrealized":0,"total":0,"bench":0.0},{"date":"2026-01-16","iwm":265.76,"realized":-243,"unrealized":0,"total":-243,"bench":408.04},{"date":"2026-01-24","iwm":264.81,"realized":-91,"unrealized":0,"total":-91,"bench":339.4},{"date":"2026-01-30","iwm":259.65,"realized":166,"unrealized":0.0,"total":166.0,"bench":-34.75},{"date":"2026-02-06","iwm":265.02,"realized":-48,"unrealized":0.0,"total":-48.0,"bench":755.55},{"date":"2026-02-13","iwm":262.96,"realized":281,"unrealized":755.0,"total":1036.0,"bench":458.52},{"date":"2026-02-21","iwm":264.61,"realized":525,"unrealized":755.0,"total":1280.0,"bench":698.29},{"date":"2026-02-27","iwm":261.41,"realized":1135,"unrealized":755.0,"total":1890.0,"bench":236.18},{"date":"2026-03-06","iwm":250.89,"realized":2093,"unrealized":755.0,"total":2848.0,"bench":-1301.62},{"date":"2026-03-13","iwm":246.59,"realized":2840,"unrealized":755.0,"total":3595.0,"bench":-1956.54},{"date":"2026-03-20","iwm":242.22,"realized":3805.95,"unrealized":-2662.05,"total":1143.9,"bench":-2633.73},{"date":"2026-03-27","iwm":243.1,"realized":4876.95,"unrealized":-2859.05,"total":2017.9,"bench":-2494.9},{"date":"2026-04-03","iwm":251.29,"realized":4437.95,"unrealized":-2400.05,"total":2037.9,"bench":-1207.53},{"date":"2026-04-10","iwm":261.3,"realized":3584.95,"unrealized":-846.05,"total":2738.9,"bench":314.64},{"date":"2026-04-17","iwm":275.78,"realized":2861.95,"unrealized":1490.95,"total":4352.9,"bench":2432.19},{"date":"2026-04-24","iwm":276.65,"realized":2861.95,"unrealized":2776.95,"total":5638.9,"bench":2552.74},{"date":"2026-05-01","iwm":279.28,"realized":3093.95,"unrealized":3191.95,"total":6285.9,"bench":2916.01},{"date":"2026-05-08","iwm":284.17,"realized":3093.95,"unrealized":4151.95,"total":7245.9,"bench":3585.08},{"date":"2026-05-15","iwm":277.6,"realized":3093.95,"unrealized":3008.95,"total":6102.9,"bench":2701.61},{"date":"2026-05-22","iwm":285.12,"realized":1537.95,"unrealized":2089.95,"total":3627.9,"bench":3736.76},{"date":"2026-05-30","iwm":290.43,"realized":1306.95,"unrealized":2089.95,"total":3396.9,"bench":4448.42},{"date":"2026-06-05","iwm":281.65,"realized":1775.95,"unrealized":5478.95,"total":7254.9,"bench":3293.22},{"date":"2026-06-12","iwm":292.95,"realized":1775.95,"unrealized":5294.95,"total":7070.9,"bench":4826.33},{"date":"2026-06-19","iwm":295.59,"realized":1775.95,"unrealized":6255.95,"total":8031.9,"bench":5170.69},{"date":"2026-06-26","iwm":299.83,"realized":4976.9,"unrealized":5186,"total":10162.9,"bench":5718.82},{"date":"2026-07-03","iwm":297.58,"realized":5995.9,"unrealized":4468,"total":10463.9,"bench":5334.67},{"date":"2026-07-10","iwm":295.99,"realized":5995.9,"unrealized":4468,"total":10463.9,"bench":5061.15},{"date":"2026-07-17","iwm":294.04,"realized":6192.9,"unrealized":3089,"total":9281.9,"bench":4723.89},{"date":"2026-07-24","iwm":291.17,"realized":9826.9,"unrealized":-912,"total":8914.9,"bench":4224.24},{"date":"2026-07-31","iwm":291.2,"realized":10858.9,"unrealized":-1374,"total":9484.9,"bench":4229.51},{"date":"2026-08-07","iwm":301.56,"realized":9317.9,"unrealized":1858,"total":11175.9,"bench":6050.74},{"date":"2026-08-14","iwm":305.09,"realized":8842.9,"unrealized":2935,"total":11777.9,"bench":6649.98},{"date":"2026-08-21","iwm":299.96,"realized":9254.9,"unrealized":1214,"total":10468.9,"bench":5789.21},{"date":"2026-08-28","iwm":295.75,"realized":10170.9,"unrealized":902,"total":11072.9,"bench":5070.73},{"date":"2026-09-04","iwm":296.01,"realized":9829.9,"unrealized":-837,"total":8992.9,"bench":5115.73},{"date":"2026-09-12","iwm":288.89,"realized":10829.9,"unrealized":-2748,"total":8081.9,"bench":3884.41},{"date":"2026-09-18","iwm":284.1,"realized":12239.9,"unrealized":-4325,"total":7914.9,"bench":3035.62},{"date":"2026-09-25","iwm":281.97,"realized":13395.9,"unrealized":-4325,"total":9070.9,"bench":2651.82},{"date":"2026-10-02","iwm":281.52,"realized":13965.9,"unrealized":-4325,"total":9640.9,"bench":2570.13},{"date":"2026-10-07","iwm":277.7,"realized":14495.9,"unrealized":-4325,"total":10170.9,"bench":1875.5},{"date":"2026-10-08","iwm":275.01,"realized":15285.9,"unrealized":-7565.0,"total":7720.9,"bench":1379.63}];
const EVENTS = [
  ["Jan 7", "Tastytrade", "Bought Jun '27 $190 call", "−$7,745"],
  ["Jan 26", "IBKR", "Bought Jun '27 $185 call", "−$9,011"],
  ["Jun 23", "IBKR", "Sold Jun '27 $185 call", "+$12,100"],
  ["Jun 23", "IBKR", "Bought 2 × Dec '27 $250 calls", "−$13,690"],
  ["Jul 2", "Tastytrade", "Bought Dec '27 $250 call", "−$6,850"],
  ["Jul 24", "Tastytrade", "Sold Jun '27 $190 call", "+$11,000"],
  ["Jul 29", "Tastytrade", "Bought Dec '27 $225 call", "−$8,005"]
];

const $ = (id) => document.getElementById(id);
const usd = (n, sign) => (n < 0 ? "−" : sign ? "+" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("en-US");
const cls = (n) => (n >= 0 ? "pos" : "neg");
const T = (s) => Date.parse(s + "T12:00:00Z");
const dlabel = (s) => new Date(T(s)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const last = DATA[DATA.length - 1];

function at(daysBack) {
  const cut = T(last.date) - daysBack * 86400000;
  let r = DATA[0];
  for (const p of DATA) { if (T(p.date) <= cut) r = p; }
  return r;
}

/* Period tiles */
(function tiles() {
  const rows = [
    { label: "Since Jan 7", from: DATA[0] },
    { label: "Last 90 days", from: at(90) },
    { label: "Last 30 days", from: at(30) }
  ];
  $("tiles").innerHTML = rows.map((r) => {
    const t = last.total - r.from.total;
    const b = last.bench - r.from.bench;
    const real = last.realized - r.from.realized;
    const unreal = last.unrealized - r.from.unrealized;
    return '<div class="tile"><span class="label">' + r.label + '</span>' +
      '<span class="big ' + cls(t) + '">' + usd(t, true) + '</span>' +
      '<span class="vs">IWM on the same capital: ' + usd(b, true) + '</span>' +
      '<span class="split">Premium and closed trades ' + usd(real, true) + '<br>LEAPS marks ' + usd(unreal, true) + '</span></div>';
  }).join("");
})();

/* Chart */
const svg = $("chart"), tip = $("tip");
let geo = null;

function niceStep(range) {
  const cands = [500, 1000, 2000, 2500, 5000, 10000];
  return cands.find((c) => range / c <= 6) || 10000;
}

function draw() {
  const W = Math.max(300, $("chartbox").clientWidth);
  const narrow = W < 560;
  const H = narrow ? 300 : 380;
  const m = { l: narrow ? 48 : 58, r: narrow ? 74 : 150, t: 14, b: 26 };
  const x0 = T(DATA[0].date), x1 = T(last.date);
  const vals = DATA.flatMap((p) => [p.total, p.bench]);
  const step = niceStep(Math.max(...vals, 0) - Math.min(...vals, 0));
  const ymin = Math.floor(Math.min(...vals, 0) / step) * step;
  const ymax = Math.ceil(Math.max(...vals, 0) / step) * step;
  const X = (s) => m.l + ((T(s) - x0) / (x1 - x0)) * (W - m.l - m.r);
  const Y = (v) => m.t + (1 - (v - ymin) / (ymax - ymin)) * (H - m.t - m.b);
  geo = { W, H, m, X, Y };

  let g = "";
  for (let v = ymin; v <= ymax + 1; v += step) {
    g += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (v === 0 ? "var(--ink-3)" : "var(--grid)") + '" stroke-width="' + (v === 0 ? 1.25 : 1) + '"/>';
    g += '<text x="' + (m.l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + (v < 0 ? "−" : "") + "$" + (Math.abs(v) >= 1000 ? Math.abs(v) / 1000 + "k" : Math.abs(v)) + "</text>";
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  months.forEach((mn, i) => {
    const s = "2026-" + String(i + 1).padStart(2, "0") + "-01";
    if (T(s) < x0 || T(s) > x1) return;
    g += '<text x="' + X(s) + '" y="' + (H - 6) + '" text-anchor="middle">' + mn + "</text>";
  });

  const pts = (key, from, to) => DATA.slice(from, to).map((p) => X(p.date).toFixed(1) + "," + Y(p[key]).toFixed(1)).join(" ");
  const n = DATA.length;
  g += '<polyline fill="none" stroke="var(--s2)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts("bench", 0, n) + '"/>';
  g += '<polyline fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts("total", 0, n - 1) + '"/>';
  g += '<polyline fill="none" stroke="var(--s1)" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round" points="' + pts("total", n - 2, n) + '"/>';

  const ex = X(last.date);
  g += '<circle cx="' + ex + '" cy="' + Y(last.bench) + '" r="4.5" fill="var(--s2)" stroke="var(--surface)" stroke-width="2"/>';
  g += '<circle cx="' + ex + '" cy="' + Y(last.total) + '" r="4.5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>';
  const lx = ex + 10;
  g += '<text class="endlabel" x="' + lx + '" y="' + (Y(last.total) - 2) + '">Turtle ' + usd(last.total, true) + "</text>";
  g += '<text class="endlabel endlabel-sub" x="' + lx + '" y="' + (Y(last.bench) + 4) + '">IWM ' + usd(last.bench, true) + "</text>";

  g += '<g id="cross" visibility="hidden"><line id="vline" y1="' + m.t + '" y2="' + (H - m.b) + '" stroke="var(--ink-3)" stroke-width="1"/>' +
    '<circle id="d1" r="4.5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>' +
    '<circle id="d2" r="4.5" fill="var(--s2)" stroke="var(--surface)" stroke-width="2"/></g>';
  g += '<rect id="hit" x="' + m.l + '" y="0" width="' + (W - m.l - m.r) + '" height="' + H + '" fill="transparent"/>';

  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("height", H);
  svg.innerHTML = g;

  const hit = $("hit");
  hit.addEventListener("pointermove", onMove);
  hit.addEventListener("pointerdown", onMove);
  hit.addEventListener("pointerleave", hide);
}

let kbIndex = DATA.length - 1;
function nearest(clientX) {
  const r = svg.getBoundingClientRect();
  const px = ((clientX - r.left) / r.width) * geo.W;
  let best = 0, bd = Infinity;
  DATA.forEach((p, i) => { const d = Math.abs(geo.X(p.date) - px); if (d < bd) { bd = d; best = i; } });
  return best;
}
function show(i) {
  const p = DATA[i];
  const px = geo.X(p.date);
  $("cross").setAttribute("visibility", "visible");
  $("vline").setAttribute("x1", px); $("vline").setAttribute("x2", px);
  $("d1").setAttribute("cx", px); $("d1").setAttribute("cy", geo.Y(p.total));
  $("d2").setAttribute("cx", px); $("d2").setAttribute("cy", geo.Y(p.bench));
  tip.innerHTML = '<div class="d">Week ending ' + dlabel(p.date) + "</div>" +
    '<div class="r"><span><span class="sw" style="background:var(--s1)"></span>Turtle</span><strong>' + usd(p.total, true) + "</strong></div>" +
    '<div class="r sub"><span>Premium and closed trades</span><span>' + usd(p.realized, true) + "</span></div>" +
    '<div class="r sub"><span>LEAPS marks</span><span>' + usd(p.unrealized, true) + "</span></div>" +
    '<div class="r"><span><span class="sw" style="background:var(--s2)"></span>Same capital in IWM</span><strong>' + usd(p.bench, true) + "</strong></div>" +
    '<div class="r sub"><span>IWM close</span><span>$' + p.iwm.toFixed(2) + "</span></div>";
  tip.hidden = false;
  const box = $("chartbox").getBoundingClientRect();
  const tw = tip.offsetWidth;
  let left = (px / geo.W) * box.width + 14;
  if (left + tw > box.width) left = (px / geo.W) * box.width - tw - 14;
  tip.style.left = Math.max(0, left) + "px";
  tip.style.top = "12px";
}
function hide() { if (!geo) return; $("cross").setAttribute("visibility", "hidden"); tip.hidden = true; }
function onMove(e) { kbIndex = nearest(e.clientX); show(kbIndex); }
function onKey(e) {
  if (e.key === "ArrowLeft") kbIndex = Math.max(0, kbIndex - 1);
  else if (e.key === "ArrowRight") kbIndex = Math.min(DATA.length - 1, kbIndex + 1);
  else if (e.key === "Escape") return hide();
  else return;
  e.preventDefault(); show(kbIndex);
}

/* Table view */
(function table() {
  const head = "<tr><th>Week ending</th><th>IWM close</th><th>Turtle total</th><th>Premium and closed</th><th>LEAPS marks</th><th>IWM on same capital</th></tr>";
  const body = DATA.slice().reverse().map((p) =>
    "<tr><td>" + dlabel(p.date) + "</td><td>$" + p.iwm.toFixed(2) + "</td><td>" + usd(p.total, true) + "</td><td>" + usd(p.realized, true) + "</td><td>" + usd(p.unrealized, true) + "</td><td>" + usd(p.bench, true) + "</td></tr>").join("");
  $("tablewrap").innerHTML = "<table>" + head + body + "</table>";
  $("toggle").addEventListener("click", () => {
    const on = $("tablewrap").hidden;
    $("tablewrap").hidden = !on;
    $("toggle").textContent = on ? "Hide table" : "Show table";
    $("toggle").setAttribute("aria-pressed", String(on));
  });
})();

/* LEAPS log */
$("log").innerHTML = EVENTS.map((e) =>
  '<li><span class="when">' + e[0] + '</span><span><span class="tag">' + e[1] + "</span>" + e[2] + '</span><span class="amt ' + (e[3].startsWith("+") ? "pos" : "") + '">' + e[3] + "</span></li>").join("");

svg.addEventListener("keydown", onKey);
let lastW = 0;
const redraw = () => { const w = Math.round($("chartbox").clientWidth); if (w > 0 && w !== lastW) { lastW = w; draw(); } };
if (window.ResizeObserver) new ResizeObserver(redraw).observe($("chartbox"));
window.addEventListener("resize", redraw);
requestAnimationFrame(redraw);
