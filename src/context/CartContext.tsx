import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  unit?: string | null;
  imageUrl?: string | null;
  stock: number;
  quantity: number;
};

export type CartSeller = {
  sellerId: string;
  sellerName: string;
};

/** Result of addItem: 'added' merged/created the line; 'seller_conflict' means
 * the cart already holds items from a different seller and must be confirmed
 * by the caller (see replaceCartWithItem) before adding this one. */
export type AddItemResult = 'added' | 'seller_conflict';

type CartContextType = {
  sellerId: string | null;
  sellerName: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  /** Adds/increments an item. Fails with 'seller_conflict' if the cart
   * already belongs to a different seller — business rule: one cart = one
   * seller = one order. */
  addItem: (
    seller: CartSeller,
    item: Omit<CartItem, 'quantity'>,
    quantity?: number,
  ) => AddItemResult;
  /** Empties the cart and starts a fresh one with this single item, for the
   * given seller. Use after the caller has confirmed clearing the cart. */
  replaceCartWithItem: (
    seller: CartSeller,
    item: Omit<CartItem, 'quantity'>,
    quantity?: number,
  ) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: PropsWithChildren) => {
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  // If the last item is removed, the cart is no longer tied to any seller,
  // so a different seller can be shopped from next.
  useEffect(() => {
    if (items.length === 0 && sellerId) {
      setSellerId(null);
      setSellerName(null);
    }
  }, [items, sellerId]);

  const clearCart = useCallback(() => {
    setSellerId(null);
    setSellerName(null);
    setItems([]);
  }, []);

  const addItem = useCallback<CartContextType['addItem']>(
    (seller, item, quantity = 1) => {
      if (sellerId && sellerId !== seller.sellerId) {
        return 'seller_conflict';
      }

      setSellerId(seller.sellerId);
      setSellerName(seller.sellerName);
      setItems(prev => {
        const existing = prev.find(i => i.productId === item.productId);
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, item.stock);
          return prev.map(i =>
            i.productId === item.productId ? { ...i, quantity: nextQty } : i,
          );
        }
        return [
          ...prev,
          { ...item, quantity: Math.min(Math.max(quantity, 1), item.stock) },
        ];
      });
      return 'added';
    },
    [sellerId],
  );

  const replaceCartWithItem = useCallback<
    CartContextType['replaceCartWithItem']
  >((seller, item, quantity = 1) => {
    setSellerId(seller.sellerId);
    setSellerName(seller.sellerName);
    setItems([
      { ...item, quantity: Math.min(Math.max(quantity, 1), item.stock) },
    ]);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prev => {
      if (quantity <= 0) {
        return prev.filter(i => i.productId !== productId);
      }
      return prev.map(i =>
        i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i,
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextType>(
    () => ({
      sellerId,
      sellerName,
      items,
      itemCount,
      subtotal,
      addItem,
      replaceCartWithItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      sellerId,
      sellerName,
      items,
      itemCount,
      subtotal,
      addItem,
      replaceCartWithItem,
      updateQuantity,
      removeItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
};

export default CartContext;