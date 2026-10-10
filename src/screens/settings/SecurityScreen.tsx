import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import authService from '../../appwrite/authService';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme';
import { SettingsStackParamList } from '../../types/navigation';
import {
  getErrorMessage,
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { getEmailChangeError, isValidPassword } from '../../utils/validation';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Security'>;

const SecurityScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { user, changeEmail } = useAppwrite();

  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmEmailError, setConfirmEmailError] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (saving) {
      return;
    }

    setError('');

    if (!currentPassword) {
      setError('Enter your current password');
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from the current one');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Inputs are valid: ask before doing anything. Cancel changes nothing and
    // leaves the form as it is.
    Alert.alert(
      'Change password?',
      'Your password will be changed. You will stay signed in on this device. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change Password', onPress: performPasswordChange },
      ],
    );
  };

  // The existing password-change logic, unchanged; it now runs only after the
  // user confirms.
  const performPasswordChange = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      await authService.updatePassword(newPassword, currentPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccessSnackbar('Password updated');
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to update password.');
      setError(message);
      showErrorSnackbar(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (changingEmail) {
      return;
    }

    setEmailError('');
    setConfirmEmailError('');

    const pairError = getEmailChangeError(newEmail, confirmEmail);
    if (pairError) {
      if (pairError.field === 'confirm') {
        setConfirmEmailError(pairError.message);
      } else {
        setEmailError(pairError.message);
      }
      return;
    }

    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError('That is already your email address.');
      return;
    }

    if (!emailPassword) {
      setEmailError('Enter your current password');
      return;
    }

    try {
      setChangingEmail(true);
      const { verificationSent, sendError } = await changeEmail(
        newEmail,
        emailPassword,
      );
      // Appwrite has now switched the account to the new, unverified address,
      // so the app moves to the verification screen by itself.
      if (verificationSent) {
        showSuccessSnackbar('Verification email sent to your new email address.');
      } else {
        showErrorSnackbar(
          sendError ?? 'We could not send the verification email. Please try again.',
        );
      }
    } catch (err) {
      const message = getAuthErrorMessage(err, 'emailChange');
      setEmailError(message);
      showErrorSnackbar(message);
    } finally {
      setChangingEmail(false);
    }
  };

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
              title="Security"
              subtitle="Keep your account safe"
              onBack={() => navigation.goBack()}
            />

            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.title, { color: colors.text }]}>
                Change password
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Use at least 8 characters. You will stay signed in on this
                device.
              </Text>

              <Input
                label="Current password"
                value={currentPassword}
                onChangeText={text => {
                  setCurrentPassword(text);
                  setError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
              <Input
                label="New password"
                value={newPassword}
                onChangeText={text => {
                  setNewPassword(text);
                  setError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
              <Input
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={text => {
                  setConfirmPassword(text);
                  setError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />

              {error ? (
                <Text style={[styles.error, { color: colors.error }]}>
                  {error}
                </Text>
              ) : null}

              <Button
                title="Update password"
                onPress={handleChangePassword}
                loading={saving}
              />
            </View>

            <View
              style={[
                styles.card,
                styles.cardSpacing,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.title, { color: colors.text }]}>
                Change email
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Current email: {user?.email}. The new address replaces it on
                your account right away, and you will need to verify it before
                you can keep using the app.
              </Text>

              <Input
                label="New email"
                value={newEmail}
                onChangeText={text => {
                  setNewEmail(text);
                  setEmailError('');
                  setConfirmEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!changingEmail}
              />
              <Input
                label="Confirm new email"
                value={confirmEmail}
                onChangeText={text => {
                  setConfirmEmail(text);
                  setEmailError('');
                  setConfirmEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!changingEmail}
                error={confirmEmailError}
              />
              <Input
                label="Current password"
                value={emailPassword}
                onChangeText={text => {
                  setEmailPassword(text);
                  setEmailError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!changingEmail}
              />

              {emailError ? (
                <Text style={[styles.error, { color: colors.error }]}>
                  {emailError}
                </Text>
              ) : null}

              <Button
                title="Change email & send verification"
                onPress={handleChangeEmail}
                loading={changingEmail}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SecurityScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardSpacing: { marginTop: spacing.lg },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  error: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
});
