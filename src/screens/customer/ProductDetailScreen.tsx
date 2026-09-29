import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
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
import productService from '../../appwrite/productService';
import Button from '../../components/ui/Button';
import AppHeader from '../../components/ui/AppHeader';
import ErrorState from '../../components/ui/ErrorState';
import Loading from '../../components/Loading';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { MedicalStoreStackParamList } from '../../types/navigation';
import { Product } from '../../types/product';
import { formatPrice } from '../../utils/format';
import { getErrorMessage, showSuccessSnackbar } from '../../utils/errorHandler';
import { radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<MedicalStoreStackParamList, 'ProductDetail'>;

const ProductDetailScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { productId, sellerId, sellerName } = route.params;
  const cart = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  const load = useCallback(async () => {
    try {
      setError('');
      const row = await productService.getProduct(productId);
      setProduct(row);
      setQuantity(1);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load this product.'));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const addToCart = (item: Product) => {
    const result = cart.addItem(
      { sellerId, sellerName },
      {
        productId: item.$id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        imageUrl: item.imageUrl,
        stock: item.stock,
      },
      quantity,
    );

    if (result === 'added') {
      showSuccessSnackbar('Added to cart');
      return;
    }

    // One cart = one seller = one order: confirm before wiping the cart.
    Alert.alert(
      'Start a new cart?',
      `Your cart has items from ${cart.sellerName}. You can only order from one seller at a time. Clear the cart and add this item instead?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear & Add',
          style: 'destructive',
          onPress: () => {
            cart.replaceCartWithItem(
              { sellerId, sellerName },
              {
                productId: item.$id,
                name: item.name,
                price: item.price,
                unit: item.unit,
                imageUrl: item.imageUrl,
                stock: item.stock,
              },
              quantity,
            );
            showSuccessSnackbar('Cart updated');
          },
        },
      ],
    );
  };

  if (loading) {
    return <Loading message="Loading product..." />;
  }

  if (error || !product) {
    return <ErrorState message={error || 'Product not found.'} onRetry={load} />;
  }

  const outOfStock = product.status === 'out_of_stock' || product.stock <= 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AppHeader title="Product" onBack={() => navigation.goBack()} />

          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <View
              style={[
                styles.image,
                styles.imagePlaceholder,
                { backgroundColor: colors.surfaceSecondary },
              ]}>
              <MaterialIcons
                name="medication"
                size={48}
                color={colors.textSecondary}
              />
            </View>
          )}

          <Text style={[styles.name, { color: colors.text }]}>
            {product.name}
          </Text>
          <Text style={[styles.seller, { color: colors.textSecondary }]}>
            Sold by {sellerName}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatPrice(product.price)}
            {product.unit ? ` / ${product.unit}` : ''}
          </Text>
          <Text
            style={[
              styles.stock,
              { color: outOfStock ? colors.error : colors.success },
            ]}>
            {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
          </Text>

          {product.description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {product.description}
            </Text>
          ) : null}

          {!outOfStock ? (
            <View style={styles.stepperRow}>
              <Text style={[styles.stepperLabel, { color: colors.text }]}>
                Quantity
              </Text>
              <View style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setQuantity(q => Math.max(1, q - 1))}
                  style={[
                    styles.stepperButton,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}>
                  <MaterialIcons name="remove" size={18} color={colors.text} />
                </Pressable>
                <Text style={[styles.stepperValue, { color: colors.text }]}>
                  {quantity}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setQuantity(q => Math.min(product.stock, q + 1))
                  }
                  style={[
                    styles.stepperButton,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}>
                  <MaterialIcons name="add" size={18} color={colors.text} />
                </Pressable>
              </View>
            </View>
          ) : null}

          <Button
            title={outOfStock ? 'Out of Stock' : 'Add to Cart'}
            onPress={() => addToCart(product)}
            disabled={outOfStock}
            style={styles.addButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  image: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '800' },
  seller: { fontSize: 14, marginTop: spacing.xs },
  price: { fontSize: 20, fontWeight: '800', marginTop: spacing.md },
  stock: { fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  stepperLabel: { fontSize: 15, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: 17, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  addButton: { marginTop: spacing.xl },
});