import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import orderService from '../../appwrite/orderService';
import AppHeader from '../../components/ui/AppHeader';
import ChipTabs from '../../components/ui/ChipTabs';
import CustomerBottomNav from '../../components/navigation/CustomerBottomNav';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import OrderStatusPill from '../../components/ui/OrderStatusPill';
import Loading from '../../components/Loading';
import { useTheme } from '../../context/ThemeContext';
import { MedicalStoreStackParamList } from '../../types/navigation';
import {
  Order,
  ORDER_STATUSES,
  getOrderStatusLabel,
  ORDER_STATUS_LABELS,
  OrderStatus,
} from '../../types/order';
import { formatPrice, formatShortDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorHandler';
import { radius, shadows, spacing } from '../../theme';

type Props = NativeStackScreenProps<MedicalStoreStackParamList, 'OrderHistory'>;

type StatusFilter = OrderStatus | 'all';

const OrderHistoryScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { profile } = useAppwrite();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    if (!profile?.userId) {
      return;
    }
    try {
      setError('');
      const rows = await orderService.listOrdersForBuyer(profile.userId);
      setOrders(rows);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your orders.'));
    } finally {
      setLoading(false);
    }
  }, [profile?.userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const filteredOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter(order => order.status === statusFilter);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppHeader
          title="Your Orders"
          subtitle={`${orders.length} total`}
          onBack={() => navigation.goBack()}
        />

        {!loading && !error && orders.length > 0 ? (
          <ChipTabs
            options={(['all', ...ORDER_STATUSES] as StatusFilter[]).map(value => ({
              key: value,
              label: value === 'all' ? 'All' : ORDER_STATUS_LABELS[value],
            }))}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        ) : null}

        {loading ? (
          <Loading message="Loading orders..." fullScreen={false} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt-long"
            title="No orders yet"
            description="Orders you place with sellers will appear here."
            actionLabel="Browse Sellers"
            onAction={() => navigation.navigate('Sellers')}
          />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon="receipt-long"
            title="No matching orders"
            description={`You have no orders with status "${ORDER_STATUS_LABELS[statusFilter as OrderStatus]}".`}
          />
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.$id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Order ${item.$id
                  .slice(-6)
                  .toUpperCase()} with ${item.sellerName}, ${item.itemCount} item${item.itemCount === 1 ? '' : 's'
                  }, ${formatPrice(item.totalAmount)}, ${getOrderStatusLabel(item)
                  }, placed ${formatShortDate(item.$createdAt)}`}
                accessibilityHint="Opens order details"
                onPress={() =>
                  navigation.navigate('OrderDetail', { orderId: item.$id })
                }
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.divider,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardBody}>
                    <Text
                      numberOfLines={1}
                      style={[styles.sellerName, { color: colors.text }]}>
                      {item.sellerName}
                    </Text>
                    <Text style={[styles.meta, { color: colors.textSecondary }]}>
                      #{item.$id.slice(-6).toUpperCase()} ·{' '}
                      {formatShortDate(item.$createdAt)}
                    </Text>
                  </View>
                  <OrderStatusPill
                    status={item.status}
                    customerDeliveryAccepted={item.customerDeliveryAccepted}
                    sellerDeliveryConfirmed={item.sellerDeliveryConfirmed}
                  />
                </View>

                <View style={styles.cardBottom}>
                  <MaterialIcons
                    name="inventory-2"
                    size={18}
                    color={colors.textMuted}
                    accessible={false}
                    importantForAccessibility="no"
                  />
                  <Text
                    style={[styles.itemsText, { color: colors.textSecondary }]}>
                    {item.itemCount} item{item.itemCount === 1 ? '' : 's'}
                  </Text>
                  <Text style={[styles.amount, { color: colors.text }]}>
                    {formatPrice(item.totalAmount)}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={colors.textMuted}
                    accessible={false}
                    importantForAccessibility="no"
                  />
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
      <CustomerBottomNav active="OrderHistory" />
    </SafeAreaView>
  );
};

export default OrderHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  itemsText: { flex: 1, fontSize: 14 },
  amount: { fontSize: 17, fontWeight: '700' },
  sellerName: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13 },
});