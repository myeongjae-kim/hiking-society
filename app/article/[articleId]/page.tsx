import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { requireCurrentUser } from '@/app/auth/actions/session';
import { getWebtuiTheme, WEBTUI_THEME_COOKIE_NAME } from '@/app/common/theme/webtuiThemes';
import { AssociateFeedNotice } from '@/app/feed/components/AssociateFeedNotice';
import { ArticleDetailClient } from '@/app/article/components/ArticleDetailClient';
import type { ArticleId } from '@/core/article/domain';
import type { CommentId } from '@/core/comment/domain';
import { applicationContext } from '@/core/config/applicationContext';

type ArticleDetailPageProps = {
  params: Promise<{ articleId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toCommentId(value: string | string[] | undefined) {
  const commentId = getSingleSearchParam(value);

  if (!commentId || !/^\d+$/.test(commentId)) {
    return null;
  }

  return commentId as CommentId;
}

export default async function ArticleDetailPage({ params, searchParams }: ArticleDetailPageProps) {
  const [{ articleId }, query, user] = await Promise.all([
    params,
    searchParams,
    requireCurrentUser(),
  ]);

  if (!/^\d+$/.test(articleId)) {
    notFound();
  }

  if (user.role === 'associate') {
    return <AssociateFeedNotice user={user} />;
  }

  const context = applicationContext();
  const [snapshot, notificationSnapshot, cookieStore] = await Promise.all([
    context
      .get('GetArticleDetailUseCase')
      .get({ articleId: articleId as ArticleId, currentUserId: user.id }),
    context.get('ListNotificationsUseCase').list({ currentUserId: user.id }),
    cookies(),
  ]);

  if (!snapshot) {
    notFound();
  }

  return (
    <ArticleDetailClient
      article={snapshot.article}
      comments={snapshot.comments}
      currentTheme={getWebtuiTheme(cookieStore.get(WEBTUI_THEME_COOKIE_NAME)?.value)}
      currentUser={user}
      highlightedCommentId={toCommentId(query.commentId)}
      notificationSnapshot={notificationSnapshot}
    />
  );
}
