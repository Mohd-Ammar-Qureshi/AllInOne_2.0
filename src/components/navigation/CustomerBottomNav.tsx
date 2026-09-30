import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import BottomNav, { BottomNavItem } from './BottomNav';
import { switchTab } from './switchTab';

export type CustomerTab = 'Home' | 'Sellers' | 'OrderHistory' | 'Cart';

type Props = {
  active: CustomerTab;
};

const CustomerBottomNav = ({ active }: Props) => {
  const navigation = useNavigation();
  const { itemCount } = useCart();

  const items: BottomNavItem<CustomerTab>[] = [
    { key: 'Home', label: 'Home', icon: 'home' },
    { key: 'Sellers', label: 'Sellers', icon: 'storefront' },
    { key: 'OrderHistory', label: 'Orders', icon: 'receipt-long' },
    { key: 'Cart', label: 'Cart', icon: 'shopping-cart', badge: itemCount },
  ];

  return (
    <BottomNav
      items={items}
      activeKey={active}
      onSelect={key => {
        if (key !== active) {
          switchTab(navigation, key);
        }
      }}
    />
  );
};

export default CustomerBottomNav;