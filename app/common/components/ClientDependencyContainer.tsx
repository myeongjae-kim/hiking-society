'use client';

import { clientEnv } from '@/core/config/clientEnv';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';

const ClientDependencyContainer = (props: PropsWithChildren) => {
  return (
    <>
      <GoogleOAuthProvider clientId={clientEnv.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID}>
        {props.children}
        <Toaster />
      </GoogleOAuthProvider>
    </>
  );
};

export default ClientDependencyContainer;
