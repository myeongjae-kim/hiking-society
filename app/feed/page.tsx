import { requireCurrentUser } from '@/app/auth/actions/session';
import { getWebtuiTheme, WEBTUI_THEME_COOKIE_NAME } from '@/app/common/theme/webtuiThemes';
import { applicationContext } from '@/core/config/applicationContext';
import { cookies } from 'next/headers';
import { AssociateFeedNotice } from './components/AssociateFeedNotice';
import { FeedCrudClient } from './components/FeedCrudClient';

export default async function FeedPage() {
  const user = await requireCurrentUser();

  if (user.role === 'associate') {
    return <AssociateFeedNotice user={user} />;
  }

  const context = applicationContext();
  const [{ articles, comments, hikings }, notificationSnapshot] = await Promise.all([
    context.get('ListFeedUseCase').list({ currentUserId: user.id }),
    context.get('ListNotificationsUseCase').list({ currentUserId: user.id }),
  ]);
  const cookieStore = await cookies();
  const theme = getWebtuiTheme(cookieStore.get(WEBTUI_THEME_COOKIE_NAME)?.value);

  return (
    <FeedCrudClient
      articles={articles}
      comments={comments}
      currentTheme={theme}
      currentUser={user}
      hikings={hikings}
      notificationSnapshot={notificationSnapshot}
    />
  );
}
