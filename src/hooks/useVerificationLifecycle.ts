import { useCallback, useEffect, useRef } from 'react';
import { AppState, Linking } from 'react-native';
import { useAppwrite } from '../appwrite/AppwriteContext';
import { getAuthErrorMessage } from '../utils/authErrors';
import {
  showErrorSnackbar,
  showSuccessSnackbar,
  showWarningSnackbar,
} from '../utils/errorHandler';
import {
  parseVerificationLink,
  VerificationLink,
} from '../utils/verificationLink';

/**
 * Keeps the verification gate honest once the app is running:
 *  1. when the app returns to the foreground, re-read the Appwrite account
 *     (the user probably just opened the email link), and
 *  2. complete email verification when the verification deep link opens the
 *     app - both warm start ('url' event) and cold start (getInitialURL).
 */
export const useVerificationLifecycle = (enabled: boolean): void => {
  const { isLoggedIn, refreshUser, completeEmailVerification, setEmailLinkError } =
    useAppwrite();
  // A link we are processing or have processed (same secret = same link).
  const seenSecrets = useRef<Set<string>>(new Set());
  const seenInvalidUrls = useRef<Set<string>>(new Set());
  // A valid link that arrived while nobody was signed in.
  const pendingLink = useRef<VerificationLink | null>(null);

  const processLink = useCallback(
    async (link: VerificationLink) => {
      if (seenSecrets.current.has(link.secret)) {
        return;
      }
      seenSecrets.current.add(link.secret);
      try {
        const account = await completeEmailVerification(link.userId, link.secret);
        if (account.emailVerification) {
          showSuccessSnackbar('Email verified successfully.');
        }
      } catch (error) {
        const message = getAuthErrorMessage(error, 'emailConfirm');
        setEmailLinkError(message);
        showErrorSnackbar(message);
      }
    },
    [completeEmailVerification, setEmailLinkError],
  );

  useEffect(() => {
    if (!enabled || !isLoggedIn) {
      return;
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        // Silent: network blips must not interrupt the user. A 401 still
        // signs them out inside refreshUser.
        refreshUser().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [enabled, isLoggedIn, refreshUser]);

  // Process a link that was waiting for a signed-in user.
  useEffect(() => {
    if (enabled && isLoggedIn && pendingLink.current) {
      const link = pendingLink.current;
      pendingLink.current = null;
      processLink(link);
    }
  }, [enabled, isLoggedIn, processLink]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleUrl = (url: string | null) => {
      const result = url ? parseVerificationLink(url) : null;
      if (!url || !result) {
        return;
      }
      if (result.status === 'invalid') {
        // Our link, but userId/secret are missing: say so (once per link).
        if (!seenInvalidUrls.current.has(url)) {
          seenInvalidUrls.current.add(url);
          const message = 'Verification link is invalid. Please request a new one.';
          setEmailLinkError(message);
          showErrorSnackbar(message);
        }
        return;
      }
      const link = result.link;
      if (seenSecrets.current.has(link.secret)) {
        return;
      }
      if (!isLoggedIn) {
        pendingLink.current = link;
        showWarningSnackbar('Sign in to finish verifying your email.');
        return;
      }
      processLink(link);
    };

    Linking.getInitialURL().then(handleUrl).catch(() => undefined);
    const subscription = Linking.addEventListener('url', event =>
      handleUrl(event.url),
    );
    return () => subscription.remove();
  }, [enabled, isLoggedIn, processLink, setEmailLinkError]);
};
