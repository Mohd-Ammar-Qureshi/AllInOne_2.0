export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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
