import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import OptionSheet from '../../components/settings/OptionSheet';
import ProfileSummaryCard from '../../components/settings/ProfileSummaryCard';
import SegmentedControl from '../../components/settings/SegmentedControl';
import SettingsRow from '../../components/settings/SettingsRow';
import SettingsSection from '../../components/settings/SettingsSection';
import AppHeader from '../../components/ui/AppHeader';
import { APP_NAME, APP_VERSION } from '../../constants/appInfo';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ACCOUNT_TYPE_LABELS,
  getLanguageLabel,
  getSettingsSections,
  IconName,
  LANGUAGES,
  LanguageCode,
  SettingsItem,
} from '../../settings/settingsConfig';
import { ThemePreference, spacing } from '../../theme';
import { getLicenseStatus } from '../../utils/license';
import {
  AgencyStackParamList,
  SettingsStackParamList,
} from '../../types/navigation';
import {
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: IconName;
}[] = [
    { value: 'light', label: 'Light', icon: 'light-mode' },
    { value: 'dark', label: 'Dark', icon: 'dark-mode' },
    { value: 'system', label: 'System', icon: 'brightness-auto' },
  ];

const SettingsScreen = ({ navigation }: Props) => {
  const { colors, preference, setPreference } = useTheme();
  const { user, profile, role, logout } = useAppwrite();
  const { language, setLanguage } = useSettings();

  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Profile and Licence screens live in the parent (role) stack.
  const openAppScreen = (screen: 'Profile' | 'LicenseVerification') => {
    navigation
      .getParent<NativeStackNavigationProp<AgencyStackParamList>>()
      ?.navigate(screen);
  };

  const getSubtitle = (item: SettingsItem): string | undefined => {
    if (item.kind === 'appLink' && item.id === 'licence') {
      const licence = getLicenseStatus(profile);
      return licence === 'verified'
        ? 'Verified'
        : licence === 'pending'
          ? 'Under review'
          : 'Not verified yet';
    }
    if (item.kind === 'link' && item.id === 'account' && role) {
      return ACCOUNT_TYPE_LABELS[role];
    }
    return undefined;
  };

  const renderItem = (item: SettingsItem) => {
    switch (item.kind) {
      case 'link':
        return (
          <SettingsRow
            key={item.id}
            icon={item.icon}
            title={item.title}
            subtitle={getSubtitle(item)}
            onPress={() => navigation.navigate(item.screen)}
          />
        );
      case 'appLink':
        return (
          <SettingsRow
            key={item.id}
            icon={item.icon}
            title={item.title}
            subtitle={getSubtitle(item)}
            onPress={() => openAppScreen(item.screen)}
          />
        );
      case 'language':
        return (
          <SettingsRow
            key={item.id}
            icon={item.icon}
            title={item.title}
            value={getLanguageLabel(language)}
            onPress={() => setLanguageSheetOpen(true)}
          />
        );
      case 'appearance':
        return (
          <View key={item.id} style={styles.appearance}>
            <Text style={[styles.appearanceTitle, { color: colors.text }]}>
              Appearance
            </Text>
            <SegmentedControl
              options={APPEARANCE_OPTIONS}
              value={preference}
              onChange={setPreference}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);
            const success = await logout();
            if (success) {
              showSuccessSnackbar('Logout successful');
            } else {
              showErrorSnackbar('Unable to log out. Please try again.');
              setLoggingOut(false);
            }
          } catch {
            showErrorSnackbar('Unable to log out. Please try again.');
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const badges = [
    ...(role
      ? [{ label: ACCOUNT_TYPE_LABELS[role], tone: 'primary' as const }]
      : []),
    ...(role === 'agency'
      ? [
        getLicenseStatus(profile) === 'verified'
          ? { label: 'Licence verified', tone: 'success' as const }
          : getLicenseStatus(profile) === 'pending'
            ? { label: 'Licence under review', tone: 'warning' as const }
            : { label: 'Licence needed', tone: 'warning' as const },]
      : []),
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <AppHeader
            title="Settings"
            subtitle="Manage your account and app"
            onBack={() => navigation.getParent()?.goBack()}
          />

          <ProfileSummaryCard
            name={profile?.name ?? ''}
            email={user?.email ?? ''}
            badges={badges}
            onPress={() => openAppScreen('Profile')}
          />

          {getSettingsSections(role).map(section => (
            <SettingsSection key={section.id} title={section.title}>
              {section.items.map(renderItem)}
            </SettingsSection>
          ))}

          <SettingsSection>
            <SettingsRow
              icon="logout"
              title={loggingOut ? 'Logging out...' : 'Log out'}
              danger
              disabled={loggingOut}
              onPress={confirmLogout}
            />
          </SettingsSection>

          <Text style={[styles.footer, { color: colors.textSecondary }]}>
            {APP_NAME} v{APP_VERSION}
          </Text>
        </View>
      </ScrollView>

      <OptionSheet<LanguageCode>
        visible={languageSheetOpen}
        title="Language"
        selected={language}
        options={LANGUAGES.map(item => ({
          value: item.code,
          label: item.label,
          description: item.nativeLabel,
          disabled: !item.available,
          badge: item.available ? undefined : 'Coming soon',
        }))}
        onSelect={code => {
          setLanguage(code);
          setLanguageSheetOpen(false);
        }}
        onClose={() => setLanguageSheetOpen(false)}
      />
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  appearance: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  appearanceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: spacing.sm,
  },
});