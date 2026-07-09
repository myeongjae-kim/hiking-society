import FeedPageView from '@/app/feed/page';
import type { HikingId } from '@/core/hiking/domain';
import { getFeedRouteData } from '#/lib/server/pageData.functions';
import { getLoginRedirectHref } from '#/lib/server/session.shared';
import { createFileRoute, redirect } from '@tanstack/react-router';

function getSingleSearchParam(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

export const Route = createFileRoute('/feed')({
  component: FeedRoute,
  loader: async ({ location }) => {
    const data = await getFeedRouteData();

    if (data.status === 'unauthenticated') {
      throw redirect({ href: getLoginRedirectHref(location.href) });
    }

    if (data.status === 'associate') {
      return {
        currentTheme: data.currentTheme,
        feedSummary: null,
        notificationSnapshot: null,
        selectedHikingId: null,
        user: data.user,
      };
    }

    return {
      currentTheme: data.currentTheme,
      feedSummary: data.feedSummary,
      notificationSnapshot: data.notificationSnapshot,
      selectedHikingId: null,
      user: data.user,
    };
  },
  validateSearch: (search) => ({
    hikingId: getSingleSearchParam(search.hikingId),
  }),
});

function FeedRoute() {
  const data = Route.useLoaderData();
  const { hikingId } = Route.useSearch();

  return (
    <FeedPageView
      {...data}
      selectedHikingId={typeof hikingId === 'string' ? (hikingId as HikingId) : null}
    />
  );
}
