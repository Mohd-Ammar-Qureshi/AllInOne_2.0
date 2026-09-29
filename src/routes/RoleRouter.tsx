import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../appwrite/AppwriteContext';
import Button from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { AgencyStack } from './AgencyStack';
import { MedicalStoreStack } from './MedicalStoreStack';
import { radius, spacing } from '../theme';

export const RoleRouter = () => {
  const { colors } = useTheme();
  const { role, logout } = useAppwrite();

  if (role === 'medical_store') {
    return <MedicalStoreStack />;
  }

  if (role === 'agency') {
    return <AgencyStack />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Profile unavailable
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Your account is signed in, but no valid role profile was found. Sign
          out and complete registration again, or contact support.
        </Text>
        <Button title="Sign Out" variant="danger" onPress={() => logout()} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});