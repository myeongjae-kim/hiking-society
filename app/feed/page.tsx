import { requireCurrentUser } from '@/app/auth/actions/session';
import { mockArticles, mockComments, mockHikings } from '@/core/mock';
import { FeedCrudClient } from './components/FeedCrudClient';

export default async function FeedPage() {
  const user = await requireCurrentUser();

  return (
    <FeedCrudClient
      articles={mockArticles}
      comments={mockComments}
      currentUser={user}
      hikings={mockHikings}
    />
  );
}
