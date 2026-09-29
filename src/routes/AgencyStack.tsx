import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { SettingsStack } from './SettingsStack';
import LicenseVerificationScreen from '../screens/agency/LicenseVerificationScreen';
import { AgencyHomeScreen } from '../screens/home/RoleHomeScreens';
import ProductsScreen from '../screens/seller/ProductsScreen';
import ProductFormScreen from '../screens/seller/ProductFormScreen';
import IncomingOrdersScreen from '../screens/seller/IncomingOrdersScreen';
import SellerOrderDetailScreen from '../screens/seller/SellerOrderDetailScreen';
import { SellerNotificationsScreen } from '../screens/home/NotificationsScreens';
import { AgencyStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<AgencyStackParamList>();

export const AgencyStack = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Home" component={AgencyHomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsStack} />
      <Stack.Screen
        name="LicenseVerification"
        component={LicenseVerificationScreen}
      />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} />
      <Stack.Screen name="IncomingOrders" component={IncomingOrdersScreen} />
      <Stack.Screen
        name="SellerOrderDetail"
        component={SellerOrderDetailScreen}
      />
      <Stack.Screen
        name="Notifications"
        component={SellerNotificationsScreen}
      />
    </Stack.Navigator>
  );
};