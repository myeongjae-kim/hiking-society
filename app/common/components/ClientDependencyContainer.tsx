'use client';

import { clientEnv } from '@/core/config/clientEnv';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PropsWithChildren, useState } from 'react';
import { Toaster } from 'sonner';

const toasterOffset = { top: '1rem' };
const toasterMobileOffset = {
  left: '1rem',
  right: '1rem',
  top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
};

const ClientDependencyContainer = (props: PropsWithChildren) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            retry: false,
          },
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={clientEnv.VITE_GOOGLE_LOGIN_CLIENT_ID}>
        {props.children}
        <Toaster mobileOffset={toasterMobileOffset} offset={toasterOffset} position="top-center" />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
};

export default ClientDependencyContainer;
