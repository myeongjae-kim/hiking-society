'use client';

import { LoadingOverlay } from '@/app/common/components/LoadingOverlay';
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { toast } from 'sonner';
import { loginWithGoogleCode } from '../actions/fetchPayloadFromGoogle';

type LoginButtonProps = {
  redirectTo?: string;
};

export const LoginButton = ({ redirectTo = '/feed' }: LoginButtonProps) => {
  const [isPending, setIsPending] = useState(false);
  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (tokenResponse) => {
      setIsPending(true);
      loginWithGoogleCode(tokenResponse.code)
        .then(() => {
          window.location.href = redirectTo;
        })
        .catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : 'Login Failed.', {
            richColors: true,
          });
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
