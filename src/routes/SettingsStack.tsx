import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AboutScreen from '../screens/settings/AboutScreen';
import AccountScreen from '../screens/settings/AccountScreen';
import LegalScreen from '../screens/settings/LegalScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { SettingsStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

/**
 * The whole Settings flow. Each role stack (medical store, agency)
 * mounts this once as its "Settings" screen, so new settings screens are
 * added here only.
 */
export const SettingsStack = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="SettingsHome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Terms" component={LegalScreen} />
      <Stack.Screen name="Privacy" component={LegalScreen} />
    </Stack.Navigator>
  );
};