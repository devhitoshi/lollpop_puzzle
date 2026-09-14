import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { COLORS } from '../js/config.js';
import { validateSkin, loadSkin, probeSkin } from '../js/skin.js';

const pieces = (extra = () => ({})) => COLORS.map((c, i) => ({ key: c.key, name: c.name, ...extra(c, i) }));

test('validateSkin accepts a well-formed manifest', () => {
  const r = validateSkin({ stick: false, credit: 'x', pieces: pieces((c) => ({ image: `${c.key}.png`, happy: null })) }, COLORS);
  assert.deepEqual(r, { ok: true, errors: [] });
});

test('validateSkin rejects wrong count, wrong order, and paths outside the skin folder', () => {
  assert.equal(validateSkin({ pieces: pieces().slice(0, 4) }, COLORS).ok, false);
  const swapped = pieces();
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  assert.equal(validateSkin({ pieces: swapped }, COLORS).ok, false);
  for (const bad of ['https://example.com/a.png', '../candy/a.png', '/abs.png', 'a.gif', 'sub/a.png']) {
    const r = validateSkin({ pieces: pieces((c, i) => (i === 0 ? { image: bad } : {})) }, COLORS);
    assert.equal(r.ok, false, bad);
  }
});

const fakeJson = (json) => async () => json;
const fakeImages = (ok) => async (url) => {
  if (!ok(url)) throw new Error('404');
  return { url };
};

test('loadSkin falls back to candy for missing images, per piece', async () => {
  const json = { stick: false, credit: 'c', pieces: pieces((c) => ({ image: `${c.key}.png` })) };
  const skin = await loadSkin('members', {
    colors: COLORS,
    fetchJson: fakeJson(json),
    loadImage: fakeImages((url) => !url.endsWith('mau.png')),
  });
  assert.equal(skin.name, 'members');
  assert.equal(skin.pieces[2].image, null);
  assert.equal(skin.pieces[0].image.url, 'assets/skins/members/kurumi.png');
  assert.deepEqual(skin.missing, ['mau:mau.png']);
});

test('loadSkin returns candy for unknown names, bad manifests and unsafe names', async () => {
  const broken = await loadSkin('members', { colors: COLORS, fetchJson: async () => { throw new Error('404'); } });
  assert.equal(broken.name, 'candy');
  const invalid = await loadSkin('members', { colors: COLORS, fetchJson: fakeJson({ pieces: [] }) });
  assert.equal(invalid.name, 'candy');
  const unsafe = await loadSkin('../secret', { colors: COLORS, fetchJson: fakeJson({ pieces: pieces() }) });
  assert.equal(unsafe.name, 'candy');
});

test('every skin.json in the repo is valid', () => {
  const dir = new URL('../assets/skins/', import.meta.url);
  for (const name of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    const json = JSON.parse(readFileSync(new URL(`${name}/skin.json`, dir), 'utf8'));
    const r = validateSkin(json, COLORS);
    assert.ok(r.ok, `${name}: ${r.errors.join(' / ')}`);
  }
});

test('probeSkin: candy always, others only when the first image exists', async () => {
  const json = { pieces: pieces((c) => ({ image: `${c.key}.png` })) };
  assert.equal(await probeSkin('candy', { colors: COLORS }), true);
  assert.equal(await probeSkin('members', { colors: COLORS, fetchJson: fakeJson(json), exists: async () => true }), true);
  assert.equal(await probeSkin('members', { colors: COLORS, fetchJson: fakeJson(json), exists: async () => false }), false);
  assert.equal(await probeSkin('members', { colors: COLORS, fetchJson: fakeJson({ pieces: pieces() }), exists: async () => true }), false);
  assert.equal(await probeSkin('members', { colors: COLORS, fetchJson: async () => { throw new Error('404'); } }), false);
});
