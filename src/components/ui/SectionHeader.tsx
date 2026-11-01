import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';

type Props = {
  title: string;
  /** Optional right-hand link, e.g. "See all". */
  actionLabel?: string;
  onAction?: () => void;
  /** Optional element instead of a text link (e.g. a small button). */
  right?: React.ReactNode;
};

const SectionHeader = ({ title, actionLabel, onAction, right }: Props) => {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {right ??
        (actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={8}
            onPress={onAction}
            style={styles.action}>
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {actionLabel}
            </Text>
            <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
          </Pressable>
        ) : null)}
    </View>
  );
};

export default SectionHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { flexShrink: 1, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 14, fontWeight: '700' },
});
