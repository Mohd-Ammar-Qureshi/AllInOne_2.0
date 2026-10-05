import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Resend cooldowns, persisted so they survive an app restart.
 *
 * The cooldown is stored as an absolute timestamp. It is only ever started
 * after a successful send, and the auth actions in AppwriteContext consult it
 * before calling Appwrite, so it is not just a disabled button. (A user can
 * still edit the device clock; Appwrite's own rate limits are the real
 * server-side backstop.)
 */
export type CooldownChannel = 'email';

export const EMAIL_RESEND_COOLDOWN_SECONDS = 60;

const storageKey = (channel: CooldownChannel, userId: string) =>
  `auth:cooldown:${channel}:${userId}`;

type Listener = (channel: CooldownChannel, userId: string) => void;
const listeners = new Set<Listener>();

export const subscribeCooldown = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notify = (channel: CooldownChannel, userId: string) => {
  listeners.forEach(listener => listener(channel, userId));
};

export const getCooldownEndsAt = async (
  channel: CooldownChannel,
  userId: string,
): Promise<number> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(channel, userId));
    const endsAt = raw ? Number(raw) : 0;
    return Number.isFinite(endsAt) ? endsAt : 0;
  } catch {
    return 0;
  }
};

export const getCooldownRemaining = async (
  channel: CooldownChannel,
  userId: string,
): Promise<number> => {
  const endsAt = await getCooldownEndsAt(channel, userId);
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
};

export const startCooldown = async (
  channel: CooldownChannel,
  userId: string,
  seconds: number,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      storageKey(channel, userId),
      String(Date.now() + seconds * 1000),
    );
  } catch {
    // Storage failure must not break the flow; Appwrite still rate-limits.
  }
  notify(channel, userId);
};

export const clearCooldown = async (
  channel: CooldownChannel,
  userId: string,
): Promise<void> => {
  try {
    await AsyncStorage.removeItem(storageKey(channel, userId));
  } catch {
    // ignore
  }
  notify(channel, userId);
};
