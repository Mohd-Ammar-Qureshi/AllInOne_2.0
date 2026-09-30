import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  USER_ROLE_LABELS,
  USER_ROLES,
  UserRole,
} from '../../types/user';
import { radius, spacing } from '../../theme';
import { getReadableTextColor } from '../../utils/color';

type RolePickerProps = {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
  error?: string;
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  medical_store: 'Browse products, place orders, and track purchases.',
  agency: 'List medical products and manage your catalogue and sales.',
};

const RolePicker = ({ value, onChange, error }: RolePickerProps) => {
  const { colors } = useTheme();
  const onPrimary = getReadableTextColor(colors.primary);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Account Role
      </Text>
      <View style={styles.options}>
        {USER_ROLES.map(role => {
          const selected = value === role;

          return (
            <Pressable
              key={role}
              accessibilityRole="button"
              onPress={() => onChange(role)}
              style={[
                styles.option,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : colors.surfaceSecondary,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.optionTitle,
                  { color: selected ? onPrimary : colors.text },
                ]}>
                {USER_ROLE_LABELS[role]}
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  {
                    color: selected ? onPrimary : colors.textSecondary,
                  },
                ]}>
                {ROLE_DESCRIPTIONS[role]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
};

export default RolePicker;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    marginTop: spacing.xs,
    fontSize: 13,
  },
});