import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderKeycap, lucideShapes } from './keycap.mjs';

const LUCIDE = `<!-- @license lucide-static v1.25.0 - ISC -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M12 19h8" />
  <rect width="18" height="18" x="3" y="3" rx="2" />
</svg>`;

test('lucideShapes keeps the inner shapes and drops the wrapper and licence comment', () => {
  assert.equal(lucideShapes(LUCIDE), '<path d="M12 19h8" /> <rect width="18" height="18" x="3" y="3" rx="2" />');
  assert.throws(() => lucideShapes('nope'), /not an SVG/);
});

test('renderKeycap draws a raised key with the icon in the tool colour and the label', () => {
  const svg = renderKeycap({ label: 'VS Code', color: '#007ACC', iconShapes: lucideShapes(LUCIDE) });
  assert.match(svg, /height="40"/);
  assert.match(svg, /stroke="#007ACC" stroke-width="2"[^>]*><path d="M12 19h8" \/>/);
  assert.match(svg, />VS Code<\/text>/);
  assert.match(svg, /aria-label="VS Code"/);
  const width = (s) => Number(s.match(/<svg[^>]* width="(\d+)"/)[1]);
  assert.ok(width(renderKeycap({ label: 'Tmux', color: '#000000', iconShapes: '' }))
    < width(renderKeycap({ label: 'VS Code', color: '#000000', iconShapes: '' })), 'width follows the label');
});

test('renderKeycap escapes the label', () => {
  assert.match(renderKeycap({ label: 'a<b', color: '#000000', iconShapes: '' }), />a&lt;b<\/text>/);
});
