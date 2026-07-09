import { getSafeRedirectTarget } from '@/app/auth/utils/redirectTarget';

export function getLoginRedirectHref(currentHref: string) {
  const url = new URL('/', 'http://localhost');

  url.searchParams.set('next', currentHref);

  return `${url.pathname}${url.search}`;
}

export function getAuthenticatedHomeRedirectHref(value: string | undefined) {
  return getSafeRedirectTarget(value);
}
