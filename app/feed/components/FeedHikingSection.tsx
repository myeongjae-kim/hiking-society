'use client';

import { ArticlePanel } from '@/app/article/components/ArticlePanel';
import { gridStackClassName } from '@/app/common/components/styles';
import { HikingHeader } from '@/app/hiking/components/HikingHeader';
import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';

import { getArticleComments, type FeedGroup } from '../utils/feed-crud-utils';
import { hasRecordKey, type HikingArticleLoadState } from '../utils/feedCrudTypes';
import { FeedArticleLoadStateView, FeedEmptyArticlesView } from './FeedArticleLoadStateView';

type FeedHikingSectionProps = {
  commentFormResetKeyByArticleId: Record<string, number>;
  commentsByArticleId: Map<ArticleId, Comment[]>;
  currentUserId: number;
  editingCommentId: CommentId | null;
  errorByKey: Record<string, string>;
  getHikingArticleCount: (hikingId: HikingId) => number;
  group: FeedGroup;
  groupIndex: number;
  highlightedHikingId: HikingId | null;
  isCommentCreateSubmitting: (articleId: ArticleId, parentCommentId: CommentId | null) => boolean;
  isCommentEditSubmitting: (commentId: CommentId) => boolean;
  isCommentLikePending: (commentId: CommentId) => boolean;
  loadHikingArticles: (hikingId: HikingId, options?: { retry?: boolean }) => void;
  loadStateByHikingId: Record<string, HikingArticleLoadState>;
  onAddArticle: (hikingId: HikingId) => void;
  onCopyArticleLink: (article: Article) => void;
  onCopyHikingLink: (hiking: Hiking) => void;
  onCreateComment: (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => void;
  onDeleteArticle: (article: Article) => void;
  onDeleteComment: (comment: Comment) => void;
  onEditArticle: (articleId: ArticleId) => void;
  onEditComment: (commentId: CommentId | null) => void;
  onEditHiking: (hikingId: HikingId) => void;
  onDeleteHiking: (hiking: Hiking) => void;
  onReplyComment: (commentId: CommentId | null) => void;
  onSubmitCommentEdit: (commentId: CommentId, body: string) => void;
  onToggleArticleLike: (articleId: ArticleId) => void;
  onToggleCommentLike: (commentId: CommentId) => void;
  pendingLikeByKey: Record<string, boolean>;
  articlesByHikingId: Record<string, readonly Article[]>;
  registerHikingSection: (hikingId: HikingId, element: HTMLElement | null) => void;
  replyingCommentId: CommentId | null;
};

export function FeedHikingSection({
  commentFormResetKeyByArticleId,
  commentsByArticleId,
  currentUserId,
  editingCommentId,
  errorByKey,
  getHikingArticleCount,
  group,
  groupIndex,
  highlightedHikingId,
  isCommentCreateSubmitting,
  isCommentEditSubmitting,
  isCommentLikePending,
  loadHikingArticles,
  loadStateByHikingId,
  onAddArticle,
  onCopyArticleLink,
  onCopyHikingLink,
  onCreateComment,
  onDeleteArticle,
  onDeleteComment,
  onDeleteHiking,
  onEditArticle,
  onEditComment,
  onEditHiking,
  onReplyComment,
  onSubmitCommentEdit,
  onToggleArticleLike,
  onToggleCommentLike,
  pendingLikeByKey,
  articlesByHikingId,
  registerHikingSection,
  replyingCommentId,
}: FeedHikingSectionProps) {
  const groupArticleCount = getHikingArticleCount(group.hiking.id);
  const hasLoadedHikingArticles = hasRecordKey(articlesByHikingId, group.hiking.id);
  const groupLoadState =
    loadStateByHikingId[group.hiking.id] ??
    (groupArticleCount === 0
      ? ({ status: 'loaded' } satisfies HikingArticleLoadState)
      : ({ status: 'idle' } satisfies HikingArticleLoadState));

  return (
    <section
      className={`${gridStackClassName} focus:outline-none ${
        highlightedHikingId === group.hiking.id ? 'shadow-[0_0_0_2px_var(--blue)]' : ''
      }`}
      data-hiking-id={group.hiking.id}
      id={`hiking-section-${group.hiking.id}`}
      key={`${group.hiking.id}-${groupIndex}`}
      aria-labelledby={`hiking-${group.hiking.id}`}
      ref={(element) => registerHikingSection(group.hiking.id, element)}
      tabIndex={-1}
    >
      <HikingHeader
        canManageHiking={group.hiking.authorUserId === currentUserId}
        error={errorByKey[`hiking-${group.hiking.id}`]}
        hiking={group.hiking}
        onAddArticle={() => onAddArticle(group.hiking.id)}
        onCopyLink={() => onCopyHikingLink(group.hiking)}
        onDelete={() => onDeleteHiking(group.hiking)}
        onEdit={() => onEditHiking(group.hiking.id)}
      />
      <div className={gridStackClassName}>
        <FeedArticleLoadStateView
          articleCount={groupArticleCount}
          hasLoadedArticles={hasLoadedHikingArticles}
          hikingId={group.hiking.id}
          loadState={groupLoadState}
          onRetry={() => loadHikingArticles(group.hiking.id, { retry: true })}
        />
        {hasLoadedHikingArticles ? (
          group.articles.length > 0 ? (
            group.articles.map((article) => (
              <ArticlePanel
                article={article}
                articleDetailHref={`/article/${article.id}`}
                articleLikePending={pendingLikeByKey[`article-${article.id}`] === true}
                canEdit={article.authorUserId === currentUserId}
                comments={getArticleComments(commentsByArticleId, article.id)}
                commentFormResetKey={commentFormResetKeyByArticleId[article.id] ?? 0}
                currentUserId={currentUserId}
                editingCommentId={editingCommentId}
                errorByKey={errorByKey}
                isCommentCreateSubmitting={isCommentCreateSubmitting}
                isCommentEditSubmitting={isCommentEditSubmitting}
                isCommentLikePending={isCommentLikePending}
                key={article.id}
                mobileMediaCarousel
                onCreateComment={onCreateComment}
                onCopyArticleLink={() => onCopyArticleLink(article)}
                onDeleteArticle={() => onDeleteArticle(article)}
                onDeleteComment={onDeleteComment}
                onEditArticle={() => onEditArticle(article.id)}
                onEditComment={onEditComment}
                onReplyComment={onReplyComment}
                onSubmitCommentEdit={onSubmitCommentEdit}
                onToggleArticleLike={onToggleArticleLike}
                onToggleCommentLike={onToggleCommentLike}
                replyingCommentId={replyingCommentId}
              />
            ))
          ) : (
            <FeedEmptyArticlesView hikingId={group.hiking.id} />
          )
        ) : groupLoadState.status === 'loaded' ? (
          <FeedEmptyArticlesView hikingId={group.hiking.id} />
        ) : null}
      </div>
    </section>
  );
}
