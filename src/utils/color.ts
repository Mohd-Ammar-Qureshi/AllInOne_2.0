const DARK_TEXT = '#0B1120';
const LIGHT_TEXT = '#FFFFFF';

const channel = (value: number): number => {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const luminance = (hex: string): number => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/**
 * Returns white or near-black, whichever is easier to read on `background`
 * (WCAG contrast). Needs a 6-digit hex colour like "#3B82F6".
 * On the dark theme's light blue/red this picks dark text; on the light
 * theme's saturated blue/red it keeps white.
 */
export const getReadableTextColor = (background: string): string =>
  contrast(LIGHT_TEXT, background) >= contrast(DARK_TEXT, background)
    ? LIGHT_TEXT
    : DARK_TEXT;