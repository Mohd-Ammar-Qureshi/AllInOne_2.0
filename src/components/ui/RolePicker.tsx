import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  USER_ROLE_LABELS,
  USER_ROLES,
  UserRole,
} from '../../types/user';
import { radius, spacing } from '../../theme';

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
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(role)}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? colors.primaryTint : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
                selected && styles.optionSelected,
              ]}>
              <View
                style={[
                  styles.radio,
                  { borderColor: selected ? colors.primary : colors.borderStrong },
                ]}>
                {selected ? (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {USER_ROLE_LABELS[role]}
                </Text>
                <Text
                  style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {ROLE_DESCRIPTIONS[role]}
                </Text>
              </View>
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
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  optionSelected: { borderWidth: 1.5 },
  optionText: { flex: 1, minWidth: 0 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
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