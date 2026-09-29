import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import notificationService from '../../appwrite/notificationService';
import AppHeader from '../../components/ui/AppHeader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Loading from '../../components/Loading';
import { useTheme } from '../../context/ThemeContext';
import {
  AgencyStackParamList,
  MedicalStoreStackParamList,
} from '../../types/navigation';
import { AppNotification } from '../../types/notification';
import { getErrorMessage, showErrorSnackbar } from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = {
  navigation: {
    navigate: (
      screen: 'OrderDetail' | 'SellerOrderDetail',
      params: { orderId: string },
    ) => void;
    goBack: () => void;
  };
  /** Which order-detail route this role's stack uses. */
  orderDetailRoute: 'OrderDetail' | 'SellerOrderDetail';
};

const formatTimestamp = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const RoleNotificationsScreen = ({ navigation, orderDetailRoute }: Props) => {
  const { colors } = useTheme();
  const { profile } = useAppwrite();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.userId) {
      return;
    }
    try {
      setError('');
      const rows = await notificationService.listForUser(profile.userId);
      setNotifications(rows);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
    }
     notificationService.pruneOldNotifications(profile.userId);
  }, [profile?.userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const unreadCount = notifications.filter(item => !item.read).length;

  const handleOpen = async (item: AppNotification) => {
    if (!item.read) {
      // Optimistic update so the list feels instant; failure is non-fatal.
      setNotifications(prev =>
        prev.map(n => (n.$id === item.$id ? { ...n, read: true } : n)),
      );
      try {
        await notificationService.markAsRead(item.$id);
      } catch (err) {
        showErrorSnackbar(err, 'Unable to mark notification as read.');
      }
    }

    navigation.navigate(orderDetailRoute, { orderId: item.orderId });
  };

  const handleMarkAllRead = async () => {
    if (!profile?.userId || unreadCount === 0) {
      return;
    }
    try {
      setMarkingAll(true);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await notificationService.markAllAsRead(profile.userId);
    } catch (err) {
      showErrorSnackbar(err, 'Unable to mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppHeader
          title="Notifications"
          subtitle={
            unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'
          }
          onBack={() => navigation.goBack()}
          rightAction={
            unreadCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleMarkAllRead}
                disabled={markingAll}
                style={({ pressed }) => [
                  styles.markAllButton,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    opacity: pressed || markingAll ? 0.7 : 1,
                  },
                ]}>
                <Text
                  style={[styles.markAllText, { color: colors.primary }]}>
                  Mark all read
                </Text>
              </Pressable>
            ) : undefined
          }
        />

        {loading ? (
          <Loading message="Loading notifications..." fullScreen={false} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="notifications-none"
            title="No notifications yet"
            description="You'll see an update here whenever an order you're involved in changes status."
          />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.$id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => handleOpen(item)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: item.read ? colors.border : colors.primary,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                {!item.read ? (
                  <View
                    style={[styles.unreadDot, { backgroundColor: colors.primary }]}
                  />
                ) : (
                  <View style={styles.unreadDotSpacer} />
                )}

                <View style={styles.cardBody}>
                  <Text
                    style={[
                      item.read ? styles.messageRead : styles.messageUnread,
                      { color: colors.text },
                    ]}>
                    {item.message}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    Order #{item.orderRef} · {formatTimestamp(item.$createdAt)}
                  </Text>
                </View>

                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export const BuyerNotificationsScreen = (
  props: NativeStackScreenProps<MedicalStoreStackParamList, 'Notifications'>,
) => <RoleNotificationsScreen {...props} orderDetailRoute="OrderDetail" />;

export const SellerNotificationsScreen = (
  props: NativeStackScreenProps<AgencyStackParamList, 'Notifications'>,
) => (
  <RoleNotificationsScreen {...props} orderDetailRoute="SellerOrderDetail" />
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unreadDotSpacer: {
    width: 8,
    height: 8,
  },
  cardBody: { flex: 1, gap: 4 },
  messageRead: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  messageUnread: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  meta: { fontSize: 12 },
  markAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  markAllText: { fontSize: 13, fontWeight: '700' },
});