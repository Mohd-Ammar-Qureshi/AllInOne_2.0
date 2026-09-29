import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
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
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import OrderStatusPill from '../../components/ui/OrderStatusPill';
import Loading from '../../components/Loading';
import { useTheme } from '../../context/ThemeContext';
import { AgencyStackParamList } from '../../types/navigation';
import {
  Order,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  OrderStatus,
} from '../../types/order';
import { getReadableTextColor } from '../../utils/color';
import { formatPrice, formatShortDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<AgencyStackParamList, 'IncomingOrders'>;

type StatusFilter = OrderStatus | 'all';

const IncomingOrdersScreen = ({ navigation }: Props) => {
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
      const rows = await orderService.listOrdersForSeller(profile.userId);
      setOrders(rows);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load incoming orders.'));
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
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppHeader
          title="Incoming Orders"
          subtitle={`${orders.length} total`}
          onBack={() => navigation.goBack()}
        />

        {!loading && !error && orders.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}>
            {(['all', ...ORDER_STATUSES] as StatusFilter[]).map(value => {
              const selected = statusFilter === value;
              const label = value === 'all' ? 'All' : ORDER_STATUS_LABELS[value];

              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setStatusFilter(value)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : colors.surfaceSecondary,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: selected
                          ? getReadableTextColor(colors.primary)
                          : colors.text,
                      },
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {loading ? (
          <Loading message="Loading orders..." fullScreen={false} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt-long"
            title="No orders yet"
            description="Orders placed by medical stores will show up here."
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
                  .toUpperCase()} from ${item.buyerName}, ${item.itemCount} item${
                  item.itemCount === 1 ? '' : 's'
                }, ${formatPrice(item.totalAmount)}, ${
                  ORDER_STATUS_LABELS[item.status]
                }, placed ${formatShortDate(item.$createdAt)}`}
                accessibilityHint="Opens order details"
                onPress={() =>
                  navigation.navigate('SellerOrderDetail', {
                    orderId: item.$id,
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <View style={styles.cardBody}>
                  <Text style={[styles.buyer, { color: colors.text }]}>
                    {item.buyerName}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    #{item.$id.slice(-6).toUpperCase()} ·{' '}
                    {formatShortDate(item.$createdAt)}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {item.itemCount} item{item.itemCount === 1 ? '' : 's'} ·{' '}
                    {formatPrice(item.totalAmount)}
                  </Text>
                </View>
                <OrderStatusPill status={item.status} />
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={colors.textSecondary}
                  accessible={false}
                  importantForAccessibility="no"
                />
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default IncomingOrdersScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  // A horizontal ScrollView has flexGrow: 1 by default, so inside this column it
  // grew to fill half the screen and pushed the list down. Keep it its own height.
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardBody: { flex: 1, gap: 4 },
  buyer: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13 },
});