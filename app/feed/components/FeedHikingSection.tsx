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
  currentUserId: number;
  group: FeedGroup;
  groupIndex: number;
  loader: {
    articlesByHikingId: Record<string, readonly Article[]>;
    commentsByArticleId: Map<ArticleId, Comment[]>;
    getHikingArticleCount: (hikingId: HikingId) => number;
    loadHikingArticles: (hikingId: HikingId, options?: { retry?: boolean }) => void;
    loadStateByHikingId: Record<string, HikingArticleLoadState>;
    registerHikingSection: (hikingId: HikingId, element: HTMLElement | null) => void;
  };
  state: {
    commentFormResetKeyByArticleId: Record<string, number>;
    editingCommentId: CommentId | null;
    errorByKey: Record<string, string>;
    highlightedHikingId: HikingId | null;
    isCommentCreateSubmitting: (articleId: ArticleId, parentCommentId: CommentId | null) => boolean;
    isCommentEditSubmitting: (commentId: CommentId) => boolean;
    isCommentLikePending: (commentId: CommentId) => boolean;
    pendingLikeByKey: Record<string, boolean>;
    replyingCommentId: CommentId | null;
  };
  actions: {
    copyArticleLink: (article: Article) => void;
    copyHikingLink: (hiking: Hiking) => void;
    createComment: (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => void;
    requestDeleteArticle: (article: Article) => void;
    requestDeleteComment: (comment: Comment) => void;
    requestDeleteHiking: (hiking: Hiking) => void;
    setActiveArticleForm: (
      form: { articleId: ArticleId; type: 'edit' } | { hikingId: HikingId; type: 'create' },
    ) => void;
    setActiveHikingForm: (form: { hikingId: HikingId; type: 'edit' } | { type: 'create' }) => void;
    setEditingCommentId: (commentId: CommentId | null) => void;
    setReplyingCommentId: (commentId: CommentId | null) => void;
    toggleArticleLike: (articleId: ArticleId) => void;
    toggleCommentLike: (commentId: CommentId) => void;
    updateComment: (commentId: CommentId, body: string) => void;
  };
};

export function FeedHikingSection({
  actions,
  currentUserId,
  group,
  groupIndex,
  loader,
  state,
}: FeedHikingSectionProps) {
  const groupArticleCount = loader.getHikingArticleCount(group.hiking.id);
  const hasLoadedHikingArticles = hasRecordKey(loader.articlesByHikingId, group.hiking.id);
  const groupLoadState =
    loader.loadStateByHikingId[group.hiking.id] ??
    (groupArticleCount === 0
      ? ({ status: 'loaded' } satisfies HikingArticleLoadState)
      : ({ status: 'idle' } satisfies HikingArticleLoadState));

  return (
    <section
      className={`${gridStackClassName} focus:outline-none ${
        state.highlightedHikingId === group.hiking.id ? 'shadow-[0_0_0_2px_var(--blue)]' : ''
      }`}
      data-hiking-id={group.hiking.id}
      id={`hiking-section-${group.hiking.id}`}
      key={`${group.hiking.id}-${groupIndex}`}
      aria-labelledby={`hiking-${group.hiking.id}`}
      ref={(element) => loader.registerHikingSection(group.hiking.id, element)}
      tabIndex={-1}
    >
      <HikingHeader
        canManageHiking={group.hiking.authorUserId === currentUserId}
        error={state.errorByKey[`hiking-${group.hiking.id}`]}
        hiking={group.hiking}
        onAddArticle={() =>
          actions.setActiveArticleForm({ hikingId: group.hiking.id, type: 'create' })
        }
        onCopyLink={() => actions.copyHikingLink(group.hiking)}
        onDelete={() => actions.requestDeleteHiking(group.hiking)}
        onEdit={() => actions.setActiveHikingForm({ hikingId: group.hiking.id, type: 'edit' })}
      />
      <div className={gridStackClassName}>
        <FeedArticleLoadStateView
          articleCount={groupArticleCount}
          hasLoadedArticles={hasLoadedHikingArticles}
          hikingId={group.hiking.id}
          loadState={groupLoadState}
          onRetry={() => loader.loadHikingArticles(group.hiking.id, { retry: true })}
        />
        {hasLoadedHikingArticles ? (
          group.articles.length > 0 ? (
            group.articles.map((article) => (
              <ArticlePanel
                article={article}
                articleDetailHref={`/article/${article.id}`}
                articleLikePending={state.pendingLikeByKey[`article-${article.id}`] === true}
                canEdit={article.authorUserId === currentUserId}
                comments={getArticleComments(loader.commentsByArticleId, article.id)}
                commentFormResetKey={state.commentFormResetKeyByArticleId[article.id] ?? 0}
                currentUserId={currentUserId}
                editingCommentId={state.editingCommentId}
                errorByKey={state.errorByKey}
                isCommentCreateSubmitting={state.isCommentCreateSubmitting}
                isCommentEditSubmitting={state.isCommentEditSubmitting}
                isCommentLikePending={state.isCommentLikePending}
                key={article.id}
                mobileMediaCarousel
                onCreateComment={actions.createComment}
                onCopyArticleLink={() => actions.copyArticleLink(article)}
                onDeleteArticle={() => actions.requestDeleteArticle(article)}
                onDeleteComment={actions.requestDeleteComment}
                onEditArticle={() =>
                  actions.setActiveArticleForm({ articleId: article.id, type: 'edit' })
                }
                onEditComment={actions.setEditingCommentId}
                onReplyComment={actions.setReplyingCommentId}
                onSubmitCommentEdit={actions.updateComment}
                onToggleArticleLike={actions.toggleArticleLike}
                onToggleCommentLike={actions.toggleCommentLike}
                replyingCommentId={state.replyingCommentId}
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
