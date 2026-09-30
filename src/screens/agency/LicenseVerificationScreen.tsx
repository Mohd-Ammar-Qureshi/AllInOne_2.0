import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { AgencyStackParamList } from '../../types/navigation';
import {
  getErrorMessage,
  showErrorSnackbar,
  showInfoSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { getLicenseStatus, getRejectionReason } from '../../utils/license';
import { isValidLicenseNumber } from '../../utils/validation';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<
  AgencyStackParamList,
  'LicenseVerification'
>;

/**
 * Agency licence verification.
 *
 * The agency submits its drug/trade licence number once. It is saved on the
 * existing `profiles` row and stays "under review" until an admin approves it
 * (the review-license Function). The app can no longer verify an agency
 * itself. The screen re-checks the latest profile whenever it opens, so an
 * approval shows up without logging in again.
 */
const LicenseVerificationScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { profile, user, updateProfile, refreshProfile, getCurrentUser, setUser } =
    useAppwrite();

  const status = getLicenseStatus(profile);
  const rejectionReason = status === 'none' ? getRejectionReason(user) : null;

  const [licenseNumber, setLicenseNumber] = useState(
    profile?.licenseNumber ?? '',
  );
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const reload = useCallback(async () => {
    const [latestUser] = await Promise.all([getCurrentUser(), refreshProfile()]);
    if (latestUser) {
      setUser(latestUser);
    }
  }, [getCurrentUser, refreshProfile, setUser]);

  // Pick up an approval/rejection made while the app was open.
  useFocusEffect(
    useCallback(() => {
      reload().catch(() => undefined);
    }, [reload]),
  );

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      await reload();
      showInfoSnackbar('Status updated.');
    } catch (err) {
      showErrorSnackbar(err, "Couldn't check your status. Try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    setError('');

    const trimmed = licenseNumber.trim();

    if (!trimmed) {
      setError('Licence number is required to start selling');
      return;
    }

    if (!isValidLicenseNumber(trimmed)) {
      setError('Enter a valid licence number (at least 6 characters)');
      return;
    }

    try {
      setLoading(true);
      await updateProfile({ licenseNumber: trimmed });
      setEditing(false);
      showSuccessSnackbar('Licence submitted for review.');
    } catch (err) {
      const message = getErrorMessage(err, "Couldn't submit your licence.");
      setError(message);
      showErrorSnackbar(message);
    } finally {
      setLoading(false);
    }
  };

  const showForm = status === 'none' || editing;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <AppHeader
              title="Licence Verification"
              subtitle="One-time check before you can sell"
              onBack={() => navigation.goBack()}
            />

            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.surfaceSecondary },
                ]}>
                <MaterialIcons
                  name={
                    status === 'verified'
                      ? 'verified'
                      : status === 'pending'
                        ? 'hourglass-top'
                        : 'badge'
                  }
                  size={32}
                  color={colors.primary}
                />
              </View>

              {status === 'verified' ? (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Licence verified
                  </Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    Your drug/trade licence is approved. You won't be asked
                    for this again.
                  </Text>
                  <Button
                    title="Back"
                    variant="secondary"
                    onPress={() => navigation.goBack()}
                  />
                </>
              ) : showForm ? (
                <>
                  {rejectionReason !== null ? (
                    <View
                      accessibilityRole="alert"
                      style={[
                        styles.notice,
                        {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.error,
                        },
                      ]}>
                      <Text style={[styles.noticeTitle, { color: colors.error }]}>
                        Your last licence wasn't approved
                      </Text>
                      <Text style={[styles.noticeBody, { color: colors.text }]}>
                        {rejectionReason ||
                          'Please check the number and submit it again.'}
                      </Text>
                    </View>
                  ) : null}

                  <Text style={[styles.title, { color: colors.text }]}>
                    {status === 'pending'
                      ? 'Change your licence number'
                      : 'Before you sell your first product'}
                  </Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    We check every agency's drug/trade licence once. This
                    protects medical stores buying on the marketplace. Once
                    it's approved you won't need to do this again.
                  </Text>

                  <Input
                    label="Drug / Trade Licence Number"
                    placeholder="e.g. MH-DL-2024-013567"
                    autoCapitalize="characters"
                    value={licenseNumber}
                    onChangeText={text => {
                      setLicenseNumber(text);
                      setError('');
                    }}
                  />

                  {error ? (
                    <Text style={[styles.error, { color: colors.error }]}>
                      {error}
                    </Text>
                  ) : null}

                  <Button
                    title="Submit for Review"
                    onPress={handleSubmit}
                    loading={loading}
                  />
                  {status === 'pending' ? (
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => {
                        setEditing(false);
                        setLicenseNumber(profile?.licenseNumber ?? '');
                        setError('');
                      }}
                      style={styles.secondaryAction}
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Licence under review
                  </Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    We're checking your licence number. You can add products as
                    soon as it's approved.
                  </Text>

                  <View
                    style={[
                      styles.numberRow,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}>
                    <Text
                      style={[styles.numberLabel, { color: colors.textSecondary }]}>
                      Submitted licence number
                    </Text>
                    <Text style={[styles.numberValue, { color: colors.text }]}>
                      {profile?.licenseNumber}
                    </Text>
                  </View>

                  <Button
                    title="Check Status"
                    onPress={handleCheckStatus}
                    loading={checking}
                  />
                  <Button
                    title="Change Licence Number"
                    variant="secondary"
                    onPress={() => setEditing(true)}
                    style={styles.secondaryAction}
                  />
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LicenseVerificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'stretch',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  error: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  notice: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  noticeTitle: { fontSize: 15, fontWeight: '800' },
  noticeBody: { fontSize: 14, lineHeight: 20 },
  numberRow: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: 2,
  },
  numberLabel: { fontSize: 12, fontWeight: '600' },
  numberValue: { fontSize: 16, fontWeight: '700' },
  secondaryAction: { marginTop: spacing.md },
});