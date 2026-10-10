import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import VerificationLayout from '../../components/auth/VerificationLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { useCooldown } from '../../hooks/useCooldown';
import { radius, spacing } from '../../theme';
import { getAuthErrorMessage } from '../../utils/authErrors';
import {
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { getEmailChangeError } from '../../utils/validation';

const EmailVerificationScreen = () => {
  const { colors } = useTheme();
  const {
    user,
    hasCachedPassword,
    emailLinkError,
    refreshUser,
    sendEmailVerification,
    changeEmail,
    setEmailLinkError,
    logout,
  } = useAppwrite();

  const remaining = useCooldown('email', user?.$id);

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [changing, setChanging] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const busy = checking || resending || changing;

  const handleCheck = async () => {
    if (busy) {
      return;
    }
    setMessage('');
    setEmailLinkError(null);
    try {
      setChecking(true);
      const account = await refreshUser();
      if (account.emailVerification) {
        showSuccessSnackbar('Email verified successfully.');
        return; // Router moves on to the app by itself.
      }
      setMessage(
        'Your email is not verified yet. Open the link we sent, then come back and check again.',
      );
    } catch (err) {
      showErrorSnackbar(getAuthErrorMessage(err, 'account'));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (busy || remaining > 0) {
      return;
    }
    setMessage('');
    try {
      setResending(true);
      const result = await sendEmailVerification();
      if (result === 'sent') {
        showSuccessSnackbar('A new verification email has been sent.');
        setMessage(`We sent a new link to ${user?.email}.`);
      }
    } catch (err) {
      showErrorSnackbar(getAuthErrorMessage(err, 'emailSend'));
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = async () => {
    if (busy) {
      return;
    }
    setFormError('');
    setConfirmError('');
    const pairError = getEmailChangeError(newEmail, confirmEmail);
    if (pairError) {
      if (pairError.field === 'confirm') {
        setConfirmError(pairError.message);
      } else {
        setFormError(pairError.message);
      }
      return;
    }
    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setFormError('That is already your email address.');
      return;
    }
    if (!hasCachedPassword && !password) {
      setFormError('Enter your password to confirm this change.');
      return;
    }
    try {
      setChanging(true);
      const { verificationSent, sendError } = await changeEmail(newEmail, password);
      setChangeOpen(false);
      setNewEmail('');
      setConfirmEmail('');
      setPassword('');
      setMessage(
        verificationSent
          ? 'Email updated. We sent a verification link to the new address.'
          : 'Email updated, but we could not send the link yet. Tap "Resend verification email".',
      );
      if (verificationSent) {
        showSuccessSnackbar('Verification email sent to your new email address.');
      } else {
        showErrorSnackbar(
          sendError ?? 'We could not send the verification email. Please try again.',
        );
      }
    } catch (err) {
      const failure = getAuthErrorMessage(err, 'emailChange');
      setFormError(failure);
      showErrorSnackbar(failure);
    } finally {
      setChanging(false);
    }
  };

  const handleSignOut = async () => {
    const ok = await logout();
    if (!ok) {
      showErrorSnackbar('Could not sign out. Check your connection.');
    }
  };

  return (
    <VerificationLayout
      title="Verify your email"
      subtitle={
        remaining > 0
          ? 'We sent a verification link to the address below. Open it, then come back to continue.'
          : 'Check your inbox for the verification link, or tap Resend to get a new one.'
      }>
      <View
        style={[styles.emailBox, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>
          Email waiting for verification
        </Text>
        <Text style={[styles.email, { color: colors.text }]} selectable>
          {user?.email}
        </Text>
        <Text style={[styles.status, { color: colors.warning }]}>
          Status: Not verified
        </Text>
      </View>

      {emailLinkError ? (
        <Text style={[styles.error, { color: colors.error }]}>
          {emailLinkError}
        </Text>
      ) : null}
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}

      <Button
        title="I've verified my email"
        onPress={handleCheck}
        loading={checking}
        disabled={resending || changing}
      />
      <Button
        title={
          remaining > 0
            ? `Resend verification email (${remaining}s)`
            : 'Resend verification email'
        }
        variant="secondary"
        onPress={handleResend}
        loading={resending}
        disabled={remaining > 0 || checking || changing}
        style={styles.gap}
      />

      {changeOpen ? (
        <View style={styles.changeForm}>
          <Input
            label="New email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={newEmail}
            onChangeText={text => {
              setNewEmail(text);
              setFormError('');
              setConfirmError('');
            }}
          />
          <Input
            label="Confirm new email"
            placeholder="Re-enter the new email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmEmail}
            onChangeText={text => {
              setConfirmEmail(text);
              setFormError('');
              setConfirmError('');
            }}
            error={confirmError}
          />
          {!hasCachedPassword ? (
            <Input
              label="Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={password}
              onChangeText={text => {
                setPassword(text);
                setFormError('');
              }}
            />
          ) : null}
          {formError ? (
            <Text style={[styles.error, { color: colors.error }]}>
              {formError}
            </Text>
          ) : null}
          <Button
            title="Update email & send link"
            onPress={handleChangeEmail}
            loading={changing}
            disabled={checking || resending}
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => {
              setChangeOpen(false);
              setFormError('');
              setConfirmError('');
              setConfirmEmail('');
            }}
            disabled={changing}
            style={styles.gap}
          />
        </View>
      ) : (
        <Button
          title="Change email"
          variant="ghost"
          onPress={() => setChangeOpen(true)}
          disabled={busy}
          style={styles.gap}
        />
      )}

      <Button
        title="Sign out"
        variant="ghost"
        onPress={handleSignOut}
        disabled={busy}
        style={styles.gap}
      />
    </VerificationLayout>
  );
};

export default EmailVerificationScreen;

const styles = StyleSheet.create({
  emailBox: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emailLabel: { fontSize: 13, marginBottom: spacing.xs },
  email: { fontSize: 17, fontWeight: '700' },
  status: { fontSize: 14, fontWeight: '600', marginTop: spacing.sm },
  error: { fontSize: 14, marginBottom: spacing.md },
  message: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  gap: { marginTop: spacing.md },
  changeForm: { marginTop: spacing.lg },
});
