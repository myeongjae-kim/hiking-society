import { requireCurrentUser } from '@/app/auth/actions/session';
import { mockArticles, mockComments, mockHikings } from '@/core/mock';
import { FeedCrudClient } from './feed-crud-client';

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
