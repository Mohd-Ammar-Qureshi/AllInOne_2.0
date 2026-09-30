import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useKeyboardBackHandler } from '../../hooks/useKeyboardBackHandler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types/navigation';
import { getReadableTextColor } from '../../utils/color';
import { isValidEmail, isValidPassword } from '../../utils/validation';
import {
  getErrorMessage,
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  useKeyboardBackHandler();

  const { colors } = useTheme();
  const { login } = useAppwrite();
  const onPrimary = getReadableTextColor(colors.primary);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      showSuccessSnackbar('Welcome back!');
    } catch (err) {
      const message = getErrorMessage(
        err,
        'Login failed. Please check your credentials.',
      );
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
        behavior='padding'>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, { backgroundColor: colors.primary }]}>
            <Text style={[styles.heroTitle, { color: onPrimary }]}>
              AllInOne
            </Text>
            <Text style={[styles.heroSubtitle, { color: onPrimary }]}>
              B2B medical marketplace for medical stores and medical agencies
            </Text>
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to continue to your workspace
            </Text>

            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setError('');
              }}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={text => {
                setPassword(text);
                setError('');
              }}
            />

            {error ? (
              <Text style={[styles.error, { color: colors.error }]}>
                {error}
              </Text>
            ) : null}

            <Button title="Sign In" onPress={handleLogin} loading={loading} />

            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
                <Text style={[styles.link, { color: colors.primary }]}>
                  Create one
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl + spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    marginTop: -spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: spacing.xl,
  },
  error: {
    fontSize: 14,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  footerText: {
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 15,
  },
  link: {
    fontWeight: '700',
  },
});