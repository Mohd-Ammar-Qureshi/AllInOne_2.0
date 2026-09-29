import { Snackbar } from 'react-native-snackbar';

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

export const showErrorSnackbar = (
  error: unknown,
  fallback?: string,
): void => {
  Snackbar.show({
    text: getErrorMessage(error, fallback),
    duration: Snackbar.LENGTH_LONG,
    backgroundColor: '#DC2626',
  });
};

export const showSuccessSnackbar = (message: string): void => {
  Snackbar.show({
    text: message,
    duration: Snackbar.LENGTH_SHORT,
    backgroundColor: '#15803D',
  });
};

export const showInfoSnackbar = (message: string): void => {
  Snackbar.show({
    text: message,
    duration: Snackbar.LENGTH_SHORT,
    backgroundColor: '#B45309',
  });
};