/**
 * Auth-flow errors: friendly messages for Appwrite failures plus a small error
 * class for client-side guards (cooldowns, duplicate requests, ...).
 */

export type AuthErrorContext =
  | 'signup'
  | 'emailSend'
  | 'emailConfirm'
  | 'emailChange'
  | 'account';

export type AuthFlowErrorKind =
  | 'busy'
  | 'cooldown'
  | 'password_required'
  | 'invalid_email'
  | 'config'
  | 'link_mismatch';

export class AuthFlowError extends Error {
  kind: AuthFlowErrorKind;
  retryAfterSeconds?: number;

  constructor(
    kind: AuthFlowErrorKind,
    message: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'AuthFlowError';
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type AppwriteLikeError = {
  code?: number;
  type?: string;
  message?: string;
};

const asAppwriteError = (error: unknown): AppwriteLikeError =>
  error && typeof error === 'object' ? (error as AppwriteLikeError) : {};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    return true;
  }
  const { code, message } = asAppwriteError(error);
  return (
    code === 0 ||
    (typeof message === 'string' &&
      /network|failed to fetch|timed? ?out|offline/i.test(message))
  );
};

/** True when Appwrite says there is no valid session any more. */
export const isSessionError = (error: unknown): boolean =>
  asAppwriteError(error).code === 401 &&
  !['user_invalid_token', 'user_invalid_credentials'].includes(
    asAppwriteError(error).type ?? '',
  );

const FALLBACKS: Record<AuthErrorContext, string> = {
  signup: 'Unable to create your account. Please try again.',
  emailSend: 'We could not send the verification email. Please try again.',
  emailConfirm: 'Verification failed. Please try again.',
  emailChange: 'We could not change your email. Please try again.',
  account: 'Something went wrong. Please try again.',
};

export const getAuthErrorMessage = (
  error: unknown,
  context: AuthErrorContext,
): string => {
  if (error instanceof AuthFlowError) {
    return error.message;
  }

  if (isNetworkError(error)) {
    return 'No internet connection. Check your network and try again.';
  }

  const { code, type, message } = asAppwriteError(error);
  const text = (message ?? '').toLowerCase();

  switch (type) {
    case 'user_already_exists':
    case 'user_email_already_exists':
      return 'This email is already registered.';
    case 'user_invalid_credentials':
      return 'Incorrect password. Please try again.';
    case 'user_invalid_token':
      if (context === 'emailConfirm') {
        return 'Verification link expired. Please request a new one.';
      }
      break;
    case 'password_personal_data':
    case 'password_recently_used':
      return 'Choose a stronger password that does not contain your personal details.';
    case 'user_blocked':
      return 'This account has been blocked. Please contact support.';
    default:
      break;
  }

  if (code === 429 || type === 'general_rate_limit_exceeded') {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (isSessionError(error)) {
    return 'Your session has expired. Please sign in again.';
  }

  if (code === 400) {
    if (context === 'signup' || context === 'emailChange') {
      if (text.includes('password')) {
        return 'Password must be at least 8 characters and not too common.';
      }
      if (text.includes('email')) {
        return 'Please enter a valid email address.';
      }
    }
  }

  if (code === 409) {
    return 'This email is already registered.';
  }

  if (typeof code === 'number' && code >= 500) {
    return 'The server is having trouble. Please try again shortly.';
  }

  return FALLBACKS[context];
};
