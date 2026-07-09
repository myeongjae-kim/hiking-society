import { AssociateFeedNotice } from '@/app/feed/components/AssociateFeedNotice';
import { ArticleDetailClient } from '@/app/article/components/ArticleDetailClient';
import type { Article } from '@/core/article/domain';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { Hiking } from '@/core/hiking/domain';
import type { NotificationListSnapshot } from '@/core/notification/model/Notification';

type ArticleDetailPageViewProps = {
  article: Article;
  comments: readonly Comment[];
  currentTheme: string;
  currentUser: AuthenticatedUser;
  hiking: Hiking;
  highlightedCommentId: CommentId | null;
  notificationSnapshot: NotificationListSnapshot;
};

export default function ArticleDetailPageView({
  article,
  comments,
  currentTheme,
  currentUser,
  hiking,
  highlightedCommentId,
  notificationSnapshot,
}: ArticleDetailPageViewProps) {
  if (currentUser.role === 'associate') {
    return <AssociateFeedNotice user={currentUser} />;
  }

  return (
    <ArticleDetailClient
      article={article}
      comments={comments}
      currentTheme={currentTheme}
      currentUser={currentUser}
      hiking={hiking}
      highlightedCommentId={highlightedCommentId}
      notificationSnapshot={notificationSnapshot}
    />
  );
}
