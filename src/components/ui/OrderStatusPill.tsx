import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ORDER_STATUS_LABELS, OrderStatus } from '../../types/order';
import { radius, spacing } from '../../theme';

type Props = {
  status: OrderStatus;
};

// Text colours for the light theme. The theme's own status colours are fine on
// the dark background but too pale on white (contrast 2.8-3.9:1, below the
// 4.5:1 WCAG AA minimum), so light mode uses a darker shade of the same hue.
const LIGHT_MODE_TEXT = {
  warning: '#92400E',
  active: '#166534',
  inactive: '#B91C1C',
};

const OrderStatusPill = ({ status }: Props) => {
  const { colors, isDark } = useTheme();

  const tone =
    status === 'delivered' || status === 'accepted'
      ? 'active'
      : status === 'rejected' || status === 'cancelled'
        ? 'inactive'
        : 'warning';

  const hue =
    tone === 'active'
      ? colors.statusActive
      : tone === 'inactive'
        ? colors.statusOutOfStock
        : colors.warning;

  const textColor = isDark ? hue : LIGHT_MODE_TEXT[tone];

  return (
    <View style={[styles.pill, { backgroundColor: `${hue}22` }]}>
      <Text style={[styles.label, { color: textColor }]}>
        {ORDER_STATUS_LABELS[status]}
      </Text>
    </View>
  );
};

export default OrderStatusPill;

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  label: { fontSize: 12, fontWeight: '700' },
});