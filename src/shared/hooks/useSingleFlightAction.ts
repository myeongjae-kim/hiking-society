'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SingleFlightOptions = {
  cooldownMs?: number;
};

const defaultCooldownMs = 800;

export function useSingleFlightAction() {
  const runningKeysRef = useRef<Set<string>>(new Set());
  const cooldownTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [, setRevision] = useState(0);

  const notifyChange = useCallback(() => {
    setRevision((revision) => revision + 1);
  }, []);

  const release = useCallback(
    (key: string, cooldownMs: number) => {
      const existingTimer = cooldownTimersRef.current.get(key);

      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        cooldownTimersRef.current.delete(key);
        runningKeysRef.current.delete(key);
        notifyChange();
      }, cooldownMs);

      cooldownTimersRef.current.set(key, timer);
      notifyChange();
    },
    [notifyChange],
  );

  const run = useCallback(
    async <T>(key: string, action: () => Promise<T>, options: SingleFlightOptions = {}) => {
      if (runningKeysRef.current.has(key)) {
        return undefined;
      }

      runningKeysRef.current.add(key);
      notifyChange();

      try {
        return await action();
      } finally {
        release(key, options.cooldownMs ?? defaultCooldownMs);
      }
    },
    [notifyChange, release],
  );

  const isRunning = useCallback((key: string) => runningKeysRef.current.has(key), []);

  useEffect(() => {
    const cooldownTimers = cooldownTimersRef.current;

    return () => {
      for (const timer of cooldownTimers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  return useMemo(() => ({ isRunning, run }), [isRunning, run]);
}
