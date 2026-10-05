import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getOrderStatusLabel, Order } from '../../types/order';
import { radius, spacing } from '../../theme';

type Props = Pick<Order, 'status'> &
  Partial<Pick<Order, 'customerDeliveryAccepted' | 'sellerDeliveryConfirmed'>>;

// Text colours for the light theme. The theme's own status colours are fine on
// the dark background but too pale on white (contrast 2.8-3.9:1, below the
// 4.5:1 WCAG AA minimum), so light mode uses a darker shade of the same hue.
const LIGHT_MODE_TEXT = {
  warning: '#92400E',
  active: '#166534',
  inactive: '#B91C1C',
  info: '#1D4ED8',
};

const OrderStatusPill = ({
  status,
  customerDeliveryAccepted,
  sellerDeliveryConfirmed,
}: Props) => {
  const { colors, isDark } = useTheme();

  const deliveryAccepted = status === 'shipped' && Boolean(customerDeliveryAccepted);

  // Shipped (amber) -> Delivery Accepted (blue) -> Delivered (green).
  const tone = deliveryAccepted
    ? 'info'
    : status === 'delivered' || status === 'accepted'
      ? 'active'
      : status === 'rejected' || status === 'cancelled'
        ? 'inactive'
        : 'warning';

  const hue =
    tone === 'active'
      ? colors.statusActive
      : tone === 'inactive'
        ? colors.statusOutOfStock
        : tone === 'info'
          ? colors.primary
          : colors.warning;

  const textColor = isDark ? hue : LIGHT_MODE_TEXT[tone];

  return (
    <View style={[styles.pill, { backgroundColor: `${hue}22` }]}>
      <Text style={[styles.label, { color: textColor }]}>
        {getOrderStatusLabel({
          status,
          customerDeliveryAccepted,
          sellerDeliveryConfirmed,
        })}
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
