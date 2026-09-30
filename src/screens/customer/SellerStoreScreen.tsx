import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import productService from '../../appwrite/productService';
import AppHeader from '../../components/ui/AppHeader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Loading from '../../components/Loading';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { MedicalStoreStackParamList } from '../../types/navigation';
import { Product } from '../../types/product';
import { getReadableTextColor } from '../../utils/color';
import { formatPrice } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<MedicalStoreStackParamList, 'SellerStore'>;

const SellerStoreScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { sellerId, sellerName } = route.params;
  const cart = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const rows = await productService.listActiveProductsBySeller(sellerId);
      setProducts(rows);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load products.'));
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const cartBelongsHere = cart.sellerId === sellerId && cart.itemCount > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppHeader
          title={sellerName}
          subtitle="Sellers Store"
          onBack={() => navigation.goBack()}
          rightAction={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cart"
              onPress={() => navigation.navigate('Cart')}
              style={[
                styles.cartButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}>
              <MaterialIcons
                name="shopping-cart"
                size={22}
                color={colors.text}
              />
              {cart.itemCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text
                    style={[
                      styles.viewCartText_notification,
                    { color: getReadableTextColor(colors.primary)},
                    ]}>{cart.itemCount}</Text>
                </View>
              ) : null}
            </Pressable>
          }
        />

        {loading ? (
          <Loading message="Loading products..." fullScreen={false} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="medication"
            title="No products available"
            description="This seller hasn't listed any active products yet."
          />
        ) : (
          <FlatList
            data={products}
            keyExtractor={item => item.$id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('ProductDetail', {
                    productId: item.$id,
                    sellerId,
                    sellerName,
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
                      size={26}
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
                  <Text style={[styles.stock, { color: colors.textSecondary }]}>
                    {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
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

        {cartBelongsHere ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Cart')}
            style={[styles.viewCartBar, { backgroundColor: colors.primary }]}>
            <Text style={styles.viewCartText}>
              View Cart · {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default SellerStoreScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  image: { width: 56, height: 56, borderRadius: radius.md },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  price: { fontSize: 13 },
  stock: { fontSize: 12 },
  viewCartBar: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  viewCartText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  viewCartText_notification: {fontSize: 10, fontWeight: '700' },
});