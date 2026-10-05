/**
 * The app's one message system. Screens call showSuccessSnackbar /
 * showErrorSnackbar / showWarningSnackbar / showInfoSnackbar; <ToastHost />
 * (mounted once in App.tsx) renders them at the top of the screen.
 */

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

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastMessage = {
  id: number;
  type: ToastType;
  message: string;
  /** How long it stays on screen, in ms. */
  duration: number;
};

type ToastListener = (toast: ToastMessage) => void;

const listeners = new Set<ToastListener>();
let nextId = 1;

// A toast fired before the host has mounted (e.g. very early at startup) is
// held briefly instead of being lost.
let pendingToast: ToastMessage | null = null;
let pendingSince = 0;
const PENDING_MAX_AGE_MS = 3000;

export const subscribeToToasts = (listener: ToastListener): (() => void) => {
  listeners.add(listener);
  if (pendingToast && Date.now() - pendingSince < PENDING_MAX_AGE_MS) {
    const toast = pendingToast;
    pendingToast = null;
    listener(toast);
  }
  pendingToast = null;
  return () => {
    listeners.delete(listener);
  };
};

const BASE_DURATION_MS: Record<ToastType, number> = {
  success: 3000,
  info: 3500,
  warning: 4000,
  error: 5000,
};

/** Long messages stay longer so they can actually be read (max +4s). */
export const getToastDuration = (type: ToastType, message: string): number =>
  BASE_DURATION_MS[type] + Math.min(4000, Math.max(0, message.length - 40) * 50);

const showToast = (type: ToastType, message: string): void => {
  const text = message.trim();
  if (!text) {
    return;
  }
  const toast: ToastMessage = {
    id: nextId++,
    type,
    message: text,
    duration: getToastDuration(type, text),
  };
  if (listeners.size === 0) {
    pendingToast = toast;
    pendingSince = Date.now();
    return;
  }
  listeners.forEach(listener => listener(toast));
};

export const showErrorSnackbar = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): void => {
  showToast('error', getErrorMessage(error, fallback));
};

export const showSuccessSnackbar = (message: string): void => {
  showToast('success', message);
};

export const showWarningSnackbar = (message: string): void => {
  showToast('warning', message);
};

export const showInfoSnackbar = (message: string): void => {
  showToast('info', message);
};
