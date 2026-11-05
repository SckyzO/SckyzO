import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTerminal, schedule } from './terminal.mjs';

test('schedule gives each line a consecutive slot covering the whole loop', () => {
  const { total, lines } = schedule(['abcdefghij', 'xy']);
  assert.equal(lines[0].start, 0);
  assert.equal(lines.at(-1).end, 1);
  assert.equal(lines[1].start, lines[0].end, 'no gap between lines');
  for (const l of lines) assert.ok(l.start < l.typed && l.typed < l.end);
  assert.equal(total, 5.6); // 0.7 + 2.2 + 0.5 + 2.2: 10 chars typed at 70ms, short lines take at least 0.5s
});

test('renderTerminal types every line in the accent colour after a static prompt', () => {
  const svg = renderTerminal({ prompt: 'tom@hpc:~$', command: 'whoami', lines: ['Monitoring Wizard', 'I <3 Go'], accent: '#ABCDEF' });
  assert.match(svg, /<tspan fill="#3FB950">tom@hpc:~\$<\/tspan>/);
  assert.match(svg, />whoami<\/tspan>/);
  assert.match(svg, />tom@hpc — zsh</, 'title bar names the host');
  assert.match(svg, /<text[^>]*fill="#ABCDEF" clip-path="url\(#t0\)">Monitoring Wizard<\/text>/);
  assert.match(svg, /clip-path="url\(#t1\)">I &lt;3 Go<\/text>/);
  const visibility = [...svg.matchAll(/attributeName="opacity" dur="[\d.]+s" repeatCount="indefinite" calcMode="discrete" keyTimes="([^"]+)"/g)];
  assert.equal(visibility.length, 2, 'one visibility timeline per line');
  for (const [, k] of visibility) {
    const times = k.split(';').map(Number);
    assert.equal(times[0], 0);
    assert.equal(times.at(-1), 1);
    assert.deepEqual([...times].sort((a, b) => a - b), times, 'keyTimes must not decrease');
  }
});

test('renderTerminal refuses an empty line list', () => {
  assert.throws(() => renderTerminal({ prompt: '$', command: 'x', lines: [] }), /at least one line/);
});
