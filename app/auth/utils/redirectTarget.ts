const defaultRedirectTarget = '/feed';

function getSingleValue(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isAllowedRedirectPath(pathname: string) {
  return (
    pathname === '/feed' ||
    pathname === '/me' ||
    pathname === '/members' ||
    pathname.startsWith('/me/') ||
    pathname.startsWith('/members/') ||
    /^\/article\/\d+$/.test(pathname)
  );
}

export function getSafeRedirectTarget(value: string | string[] | null | undefined) {
  const target = getSingleValue(value);

  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return defaultRedirectTarget;
  }

  try {
    const url = new URL(target, 'https://hiking-society.local');

    if (url.origin !== 'https://hiking-society.local' || !isAllowedRedirectPath(url.pathname)) {
      return defaultRedirectTarget;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return defaultRedirectTarget;
  }
}
