import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useKeyboardBackHandler } from '../../hooks/useKeyboardBackHandler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import { images } from '../../assets/images';
import AppLogo from '../../components/ui/AppLogo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PlusMark from '../../components/ui/PlusMark';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types/navigation';
import { getReadableTextColor } from '../../utils/color';
import { isValidEmail, isValidPassword } from '../../utils/validation';
import {
  getErrorMessage,
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { radius, spacing, useLayout } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  useKeyboardBackHandler();

  const { colors, isDark } = useTheme();
  const { login } = useAppwrite();
  const { gutter, contentMaxWidth } = useLayout();
  const { height } = useWindowDimensions();
  // Shorter phones get a tighter hero so the form stays on screen.
  const compact = height < 720;
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
      showSuccessSnackbar('Login successful');
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
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingHorizontal: gutter },
          ]}
          keyboardShouldPersistTaps="handled">
          <PlusMark size={64} style={styles.plusLeft} />

          <View style={[styles.column, { maxWidth: contentMaxWidth }]}>
            <View style={[styles.hero, compact && styles.heroCompact]}>
              <View style={styles.heroImageFrame}>
                <Image
                  source={images.loginHeroFade}
                  accessible={false}
                  accessibilityIgnoresInvertColors
                  resizeMode="contain"
                  style={styles.heroImage}
                />
              </View>
              <View style={styles.brand}>
                <AppLogo size={compact ? 52 : 64} />
                <Text style={[styles.brandName, { color: colors.text }]}>
                  AllInOne
                </Text>
                <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
                  Medical marketplace for stores and agencies
                </Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to continue to your workspace
            </Text>

            {error ? (
              <View
                accessibilityLiveRegion="polite"
                style={[styles.errorBanner, { backgroundColor: colors.errorSoft }]}>
                <MaterialIcons name="error-outline" size={20} color={colors.errorText} />
                <Text style={[styles.errorText, { color: colors.errorText }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Input
              leftIcon="mail-outline"
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setError('');
              }}
            />

            <Input
              leftIcon="lock-outline"
              placeholder="Password"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setError('');
              }}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              rightIcon={
                <MaterialIcons
                  name="arrow-forward"
                  size={20}
                  color={getReadableTextColor(colors.primary)}
                />
              }
            />

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate('Signup')}
              style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
                <Text style={[styles.link, { color: colors.primary }]}>
                  Create one
                </Text>
              </Text>
            </TouchableOpacity>

            <Image
              source={isDark ? images.healthLogoDark : images.healthLogo}
              accessible={false}
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              style={styles.tagline}
            />
          </View>

          <PlusMark size={48} style={styles.plusRight} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: spacing.xl },
  column: { width: '100%', alignSelf: 'center' },
  plusLeft: { position: 'absolute', left: -28, top: 280 },
  plusRight: { position: 'absolute', right: -16, bottom: 40 },
  hero: { minHeight: 200, marginTop: spacing.lg, position: 'relative' },
  heroCompact: { minHeight: 160, marginTop: spacing.sm },
  heroImageFrame: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  brand: { width: '48%', alignItems: 'flex-start', gap: spacing.xs },
  brandName: { fontSize: 24, fontWeight: '800', marginTop: spacing.sm },
  brandTagline: { fontSize: 13, lineHeight: 18, maxWidth: '100%' },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700', marginTop: spacing.md },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: spacing.xs, marginBottom: spacing.xl },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  footer: { marginTop: spacing.lg, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  footerText: { fontSize: 15, textAlign: 'center' },
  link: { fontWeight: '700' },
  tagline: { alignSelf: 'center', width: 120, height: 119, marginTop: spacing.lg },
});
