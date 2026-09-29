import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { AppwriteProvider, useAppwrite } from '../appwrite/AppwriteContext';
import profileService from '../appwrite/profileService';
import Loading from '../components/Loading';
import { useTheme } from '../context/ThemeContext';
import { AuthStack } from './AuthStack';
import { RoleRouter } from './RoleRouter';

const AppNavigator = () => {
  const { colors, isDark } = useTheme();
  const {
    isLoggedIn,
    setIsLoggedIn,
    setUser,
    setProfile,
    getCurrentUser,
    logout,
  } = useAppwrite();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const bootstrapAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setIsLoggedIn(false);
        return;
      }

      const profile = await profileService.getProfileByUserId(currentUser.$id);

      if (!profile) {
        await logout();
        return;
      }

      setUser(currentUser);
      setProfile(profile);
      setIsLoggedIn(true);
    } catch {
      await logout();

      setUser(null);
      setProfile(null);
      setIsLoggedIn(false);
    } finally {
      setIsBootstrapping(false);
    }
  }, [
    getCurrentUser,
    logout,
    setIsLoggedIn,
    setProfile,
    setUser,
  ]);

   const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }
    hasBootstrapped.current = true;
    bootstrapAuth();
  }, [bootstrapAuth]);
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (isBootstrapping) {
    return <Loading message="Starting AllInOne..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isLoggedIn ? <RoleRouter /> : <AuthStack />}
    </NavigationContainer>
  );
};

export const Router = () => {
  return (
    <AppwriteProvider>
      <AppNavigator />
    </AppwriteProvider>
  );
};
