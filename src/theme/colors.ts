export type ThemeColors = {
  primary: string;
  primaryDark: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  overlay: string;
  fab: string;
  statusActive: string;
  statusDraft: string;
  statusOutOfStock: string;
  /** Very light blue wash for tinted buttons, selected rows and hero areas. */
  primaryTint: string;
  /** Soft blue for icon circles and selected-state backgrounds. */
  primaryLight: string;
  /** Border for tinted/outlined controls. */
  borderStrong: string;
  /** Hairline between rows and around cards. */
  divider: string;
  /** Secondary ICONS and chevrons only (about 3.8:1). Text and placeholders use textSecondary. */
  textMuted: string;
  /** Pill search field background. */
  searchBackground: string;
  successSoft: string;
  successText: string;
  warningSoft: string;
  warningText: string;
  errorSoft: string;
  errorText: string;
  infoSoft: string;
  infoText: string;
};

export const lightColors: ThemeColors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#56667D',
  border: '#E2E8F0',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  overlay: 'rgba(15, 23, 42, 0.45)',
  fab: '#2563EB',
  statusActive: '#16A34A',
  statusDraft: '#64748B',
  statusOutOfStock: '#DC2626',
  primaryTint: '#F0F6FF',
  primaryLight: '#E3EEFF',
  borderStrong: '#C9DBF7',
  divider: '#EDF2F7',
  textMuted: '#74859C',
  searchBackground: '#F1F6FD',
  successSoft: '#E4F6EE',
  successText: '#0B7A4B',
  warningSoft: '#FFF2DD',
  warningText: '#975200',
  errorSoft: '#FDECEC',
  errorText: '#B3261E',
  infoSoft: '#E7F0FD',
  infoText: '#1D5FD1',
};

export const darkColors: ThemeColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  background: '#0B1120',
  surface: '#111827',
  surfaceSecondary: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  error: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  overlay: 'rgba(0, 0, 0, 0.6)',
  fab: '#3B82F6',
  statusActive: '#4ADE80',
  statusDraft: '#94A3B8',
  statusOutOfStock: '#F87171',
  primaryTint: '#101C33',
  primaryLight: '#172B52',
  borderStrong: '#2B4A7E',
  divider: '#1F2A3D',
  textMuted: '#7B8BA3',
  searchBackground: '#162033',
  successSoft: '#0F2A1E',
  successText: '#4ADE80',
  warningSoft: '#33240A',
  warningText: '#FBBF24',
  errorSoft: '#341517',
  errorText: '#F87171',
  infoSoft: '#13233F',
  infoText: '#93C5FD',
};
