'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

type MemberRoleFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
};

const cooldownMs = 800;

export function MemberRoleForm({ action, children }: MemberRoleFormProps) {
  const lockedRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const releaseAfterCooldown = () => {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setTimeout(() => {
      cooldownTimerRef.current = null;
      lockedRef.current = false;
      setPending(false);
    }, cooldownMs);
  };

  const submitAction = async (formData: FormData) => {
    if (lockedRef.current) {
      return;
    }

    lockedRef.current = true;
    setPending(true);

    try {
      await action(formData);
    } finally {
      releaseAfterCooldown();
    }
  };

  return (
    <form action={submitAction} className="flex flex-wrap items-center gap-2">
      <fieldset className="contents" disabled={pending}>
        {children}
      </fieldset>
    </form>
  );
}
