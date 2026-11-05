import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBadge, renderValueBadge, badgeSlug, iconPathsFrom, textWidth } from './badge.mjs';

const width = (svg) => Number(svg.match(/<svg[^>]* width="(\d+)"/)[1]);

test('renderBadge draws an uppercase label on the brand colour, wider with an icon', () => {
  const plain = renderBadge({ label: 'Slurm', color: '#2C6E49' });
  const icon = renderBadge({ label: 'Slurm', color: '#2C6E49', iconPaths: ['M0 0h24v24H0z'] });
  assert.match(plain, /<rect width="\d+" height="28" fill="#2C6E49"\/>/);
  assert.match(plain, />SLURM<\/text>/);
  assert.equal(width(icon) - width(plain), 18, 'the icon adds its width plus a gap');
  assert.match(icon, /<g transform="translate\(10 7\) scale\(0\.5833333333333334\)" fill="#FFFFFF"><path d="M0 0h24v24H0z"\/><\/g>/);
});

test('renderBadge pins the text to its estimated width so a fallback font cannot overflow', () => {
  const svg = renderBadge({ label: 'Prometheus', color: '#E6522C' });
  assert.match(svg, new RegExp(`textLength="${textWidth('Prometheus')}" lengthAdjust="spacingAndGlyphs"`));
  assert.equal(width(svg), 12 + textWidth('Prometheus') + 12);
});

test('renderBadge escapes labels and honours a dark text colour', () => {
  const svg = renderBadge({ label: 'A&B', color: '#FCC624', textColor: '#000000' });
  assert.match(svg, />A&amp;B<\/text>/);
  assert.match(svg, /fill="#000000"/);
});

test('renderValueBadge splits a grey label from a coloured value', () => {
  const svg = renderValueBadge({ label: 'Followers', value: 16, color: '#8A2BE2' });
  assert.match(svg, /fill="#555555"/);
  assert.match(svg, /fill="#8A2BE2"/);
  assert.match(svg, />FOLLOWERS<\/text>.*>16<\/text>/);
  assert.match(svg, /aria-label="Followers: 16"/);
});

test('badgeSlug and iconPathsFrom', () => {
  assert.equal(badgeSlug('VS Code'), 'vs-code');
  assert.equal(badgeSlug('C++'), 'c');
  assert.deepEqual(iconPathsFrom('<svg><path fill="#000" d="M1 1"/><path d="M2 2"/></svg>'), ['M1 1', 'M2 2']);
});
