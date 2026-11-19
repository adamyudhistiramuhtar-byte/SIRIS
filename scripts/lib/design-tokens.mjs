// Pustaka generator token desain SIRIS (SRS-45 / T-11).
// Sumber tunggal: blok JSON DTCG pada design.md §4.9. Modul ini hanya mengekstrak,
// memvalidasi, dan menerjemahkan registry ke CSS custom properties sesuai design.md §8.2.

const THEMES = ['light', 'dark', 'high-contrast'];
const BASE = 'base';

/** Ambil blok JSON registry dari design.md §4.9 tanpa mengubah isinya. */
export function extractRegistryText(markdown) {
  const text = markdown.replace(/\r\n/g, '\n');
  const heading = text.indexOf('### 4.9');
  if (heading === -1) throw new Error('Bagian "### 4.9" tidak ditemukan di design.md');
  const open = text.indexOf('```json\n', heading);
  if (open === -1) throw new Error('Blok ```json pada §4.9 tidak ditemukan');
  const start = open + '```json\n'.length;
  const close = text.indexOf('\n```', start);
  if (close === -1) throw new Error('Penutup blok JSON pada §4.9 tidak ditemukan');
  return text.slice(start, close) + '\n';
}

/** Ratakan pohon DTCG menjadi daftar token berjalur titik. */
export function flatten(registry) {
  const tokens = new Map();
  const walk = (node, path) => {
    if (node && typeof node === 'object' && '$value' in node) {
      tokens.set(path.join('.'), { path, type: node.$type, value: node.$value });
      return;
    }
    if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) walk(child, [...path, key]);
    }
  };
  walk(registry, []);
  return tokens;
}

const aliasOf = (value) => {
  if (typeof value !== 'string') return null;
  const match = /^\{([^{}]+)\}$/.exec(value);
  return match ? match[1] : null;
};

/** Pastikan semua alias terselesaikan dan tidak ada siklus. */
export function validateAliases(tokens) {
  const errors = [];
  for (const [name, token] of tokens) {
    const seen = new Set([name]);
    let current = token;
    for (;;) {
      const target = aliasOf(current.value);
      if (!target) break;
      if (!tokens.has(target)) {
        errors.push(`Alias tidak ditemukan: ${name} -> ${target}`);
        break;
      }
      if (seen.has(target)) {
        errors.push(`Siklus alias: ${[...seen, target].join(' -> ')}`);
        break;
      }
      seen.add(target);
      current = tokens.get(target);
    }
  }
  return errors;
}

const round = (n) => Math.round(n * 255);
const hex2 = (n) => round(n).toString(16).padStart(2, '0').toUpperCase();

function renderColor(value, name) {
  const [r, g, b] = value.components;
  if (value.alpha === 1) {
    const computed = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
    if (value.hex && value.hex.toUpperCase() !== computed) {
      throw new Error(`Field hex tidak konsisten dengan komponen sRGB pada ${name}: ${value.hex} != ${computed}`);
    }
    return computed;
  }
  return `rgba(${round(r)}, ${round(g)}, ${round(b)}, ${value.alpha})`;
}

const dimension = (v) => `${v.value}${v.unit}`;

function renderFontFamily(list) {
  return list.map((f) => (/^[A-Za-z][A-Za-z0-9-]*$/.test(f) ? f : `"${f}"`)).join(', ');
}

function renderLiteral(token, name) {
  switch (token.type) {
    case 'color':
      return renderColor(token.value, name);
    case 'dimension':
    case 'duration':
      return dimension(token.value);
    case 'number':
      return name.endsWith('.prose-ch') ? `${token.value}ch` : String(token.value);
    case 'fontWeight':
      return String(token.value);
    case 'fontFamily':
      return renderFontFamily(token.value);
    case 'cubicBezier':
      return `cubic-bezier(${token.value.join(', ')})`;
    case 'shadow': {
      const v = token.value;
      const parts = [dimension(v.offsetX), dimension(v.offsetY), dimension(v.blur), dimension(v.spread), renderColor(v.color, name)];
      return (v.inset ? 'inset ' : '') + parts.join(' ');
    }
    default:
      throw new Error(`Tipe token tidak didukung: ${token.type} pada ${name}`);
  }
}

/** Nama CSS publik: buang prefix layer/tema, titik menjadi tanda hubung. */
export function cssName(path) {
  return `--${path.slice(2).join('-')}`;
}

const isEmitted = (token) => token.path[0] !== 'primitive';
const scopeOf = (token) => token.path[1];

/** Terjemahkan satu token ke nilai CSS; alias ke non-primitive tetap menjadi var(). */
function renderValue(tokens, token, name) {
  const target = aliasOf(token.value);
  if (!target) return renderLiteral(token, name);
  const targetToken = tokens.get(target);
  if (targetToken.path[0] === 'primitive') {
    // Primitive tidak dikonsumsi langsung: nilainya diinline pada token semantic.
    // Nama token pemanggil dipertahankan agar aturan unit (mis. prose-ch) tetap berlaku.
    return renderValue(tokens, targetToken, name);
  }
  return `var(${cssName(targetToken.path)})`;
}

/** Hasilkan CSS, deteksi benturan nama, dan kumpulkan statistik. */
export function buildCss(tokens) {
  const errors = validateAliases(tokens);
  if (errors.length) throw new Error(errors.join('\n'));

  const groups = { [BASE]: [] };
  for (const theme of THEMES) groups[theme] = [];
  for (const [name, token] of tokens) {
    if (!isEmitted(token)) continue;
    const scope = scopeOf(token);
    if (!groups[scope]) throw new Error(`Scope tidak dikenal: ${scope} pada ${name}`);
    groups[scope].push({ name, token, css: cssName(token.path), value: renderValue(tokens, token, name) });
  }

  // Benturan nama setelah normalisasi: dicek per tema (base + tema yang sama).
  const collisions = [];
  for (const theme of THEMES) {
    const owner = new Map();
    for (const entry of [...groups[BASE], ...groups[theme]]) {
      if (owner.has(entry.css)) collisions.push(`${entry.css}: ${owner.get(entry.css)} <-> ${entry.name}`);
      owner.set(entry.css, entry.name);
    }
  }
  if (collisions.length) throw new Error(`Benturan nama CSS:\n${collisions.join('\n')}`);

  const block = (selector, entries, title) => {
    const lines = [`${selector} {`, `  /* ${title} */`];
    for (const e of entries) lines.push(`  ${e.css}: ${e.value};`);
    lines.push('}');
    return lines.join('\n');
  };

  const css = [
    '/* BERKAS HASIL GENERATE — JANGAN DIEDIT MANUAL.',
    ' * Sumber: design.md §4.9 (registry DTCG). Perintah: npm run tokens:generate.',
    ' * Primitive tidak diemit; komponen hanya memakai semantic/component token. */',
    '',
    block(':root', groups[BASE], 'semantic.base + component.base'),
    '',
    block(':root,\n[data-theme="light"]', groups.light, 'semantic.light + component.light (tema V1)'),
    '',
    block('[data-theme="dark"]', groups.dark, 'semantic.dark + component.dark (reserved, belum diaktifkan di V1)'),
    '',
    block('[data-theme="high-contrast"]', groups['high-contrast'], 'semantic.high-contrast + component.high-contrast (fallback desain)'),
    '',
  ].join('\n');

  return {
    css,
    stats: {
      total: tokens.size,
      primitive: [...tokens.values()].filter((t) => t.path[0] === 'primitive').length,
      base: groups[BASE].length,
      light: groups.light.length,
      dark: groups.dark.length,
      highContrast: groups['high-contrast'].length,
    },
  };
}
