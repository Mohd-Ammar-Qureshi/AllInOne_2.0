import { useCallback, useEffect, useState } from 'react';
import {
  CooldownChannel,
  getCooldownEndsAt,
  subscribeCooldown,
} from '../utils/cooldown';

/**
 * Seconds left on a persisted resend cooldown. Re-syncs automatically whenever
 * a cooldown is started/cleared anywhere in the app.
 */
export const useCooldown = (
  channel: CooldownChannel,
  userId: string | undefined,
): number => {
  const [endsAt, setEndsAt] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const load = useCallback(async () => {
    if (!userId) {
      setEndsAt(0);
      return;
    }
    setEndsAt(await getCooldownEndsAt(channel, userId));
  }, [channel, userId]);

  useEffect(() => {
    load();
    return subscribeCooldown((changedChannel, changedUserId) => {
      if (changedChannel === channel && changedUserId === userId) {
        load();
      }
    });
  }, [channel, load, userId]);

  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    if (endsAt <= Date.now()) {
      return;
    }
    const timer = setInterval(() => {
      tick();
      if (Date.now() >= endsAt) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return remaining;
};
