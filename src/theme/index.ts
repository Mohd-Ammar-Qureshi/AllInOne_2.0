export { lightColors, darkColors } from './colors';
export type { ThemeColors } from './colors';
export { spacing, radius, sizes } from './spacing';
export { typography } from './typography';
export type { TypographyVariant } from './typography';
export { shadows } from './shadows';
export { getTones } from './tones';
export type { Tone, ToneColors } from './tones';
export { useLayout, MAX_FONT_SCALE } from './responsive';

/** The theme that is actually applied. */
export type ThemeMode = 'light' | 'dark';

/** What the user picks in Settings. 'system' follows the phone setting. */
export type ThemePreference = ThemeMode | 'system';
