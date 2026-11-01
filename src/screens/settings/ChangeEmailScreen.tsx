import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, shadows } from '../../theme';
import { SettingsStackParamList } from '../../types/navigation';
import { showErrorSnackbar, showSuccessSnackbar } from '../../utils/errorHandler';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { getEmailChangeError } from '../../utils/validation';

type Props = NativeStackScreenProps<SettingsStackParamList, 'ChangeEmail'>;

const ChangeEmailScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { user, changeEmail } = useAppwrite();

  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmEmailError, setConfirmEmailError] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

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
      if (verificationSent) {
        showSuccessSnackbar('Verification email sent to your new email address.');
      } else {
        showErrorSnackbar(
          sendError ??
            'We could not send the verification email. Please try again.',
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
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <AppHeader
              title="Change email"
              subtitle="Update your sign-in email"
              onBack={() => navigation.goBack()}
            />

            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Current email: {user?.email ?? '—'}. The new address replaces
                it on your account right away, and you will need to verify it
                before you can keep using the app.
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
                error={emailError}
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

export default ChangeEmailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
});
