import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  darkColors,
  lightColors,
  ThemeColors,
  ThemeMode,
  ThemePreference,
} from '../theme';

const THEME_STORAGE_KEY = '@allinone_theme_mode';

type ThemeContextType = {
  /** The theme currently applied (never 'system'). */
  mode: ThemeMode;
  /** The user's choice: light, dark or system. */
  preference: ThemePreference;
  colors: ThemeColors;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isThemePreference(stored)) {
          setPreferenceState(stored);
        }
      } catch {
        // Keep the default preference if storage is unavailable.
      }
    };

    loadTheme();
  }, []);

  const mode: ThemeMode =
    preference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The theme still applies for this session.
    }
  }, []);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setPreference(next);
    },
    [setPreference],
  );

  const toggleTheme = useCallback(() => {
    setPreference(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setPreference]);

  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      preference,
      colors: mode === 'dark' ? darkColors : lightColors,
      isDark: mode === 'dark',
      setPreference,
      setMode,
      toggleTheme,
    }),
    [mode, preference, setPreference, setMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};