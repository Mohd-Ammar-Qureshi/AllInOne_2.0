import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import IconBadge from '../ui/IconBadge';
import { useTheme } from '../../context/ThemeContext';
import { IconName } from '../../settings/settingsConfig';
import { spacing } from '../../theme';

type SettingsRowProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  /** Short value shown on the right, e.g. the current language. */
  value?: string;
  onPress?: () => void;
  /** Replaces the chevron, e.g. a Switch. */
  right?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
};

const SettingsRow = ({
  icon,
  title,
  subtitle,
  value,
  onPress,
  right,
  danger = false,
  disabled = false,
}: SettingsRowProps) => {
  const { colors } = useTheme();
  const accent = danger ? colors.error : colors.primary;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      disabled={disabled || !onPress}
      onPress={onPress}
      android_ripple={{ color: colors.surfaceSecondary }}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      <IconBadge
        icon={icon}
        color={accent}
        background={danger ? colors.errorSoft : colors.primaryLight}
        size={38}
      />

      <View style={styles.textWrap}>
        <Text
          style={[styles.title, { color: danger ? colors.error : colors.text }]}
          numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text
          style={[styles.value, { color: colors.textSecondary }]}
          numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {right ??
        (onPress && !danger ? (
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
          />
        ) : null)}
    </Pressable>
  );
};

export default SettingsRow;

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  value: {
    fontSize: 14,
    maxWidth: 120,
  },
});