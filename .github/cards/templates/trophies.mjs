import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';

export function renderTrophies(data, t = tokyonight) {
  const tr = data.trophies;
  const W = 800, padX = 28, top = 78, gap = 10, chipH = 72;
  const cellW = (W - padX * 2) / tr.length; // pitch per chip; gap is carved out of the chip width below
  const inner = [cardTitle('🏆', 'Achievements', t)];
  tr.forEach((c, i) => {
    const x = padX + i * cellW;
    const chipW = cellW - gap;
    inner.push(`<rect x="${x.toFixed(1)}" y="${top}" width="${chipW.toFixed(1)}" height="${chipH}" rx="10" fill="none" stroke="${t.line}" stroke-width="1.5"/>`);
    inner.push(text(x + chipW / 2, top + 36, c.rank, { fill: t.gold, size: 22, weight: 700, anchor: 'middle' }, t));
    inner.push(text(x + chipW / 2, top + 58, c.kind, { fill: t.dim, size: 12, anchor: 'middle' }, t));
  });
  return svgFrame(W, top + chipH + 28, inner.join(''), t);
}
