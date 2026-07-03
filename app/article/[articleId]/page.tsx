import { notFound } from 'next/navigation';

import { requireCurrentUser } from '@/app/auth/actions/session';
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

  const snapshot = await applicationContext()
    .get('GetArticleDetailUseCase')
    .get({ articleId: articleId as ArticleId, currentUserId: user.id });

  if (!snapshot) {
    notFound();
  }

  return (
    <ArticleDetailClient
      article={snapshot.article}
      comments={snapshot.comments}
      currentUser={user}
      highlightedCommentId={toCommentId(query.commentId)}
    />
  );
}
