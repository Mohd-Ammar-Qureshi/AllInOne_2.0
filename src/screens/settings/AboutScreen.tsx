import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsRow from '../../components/settings/SettingsRow';
import SettingsSection from '../../components/settings/SettingsSection';
import AppHeader from '../../components/ui/AppHeader';
import {
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
  SUPPORT_EMAIL,
} from '../../constants/appInfo';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme';
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
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="storefront" size={40} color="#FFFFFF" />
            </View>
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
  logo: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});