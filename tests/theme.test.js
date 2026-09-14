import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { resolveTheme } from '../js/theme.js';
import { festivalDegree } from '../js/game.js';

const choices = [
  { name: 'stylish', label: 'スタイリッシュ' },
  { name: 'candy', label: 'キャンディ', ready: false },
  { name: 'extra', label: '追加' },
];

test('resolveTheme: ?theme= wins, then the saved choice, then the default', () => {
  assert.equal(resolveTheme({ param: 'extra', stored: 'stylish', choices, fallback: 'stylish' }), 'extra');
  assert.equal(resolveTheme({ param: null, stored: 'extra', choices, fallback: 'stylish' }), 'extra');
  assert.equal(resolveTheme({ choices, fallback: 'stylish' }), 'stylish');
});

test('resolveTheme skips unknown and not-ready themes', () => {
  assert.equal(resolveTheme({ param: 'candy', stored: 'nope', choices, fallback: 'extra' }), 'extra');
  assert.equal(resolveTheme({ param: 'nope', choices, fallback: 'candy' }), 'stylish');
});

test('the configured default theme is pickable', () => {
  assert.equal(resolveTheme({ choices: CONFIG.theme.choices, fallback: CONFIG.theme.default }), CONFIG.theme.default);
});

test('festivalDegree gives a rank letter at the thresholds', () => {
  const at = (percent) => festivalDegree((CONFIG.result.fullScore * percent) / 100, CONFIG).rank;
  assert.equal(at(0), 'C');
  assert.equal(at(39), 'C');
  assert.equal(at(40), 'B');
  assert.equal(at(70), 'A');
  assert.equal(at(89), 'A');
  assert.equal(at(90), 'S');
  assert.equal(festivalDegree(CONFIG.result.fullScore * 3, CONFIG).rank, 'S');
});
