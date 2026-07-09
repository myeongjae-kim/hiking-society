'use client';

import { LoadingOverlay } from '#/features/shared/components/LoadingOverlay';
import { $api } from '#/api/client/$api';
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { toast } from 'sonner';

type LoginButtonProps = {
  redirectTo?: string;
};

export const LoginButton = ({ redirectTo = '/feed' }: LoginButtonProps) => {
  const [isPending, setIsPending] = useState(false);
  const loginMutation = $api.useMutation('post', '/api/auth/google/login');
  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (tokenResponse) => {
      const code = tokenResponse.code;

      if (!code) {
        toast.error('Google authorization code를 받지 못했습니다.', {
          richColors: true,
        });
        return;
      }

      setIsPending(true);
      loginMutation
        .mutateAsync({ body: { code } })
        .then(() => {
          window.location.href = redirectTo;
        })
        .catch(() => {
          setIsPending(false);
        });
    },
    onError: (e) => {
      toast.error('Login Failed. ' + e.error_description, { richColors: true });
      console.error(e);
    },
  });

  return (
    <>
      <button
        className="basecamp-button"
        size-="large"
        type="button"
        variant-="lavender"
        disabled={isPending}
        onClick={() => login()}
      >
        {isPending ? 'Entering...' : 'Enter Basecamp'}
      </button>
      <LoadingOverlay label="로그인 중" open={isPending} />
    </>
  );
};
