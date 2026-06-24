// charts.js — canvas chart rendering

function niceStep(range) {
    const rough = range / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const n = rough / mag;
    if (n < 1.5) return mag;
    if (n < 3)   return 2 * mag;
    if (n < 7)   return 5 * mag;
    return 10 * mag;
}

function drawPriceChart(canvas, ohlcData, emaData) {
    if (canvas.offsetWidth > 0) canvas.width = canvas.offsetWidth;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const data = ohlcData.slice(-12);
    if (data.length === 0) return;

    const pad = { top: 8, bottom: 18, left: 44, right: 8 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    // Fixed 12-slot grid — candles right-align
    const SLOTS = 12;
    const spacing = chartW / SLOTS;
    const barWidth = Math.max(2, spacing * 0.35);
    const slotOffset = SLOTS - data.length;

    // Price range with minimum span
    let minP = Infinity, maxP = -Infinity;
    data.forEach(d => { minP = Math.min(minP, d.low); maxP = Math.max(maxP, d.high); });
    const lastClose = data[data.length - 1].close;
    const minSpan = lastClose * 0.163;
    const mid = (minP + maxP) / 2;
    if (maxP - minP < minSpan) { minP = mid - minSpan / 2; maxP = mid + minSpan / 2; }
    const range = maxP - minP || 1;
    const priceToY = p => pad.top + chartH - ((p - minP) / range) * chartH;

    // Y gridlines + labels
    const step = niceStep(range);
    const firstTick = Math.ceil(minP / step) * step;
    ctx.font = '9px IBM Plex Mono, monospace';
    for (let t = firstTick; t <= maxP + step * 0.01; t += step) {
        const y = priceToY(t);
        if (y < pad.top || y > pad.top + chartH) continue;
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = '#e4e4e4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + chartW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'right';
        ctx.fillText(`$${Math.round(t)}`, pad.left - 4, y + 3);
    }

    // Y-axis spine
    ctx.beginPath();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.stroke();

    // EMA line
    if (emaData && emaData.length >= data.length) {
        const emaSlice = emaData.slice(-data.length);
        ctx.beginPath();
        ctx.strokeStyle = '#378ADD';
        ctx.lineWidth = 1.5;
        emaSlice.forEach((v, i) => {
            const x = pad.left + (slotOffset + i) * spacing + spacing / 2;
            const y = priceToY(v);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    // Candlesticks — seed candles (week<=0) at reduced opacity
    data.forEach((d, i) => {
        const x = pad.left + (slotOffset + i) * spacing + spacing / 2;
        const isHistorical = (d.week !== undefined && d.week <= 0);
        const isGreen = d.close >= d.open;
        const color = isGreen ? '#3B6D11' : '#A32D2D';
        ctx.globalAlpha = isHistorical ? 0.4 : 1.0;

        // Wick — enforce minimum height so it's always visible
        const wickTop = priceToY(d.high);
        const wickBot = priceToY(d.low);
        const wickMid = (wickTop + wickBot) / 2;
        const wickH = Math.max(10, wickBot - wickTop);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(x, wickMid - wickH / 2);
        ctx.lineTo(x, wickMid + wickH / 2);
        ctx.stroke();

        // Body — enforce minimum height so it's always visible
        const rawBodyTop = priceToY(Math.max(d.open, d.close));
        const rawBodyBot = priceToY(Math.min(d.open, d.close));
        const bodyMid = (rawBodyTop + rawBodyBot) / 2;
        const bodyH = Math.max(5, rawBodyBot - rawBodyTop);
        ctx.fillStyle = color;
        ctx.fillRect(x - barWidth / 2, bodyMid - bodyH / 2, barWidth, bodyH);
    });
    ctx.globalAlpha = 1.0;

    // X-axis: label every game week (week >= 1)
    ctx.fillStyle = '#aaa';
    ctx.font = '9px IBM Plex Mono, monospace';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
        const w = d.week;
        if (!w || w <= 0) return;
        const x = pad.left + (slotOffset + i) * spacing + spacing / 2;
        ctx.fillText(`W${w}`, x, H - 3);
    });
}

function drawVixChart(canvas, vixData, vixEMA) {
    if (canvas.offsetWidth > 0) canvas.width = canvas.offsetWidth;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const data = vixData.slice(-12);
    if (data.length === 0) return;

    const pad = { top: 8, bottom: 20, left: 24, right: 8 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const allVals = [...data, 22, 27];
    let minV = Math.max(0, Math.min(...allVals) - 3);
    let maxV = Math.max(...allVals) + 5;
    const range = maxV - minV || 1;
    const vixToY = v => pad.top + chartH - ((v - minV) / range) * chartH;

    const spacing = chartW / Math.max(data.length - 1, 1);

    // Zone fills
    // Below 22 — light green
    const y22 = vixToY(22);
    const yBottom = pad.top + chartH;
    const grad1 = ctx.createLinearGradient(0, y22, 0, yBottom);
    grad1.addColorStop(0, 'rgba(151,196,89,0.08)');
    grad1.addColorStop(1, 'rgba(151,196,89,0.04)');
    ctx.fillStyle = grad1;
    ctx.fillRect(pad.left, y22, chartW, yBottom - y22);

    // Above 27 — light amber
    const y27 = vixToY(27);
    if (y27 > pad.top) {
        const grad2 = ctx.createLinearGradient(0, pad.top, 0, y27);
        grad2.addColorStop(0, 'rgba(239,159,39,0.10)');
        grad2.addColorStop(1, 'rgba(239,159,39,0.04)');
        ctx.fillStyle = grad2;
        ctx.fillRect(pad.left, pad.top, chartW, y27 - pad.top);
    }

    // Dashed reference lines
    function dashLine(y, color, label) {
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + chartW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = '9px IBM Plex Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(label, pad.left - 2, y + 3);
    }
    dashLine(y22, '#97C459', '22');
    dashLine(y27, '#EF9F27', '27');

    // EMA line
    if (vixEMA && vixEMA.length >= data.length) {
        const emaSlice = vixEMA.slice(-data.length);
        ctx.beginPath();
        ctx.strokeStyle = '#378ADD';
        ctx.lineWidth = 1.5;
        emaSlice.forEach((v, i) => {
            const x = pad.left + i * spacing;
            const y = vixToY(v);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    // VIX line
    ctx.beginPath();
    ctx.strokeStyle = '#888780';
    ctx.lineWidth = 1.5;
    data.forEach((v, i) => {
        const x = pad.left + i * spacing;
        const y = vixToY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = '#999';
    ctx.font = '9px IBM Plex Mono, monospace';
    ctx.textAlign = 'center';
    data.forEach((v, i) => {
        if (i % 3 === 0 || i === data.length - 1) {
            const x = pad.left + i * spacing;
            ctx.fillText(`W${i + 1}`, x, H - 4);
        }
    });
}

function drawPnlChart(canvas, pnlHistory, startingCapital) {
    if (canvas.offsetWidth > 0) canvas.width = canvas.offsetWidth;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (pnlHistory.length < 2) return;

    const pad = { top: 8, bottom: 20, left: 40, right: 8 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const values = [startingCapital, ...pnlHistory];
    const minV = Math.min(...values) * 0.99;
    const maxV = Math.max(...values) * 1.01;
    const range = maxV - minV || 1;
    const valToY = v => pad.top + chartH - ((v - minV) / range) * chartH;

    const spacing = chartW / Math.max(values.length - 1, 1);

    // Baseline
    const baseY = valToY(startingCapital);
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, baseY);
    ctx.lineTo(pad.left + chartW, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Area fill
    const lastX = pad.left + (values.length - 1) * spacing;
    ctx.beginPath();
    values.forEach((v, i) => {
        const x = pad.left + i * spacing;
        const y = valToY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(lastX, pad.top + chartH);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.closePath();
    const lastVal = values[values.length - 1];
    ctx.fillStyle = lastVal >= startingCapital ? 'rgba(59,109,17,0.08)' : 'rgba(163,45,45,0.08)';
    ctx.fill();

    // P&L line
    ctx.beginPath();
    ctx.strokeStyle = lastVal >= startingCapital ? '#3B6D11' : '#A32D2D';
    ctx.lineWidth = 2;
    values.forEach((v, i) => {
        const x = pad.left + i * spacing;
        const y = valToY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#999';
    ctx.font = '9px IBM Plex Mono, monospace';
    ctx.textAlign = 'right';
    const fmt = v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v.toFixed(0)}`;
    ctx.fillText(fmt(maxV), pad.left - 2, pad.top + 8);
    ctx.fillText(fmt(startingCapital), pad.left - 2, baseY + 3);
    ctx.fillText(fmt(minV), pad.left - 2, pad.top + chartH);
}
