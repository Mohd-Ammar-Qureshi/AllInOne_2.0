import { Snackbar } from 'react-native-snackbar';

import { TOAST_BOTTOM_OFFSET } from '../theme/layout';

type AppwriteError = {
  message?: string;
  code?: number;
};

export const getErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as AppwriteError).message;

    if (message) {
      return message;
    }
  }

  return fallback;
};

const showSnackbar = (
  message: string,
  backgroundColor: string,
  duration: number,
): void => {
  Snackbar.show({
    text: message,
    duration,
    backgroundColor,
    marginBottom: TOAST_BOTTOM_OFFSET,
  });
};

export const showErrorSnackbar = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): void => {
  showSnackbar(
    getErrorMessage(error, fallback),
    '#DC2626',
    Snackbar.LENGTH_LONG,
  );
};

export const showSuccessSnackbar = (message: string): void => {
  showSnackbar(
    message,
    '#15803D',
    Snackbar.LENGTH_SHORT,
  );
};

export const showInfoSnackbar = (message: string): void => {
  showSnackbar(
    message,
    '#B45309',
    Snackbar.LENGTH_SHORT,
  );
};