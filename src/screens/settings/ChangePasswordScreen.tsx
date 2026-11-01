import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../../appwrite/authService';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, shadows } from '../../theme';
import { SettingsStackParamList } from '../../types/navigation';
import {
  getErrorMessage,
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { isValidPassword } from '../../utils/validation';

type Props = NativeStackScreenProps<SettingsStackParamList, 'ChangePassword'>;

const ChangePasswordScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleChangePassword = () => {
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

    Alert.alert(
      'Change password?',
      'Your password will be changed. You will stay signed in on this device. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change Password', onPress: performPasswordChange },
      ],
    );
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
              title="Change password"
              subtitle="Choose a strong password"
              onBack={() => navigation.goBack()}
            />

            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

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
  error: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
});
