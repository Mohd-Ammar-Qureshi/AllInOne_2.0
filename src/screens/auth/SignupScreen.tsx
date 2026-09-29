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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import Button from '../../components/ui/Button';
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
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const SignupScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join AllInOne B2B medical marketplace
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
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
              placeholder="City Medical Store"
              value={name}
              onChangeText={text => {
                setName(text);
                setError('');
              }}
            />

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
              label="Phone"
              placeholder="9880008084"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Input
              label="Address"
              placeholder="123 main street"
              value={address}
              onChangeText={setAddress}
            />

            <Input
              label="City"
              placeholder="Mumbai"
              value={city}
              onChangeText={setCity}
            />

            <Input
              label="State"
              placeholder="Maharashtra"
              value={stateValue}
              onChangeText={setStateValue}
            />

            <Input
              label="Pincode"
              placeholder="400001"
              keyboardType="number-pad"
              value={pincode}
              onChangeText={setPincode}
            />

            <Input
              label="Password"
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
              placeholder="Repeat your password"
              secureTextEntry
              value={repeatPassword}
              onChangeText={text => {
                setRepeatPassword(text);
                setError('');
              }}
            />

            {error ? (
              <Text style={[styles.error, { color: colors.error }]}>
                {error}
              </Text>
            ) : null}

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
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
