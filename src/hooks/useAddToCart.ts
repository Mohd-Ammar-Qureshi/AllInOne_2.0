import { useCallback } from 'react';
import { Alert } from 'react-native';
import { CartSeller, useCart } from '../context/CartContext';
import { Product } from '../types/product';
import { showSuccessSnackbar } from '../utils/errorHandler';

const toCartItem = (product: Product) => ({
  productId: product.$id,
  name: product.name,
  price: product.price,
  unit: product.unit,
  imageUrl: product.imageUrl,
  stock: product.stock,
});

/**
 * The one add-to-cart action used by the product list and the product page.
 * Business rule kept intact: one cart = one seller = one order, so adding from
 * a different seller asks before clearing the cart.
 */
export const useAddToCart = (seller: CartSeller) => {
  const cart = useCart();
  const { sellerId, sellerName } = seller;

  return useCallback(
    (product: Product, quantity = 1) => {
      const result = cart.addItem(
        { sellerId, sellerName },
        toCartItem(product),
        quantity,
      );

      if (result === 'added') {
        showSuccessSnackbar('Added to cart');
        return;
      }

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
                toCartItem(product),
                quantity,
              );
              showSuccessSnackbar('Cart updated');
            },
          },
        ],
      );
    },
    [cart, sellerId, sellerName],
  );
};
