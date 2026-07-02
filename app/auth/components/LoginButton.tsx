'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchPayloadFromGoogle } from '../actions/fetchPayloadFromGoogle';

export const LoginButton = () => {
  const router = useRouter();
  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (tokenResponse) => {
      fetchPayloadFromGoogle(tokenResponse)
        .then(console.log)
        .then(() => {
          router.push('/feed');
        });
    },
    onError: (e) => {
      toast.error('Login Failed. ' + e.error_description, { richColors: true });
      console.error(e);
    },
  });

  return (
    <button
      className="basecamp-button"
      size-="large"
      type="button"
      variant-="lavender"
      onClick={() => login()}
    >
      Enter Basecamp
    </button>
  );
};
