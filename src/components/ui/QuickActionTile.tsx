import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getTones, radius, spacing, Tone } from '../../theme';
import IconBadge, { MaterialIconName } from './IconBadge';

type Props = {
  title: string;
  subtitle: string;
  icon: MaterialIconName;
  tone: Tone;
  onPress: () => void;
};

/** Tinted action tile: icon circle on the left, coloured title + subtitle. */
const QuickActionTile = ({ title, subtitle, icon, tone, onPress }: Props) => {
  const { colors, isDark } = useTheme();
  const palette = getTones(isDark)[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: palette.tile, opacity: pressed ? 0.9 : 1 },
      ]}>
      <IconBadge
        icon={icon}
        color={palette.text}
        background={palette.circle}
        size={40}
      />
      <View style={styles.text}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: palette.text }]}>
          {title}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
};

export default QuickActionTile;

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    minHeight: 112,
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  text: { width: '100%', minWidth: 0, marginTop: spacing.sm },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 18 },
});
