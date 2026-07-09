import MembersPageView from '#/member/MemberManagementPageView';
import { getMembersRouteData } from '#/member/memberRouteData.functions';
import { getLoginRedirectHref } from '#/auth/session.shared';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/members')({
  component: MembersRoute,
  loader: async ({ location }) => {
    const data = await getMembersRouteData();

    if (data.status === 'unauthenticated') {
      throw redirect({ href: getLoginRedirectHref(location.href) });
    }

    if (data.status === 'forbidden') {
      throw redirect({ href: '/feed' });
    }

    return {
      actor: data.actor,
      members: data.members,
    };
  },
});

function MembersRoute() {
  return <MembersPageView {...Route.useLoaderData()} />;
}
