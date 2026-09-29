import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme';

type SettingsSectionProps = {
  title?: string;
  children: React.ReactNode;
};

/** A titled card that groups related rows and draws dividers between them. */
const SettingsSection = ({ title, children }: SettingsSectionProps) => {
  const { colors } = useTheme();
  const items = React.Children.toArray(children);

  return (
    <View style={styles.wrapper}>
      {title ? (
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {title}
        </Text>
      ) : null}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        {items.map((child, index) => (
          <View key={index}>
            {child}
            {index < items.length - 1 ? (
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
};

export default SettingsSection;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
});