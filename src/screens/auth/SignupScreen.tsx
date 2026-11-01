import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useKeyboardBackHandler } from '../../hooks/useKeyboardBackHandler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import AppLogo from '../../components/ui/AppLogo';
import Button from '../../components/ui/Button';
import PlusMark from '../../components/ui/PlusMark';
import Input from '../../components/ui/Input';
import RolePicker from '../../components/ui/RolePicker';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types/navigation';
import { UserRole } from '../../types/user';
import { isValidEmail, isValidPassword } from '../../utils/validation';
import {
  getErrorMessage,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { getReadableTextColor } from '../../utils/color';
import { radius, spacing, useLayout } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const SignupScreen = ({ navigation }: Props) => {
  useKeyboardBackHandler();
  const { colors } = useTheme();
  const { gutter, contentMaxWidth } = useLayout();
  const { register } = useAppwrite();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [pincode, setPincode] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');
    setRoleError('');

    if (!name.trim() || !email.trim() || !password || !repeatPassword) {
      setError('Name, email, and password are required');
      return;
    }

    if (!role) {
      setRoleError('Please select your account role');
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

    if (password !== repeatPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone,
        address,
        city,
        state: stateValue,
        pincode,
      });
      showSuccessSnackbar('Account created successfully');
    } catch (err: unknown) {
      const appwriteError = err as { code?: number; message?: string };

      if (appwriteError.code === 409) {
        setError('This email is already registered.');
        return;
      }

      setError(getErrorMessage(err, 'Unable to create account.'));
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
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingHorizontal: gutter },
          ]}
          keyboardShouldPersistTaps="handled">
          <PlusMark size={56} style={styles.plusRight} />
          <View style={[styles.column, { maxWidth: contentMaxWidth }]}>
          <View style={styles.header}>
            <AppLogo size={52} />
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join the AllInOne B2B medical marketplace
            </Text>
          </View>

          <View>
            <RolePicker
              value={role}
              onChange={nextRole => {
                setRole(nextRole);
                setRoleError('');
              }}
              error={roleError}
            />

            <Input
              label="Full Name / Business Name"
              leftIcon="person-outline"
              placeholder="City Medical Store"
              value={name}
              onChangeText={text => {
                setName(text);
                setError('');
              }}
            />

            <Input
              label="Email"
              leftIcon="mail-outline"
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
              label="Phone"
              leftIcon="phone"
              placeholder="9880008084"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Input
              label="Address"
              leftIcon="location-on"
              placeholder="123 main street"
              value={address}
              onChangeText={setAddress}
            />

            <Input
              label="City"
              leftIcon="location-city"
              placeholder="Mumbai"
              value={city}
              onChangeText={setCity}
            />

            <Input
              label="State"
              leftIcon="map"
              placeholder="Maharashtra"
              value={stateValue}
              onChangeText={setStateValue}
            />

            <Input
              label="Pincode"
              leftIcon="pin-drop"
              placeholder="400001"
              keyboardType="number-pad"
              value={pincode}
              onChangeText={setPincode}
            />

            <Input
              label="Password"
              leftIcon="lock-outline"
              placeholder="Minimum 8 characters"
              secureTextEntry
              value={password}
              onChangeText={text => {
                setPassword(text);
                setError('');
              }}
            />

            <Input
              label="Confirm Password"
              leftIcon="lock-outline"
              placeholder="Repeat your password"
              secureTextEntry
              value={repeatPassword}
              onChangeText={text => {
                setRepeatPassword(text);
                setError('');
              }}
            />

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

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              rightIcon={
                <MaterialIcons
                  name="arrow-forward"
                  size={20}
                  color={getReadableTextColor(colors.primary)}
                />
              }
            />

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
                <Text style={[styles.link, { color: colors.primary }]}>
                  Sign in
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
  },
  column: { width: '100%', alignSelf: 'center' },
  plusRight: { position: 'absolute', right: -14, top: 60 },
  header: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  footerText: {
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 15,
  },
  link: {
    fontWeight: '700',
  },
});
