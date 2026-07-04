import { requireCurrentUser } from '@/app/auth/actions/session';
import { getWebtuiTheme, WEBTUI_THEME_COOKIE_NAME } from '@/app/common/theme/webtuiThemes';
import { applicationContext } from '@/core/config/applicationContext';
import type { HikingId } from '@/core/hiking/domain';
import { cookies } from 'next/headers';
import { AssociateFeedNotice } from './components/AssociateFeedNotice';
import { FeedCrudClient } from './components/FeedCrudClient';

type FeedPageProps = {
  searchParams?: Promise<{
    hikingId?: string | string[];
  }>;
};

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const user = await requireCurrentUser();
  const params = searchParams ? await searchParams : {};
  const hikingIdParam = Array.isArray(params.hikingId) ? params.hikingId[0] : params.hikingId;

  if (user.role === 'associate') {
    return <AssociateFeedNotice user={user} />;
  }

  const context = applicationContext();
  const [feedSummary, notificationSnapshot] = await Promise.all([
    context.get('ListFeedUseCase').listHikings({ currentUserId: user.id }),
    context.get('ListNotificationsUseCase').list({ currentUserId: user.id }),
  ]);
  const cookieStore = await cookies();
  const theme = getWebtuiTheme(cookieStore.get(WEBTUI_THEME_COOKIE_NAME)?.value);

  return (
    <FeedCrudClient
      articleCount={feedSummary.articleCount}
      commentCount={feedSummary.commentCount}
      currentTheme={theme}
      currentUser={user}
      hikingArticleCounts={feedSummary.hikingArticleCounts}
      hikings={feedSummary.hikings}
      notificationSnapshot={notificationSnapshot}
      selectedHikingId={hikingIdParam ? (hikingIdParam as HikingId) : null}
    />
  );
}
