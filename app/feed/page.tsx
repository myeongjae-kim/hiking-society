import { requireCurrentUser } from '@/app/auth/actions/session';
import { applicationContext } from '@/core/config/applicationContext';
import { AssociateFeedNotice } from './components/AssociateFeedNotice';
import { FeedCrudClient } from './components/FeedCrudClient';

export default async function FeedPage() {
  const user = await requireCurrentUser();

  if (user.role === 'associate') {
    return <AssociateFeedNotice user={user} />;
  }

  const { articles, comments, hikings } = await applicationContext().get('ListFeedUseCase').list();

  return (
    <FeedCrudClient articles={articles} comments={comments} currentUser={user} hikings={hikings} />
  );
}
