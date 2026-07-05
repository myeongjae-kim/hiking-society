'use client';

import type { paths } from '@/lib/api/schema';
import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';
import { toast } from 'sonner';

export const fetchClient = createFetchClient<paths>({
  credentials: 'same-origin',
});

fetchClient.use({
  async onResponse({ response }) {
    if (response.ok) {
      return response;
    }

    let message = '요청을 처리하지 못했습니다.';

    try {
      const body = (await response.clone().json()) as { message?: unknown };
      if (typeof body.message === 'string') {
        message = body.message;
      }
    } catch {
      // Keep the generic message when the response is not JSON.
    }

    toast.error(message, { position: 'bottom-center' });
    throw new Error(message);
  },
});

export const $api = createClient(fetchClient);
