// Skins: what a piece looks like. Rules never change — color index 0–4 is always the same member.
//
//   assets/skins/<name>/skin.json   manifest (see assets/skins/README.md)
//   assets/skins/<name>/*.png       optional piece art, 512 × 512, transparent
//
// Faces per piece (all optional): image (normal), happy (being traced), pop (the instant it bursts),
// fever (during fever), pose (the result screen). Missing faces fall back: pop → happy → image, fever → image.
//
// A piece without art (or whose art fails to load) falls back to the drawn candy, so a half-finished
// skin is still playable. Images must be same-origin: cross-origin art would taint the canvas and
// break exporting the share card.

const NAME_RE = /^[a-z0-9_-]+$/;
const FILE_RE = /^[A-Za-z0-9_-]+\.(png|webp)$/;
export const FACES = ['image', 'happy', 'pop', 'fever', 'pose'];

export function validateSkin(json, colors) {
  const errors = [];
  if (!json || typeof json !== 'object') return { ok: false, errors: ['skin.json がオブジェクトではありません'] };
  const pieces = Array.isArray(json.pieces) ? json.pieces : [];
  if (pieces.length !== colors.length) errors.push(`pieces は ${colors.length} 個必要です（${pieces.length} 個）`);
  colors.forEach((c, i) => {
    const p = pieces[i];
    if (!p) return;
    if (p.key !== c.key) errors.push(`pieces[${i}].key は "${c.key}" の順番です（"${p.key}"）`);
    for (const field of FACES) {
      const v = p[field];
      if (v == null) continue;
      if (typeof v !== 'string' || !FILE_RE.test(v)) {
        errors.push(`pieces[${i}].${field} はスキンのフォルダ内のファイル名だけを書きます（"${v}"）`);
      }
    }
  });
  if (json.stick != null && typeof json.stick !== 'boolean') errors.push('stick は true / false');
  if (json.credit != null && typeof json.credit !== 'string') errors.push('credit は文字列');
  return { ok: errors.length === 0, errors };
}

// Cheap check for the title switch: manifest is valid and the first piece image exists.
// Doesn't download the art (HEAD request).
export async function probeSkin(name, { colors, base = 'assets/skins', fetchJson = fetchBrowserJson, exists = headExists } = {}) {
  if (name === 'candy') return true;
  if (!NAME_RE.test(name)) return false;
  try {
    const json = await fetchJson(`${base}/${name}/skin.json`);
    if (!validateSkin(json, colors).ok) return false;
    const first = json.pieces.find((p) => p.image);
    return first ? await exists(`${base}/${name}/${first.image}`) : false;
  } catch {
    return false;
  }
}

async function headExists(url) {
  const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
  return res.ok;
}

export function candySkin(colors) {
  return {
    name: 'candy',
    title: '飴',
    stick: true,
    credit: '',
    pieces: colors.map((c) => ({ key: c.key, ...Object.fromEntries(FACES.map((f) => [f, null])) })),
    missing: [],
  };
}

// loadImage(url) → Promise<image>; injected so tests can run without a DOM.
export async function loadSkin(name, { colors, base = 'assets/skins', loadImage = loadBrowserImage, fetchJson = fetchBrowserJson } = {}) {
  if (!name || name === 'candy' || !NAME_RE.test(name)) return candySkin(colors);
  let json;
  try {
    json = await fetchJson(`${base}/${name}/skin.json`);
  } catch (err) {
    console.warn(`[skin] ${name}: skin.json を読めませんでした。飴で遊びます`, err);
    return candySkin(colors);
  }
  const { ok, errors } = validateSkin(json, colors);
  if (!ok) {
    console.warn(`[skin] ${name}: skin.json の形が違います。飴で遊びます\n- ${errors.join('\n- ')}`);
    return candySkin(colors);
  }

  const missing = [];
  const load = async (key, file) => {
    if (!file) return null;
    try {
      return await loadImage(`${base}/${name}/${file}`);
    } catch {
      missing.push(`${key}:${file}`);
      return null;
    }
  };
  const pieces = await Promise.all(json.pieces.map(async (p) => {
    const faces = await Promise.all(FACES.map((f) => load(p.key, p[f])));
    return { key: p.key, ...Object.fromEntries(FACES.map((f, i) => [f, faces[i]])) };
  }));
  if (missing.length) console.warn(`[skin] ${name}: 読めなかった画像（その駒は飴になります）: ${missing.join(', ')}`);

  return {
    name,
    title: json.title ?? name,
    stick: json.stick ?? false,
    credit: json.credit ?? '',
    pieces,
    missing,
  };
}

function loadBrowserImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`load failed: ${url}`));
    img.src = url;
  });
}

async function fetchBrowserJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}
