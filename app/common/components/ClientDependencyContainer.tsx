'use client';

import { clientEnv } from '@/core/config/clientEnv';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';

const toasterOffset = { top: '1rem' };
const toasterMobileOffset = {
  left: '1rem',
  right: '1rem',
  top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
};

const ClientDependencyContainer = (props: PropsWithChildren) => {
  return (
    <>
      <GoogleOAuthProvider clientId={clientEnv.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID}>
        {props.children}
        <Toaster mobileOffset={toasterMobileOffset} offset={toasterOffset} position="top-center" />
      </GoogleOAuthProvider>
    </>
  );
};

export default ClientDependencyContainer;
