import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { SettingsStack } from './SettingsStack';
import { MedicalStoreHomeScreen } from '../screens/home/RoleHomeScreens';
import SellersListScreen from '../screens/customer/SellersListScreen';
import SellerStoreScreen from '../screens/customer/SellerStoreScreen';
import ProductDetailScreen from '../screens/customer/ProductDetailScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import OrderDetailScreen from '../screens/customer/OrderDetailScreen';
import { BuyerNotificationsScreen } from '../screens/home/NotificationsScreens';
import { MedicalStoreStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<MedicalStoreStackParamList>();

export const MedicalStoreStack = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Home" component={MedicalStoreHomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsStack} />
      <Stack.Screen name="Sellers" component={SellersListScreen} />
      <Stack.Screen name="SellerStore" component={SellerStoreScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Notifications" component={BuyerNotificationsScreen} />
    </Stack.Navigator>
  );
};