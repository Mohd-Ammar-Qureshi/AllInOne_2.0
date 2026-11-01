import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../context/ThemeContext';
import { getOrderStatusLabel, Order } from '../../types/order';
import { radius, spacing } from '../../theme';
import { MaterialIconName } from './IconBadge';

type Props = Pick<Order, 'status'> &
  Partial<Pick<Order, 'customerDeliveryAccepted' | 'sellerDeliveryConfirmed'>>;

type Tone = 'warning' | 'success' | 'error' | 'info';

const ICONS: Record<Order['status'], MaterialIconName> = {
  pending: 'schedule',
  accepted: 'check-circle',
  rejected: 'cancel',
  cancelled: 'block',
  shipped: 'local-shipping',
  delivered: 'done-all',
};

/**
 * Pastel status pill with an icon. Colours come from the theme's soft/text
 * pairs, which are chosen to pass WCAG AA contrast in light and dark mode.
 */
const OrderStatusPill = ({
  status,
  customerDeliveryAccepted,
  sellerDeliveryConfirmed,
}: Props) => {
  const { colors } = useTheme();

  const deliveryAccepted =
    status === 'shipped' && Boolean(customerDeliveryAccepted);

  // Shipped (amber) -> Delivery Accepted (blue) -> Delivered (green).
  const tone: Tone = deliveryAccepted
    ? 'info'
    : status === 'delivered' || status === 'accepted'
      ? 'success'
      : status === 'rejected' || status === 'cancelled'
        ? 'error'
        : 'warning';

  const palette = {
    warning: { bg: colors.warningSoft, fg: colors.warningText },
    success: { bg: colors.successSoft, fg: colors.successText },
    error: { bg: colors.errorSoft, fg: colors.errorText },
    info: { bg: colors.infoSoft, fg: colors.infoText },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <MaterialIcons
        name={deliveryAccepted ? 'inventory' : ICONS[status]}
        size={14}
        color={palette.fg}
      />
      <Text style={[styles.label, { color: palette.fg }]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  label: { fontSize: 12, fontWeight: '700' },
});
