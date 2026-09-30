import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { IconName } from '../../settings/settingsConfig';
import { radius, spacing } from '../../theme';
import { BOTTOM_NAV_HEIGHT } from '../../theme/layout';
import { getReadableTextColor } from '../../utils/color';

export type BottomNavItem<K extends string> = {
  key: K;
  label: string;
  icon: IconName;
  /** Small count bubble on the icon (e.g. items in the cart). Hidden at 0. */
  badge?: number;
};

type Props<K extends string> = {
  items: BottomNavItem<K>[];
  activeKey: K;
  onSelect: (key: K) => void;
};

/**
 * Fixed bottom navigation bar shared by the customer and seller areas.
 *
 * It is a normal row at the bottom of the screen layout (not an overlay), so
 * it can never cover content. It adds the Android navigation-bar inset itself,
 * so render the screen's SafeAreaView with edges={['top', 'left', 'right']}.
 */
const BottomNav = <K extends string>({
  items,
  activeKey,
  onSelect,
}: Props<K>) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom,
        },
      ]}>
      {items.map(item => {
        const selected = item.key === activeKey;
        const color = selected ? colors.primary : colors.textSecondary;
        const badge = item.badge && item.badge > 0 ? item.badge : 0;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              badge ? `${item.label}, ${badge} items` : item.label
            }
            onPress={() => onSelect(item.key)}
            style={({ pressed }) => [
              styles.item,
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <View
              style={[
                styles.iconPill,
                selected && { backgroundColor: `${colors.primary}22` },
              ]}>
              <MaterialIcons name={item.icon} size={24} color={color} />
              {badge ? (
                <View
                  style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text
                    style={[
                      styles.badgeText,
                      { color: getReadableTextColor(colors.error) },
                    ]}>
                    {badge > 9 ? '9+' : badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              style={[
                styles.label,
                selected && styles.labelSelected,
                { color },
              ]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  item: {
    flex: 1,
    height: BOTTOM_NAV_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconPill: {
    width: 56,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: spacing.xs,
  },
  labelSelected: {
    fontWeight: '700',
  },
});