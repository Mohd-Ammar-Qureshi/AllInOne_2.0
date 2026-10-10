export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export type EmailChangeError = {
  /** Which input the message belongs under. */
  field: 'email' | 'confirm';
  message: string;
};

/**
 * Checks the "New email" + "Confirm new email" pair before an email change
 * starts. Returns null when both are valid and identical (case-insensitive,
 * ignoring surrounding spaces, as Appwrite treats emails).
 */
export const getEmailChangeError = (
  email: string,
  confirmEmail: string,
): EmailChangeError | null => {
  if (!isValidEmail(email)) {
    return { field: 'email', message: 'Please enter a valid email address.' };
  }
  if (!confirmEmail.trim()) {
    return { field: 'confirm', message: 'Please confirm your new email address.' };
  }
  if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
    return { field: 'confirm', message: 'Email addresses do not match.' };
  }
  return null;
};

export const isValidPassword = (password: string): boolean =>
  password.length >= 8;

export const isValidLicenseNumber = (value: string): boolean =>
  value.trim().length >= 6;

export const isValidUrl = (url: string): boolean => {
  if (!url.trim()) {
    return true;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
