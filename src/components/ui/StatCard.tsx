import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getTones, radius, spacing, Tone } from '../../theme';
import IconBadge, { MaterialIconName } from './IconBadge';

type Props = {
  label: string;
  value: string | number;
  icon: MaterialIconName;
  tone: Tone;
  onPress?: () => void;
};

/** Centred tinted tile: coloured icon circle, big number, small label. */
const StatCard = ({ label, value, icon, tone, onPress }: Props) => {
  const { colors, isDark } = useTheme();
  const palette = getTones(isDark)[tone];

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${value}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.card, opacity: pressed ? 0.9 : 1 },
      ]}>
      <IconBadge icon={icon} color={palette.text} background={palette.circle} size={42} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={[styles.value, { color: colors.text }]}>
        {value}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
};

export default StatCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  value: {
    marginTop: spacing.sm,
    maxWidth: '100%',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  label: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
