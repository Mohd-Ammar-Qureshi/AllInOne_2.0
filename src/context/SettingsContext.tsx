import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LanguageCode,
} from '../settings/settingsConfig';

const SETTINGS_STORAGE_KEY = '@allinone_app_settings';

type StoredSettings = {
  language: LanguageCode;
  /** Only values the user changed. Anything missing uses its default. */
  notifications: Record<string, boolean>;
};

const DEFAULT_SETTINGS: StoredSettings = {
  language: DEFAULT_LANGUAGE,
  notifications: {},
};

type SettingsContextType = {
  ready: boolean;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  isNotificationEnabled: (id: string, defaultEnabled: boolean) => boolean;
  setNotificationEnabled: (id: string, enabled: boolean) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

/**
 * Device-level app preferences (language, notification switches).
 * Theme lives in ThemeContext; account data lives in AppwriteContext.
 */
export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<StoredSettings>;
          const language = LANGUAGES.some(item => item.code === parsed.language)
            ? (parsed.language as LanguageCode)
            : DEFAULT_LANGUAGE;
          setSettings({
            language,
            notifications: parsed.notifications ?? {},
          });
        }
      } catch {
        // Corrupt or unavailable storage: fall back to defaults.
      } finally {
        setReady(true);
      }
    };

    load();
  }, []);

  // Save after every change, but never before the first load finished.
  useEffect(() => {
    if (!ready) {
      return;
    }

    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)).catch(
      () => {},
    );
  }, [ready, settings]);

  const setLanguage = useCallback((language: LanguageCode) => {
    setSettings(prev => ({ ...prev, language }));
  }, []);

  const setNotificationEnabled = useCallback((id: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [id]: enabled },
    }));
  }, []);

  const isNotificationEnabled = useCallback(
    (id: string, defaultEnabled: boolean) =>
      settings.notifications[id] ?? defaultEnabled,
    [settings.notifications],
  );

  const value = useMemo<SettingsContextType>(
    () => ({
      ready,
      language: settings.language,
      setLanguage,
      isNotificationEnabled,
      setNotificationEnabled,
    }),
    [
      ready,
      settings.language,
      setLanguage,
      isNotificationEnabled,
      setNotificationEnabled,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }

  return context;
};