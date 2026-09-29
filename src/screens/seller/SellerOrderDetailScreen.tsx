import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import orderService from '../../appwrite/orderService';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import ErrorState from '../../components/ui/ErrorState';
import Loading from '../../components/Loading';
import { useTheme } from '../../context/ThemeContext';
import { AgencyStackParamList } from '../../types/navigation';
import {
  NEXT_SELLER_STATUSES,
  Order,
  OrderItem,
  ORDER_STATUS_LABELS,
  OrderStatus,
} from '../../types/order';
import { formatPrice } from '../../utils/format';
import {
  getErrorMessage,
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<AgencyStackParamList, 'SellerOrderDetail'>;

const ACTION_LABELS: Record<OrderStatus, string> = {
  pending: 'Mark Pending',
  accepted: 'Accept Order',
  rejected: 'Reject Order',
  shipped: 'Mark Shipped',
  delivered: 'Mark Delivered',
  cancelled: 'Cancel Order',
};

const SellerOrderDetailScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const [orderRow, itemRows] = await Promise.all([
        orderService.getOrder(orderId),
        orderService.listOrderItems(orderId),
      ]);
      setOrder(orderRow);
      setItems(itemRows);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load this order.'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const handleTransition = (nextStatus: OrderStatus) => {
    if (!order) {
      return;
    }
    Alert.alert(
      ACTION_LABELS[nextStatus],
      `Change this order's status to "${ORDER_STATUS_LABELS[nextStatus]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setUpdating(true);
              const updated = await orderService.updateOrderStatus(
                orderId,
                nextStatus,
              );
              setOrder(updated);
              showSuccessSnackbar(`Order marked as ${ORDER_STATUS_LABELS[nextStatus]}`);
            } catch (err) {
              showErrorSnackbar(err, 'Unable to update order status.');
              // The order may have changed (e.g. the buyer cancelled).
              load();
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <Loading message="Loading order..." />;
  }

  if (error || !order) {
    return <ErrorState message={error || 'Order not found.'} onRetry={load} />;
  }

  const nextActions = NEXT_SELLER_STATUSES[order.status] ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AppHeader
            title={`Order #${order.$id.slice(-6).toUpperCase()}`}
            subtitle={ORDER_STATUS_LABELS[order.status]}
            onBack={() => navigation.goBack()}
          />

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Buyer
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {order.buyerName}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {order.address}, {order.city}, {order.state} - {order.pincode}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Phone: {order.phone}
            </Text>
            {order.notes ? (
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Notes: {order.notes}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Items
            </Text>
            {items.map(item => (
              <View key={item.$id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {item.productName}
                  </Text>
                  <Text
                    style={[styles.itemMeta, { color: colors.textSecondary }]}>
                    {item.quantity} x {formatPrice(item.price)}
                    {item.unit ? ` / ${item.unit}` : ''}
                  </Text>
                </View>
                <Text style={[styles.itemSubtotal, { color: colors.text }]}>
                  {formatPrice(item.subtotal)}
                </Text>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.itemRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                {formatPrice(order.totalAmount)}
              </Text>
            </View>
          </View>

          {nextActions.length > 0 ? (
            <View style={styles.actions}>
              {nextActions.map(nextStatus => (
                <Button
                  key={nextStatus}
                  title={ACTION_LABELS[nextStatus]}
                  variant={nextStatus === 'rejected' ? 'danger' : 'primary'}
                  onPress={() => handleTransition(nextStatus)}
                  loading={updating}
                  style={styles.actionButton}
                />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellerOrderDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: spacing.xs },
  body: { fontSize: 14, lineHeight: 20 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  itemInfo: { flex: 1, paddingRight: spacing.sm },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemMeta: { fontSize: 12, marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: spacing.sm },
  totalLabel: { fontSize: 15, fontWeight: '800' },
  totalValue: { fontSize: 16, fontWeight: '800' },
  actions: { gap: spacing.md },
  actionButton: { width: '100%' },
});