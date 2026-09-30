import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAppwrite } from '../../appwrite/AppwriteContext';
import BottomNav, { BottomNavItem } from './BottomNav';
import { switchTab } from './switchTab';

export type SellerTab = 'Home' | 'Products' | 'IncomingOrders';

type Props = {
  active: SellerTab;
};

const SellerBottomNav = ({ active }: Props) => {
  const navigation = useNavigation();
  const { profile } = useAppwrite();
  const licenseVerified = Boolean(profile?.licenseVerified);

  // Same rules as the Seller home screen used before: Products always shows
  // (it leads to licence verification until the licence is verified), and
  // Orders only appears once the licence is verified.
  const items: BottomNavItem<SellerTab>[] = [
    { key: 'Home', label: 'Home', icon: 'home' },
    { key: 'Products', label: 'Products', icon: 'inventory-2' },
    ...(licenseVerified
      ? [
          {
            key: 'IncomingOrders' as const,
            label: 'Orders',
            icon: 'receipt-long' as const,
          },
        ]
      : []),
  ];

  return (
    <BottomNav
      items={items}
      activeKey={active}
      onSelect={key => {
        if (key === active) {
          return;
        }
        if (key === 'Products' && !licenseVerified) {
          (navigation.navigate as (screen: string) => void)(
            'LicenseVerification',
          );
          return;
        }
        switchTab(navigation, key);
      }}
    />
  );
};

export default SellerBottomNav;