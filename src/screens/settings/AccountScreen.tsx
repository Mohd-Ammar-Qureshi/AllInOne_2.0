import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import SettingsRow from '../../components/settings/SettingsRow';
import SettingsSection from '../../components/settings/SettingsSection';
import AppHeader from '../../components/ui/AppHeader';
import { useTheme } from '../../context/ThemeContext';
import {
  ACCOUNT_TYPE_DESCRIPTIONS,
  ACCOUNT_TYPE_LABELS,
} from '../../settings/settingsConfig';
import { radius, spacing } from '../../theme';
import { SettingsStackParamList } from '../../types/navigation';
import { USER_ROLE_LABELS } from '../../types/user';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Account'>;

const formatDate = (iso?: string): string => {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
};

const AccountScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { user, role } = useAppwrite();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AppHeader
            title="Account"
            subtitle="Your sign-in and account type"
            onBack={() => navigation.goBack()}
          />

          {role ? (
            <View
              style={[
                styles.typeCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
                Account type
              </Text>
              <Text style={[styles.typeValue, { color: colors.text }]}>
                {ACCOUNT_TYPE_LABELS[role]}
              </Text>
              <Text style={[styles.typeRole, { color: colors.primary }]}>
                {USER_ROLE_LABELS[role]}
              </Text>
              <Text style={[styles.typeBody, { color: colors.textSecondary }]}>
                {ACCOUNT_TYPE_DESCRIPTIONS[role]}
              </Text>
              <Text style={[styles.typeHint, { color: colors.textSecondary }]}>
                Account type is chosen at registration and cannot be changed.
              </Text>
            </View>
          ) : null}

          <SettingsSection title="Sign-in details">
            <SettingsRow
              icon="mail"
              title="Email"
              subtitle={user?.email ?? '—'}
            />
            <SettingsRow
              icon="verified-user"
              title="Email status"
              subtitle={user?.emailVerification ? 'Verified' : 'Not verified'}
            />
            <SettingsRow
              icon="calendar-today"
              title="Member since"
              subtitle={formatDate(user?.$createdAt)}
            />
          </SettingsSection>

          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Your email is managed by your login account. To change it, contact
            support.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  typeCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  typeValue: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  typeRole: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  typeBody: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  typeHint: {
    fontSize: 13,
    marginTop: spacing.md,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.xs,
  },
});