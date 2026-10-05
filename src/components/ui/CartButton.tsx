import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { getReadableTextColor } from '../../utils/color';

type Props = { onPress: () => void };

/** Compact cart icon with an item-count badge, for screen headers. */
const CartButton = ({ onPress }: Props) => {
  const { colors } = useTheme();
  const { itemCount } = useCart();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        itemCount > 0
          ? `Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`
          : 'Cart'
      }
      hitSlop={4}
      onPress={onPress}
      style={[styles.button, { backgroundColor: colors.surfaceSecondary }]}>
      <MaterialIcons name="shopping-cart" size={22} color={colors.text} />
      {itemCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Text
            style={[styles.badgeText, { color: getReadableTextColor(colors.error) }]}>
            {itemCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};

export default CartButton;

const styles = StyleSheet.create({
  button: {
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
  badgeText: { fontSize: 10, fontWeight: '800' },
});
