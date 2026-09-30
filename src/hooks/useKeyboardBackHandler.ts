import { useCallback } from 'react';
import { BackHandler, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Android Back closes the keyboard first.
 *
 * While the keyboard is open, the Back button only hides it and the user stays
 * on the screen. With the keyboard closed, Back behaves exactly as before.
 * The handler is active only while the screen is focused.
 */
export const useKeyboardBackHandler = (): void => {
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (Keyboard.isVisible()) {
            Keyboard.dismiss();
            return true;
          }
          return false;
        },
      );

      return () => subscription.remove();
    }, []),
  );
};