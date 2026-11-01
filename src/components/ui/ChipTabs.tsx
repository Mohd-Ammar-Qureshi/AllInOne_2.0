import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, sizes, spacing } from '../../theme';
import { getReadableTextColor } from '../../utils/color';

export type ChipOption<K extends string> = { key: K; label: string };

type Props<K extends string> = {
  options: ChipOption<K>[];
  value: K;
  onChange: (key: K) => void;
};

/** Horizontally scrolling filter chips; the selected one is filled. */
const ChipTabs = <K extends string>({ options, value, onChange }: Props<K>) => {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={styles.scroll}
      contentContainerStyle={styles.row}>
      {options.map(option => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.key)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: selected
                    ? getReadableTextColor(colors.primary)
                    : colors.textSecondary,
                },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

export default ChipTabs;

const styles = StyleSheet.create({
  // A horizontal ScrollView would otherwise stretch vertically.
  scroll: { flexGrow: 0 },
  row: { paddingVertical: spacing.sm, alignItems: 'center', gap: spacing.sm },
  chip: {
    minHeight: sizes.controlHeightSmall,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: { fontSize: 13, fontWeight: '600' },
});
