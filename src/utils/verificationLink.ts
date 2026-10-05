import { APPWRITE_VERIFICATION_URL } from '../appwrite/client';

export type VerificationLink = { userId: string; secret: string };

/** `invalid`: it is our verification link, but userId/secret are missing. */
export type VerificationLinkResult =
  | { status: 'ok'; link: VerificationLink }
  | { status: 'invalid' };

const parseQuery = (query: string): Record<string, string> => {
  const out: Record<string, string> = {};
  query.split('&').forEach(pair => {
    if (!pair) {
      return;
    }
    const [rawKey, ...rest] = pair.split('=');
    try {
      out[decodeURIComponent(rawKey)] = decodeURIComponent(
        rest.join('=').replace(/\+/g, ' '),
      );
    } catch {
      // skip malformed pair
    }
  });
  return out;
};

const stripQuery = (url: string) => url.split(/[?#]/)[0].replace(/\/+$/, '');

/**
 * Returns null when `url` is not our verification link at all (so unrelated
 * deep links are ignored). For our link - the bridge page URL
 * (APPWRITE_VERIFICATION_URL) or the app deep link it forwards to
 * (allinone://verify-email) - returns the parameters, or `invalid` when
 * userId/secret are missing so the user can be told instead of nothing happening.
 */
export const parseVerificationLink = (
  url: string,
): VerificationLinkResult | null => {
  if (!url) {
    return null;
  }
  const base = stripQuery(url);
  const accepted = [stripQuery(APPWRITE_VERIFICATION_URL), 'allinone://verify-email'];
  if (!accepted.some(item => item && base === item)) {
    return null;
  }
  const query = url.indexOf('?') === -1 ? '' : url.slice(url.indexOf('?') + 1);
  const params = parseQuery(query.split('#')[0]);
  if (!params.userId || !params.secret) {
    return { status: 'invalid' };
  }
  return { status: 'ok', link: { userId: params.userId, secret: params.secret } };
};
