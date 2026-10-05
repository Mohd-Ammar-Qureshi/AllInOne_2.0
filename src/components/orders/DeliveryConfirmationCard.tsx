import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getDeliveryStage, Order } from '../../types/order';
import { radius, spacing } from '../../theme';
import DeliveryActionButton, { DeliveryViewerRole } from './DeliveryActionButton';

type Props = {
  order: Order;
  viewerRole: DeliveryViewerRole | null;
  onAcceptDelivery: () => Promise<void>;
  onConfirmDelivered: () => Promise<void>;
};

/**
 * Delivery section for both Order Details screens. It renders nothing before
 * shipping and for cancelled/rejected orders.
 */
const DeliveryConfirmationCard = ({
  order,
  viewerRole,
  onAcceptDelivery,
  onConfirmDelivered,
}: Props) => {
  const { colors } = useTheme();
  const stage = getDeliveryStage(order);

  if (!viewerRole || stage === 'not_shipped' || stage === 'closed') {
    return null;
  }

  const isBuyer = viewerRole === 'buyer';
  const completed = stage === 'completed';

  const message =
    stage === 'awaiting_customer'
      ? isBuyer
        ? 'Seller has shipped your order.'
        : 'Waiting for customer to accept the delivery.'
      : isBuyer
        ? 'You have accepted the delivery.\n\nWaiting for seller confirmation.'
        : 'Customer has accepted the delivery.';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {completed ? 'Delivery Completed' : 'Delivery Status'}
      </Text>

      {completed ? (
        <View style={styles.checks}>
          <Text style={[styles.check, { color: colors.success }]}>
            ✓ Customer accepted delivery
          </Text>
          <Text style={[styles.check, { color: colors.success }]}>
            ✓ Seller confirmed delivery
          </Text>
        </View>
      ) : (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}

      {stage === 'awaiting_customer' ? (
        <DeliveryActionButton
          action="accept_delivery"
          viewerRole={viewerRole}
          onPerform={onAcceptDelivery}
        />
      ) : null}
      {stage === 'awaiting_seller' ? (
        <DeliveryActionButton
          action="confirm_delivered"
          viewerRole={viewerRole}
          onPerform={onConfirmDelivered}
        />
      ) : null}
    </View>
  );
};

export default DeliveryConfirmationCard;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { fontSize: 15, fontWeight: '800', marginBottom: spacing.xs },
  message: { fontSize: 14, lineHeight: 20 },
  checks: { gap: spacing.xs },
  check: { fontSize: 14, fontWeight: '600' },
});
