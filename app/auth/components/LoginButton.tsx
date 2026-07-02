'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { LoadingOverlay } from '@/app/common/components/LoadingOverlay';
import { loginWithGoogleCode } from '../actions/fetchPayloadFromGoogle';

export const LoginButton = () => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (tokenResponse) => {
      setIsPending(true);
      loginWithGoogleCode(tokenResponse.code)
        .then(() => {
          router.push('/feed');
          router.refresh();
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
