'use client';

import { useEffect } from 'react';

import { MediaViewer } from '@/app/article/components/MediaViewer';
import { CommentForm } from '@/app/comment/components/CommentForm';
import { CommentLine } from '@/app/comment/components/CommentLine';
import { getThreadedComments, getVisibleCommentCount } from '@/app/comment/components/commentUtils';
import { ActionButton } from '@/app/common/components/ActionButton';
import { AuthorBadge } from '@/app/common/components/AuthorBadge';
import { Command } from '@/app/common/components/Command';
import { InlineMeta } from '@/app/common/components/InlineMeta';
import { boxBorderClassName, inlineButtonClassName } from '@/app/common/components/styles';
import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment, CommentId } from '@/core/comment/domain';

import { getArticleMeta } from './articleMeta';

type ArticlePanelProps = {
  article: Article;
  articleDetailHref?: string;
  articleLikePending: boolean;
  canEdit: boolean;
  comments: readonly Comment[];
  commentFormResetKey: number;
  currentUserId: number;
  editingCommentId: CommentId | null;
  errorByKey: Record<string, string>;
  highlightedCommentId?: CommentId | null;
  isCommentCreateSubmitting: (articleId: ArticleId, parentCommentId: CommentId | null) => boolean;
  isCommentEditSubmitting: (commentId: CommentId) => boolean;
  isCommentLikePending: (commentId: CommentId) => boolean;
  mobileMediaCarousel?: boolean;
  onCreateComment: (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => void;
  onCopyArticleLink?: () => void;
  onDeleteArticle: () => void;
  onDeleteComment: (comment: Comment) => void;
  onEditArticle: () => void;
  onEditComment: (commentId: CommentId | null) => void;
  onReplyComment: (commentId: CommentId | null) => void;
  onSubmitCommentEdit: (commentId: CommentId, body: string) => void;
  onToggleArticleLike: (articleId: ArticleId) => void;
  onToggleCommentLike: (commentId: CommentId) => void;
  replyingCommentId: CommentId | null;
};

export function ArticlePanel({
  article,
  articleDetailHref,
  articleLikePending,
  canEdit,
  comments,
  commentFormResetKey,
  currentUserId,
  editingCommentId,
  errorByKey,
  highlightedCommentId = null,
  isCommentCreateSubmitting,
  isCommentEditSubmitting,
  isCommentLikePending,
  mobileMediaCarousel = false,
  onCreateComment,
  onCopyArticleLink,
  onDeleteArticle,
  onDeleteComment,
  onEditArticle,
  onEditComment,
  onReplyComment,
  onSubmitCommentEdit,
  onToggleArticleLike,
  onToggleCommentLike,
  replyingCommentId,
}: ArticlePanelProps) {
  useEffect(() => {
    if (!highlightedCommentId) {
      return;
    }

    const element = document.getElementById(`comment-${highlightedCommentId}`);

    if (!element) {
      return;
    }

    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [highlightedCommentId]);

  const { repliesByParentId, topLevelComments } = getThreadedComments(comments);
  const visibleCommentThreads = topLevelComments.flatMap((comment) => {
    const visibleReplies = (repliesByParentId.get(comment.id) ?? []).filter(
      (reply) => reply.deletedAt === null,
    );

    if (comment.deletedAt !== null && visibleReplies.length === 0) {
      return [];
    }

    return [{ comment, visibleReplies }];
  });
  const visibleCommentIds = visibleCommentThreads.flatMap(({ comment, visibleReplies }) => [
    comment.id,
    ...visibleReplies.map((reply) => reply.id),
  ]);
  const lastVisibleCommentId = visibleCommentIds.at(-1) ?? null;
  const getCommentMenuPosition = (commentId: CommentId) =>
    commentId === lastVisibleCommentId ? 'top left' : 'bottom left';

  return (
    <article
      className={`grid min-w-0 gap-5 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-5 [contain-intrinsic-size:auto_48rem] [content-visibility:auto] ${boxBorderClassName}`}
      box-="round"
    >
      <header className="grid gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Command>article.open {article.id}</Command>
          {canEdit || onCopyArticleLink ? (
            <div className="flex flex-wrap gap-2">
              {onCopyArticleLink ? (
                <button
                  aria-label="게시글 링크 복사"
                  className={`${inlineButtonClassName} aspect-square !min-h-[1.75rem] !min-w-[1.75rem] !px-1 !py-1`}
                  onClick={onCopyArticleLink}
                  title="게시글 링크 복사"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71" />
                  </svg>
                </button>
              ) : null}
              {canEdit ? (
                <>
                  <ActionButton onClick={onEditArticle}>수정</ActionButton>
                  <ActionButton onClick={onDeleteArticle} tone="danger">
                    삭제
                  </ActionButton>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="font-mono">
          <AuthorBadge
            name={article.authorName}
            profileImageUrl={article.authorProfileImageUrl}
            size="md"
          />
        </div>
        <InlineMeta
          items={getArticleMeta(article, getVisibleCommentCount(comments), articleDetailHref)}
        />
      </header>

      <div className="mx-[-1.25rem] w-[calc(100%_+_2.5rem)] sm:mx-0 sm:w-full">
        <MediaViewer
          articleId={article.id}
          authorName={article.authorName}
          inlineCarousel={mobileMediaCarousel}
          media={article.media}
          thumbnailGridClassName="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]"
        />
      </div>

      <p className="m-0 text-[1.05rem] leading-[1.6] break-keep whitespace-pre-wrap text-[var(--foreground0)]">
        {article.body}
      </p>

      {article.deletedAt === null ? (
        <div>
          <ActionButton
            ariaPressed={article.likedByCurrentUser}
            disabled={articleLikePending}
            onClick={() => onToggleArticleLike(article.id)}
            title={article.likedByCurrentUser ? '게시글 좋아요 취소' : '게시글 좋아요'}
          >
            <span className="inline-flex items-center gap-2">
              <span className={article.likedByCurrentUser ? 'text-[var(--red)]' : undefined}>
                {article.likedByCurrentUser ? '❤' : '♡'}
              </span>
              <span>{article.likeCount}</span>
            </span>
          </ActionButton>
        </div>
      ) : null}

      <section
        className="grid gap-3 border-t border-[var(--overlay0)] pt-3.5"
        aria-label={`${article.authorName} 게시글 댓글`}
      >
        <Command>comments.list --count={getVisibleCommentCount(comments)}</Command>
        {visibleCommentThreads.map(({ comment, visibleReplies }) => (
          <div className="grid min-w-0 gap-2" key={comment.id}>
            <CommentLine
              canEdit={comment.authorUserId === currentUserId}
              comment={comment}
              editingCommentId={editingCommentId}
              highlighted={comment.id === highlightedCommentId}
              menuPosition={getCommentMenuPosition(comment.id)}
              onDelete={onDeleteComment}
              onEdit={onEditComment}
              onReply={onReplyComment}
              onSubmitEdit={onSubmitCommentEdit}
              onToggleLike={onToggleCommentLike}
              submittingEdit={isCommentEditSubmitting(comment.id)}
              likeDisabled={isCommentLikePending(comment.id)}
              prompt="comment>"
              replies={visibleReplies}
            />
            {replyingCommentId === comment.id ? (
              <div className="ml-4">
                <CommentForm
                  autoFocus
                  onCancel={() => onReplyComment(null)}
                  onSubmit={(body) => onCreateComment(article.id, body, comment.id)}
                  prompt="reply.new>"
                  submitting={isCommentCreateSubmitting(article.id, comment.id)}
                />
              </div>
            ) : null}
            {visibleReplies.map((reply) => (
              <CommentLine
                canEdit={reply.authorUserId === currentUserId}
                comment={reply}
                editingCommentId={editingCommentId}
                highlighted={reply.id === highlightedCommentId}
                key={reply.id}
                menuPosition={getCommentMenuPosition(reply.id)}
                onDelete={onDeleteComment}
                onEdit={onEditComment}
                onReply={onReplyComment}
                onSubmitEdit={onSubmitCommentEdit}
                onToggleLike={onToggleCommentLike}
                submittingEdit={isCommentEditSubmitting(reply.id)}
                likeDisabled={isCommentLikePending(reply.id)}
                prompt="reply>"
                replies={[]}
                reply
              />
            ))}
          </div>
        ))}
        <CommentForm
          error={errorByKey[`comment-new-${article.id}`]}
          key={`comment-new-${article.id}-${commentFormResetKey}`}
          onSubmit={(body) => onCreateComment(article.id, body, null)}
          prompt="comment.new>"
          submitting={isCommentCreateSubmitting(article.id, null)}
        />
      </section>
    </article>
  );
}
