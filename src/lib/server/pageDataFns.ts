import { canManageMembers } from '@/core/auth/model/roles';
import type { ArticleId } from '@/core/article/domain';
import { createServerFn } from '@tanstack/react-start';
import { readCurrentTheme, readCurrentUser } from './sessionFns';

async function getApplicationContext() {
  const { applicationContext } = await import('@/core/config/applicationContext');

  return applicationContext();
}

export const getFeedRouteData = createServerFn({ method: 'GET' }).handler(async () => {
  const [user, currentTheme] = await Promise.all([readCurrentUser(), readCurrentTheme()]);

  if (!user) {
    return { status: 'unauthenticated' as const };
  }

  if (user.role === 'associate') {
    return {
      currentTheme,
      status: 'associate' as const,
      user,
    };
  }

  const context = await getApplicationContext();
  const [feedSummary, notificationSnapshot] = await Promise.all([
    context.get('ListFeedUseCase').listHikings({ currentUserId: user.id }),
    context.get('ListNotificationsUseCase').list({ currentUserId: user.id }),
  ]);

  return {
    currentTheme,
    feedSummary,
    notificationSnapshot,
    status: 'ok' as const,
    user,
  };
});

export const getMembersRouteData = createServerFn({ method: 'GET' }).handler(async () => {
  const actor = await readCurrentUser();

  if (!actor) {
    return { status: 'unauthenticated' as const };
  }

  if (!canManageMembers(actor.role)) {
    return { status: 'forbidden' as const };
  }

  return {
    actor,
    members: await (await getApplicationContext()).get('ListMembersUseCase').list(),
    status: 'ok' as const,
  };
});

export const getArticleRouteData = createServerFn({ method: 'GET' })
  .validator((data: { articleId: string }) => data)
  .handler(async ({ data }) => {
    const [currentUser, currentTheme] = await Promise.all([readCurrentUser(), readCurrentTheme()]);

    if (!currentUser) {
      return { status: 'unauthenticated' as const };
    }

    if (!/^\d+$/.test(data.articleId)) {
      return { status: 'notFound' as const };
    }

    if (currentUser.role === 'associate') {
      return {
        currentTheme,
        currentUser,
        status: 'associate' as const,
      };
    }

    const context = await getApplicationContext();
    const [snapshot, notificationSnapshot] = await Promise.all([
      context
        .get('GetArticleDetailUseCase')
        .get({ articleId: data.articleId as ArticleId, currentUserId: currentUser.id }),
      context.get('ListNotificationsUseCase').list({ currentUserId: currentUser.id }),
    ]);

    if (!snapshot) {
      return { status: 'notFound' as const };
    }

    return {
      article: snapshot.article,
      comments: snapshot.comments,
      currentTheme,
      currentUser,
      hiking: snapshot.hiking,
      notificationSnapshot,
      status: 'ok' as const,
    };
  });
