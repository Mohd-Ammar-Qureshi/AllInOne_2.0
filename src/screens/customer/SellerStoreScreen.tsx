import React, { useCallback, useMemo, useState } from 'react';
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
import CartButton from '../../components/ui/CartButton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Input from '../../components/ui/Input';
import Loading from '../../components/Loading';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useAddToCart } from '../../hooks/useAddToCart';
import { MedicalStoreStackParamList } from '../../types/navigation';
import { Product } from '../../types/product';
import { getReadableTextColor } from '../../utils/color';
import { formatPrice } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorHandler';
import { getStockStatus } from '../../utils/stock';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<MedicalStoreStackParamList, 'SellerStore'>;

// A search box only earns its space on a catalogue that needs scrolling.
const SEARCH_MIN_PRODUCTS = 6;

const SellerStoreScreen = ({ navigation, route }: Props) => {
  const { colors, isDark } = useTheme();
  const { sellerId, sellerName } = route.params;
  const cart = useCart();
  const addProduct = useAddToCart({ sellerId, sellerName });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

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

  // Quantity already in the cart for each product of THIS seller.
  const quantities = useMemo(() => {
    const map = new Map<string, number>();
    if (cart.sellerId === sellerId) {
      cart.items.forEach(item => map.set(item.productId, item.quantity));
    }
    return map;
  }, [cart.items, cart.sellerId, sellerId]);

  const trimmedQuery = query.trim().toLowerCase();
  const visibleProducts = trimmedQuery
    ? products.filter(product => product.name.toLowerCase().includes(trimmedQuery))
    : products;
  const showSearch = products.length > SEARCH_MIN_PRODUCTS;

  const lowStockText = isDark ? colors.warning : '#92400E';

  const renderProduct = ({ item }: { item: Product }) => {
    const stock = getStockStatus(item.stock, item.status);
    const quantity = quantities.get(item.$id) ?? 0;
    const stockColor =
      stock.tone === 'out'
        ? colors.error
        : stock.tone === 'low'
          ? lowStockText
          : colors.textSecondary;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${formatPrice(item.price)}, ${stock.label}`}
        accessibilityHint="Opens product details"
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
            opacity: pressed ? 0.9 : stock.tone === 'out' ? 0.7 : 1,
          },
        ]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
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
            numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>
            {formatPrice(item.price)}
            {item.unit ? (
              <Text style={[styles.unit, { color: colors.textSecondary }]}>
                {` / ${item.unit}`}
              </Text>
            ) : null}
          </Text>
          <Text
            style={[
              styles.stock,
              {
                color: stockColor,
                fontWeight: stock.tone === 'ok' ? '400' : '700',
              },
            ]}>
            {stock.label}
          </Text>
        </View>

        {stock.tone === 'out' ? null : quantity > 0 ? (
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                quantity <= 1 ? `Remove ${item.name} from cart` : 'Decrease quantity'
              }
              hitSlop={6}
              onPress={() => cart.updateQuantity(item.$id, quantity - 1)}
              style={[
                styles.stepButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}>
              <MaterialIcons
                name={quantity <= 1 ? 'delete-outline' : 'remove'}
                size={18}
                color={quantity <= 1 ? colors.error : colors.text}
              />
            </Pressable>
            <Text style={[styles.stepValue, { color: colors.text }]}>
              {quantity}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              accessibilityState={{ disabled: quantity >= item.stock }}
              disabled={quantity >= item.stock}
              hitSlop={6}
              onPress={() => cart.updateQuantity(item.$id, quantity + 1)}
              style={[
                styles.stepButton,
                {
                  backgroundColor: colors.surfaceSecondary,
                  opacity: quantity >= item.stock ? 0.4 : 1,
                },
              ]}>
              <MaterialIcons name="add" size={18} color={colors.text} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name} to cart`}
            hitSlop={6}
            onPress={() => addProduct(item, 1)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <MaterialIcons
              name="add"
              size={18}
              color={getReadableTextColor(colors.primary)}
            />
            <Text
              style={[
                styles.addText,
                { color: getReadableTextColor(colors.primary) },
              ]}>
              Add
            </Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppHeader
          title={sellerName}
          subtitle="Sellers Store"
          onBack={() => navigation.goBack()}
          rightAction={<CartButton onPress={() => navigation.navigate('Cart')} />}
        />

        {!loading && !error && showSearch ? (
          <Input
            placeholder="Search products"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        ) : null}

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
        ) : visibleProducts.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matching products"
            description={`Nothing in ${sellerName} matches "${query.trim()}".`}
          />
        ) : (
          <FlatList
            data={visibleProducts}
            keyExtractor={item => item.$id}
            keyboardShouldPersistTaps="handled"
            // Leave room so the floating cart bar never hides the last row.
            contentContainerStyle={[
              styles.list,
              cartBelongsHere && styles.listWithCartBar,
            ]}
            renderItem={renderProduct}
          />
        )}

        {cartBelongsHere && !searchFocused ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Cart')}
            style={[styles.viewCartBar, { backgroundColor: colors.primary }]}>
            <Text
              style={[
                styles.viewCartText,
                { color: getReadableTextColor(colors.primary) },
              ]}>
              View Cart · {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'} ·{' '}
              {formatPrice(cart.subtotal)}
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
  list: { paddingBottom: spacing.xxl, gap: spacing.md },
  listWithCartBar: { paddingBottom: 96 },
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
  cardBody: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700' },
  price: { fontSize: 16, fontWeight: '800' },
  unit: { fontSize: 12, fontWeight: '400' },
  stock: { fontSize: 12 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 36,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.md,
  },
  addText: { fontSize: 14, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
  viewCartBar: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  viewCartText: { fontSize: 15, fontWeight: '700' },
});
