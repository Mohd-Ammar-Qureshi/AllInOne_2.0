export { lightColors, darkColors } from './colors';
export type { ThemeColors } from './colors';
export { spacing, radius } from './spacing';

/** The theme that is actually applied. */
export type ThemeMode = 'light' | 'dark';

/** What the user picks in Settings. 'system' follows the phone setting. */
export type ThemePreference = ThemeMode | 'system';