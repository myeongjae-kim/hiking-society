'use client';

import { $api } from '@/app/common/api/$api';
import { apiQueryKeys } from '@/app/common/api/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

type MemberRoleFormProps = {
  children: ReactNode;
  userId: number;
};

const cooldownMs = 800;

export function MemberRoleForm({ children, userId }: MemberRoleFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const updateRoleMutation = $api.useMutation('patch', '/api/members/{userId}/role', {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryKeys.members(),
      });
      router.refresh();
    },
  });
  const lockedRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cooldownPending, setCooldownPending] = useState(false);
  const pending = updateRoleMutation.isPending || cooldownPending;

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
      setCooldownPending(false);
    }, cooldownMs);
  };

  const submitAction = async (formData: FormData) => {
    if (lockedRef.current) {
      return;
    }

    lockedRef.current = true;
    setCooldownPending(true);

    try {
      const role = formData.get('role');

      if (role !== 'associate' && role !== 'member' && role !== 'admin') {
        throw new Error('Invalid role.');
      }

      await updateRoleMutation.mutateAsync({
        body: { role },
        params: { path: { userId: String(userId) } },
      });
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
