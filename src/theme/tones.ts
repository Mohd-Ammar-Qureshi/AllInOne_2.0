export type Tone = 'green' | 'blue' | 'purple' | 'peach' | 'pink' | 'teal';

export type ToneColors = {
  /** Card / panel background. */
  card: string;
  /** Icon circle background. */
  circle: string;
  /** Tile background (slightly stronger than card). */
  tile: string;
  /** Icon and title colour. */
  text: string;
};

const light: Record<Tone, ToneColors> = {
  green: { card: '#F1FCF6', circle: '#DDF5DE', tile: '#E4F6EE', text: '#0B7A4B' },
  blue: { card: '#F0F6FF', circle: '#DCEBFF', tile: '#E5EFFD', text: '#1D5FD1' },
  purple: { card: '#F6F5FE', circle: '#E8E1FB', tile: '#EEE9FC', text: '#6D4CC9' },
  peach: { card: '#FDF8E4', circle: '#FFF1C2', tile: '#FFF3E0', text: '#A85D00' },
  pink: { card: '#FDF2F8', circle: '#FBE4F2', tile: '#FCE9F4', text: '#B02A78' },
  teal: { card: '#EEF9FA', circle: '#D4F1F3', tile: '#E1F6F7', text: '#0B6E78' },
};

const dark: Record<Tone, ToneColors> = {
  green: { card: '#10231B', circle: '#17352A', tile: '#133024', text: '#6EE7B7' },
  blue: { card: '#0F1E36', circle: '#17305A', tile: '#12264A', text: '#93C5FD' },
  purple: { card: '#1B1730', circle: '#2A2150', tile: '#231D44', text: '#C4B5FD' },
  peach: { card: '#2A2010', circle: '#3D2E12', tile: '#33270F', text: '#FCD34D' },
  pink: { card: '#2A1424', circle: '#43213A', tile: '#361A2F', text: '#F9A8D4' },
  teal: { card: '#0F2326', circle: '#163A40', tile: '#122F34', text: '#5EEAD4' },
};

export const getTones = (isDark: boolean): Record<Tone, ToneColors> =>
  isDark ? dark : light;
