import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import orderService, { isStaleOrderError } from '../../appwrite/orderService';
import DeliveryConfirmationCard from '../../components/orders/DeliveryConfirmationCard';
import OrderProgress from '../../components/orders/OrderProgress';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import ErrorState from '../../components/ui/ErrorState';
import Loading from '../../components/Loading';
import { useTheme } from '../../context/ThemeContext';
import { MedicalStoreStackParamList } from '../../types/navigation';
import {
  NEXT_BUYER_STATUSES,
  getOrderStatusLabel,
  Order,
  OrderItem,
} from '../../types/order';
import { formatPrice } from '../../utils/format';
import {
  getErrorMessage,
  showErrorSnackbar,
  showSuccessSnackbar,
} from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<MedicalStoreStackParamList, 'OrderDetail'>;

const OrderDetailScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { user } = useAppwrite();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

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

  // Re-read the order without disturbing the screen if that fails too.
  const refreshQuietly = useCallback(async () => {
    try {
      setOrder(await orderService.getOrder(orderId));
    } catch {
      // keep what is on screen
    }
  }, [orderId]);

  const handleAcceptDelivery = async () => {
    if (!order || order.customerDeliveryAccepted) {
      return;
    }
    try {
      // The screen is updated only from the server's response.
      setOrder(await orderService.acceptDelivery(order.$id));
      showSuccessSnackbar('Delivery confirmed as received');
    } catch (err) {
      if (isStaleOrderError(err)) {
        refreshQuietly();
      }
      throw err; // the button shows the message
    }
  };

  const handleCancel = () => {
    if (!order) {
      return;
    }
    Alert.alert('Cancel order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelling(true);
            const updated = await orderService.updateOrderStatus(
              orderId,
              'cancelled',
            );
            setOrder(updated);
            showSuccessSnackbar('Order cancelled');
          } catch (err) {
            showErrorSnackbar(err, 'Unable to cancel order.');
            // The seller may have accepted it in the meantime.
            load();
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <Loading message="Loading order..." />;
  }

  if (error || !order) {
    return <ErrorState message={error || 'Order not found.'} onRetry={load} />;
  }

  const canCancel = (NEXT_BUYER_STATUSES[order.status] ?? []).includes(
    'cancelled',
  );
  const viewerRole = user?.$id === order.buyerId ? 'buyer' : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AppHeader
            title={`Order #${order.$id.slice(-6).toUpperCase()}`}
            subtitle={getOrderStatusLabel(order)}
            onBack={() => navigation.goBack()}
          />

          <OrderProgress status={order.status} />

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Seller
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Visit ${order.sellerName} store`}
                hitSlop={8}
                onPress={() =>
                  navigation.navigate('SellerStore', {
                    sellerId: order.sellerId,
                    sellerName: order.sellerName,
                  })
                }
                style={styles.linkButton}>
                <MaterialIcons
                  name="storefront"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Visit store
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {order.sellerName}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Delivery Details
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

          <DeliveryConfirmationCard
            order={order}
            viewerRole={viewerRole}
            onAcceptDelivery={handleAcceptDelivery}
            onConfirmDelivered={async () => undefined}
          />

          {canCancel ? (
            <Button
              title="Cancel Order"
              variant="danger"
              onPress={handleCancel}
              loading={cancelling}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderDetailScreen;

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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 13, fontWeight: '700' },
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
});