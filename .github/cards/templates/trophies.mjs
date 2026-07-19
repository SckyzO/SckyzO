import { svgFrame, text, cardTitle, tokyonight } from '../lib/theme.mjs';

export function renderTrophies(data, t = tokyonight) {
  const tr = data.trophies;
  const W = 495, padX = 28, top = 78, gap = 10, chipH = 72;
  const cellW = (W - padX * 2 - gap * (tr.length - 1)) / tr.length;
  const inner = [cardTitle('🏆', 'Achievements', t)];
  tr.forEach((c, i) => {
    const x = padX + i * (cellW + gap);
    inner.push(`<rect x="${x.toFixed(1)}" y="${top}" width="${cellW.toFixed(1)}" height="${chipH}" rx="10" fill="none" stroke="${t.line}" stroke-width="1.5"/>`);
    inner.push(text(x + cellW / 2, top + 36, c.rank, { fill: t.gold, size: 22, weight: 700, anchor: 'middle' }));
    inner.push(text(x + cellW / 2, top + 58, c.kind, { fill: t.dim, size: 12, anchor: 'middle' }));
  });
  return svgFrame(W, top + chipH + 28, inner.join(''), t);
}
