import React, { useEffect, useState } from 'react';
import {
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
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loading from '../../components/Loading';
import { useTheme } from '../../context/ThemeContext';
import { Profile } from '../../types/profile';
import { SharedAppParamList } from '../../types/navigation';
import { USER_ROLE_LABELS } from '../../types/user';
import {
  getErrorMessage,
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<SharedAppParamList, 'Profile'>;

const ProfileScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { user, profile, refreshProfile, updateProfile } = useAppwrite();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [pincode, setPincode] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fillForm = (source: Profile) => {
    setName(source.name ?? '');
    setPhone(source.phone ?? '');
    setAddress(source.address ?? '');
    setCity(source.city ?? '');
    setStateValue(source.state ?? '');
    setPincode(source.pincode ?? '');
  };


  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const latest = await refreshProfile();
        if (cancelled) {
          return;
        }

        const source = latest ?? profile;
        if (source) {
          fillForm(source);
        } else {
          setError('No profile found for this account.');
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        // Fall back to the profile loaded at login, but tell the user.
        if (profile) {
          fillForm(profile);
        }
        setError(getErrorMessage(err, 'Unable to refresh your profile.'));
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
    // Intentionally run once on mount only: refreshProfile/profile are
    // deliberately excluded because context's `profile` reference changes
    // after handleSave() below succeeds, and re-running this effect on that
    // change would refill the form and wipe whatever the user is editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateValue.trim(),
        pincode: pincode.trim(),
      });
      showSuccessSnackbar('Profile updated');
      navigation.goBack();
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to update profile.');
      setError(message);
      showErrorSnackbar(message);
    } finally {
      setSaving(false);
    }
  };

  if (initializing) {
    return <Loading message="Loading profile..." />;
  }

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
              title="Edit Profile"
              subtitle="Update your account details"
              onBack={() => navigation.goBack()}
            />

            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>
                Role
              </Text>
              <Text style={[styles.roleValue, { color: colors.text }]}>
                {profile ? USER_ROLE_LABELS[profile.role] : '—'}
              </Text>
              <Text style={[styles.roleHint, { color: colors.textSecondary }]}>
                Role is set at registration and cannot be changed.
              </Text>

              <Input
                label="Email (from your login)"
                value={user?.email ?? ''}
                editable={false}
                selectTextOnFocus={false}
                style={styles.readOnly}
              />
              <Input
                label="Name"
                value={name}
                onChangeText={setName}
                editable={!saving}
                placeholder="Your name or business name"
              />
              <Input
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                editable={!saving}
                keyboardType="phone-pad"
                placeholder="Phone number"
              />
              <Input
                label="Address"
                value={address}
                onChangeText={setAddress}
                editable={!saving}
                placeholder="Street address"
              />
              <Input
                label="City"
                value={city}
                onChangeText={setCity}
                editable={!saving}
                placeholder="City"
              />
              <Input
                label="State"
                value={stateValue}
                onChangeText={setStateValue}
                editable={!saving}
                placeholder="State"
              />
              <Input
                label="Pincode"
                value={pincode}
                onChangeText={setPincode}
                editable={!saving}
                keyboardType="number-pad"
                placeholder="Pincode"
              />

              {error ? (
                <Text style={[styles.error, { color: colors.error }]}>
                  {error}
                </Text>
              ) : null}

              <Button
                title="Save Changes"
                onPress={handleSave}
                loading={saving}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  roleValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  roleHint: {
    fontSize: 13,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  readOnly: {
    opacity: 0.6,
  },
  error: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
});