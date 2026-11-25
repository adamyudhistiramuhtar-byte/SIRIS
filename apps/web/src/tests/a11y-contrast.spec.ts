import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// SRS-71: pasangan warna yang dipakai shell dan badge harus memenuhi WCAG 2.2 AA (4,5:1
// untuk teks biasa) pada ketiga tema. Nilai dibaca dari tokens.css hasil generate, bukan
// disalin, agar perubahan token yang menurunkan kontras terdeteksi.
const css = readFileSync(resolve(__dirname, '../styles/generated/tokens.css'), 'utf8');

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf('\n}', start);
  return css.slice(start, end);
}
function token(theme: string, name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(block(`[data-theme="${theme}"]`));
  if (!match) throw new Error(`Token --${name} tidak ditemukan pada tema ${theme}`);
  return match[1];
}
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const THEMES = ['light', 'dark', 'high-contrast'];

describe('Kontras warna shell dan badge (SRS-71, WCAG 2.2 AA)', () => {
  it.each(THEMES)('menu aktif: warna teks navigasi terpilih pada latar aktif, tema %s', (theme) => {
    expect(
      ratio(token(theme, 'color-nav-selected'), token(theme, 'color-bg-active')),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(THEMES)('badge UC: teks info pada latar info, tema %s', (theme) => {
    expect(
      ratio(token(theme, 'color-feedback-info-fg'), token(theme, 'color-feedback-info-bg')),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('warna aksen mentah pada latar aktif TIDAK cukup (alasan token nav dipakai)', () => {
    expect(
      ratio(token('light', 'color-accent-default'), token('light', 'color-bg-active')),
    ).toBeLessThan(4.5);
  });
});
