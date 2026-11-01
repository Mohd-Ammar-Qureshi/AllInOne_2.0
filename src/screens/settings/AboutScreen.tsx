import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsRow from '../../components/settings/SettingsRow';
import SettingsSection from '../../components/settings/SettingsSection';
import AppHeader from '../../components/ui/AppHeader';
import AppLogo from '../../components/ui/AppLogo';
import {
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
  SUPPORT_EMAIL,
} from '../../constants/appInfo';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';
import { SettingsStackParamList } from '../../types/navigation';
import { showInfoSnackbar } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<SettingsStackParamList, 'About'>;

const AboutScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();

  const contactSupport = async () => {
    try {
      await Linking.openURL(
        `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
          `${APP_NAME} support`,
        )}`,
      );
    } catch {
      showInfoSnackbar(`Email us at ${SUPPORT_EMAIL}`);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AppHeader
            title="About"
            subtitle={`${APP_NAME} v${APP_VERSION}`}
            onBack={() => navigation.goBack()}
          />

          <View style={styles.hero}>
            <AppLogo size={88} />
            <Text style={[styles.name, { color: colors.text }]}>
              {APP_NAME}
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              {APP_TAGLINE}
            </Text>
          </View>

          <SettingsSection>
            <SettingsRow icon="info" title="Version" subtitle={APP_VERSION} />
            <SettingsRow
              icon="mail"
              title="Contact support"
              subtitle={SUPPORT_EMAIL}
              onPress={contactSupport}
            />
          </SettingsSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});