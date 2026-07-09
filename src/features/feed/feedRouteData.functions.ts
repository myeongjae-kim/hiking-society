import { applicationContext } from '@/core/config/applicationContext.server';
import { readCurrentTheme, readCurrentUser } from '#/features/auth/session.functions';
import { createServerFn } from '@tanstack/react-start';

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

  const context = applicationContext();
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
