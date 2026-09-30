import { Models } from 'appwrite';
import { Profile } from '../types/profile';

/**
 * Where an agency is in the licence process, worked out from data that already
 * exists (no extra column needed):
 *   verified - an admin approved it (profile.licenseVerified)
 *   pending  - a licence number was submitted and is waiting for review
 *   none     - nothing submitted yet, or the last one was rejected
 */
export type LicenseStatus = 'verified' | 'pending' | 'none';

export const getLicenseStatus = (
  profile: Pick<Profile, 'licenseVerified' | 'licenseNumber'> | null | undefined,
): LicenseStatus => {
  if (profile?.licenseVerified) {
    return 'verified';
  }
  if (profile?.licenseNumber && profile.licenseNumber.trim()) {
    return 'pending';
  }
  return 'none';
};

/**
 * The reason an admin gave when rejecting the last submission, or null. Only
 * meaningful while the status is "none" (a new submission replaces it).
 */
export const getRejectionReason = (
  user: Models.User<Models.Preferences> | null | undefined,
): string | null => {
  const review = (user?.prefs as Record<string, unknown> | undefined)
    ?.licenseReview as { status?: string; reason?: unknown } | undefined;
  if (review && review.status === 'rejected') {
    return typeof review.reason === 'string' && review.reason.trim()
      ? review.reason.trim()
      : '';
  }
  return null;
};