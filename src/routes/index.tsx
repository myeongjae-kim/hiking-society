import Home from '@/app/page';
import { getSafeRedirectTarget } from '@/app/auth/utils/redirectTarget';
import { getCurrentUser } from '#/lib/server/session.functions';
import { getAuthenticatedHomeRedirectHref } from '#/lib/server/session.shared';
import { createFileRoute, redirect } from '@tanstack/react-router';

function getSingleSearchParam(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function validateHomeSearch(search: Record<string, unknown>): { next?: string } {
  const next = getSingleSearchParam(search.next);

  return {
    next: typeof next === 'string' ? next : undefined,
  };
}

export const Route = createFileRoute('/')({
  beforeLoad: async ({ search }) => {
    const user = await getCurrentUser();
    const { next } = validateHomeSearch(search);

    if (user) {
      throw redirect({
        href: getAuthenticatedHomeRedirectHref(next),
      });
    }
  },
  component: HomeRoute,
  validateSearch: validateHomeSearch,
});

function HomeRoute() {
  const { next } = Route.useSearch();

  return <Home redirectTo={getSafeRedirectTarget(next)} />;
}
