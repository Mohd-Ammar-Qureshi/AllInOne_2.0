import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
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
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { isValidLicenseNumber } from '../../utils/validation';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<
  AgencyStackParamList,
  'LicenseVerification'
>;

/**
 * One-time agency licence verification.
 *
 * Triggered the first time an agency tries to add/sell a product and
 * profile.licenseVerified is not yet true. Writes licenseNumber +
 * licenseVerified onto the existing `profiles` row — no new table needed.
 * Once verified, this screen is never shown again for that agency.
 */
const LicenseVerificationScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { profile, updateProfile } = useAppwrite();

  const [licenseNumber, setLicenseNumber] = useState(
    profile?.licenseNumber ?? '',
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const alreadyVerified = Boolean(profile?.licenseVerified);

  const handleVerify = async () => {
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
      await updateProfile({
        licenseNumber: trimmed,
        licenseVerified: true,
      });
      showSuccessSnackbar('Licence verified. You can now add products.');
      navigation.goBack();
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to verify licence.');
      setError(message);
      showErrorSnackbar(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                <MaterialIcons name="badge" size={32} color={colors.primary} />
              </View>

              {alreadyVerified ? (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Licence already verified
                  </Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    Your drug/trade licence is on file. You won't be asked
                    for this again.
                  </Text>
                  <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
                </>
              ) : (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Before you sell your first product
                  </Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    We verify every agency's drug/trade licence once. This
                    protects medical stores buying on the marketplace. You
                    won't need to do this again for future products.
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
                    title="Verify & Continue"
                    onPress={handleVerify}
                    loading={loading}
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
});
