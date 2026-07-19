import { svgFrame, text, tokyonight, fmtNum } from '../lib/theme.mjs';

export function renderStats(data, t = tokyonight) {
  const s = data.stats;
  const rows = [
    ['⭐ Total Stars Earned', s.stars],
    ['⬆ Total Commits', s.commits],
    ['⎇ Total PRs', s.prs],
    ['◎ Total Issues', s.issues],
    ['◈ Contributed to', s.contributedTo],
  ];
  const inner = [
    text(20, 34, `${data.user}'s GitHub Stats`, { fill: t.title, size: 15, weight: 600 }),
    ...rows.flatMap(([label, val], i) => {
      const y = 62 + i * 26;
      return [
        text(20, y, label, { fill: t.ink, size: 13 }),
        text(300, y, fmtNum(val), { fill: t.white, size: 13, anchor: 'end', mono: true }),
      ];
    }),
    // grade ring
    `<g transform="translate(360,90)">`
    + `<circle r="36" fill="none" stroke="${t.line}" stroke-width="6"/>`
    + `<circle r="36" fill="none" stroke="${t.accent}" stroke-width="6" stroke-linecap="round" `
    + `stroke-dasharray="226" stroke-dashoffset="32" transform="rotate(-90)"/>`
    + text(0, 7, s.grade, { fill: t.accent, size: 21, weight: 700, anchor: 'middle', mono: true })
    + `</g>`,
  ].join('');
  return svgFrame(430, 190, inner, t);
}
