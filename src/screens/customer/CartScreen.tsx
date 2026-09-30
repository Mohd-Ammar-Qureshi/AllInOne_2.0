import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/ui/AppHeader';
import CustomerBottomNav from '../../components/navigation/CustomerBottomNav';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { CartItem, useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { MedicalStoreStackParamList } from '../../types/navigation';
import { formatPrice } from '../../utils/format';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<MedicalStoreStackParamList, 'Cart'>;

const CartScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const cart = useCart();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppHeader
          title="Cart"
          subtitle={cart.sellerName ?? undefined}
          onBack={() => navigation.goBack()}
        />

        {cart.items.length === 0 ? (
          <EmptyState
            icon="shopping-cart"
            title="Your cart is empty"
            description="Add products from a seller's store to get started."
            actionLabel="Browse Sellers"
            onAction={() => navigation.navigate('Sellers')}
          />
        ) : (
          <>
            <FlatList
              data={cart.items}
              keyExtractor={item => item.productId}
              contentContainerStyle={styles.list}
              renderItem={({ item }: { item: CartItem }) => {
                const atMaxStock = item.quantity >= item.stock;
                const willRemoveOnDecrement = item.quantity <= 1;

                return (
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                      />
                    ) : (
                      <View
                        style={[
                          styles.image,
                          styles.imagePlaceholder,
                          { backgroundColor: colors.surfaceSecondary },
                        ]}>
                        <MaterialIcons
                          name="medication"
                          size={22}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}
                    <View style={styles.cardBody}>
                      <Text
                        style={[styles.name, { color: colors.text }]}
                        numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.price, { color: colors.textSecondary }]}>
                        {formatPrice(item.price)}
                        {item.unit ? ` / ${item.unit}` : ''}
                      </Text>
                      <View style={styles.stepper}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            willRemoveOnDecrement
                              ? 'Remove item'
                              : 'Decrease quantity'
                          }
                          onPress={() =>
                            cart.updateQuantity(item.productId, item.quantity - 1)
                          }
                          style={[
                            styles.stepperButton,
                            { backgroundColor: colors.surfaceSecondary },
                          ]}>
                          <MaterialIcons
                            name={willRemoveOnDecrement ? 'delete-outline' : 'remove'}
                            size={16}
                            color={willRemoveOnDecrement ? colors.error : colors.text}
                          />
                        </Pressable>
                        <Text style={[styles.stepperValue, { color: colors.text }]}>
                          {item.quantity}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Increase quantity"
                          accessibilityState={{ disabled: atMaxStock }}
                          disabled={atMaxStock}
                          onPress={() =>
                            cart.updateQuantity(item.productId, item.quantity + 1)
                          }
                          style={[
                            styles.stepperButton,
                            {
                              backgroundColor: colors.surfaceSecondary,
                              opacity: atMaxStock ? 0.4 : 1,
                            },
                          ]}>
                          <MaterialIcons name="add" size={16} color={colors.text} />
                        </Pressable>
                      </View>
                      {atMaxStock ? (
                        <Text
                          style={[
                            styles.maxStockHint,
                            { color: colors.textSecondary },
                          ]}>
                          Only {item.stock} in stock
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove item"
                      onPress={() => cart.removeItem(item.productId)}
                      style={styles.removeButton}>
                      <MaterialIcons
                        name="delete-outline"
                        size={20}
                        color={colors.error}
                      />
                    </Pressable>
                  </View>
                );
              }}
            />

            <View
              style={[
                styles.summary,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Subtotal
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatPrice(cart.subtotal)}
                </Text>
              </View>
              <Button
                title="Proceed to Checkout"
                onPress={() => navigation.navigate('Checkout')}
                style={styles.checkoutButton}
              />
            </View>
          </>
        )}
      </View>
      <CustomerBottomNav active="Cart" />
    </SafeAreaView>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { paddingBottom: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  image: { width: 48, height: 48, borderRadius: radius.md },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '700' },
  price: { fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  maxStockHint: { fontSize: 11, marginTop: 2 },
  removeButton: { padding: spacing.xs },
  summary: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  checkoutButton: {},
});