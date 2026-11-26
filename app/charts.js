// HearthLedger — hand-drawn inline SVG charts. Pure functions: data in, SVG string
// out. No DOM, no state, no library, no network. All colors come from the
// design palette (section 5).

// Format a whole-dollar amount for a chart label: 4726 -> "$4,726".
function label0(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

// Escape text that goes inside SVG (category names contain &).
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// One point on a circle of radius r around (cx, cy), angle in degrees,
// 0 deg = 12 o'clock, clockwise.
function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// Donut: "Where November's money went".
// slices: [{ label, value, color }] in draw order; total: the sum to show in the hole.
export function donutChart(slices, total) {
  const size = 220;
  const cx = 110;
  const cy = 110;
  const outer = 108;
  const inner = 82; // 26 px ring thickness
  let angle = 0;
  const parts = [];
  for (const s of slices) {
    const sweep = (s.value / total) * 360;
    if (sweep <= 0) continue;
    const [x0, y0] = polar(cx, cy, outer, angle);
    const [x1, y1] = polar(cx, cy, outer, angle + sweep);
    const [x2, y2] = polar(cx, cy, inner, angle + sweep);
    const [x3, y3] = polar(cx, cy, inner, angle);
    const large = sweep > 180 ? 1 : 0;
    parts.push(
      `<path d="M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${outer} ${outer} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${inner} ${inner} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z" fill="${s.color}"><title>${esc(s.label)} — ${label0(s.value)} (${((s.value / total) * 100).toFixed(1)}%)</title></path>`
    );
    angle += sweep;
  }
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Donut chart: where November's money went, total ${label0(total)} spent" xmlns="http://www.w3.org/2000/svg">${parts.join('')}<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="26" font-weight="800" fill="#22302B">${label0(total)}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="12" fill="#22302B" opacity="0.65">spent in Nov</text></svg>`;
}

// Trend chart: "Spending vs income, Jun-Nov".
// months: [{ short, income, spending, saved, projected }] — six entries.
// opts: { width, height } — dashboard uses 640x260, Insights uses 760x300.
export function trendChart(months, opts) {
  const width = (opts && opts.width) || 640;
  const height = (opts && opts.height) || 260;
  const padL = 52;
  const padR = 14;
  const padT = 30;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const maxV = 7000; // scale: income tops at $6,960, so $7,000 headroom
  const y = (v) => padT + plotH - (v / maxV) * plotH;
  const slot = plotW / months.length;
  const barW = 30;
  const saveW = 16;
  const out = [];

  // Y gridlines at $0 / $2,000 / $4,000 / $6,000.
  for (const g of [0, 2000, 4000, 6000]) {
    out.push(`<line x1="${padL}" y1="${y(g).toFixed(1)}" x2="${width - padR}" y2="${y(g).toFixed(1)}" stroke="#22302B" stroke-opacity="0.12" stroke-width="1"/><text x="${padL - 8}" y="${(y(g) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#22302B" opacity="0.6">${label0(g)}</text>`);
  }

  // Bars per month: spending (pine) + savings (gold) beside it; income as a
  // dashed terracotta line across the six months.
  const linePts = [];
  months.forEach((m, i) => {
    const x0 = padL + i * slot + (slot - barW - saveW - 6) / 2;
    const spendH = (m.spending / maxV) * plotH;
    const saveH = (m.saved / maxV) * plotH;
    const spendY = padT + plotH - spendH;
    const saveY = padT + plotH - saveH;
    if (m.projected) {
      // November is projected: hatched bar, not solid.
      out.push(`<defs><pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#1E4D3B"/><line x1="0" y1="0" x2="0" y2="6" stroke="#FAF6EF" stroke-width="2"/></pattern></defs>`);
      out.push(`<rect x="${x0.toFixed(1)}" y="${spendY.toFixed(1)}" width="${barW}" height="${spendH.toFixed(1)}" fill="url(#hatch)" rx="2"><title>${esc(m.month)} spending (projected) ${label0(m.spending)}</title></rect>`);
    } else {
      out.push(`<rect x="${x0.toFixed(1)}" y="${spendY.toFixed(1)}" width="${barW}" height="${spendH.toFixed(1)}" fill="#1E4D3B" rx="2"><title>${esc(m.month)} spending ${label0(m.spending)}</title></rect>`);
    }
    out.push(`<rect x="${(x0 + barW + 6).toFixed(1)}" y="${saveY.toFixed(1)}" width="${saveW}" height="${saveH.toFixed(1)}" fill="#D9A441" rx="2"><title>${esc(m.month)} saved ${label0(m.saved)}</title></rect>`);
    out.push(`<text x="${(x0 + barW / 2).toFixed(1)}" y="${(spendY - 6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#22302B">${label0(m.spending)}</text>`);
    out.push(`<text x="${(padL + i * slot + slot / 2).toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="12" fill="#22302B" opacity="0.7">${esc(m.short)}${m.projected ? '*' : ''}</text>`);
    linePts.push(`${(padL + i * slot + slot / 2).toFixed(1)},${y(m.income).toFixed(1)}`);
  });

  // Income line (dashed terracotta) + the August bump label.
  out.push(`<polyline points="${linePts.join(' ')}" fill="none" stroke="#C96F4A" stroke-width="2.5" stroke-dasharray="7 5"><title>Monthly income</title></polyline>`);
  const aug = months[2];
  if (aug) {
    const ax = padL + 2 * slot + slot / 2;
    out.push(`<circle cx="${ax.toFixed(1)}" cy="${y(aug.income).toFixed(1)}" r="4" fill="#C96F4A"/><text x="${ax.toFixed(1)}" y="${(y(aug.income) + 20).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#C96F4A">$6,960 \u00b7 summer-school stipend</text>`);
  }

  // Legend, bottom-left inside the plot.
  out.push(`<g font-size="11" fill="#22302B"><rect x="${padL}" y="${padT - 22}" width="10" height="10" fill="#1E4D3B" rx="2"/><text x="${padL + 14}" y="${padT - 13}">Spending</text><rect x="${padL + 82}" y="${padT - 22}" width="10" height="10" fill="#D9A441" rx="2"/><text x="${padL + 96}" y="${padT - 13}">Saved</text><line x1="${padL + 150}" y1="${padT - 17}" x2="${padL + 168}" y2="${padT - 17}" stroke="#C96F4A" stroke-width="2.5" stroke-dasharray="5 3"/><text x="${padL + 172}" y="${padT - 13}">Income</text></g>`);

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Bar chart: monthly spending and savings with an income line, June to November 2026" xmlns="http://www.w3.org/2000/svg">${out.join('')}</svg>`;
}
