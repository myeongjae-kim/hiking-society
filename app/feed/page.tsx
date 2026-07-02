import { requireCurrentUser } from '@/app/auth/actions/session';
import { mockArticles, mockComments, mockHikings } from '@/core/mock';
import { AssociateFeedNotice } from './components/AssociateFeedNotice';
import { FeedCrudClient } from './components/FeedCrudClient';

export default async function FeedPage() {
  const user = await requireCurrentUser();

  if (user.role === 'associate') {
    return <AssociateFeedNotice user={user} />;
  }

  return (
    <FeedCrudClient
      articles={mockArticles}
      comments={mockComments}
      currentUser={user}
      hikings={mockHikings}
    />
  );
}
