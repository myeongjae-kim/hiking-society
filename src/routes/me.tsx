import MyPageView from '@/app/me/page';
import { getCurrentTheme, getCurrentUser } from '#/lib/server/session.functions';
import { getLoginRedirectHref } from '#/lib/server/session.shared';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/me')({
  component: MyRoute,
  loader: async ({ location }) => {
    const user = await getCurrentUser();

    if (!user) {
      throw redirect({ href: getLoginRedirectHref(location.href) });
    }

    return {
      theme: await getCurrentTheme(),
      user,
    };
  },
});

function MyRoute() {
  return <MyPageView {...Route.useLoaderData()} />;
}
