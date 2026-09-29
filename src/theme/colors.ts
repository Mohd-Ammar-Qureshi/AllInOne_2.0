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
};

export const lightColors: ThemeColors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  overlay: 'rgba(15, 23, 42, 0.45)',
  fab: '#2563EB',
  statusActive: '#16A34A',
  statusDraft: '#64748B',
  statusOutOfStock: '#DC2626',
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
};
