import MyPageView from '#/profile/ProfilePageView';
import { getCurrentTheme, getCurrentUser } from '#/auth/session.functions';
import { getLoginRedirectHref } from '#/auth/session.shared';
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
