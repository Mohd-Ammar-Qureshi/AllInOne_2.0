import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Models } from 'appwrite';
import authService from './authService';
import profileService from './profileService';
import { APPWRITE_VERIFICATION_URL } from './client';
import { Profile, UpdateProfileInput } from '../types/profile';
import { UserRole } from '../types/user';
import {
  AuthFlowError,
  getAuthErrorMessage,
  isSessionError,
} from '../utils/authErrors';
import {
  clearCooldown,
  EMAIL_RESEND_COOLDOWN_SECONDS,
  getCooldownRemaining,
  startCooldown,
} from '../utils/cooldown';
import { isValidEmail } from '../utils/validation';

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type AppUser = Models.User<Models.Preferences>;

/**
 * Where the signed-in user is in the verification funnel. It is derived from
 * the Appwrite account's `emailVerification`, never stored locally, so editing
 * local storage cannot skip the stage. (The phone number is only contact
 * information in the profile; it is not verified.)
 */
export type AuthStage = 'unauthenticated' | 'email_verification' | 'verified';

type AppwriteContextType = {
  isLoggedIn: boolean;
  user: AppUser | null;
  profile: Profile | null;
  role: UserRole | null;
  authStage: AuthStage;
  /** True while the session password is held in memory (never persisted). */
  hasCachedPassword: boolean;
  /** Message from a failed verification deep link, shown on the email screen. */
  emailLinkError: string | null;
  setIsLoggedIn: (value: boolean) => void;
  setUser: (user: AppUser | null) => void;
  setProfile: (profile: Profile | null) => void;
  login: (email: string, password: string) => Promise<Profile>;
  register: (input: RegisterInput) => Promise<Profile>;
  logout: () => Promise<boolean>;
  refreshProfile: () => Promise<Profile | null>;
  updateProfile: (data: UpdateProfileInput) => Promise<Profile>;
  getCurrentUser: typeof authService.getCurrentUser;
  /** Re-reads the Appwrite account. Throws on failure; 401 signs the user out. */
  refreshUser: () => Promise<AppUser>;
  sendEmailVerification: () => Promise<'sent' | 'already_verified'>;
  completeEmailVerification: (userId: string, secret: string) => Promise<AppUser>;
  setEmailLinkError: (message: string | null) => void;
  changeEmail: (
    email: string,
    password?: string,
  ) => Promise<{ verificationSent: boolean; sendError: string | null }>;
};

const AppwriteContext = createContext<AppwriteContextType | undefined>(
  undefined,
);
const getCurrentUser = authService.getCurrentUser.bind(authService);

const cooldownMessage = (seconds: number, what: string) =>
  new AuthFlowError(
    'cooldown',
    `Please wait ${seconds}s before requesting another ${what}.`,
    seconds,
  );

export const AppwriteProvider = ({ children }: PropsWithChildren) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [emailLinkError, setEmailLinkError] = useState<string | null>(null);
  const [hasCachedPassword, setHasCachedPassword] = useState(false);

  // The password is needed by Appwrite for updateEmail. It is kept
  // in memory only for the current app run and is never written to storage.
  const passwordRef = useRef<string | null>(null);
  const inFlight = useRef<Set<string>>(new Set());

  const cachePassword = useCallback((password: string | null) => {
    passwordRef.current = password;
    setHasCachedPassword(Boolean(password));
  }, []);

  const clearSessionState = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    setProfile(null);
    setEmailLinkError(null);
    cachePassword(null);
  }, [cachePassword]);

  /** Rejects a second call while one with the same key is still running. */
  const runExclusive = useCallback(
    async <T,>(key: string, task: () => Promise<T>): Promise<T> => {
      if (inFlight.current.has(key)) {
        throw new AuthFlowError(
          'busy',
          'Please wait, a request is already in progress.',
        );
      }
      inFlight.current.add(key);
      try {
        return await task();
      } finally {
        inFlight.current.delete(key);
      }
    },
    [],
  );

  const loadProfileForUser = useCallback(async (userId: string) => {
    const existingProfile = await profileService.getProfileByUserId(userId);
    if (!existingProfile) {
      throw new Error(
        'No profile found for this account. Please complete registration again or contact support.',
      );
    }
    setProfile(existingProfile);
    return existingProfile;
  }, []);

  const refreshUser = useCallback(async (): Promise<AppUser> => {
    try {
      const account = await authService.getAccount();
      setUser(account);
      return account;
    } catch (error) {
      if (isSessionError(error)) {
        clearSessionState();
      }
      throw error;
    }
  }, [clearSessionState]);

  // ---- Email --------------------------------------------------------------

  const sendEmailVerificationInternal = useCallback(async (): Promise<
    'sent' | 'already_verified'
  > => {
    if (!APPWRITE_VERIFICATION_URL) {
      throw new AuthFlowError(
        'config',
        'Email verification is not configured. Please contact support.',
      );
    }
    const account = await authService.getAccount();
    setUser(account);
    if (account.emailVerification) {
      return 'already_verified';
    }
    const remaining = await getCooldownRemaining('email', account.$id);
    if (remaining > 0) {
      throw cooldownMessage(remaining, 'verification email');
    }
    await authService.sendEmailVerification(APPWRITE_VERIFICATION_URL);
    // Cooldown only starts once Appwrite accepted the request.
    await startCooldown('email', account.$id, EMAIL_RESEND_COOLDOWN_SECONDS);
    setEmailLinkError(null);
    return 'sent';
  }, []);

  const sendEmailVerification = useCallback(
    () => runExclusive('email-send', sendEmailVerificationInternal),
    [runExclusive, sendEmailVerificationInternal],
  );

  const completeEmailVerification = useCallback(
    (userId: string, secret: string) =>
      runExclusive('email-confirm', async () => {
        const account = await authService.getAccount();
        if (account.$id !== userId) {
          throw new AuthFlowError(
            'link_mismatch',
            'This verification link belongs to a different account. Sign in with that account and open the link again.',
          );
        }
        if (!account.emailVerification) {
          await authService.confirmEmailVerification(userId, secret);
        }
        setEmailLinkError(null);
        // Trust Appwrite, not the link: re-read the account.
        const fresh = await refreshUser();
        if (fresh.emailVerification) {
          await clearCooldown('email', fresh.$id);
        }
        return fresh;
      }),
    [refreshUser, runExclusive],
  );

  const changeEmail = useCallback(
    (email: string, password?: string) =>
      runExclusive('email-change', async () => {
        const nextEmail = email.trim();
        if (!isValidEmail(nextEmail)) {
          throw new AuthFlowError(
            'invalid_email',
            'Please enter a valid email address.',
          );
        }
        const pwd = password || passwordRef.current;
        if (!pwd) {
          throw new AuthFlowError(
            'password_required',
            'Enter your password to change your email.',
          );
        }
        const current = await authService.getAccount();
        if (current.email.toLowerCase() === nextEmail.toLowerCase()) {
          throw new AuthFlowError(
            'invalid_email',
            'That is already your email address.',
          );
        }

        // Appwrite has no "pending email": updateEmail applies the new address
        // to the account immediately and resets emailVerification to false
        // (it does NOT send a new verification email). So from here on the
        // account is unverified, the gate shows the new address, and that state
        // lives on Appwrite - it survives leaving the screen or restarting.
        const updated = await authService.changeEmail(nextEmail, pwd);
        cachePassword(pwd);
        await clearCooldown('email', updated.$id); // new address: no stale cooldown

        let verificationSent = false;
        let sendError: string | null = null;
        try {
          verificationSent =
            (await sendEmailVerificationInternal()) === 'sent';
        } catch (error) {
          // The address did change, so report the failure instead of hiding it;
          // the user can use Resend on the verification screen.
          sendError = getAuthErrorMessage(error, 'emailSend');
        }
        setUser(updated);
        return { verificationSent, sendError };
      }),
    [cachePassword, runExclusive, sendEmailVerificationInternal],
  );

  // ---- Session ------------------------------------------------------------

  const login = useCallback(
    async (email: string, password: string) => {
      await authService.login({ email, password });
      const currentUser = await authService.getCurrentUser();

      if (!currentUser) {
        throw new Error('Unable to load user after login.');
      }

      const userProfile = await loadProfileForUser(currentUser.$id);
      cachePassword(password);
      setUser(currentUser);
      setIsLoggedIn(true);
      return userProfile;
    },
    [cachePassword, loadProfileForUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const account = await authService.createAccount({
        email: input.email,
        password: input.password,
        name: input.name,
      });

      await authService.login({
        email: input.email,
        password: input.password,
      });

      const userProfile = await profileService.createProfile({
        userId: account.$id,
        role: input.role,
        name: input.name.trim(),
        phone: input.phone?.trim(),
        address: input.address?.trim(),
        city: input.city?.trim(),
        state: input.state?.trim(),
        pincode: input.pincode?.trim(),
        licenseVerified: false,
      });

      // Best effort: if this fails the account still exists and the email
      // screen offers "Resend".
      try {
        await sendEmailVerificationInternal();
      } catch {
        // handled on the email verification screen
      }

      const currentUser = await authService.getCurrentUser();
      cachePassword(input.password);
      setUser(currentUser);
      setProfile(userProfile);
      setIsLoggedIn(true);
      return userProfile;
    },
    [cachePassword, sendEmailVerificationInternal],
  );

  const logout = useCallback(async () => {
    const success = await authService.logout();
    if (success) {
      clearSessionState();
    }
    return success;
  }, [clearSessionState]);

  const refreshProfile = useCallback(async () => {
    if (!user?.$id) {
      return null;
    }

    const latest = await loadProfileForUser(user.$id);
    return latest;
  }, [loadProfileForUser, user?.$id]);

  const updateProfile = useCallback(
    async (data: UpdateProfileInput) => {
      if (!profile?.$id) {
        throw new Error('No profile loaded.');
      }

      const updated = await profileService.updateProfile(profile.$id, data);
      setProfile(updated);
      return updated;
    },
    [profile?.$id],
  );

  const authStage: AuthStage = !isLoggedIn || !user
    ? 'unauthenticated'
    : !user.emailVerification
      ? 'email_verification'
      : 'verified';

  // The in-memory password is only needed while the email is unverified.
  useEffect(() => {
    if (authStage === 'verified') {
      cachePassword(null);
    }
  }, [authStage, cachePassword]);

  const value = useMemo<AppwriteContextType>(
    () => ({
      isLoggedIn,
      user,
      profile,
      role: profile?.role ?? null,
      authStage,
      hasCachedPassword,
      emailLinkError,
      setIsLoggedIn,
      setUser,
      setProfile,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      getCurrentUser,
      refreshUser,
      sendEmailVerification,
      completeEmailVerification,
      setEmailLinkError,
      changeEmail,
    }),
    [
      isLoggedIn,
      user,
      profile,
      authStage,
      hasCachedPassword,
      emailLinkError,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      refreshUser,
      sendEmailVerification,
      completeEmailVerification,
      changeEmail,
    ],
  );

  return (
    <AppwriteContext.Provider value={value}>{children}</AppwriteContext.Provider>
  );
};

export const useAppwrite = (): AppwriteContextType => {
  const context = useContext(AppwriteContext);

  if (!context) {
    throw new Error('useAppwrite must be used within AppwriteProvider');
  }

  return context;
};

export default AppwriteContext;
