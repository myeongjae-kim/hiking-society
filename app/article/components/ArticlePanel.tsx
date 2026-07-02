import { PhotoViewer } from '@/app/article/components/PhotoViewer';
import { CommentForm } from '@/app/comment/components/CommentForm';
import { CommentLine } from '@/app/comment/components/CommentLine';
import { getThreadedComments, getVisibleCommentCount } from '@/app/comment/components/commentUtils';
import { ActionButton } from '@/app/common/components/ActionButton';
import { AuthorBadge } from '@/app/common/components/AuthorBadge';
import { Command } from '@/app/common/components/Command';
import { InlineMeta } from '@/app/common/components/InlineMeta';
import { boxBorderClassName } from '@/app/common/components/styles';
import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment, CommentId } from '@/core/comment/domain';

import { getArticleMeta } from './articleMeta';

type ArticlePanelProps = {
  article: Article;
  canEdit: boolean;
  comments: readonly Comment[];
  commentFormResetKey: number;
  currentUserId: number;
  editingCommentId: CommentId | null;
  errorByKey: Record<string, string>;
  onCreateComment: (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => void;
  onDeleteArticle: () => void;
  onDeleteComment: (comment: Comment) => void;
  onEditArticle: () => void;
  onEditComment: (commentId: CommentId | null) => void;
  onReplyComment: (commentId: CommentId | null) => void;
  onSubmitCommentEdit: (commentId: CommentId, body: string) => void;
  replyingCommentId: CommentId | null;
};

export function ArticlePanel({
  article,
  canEdit,
  comments,
  commentFormResetKey,
  currentUserId,
  editingCommentId,
  errorByKey,
  onCreateComment,
  onDeleteArticle,
  onDeleteComment,
  onEditArticle,
  onEditComment,
  onReplyComment,
  onSubmitCommentEdit,
  replyingCommentId,
}: ArticlePanelProps) {
  const { repliesByParentId, topLevelComments } = getThreadedComments(comments);

  return (
    <article
      className={`grid min-w-0 gap-5 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-5 [contain-intrinsic-size:auto_48rem] [content-visibility:auto] ${boxBorderClassName}`}
      box-="round"
    >
      <header className="grid gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Command>article.open {article.id}</Command>
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={onEditArticle}>수정</ActionButton>
              <ActionButton onClick={onDeleteArticle} tone="danger">
                삭제
              </ActionButton>
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
        <InlineMeta items={getArticleMeta(article, getVisibleCommentCount(comments))} />
      </header>

      <PhotoViewer articleId={article.id} authorName={article.authorName} photos={article.photos} />

      <p className="m-0 text-[1.05rem] leading-[1.6] break-keep whitespace-pre-wrap text-[var(--foreground0)]">
        {article.body}
      </p>

      <section
        className="grid gap-3 border-t border-[var(--overlay0)] pt-3.5"
        aria-label={`${article.authorName} 게시글 댓글`}
      >
        <Command>comments.list --count={getVisibleCommentCount(comments)}</Command>
        <CommentForm
          error={errorByKey[`comment-new-${article.id}`]}
          key={`comment-new-${article.id}-${commentFormResetKey}`}
          onSubmit={(body) => onCreateComment(article.id, body, null)}
          prompt="comment.new>"
        />
        {topLevelComments.map((comment, commentIndex) => (
          <div className="grid min-w-0 gap-2" key={comment.id}>
            <CommentLine
              canEdit={comment.authorUserId === currentUserId}
              comment={comment}
              editingCommentId={editingCommentId}
              menuPosition={
                commentIndex === topLevelComments.length - 1 ? 'top left' : 'bottom left'
              }
              onDelete={onDeleteComment}
              onEdit={onEditComment}
              onReply={onReplyComment}
              onSubmitEdit={onSubmitCommentEdit}
              prompt="comment>"
              replies={(repliesByParentId.get(comment.id) ?? []).filter(
                (reply) => reply.deletedAt === null,
              )}
            />
            {replyingCommentId === comment.id ? (
              <div className="ml-4">
                <CommentForm
                  autoFocus
                  onCancel={() => onReplyComment(null)}
                  onSubmit={(body) => onCreateComment(article.id, body, comment.id)}
                  prompt="reply.new>"
                />
              </div>
            ) : null}
            {(repliesByParentId.get(comment.id) ?? [])
              .filter((reply) => reply.deletedAt === null)
              .map((reply) => (
                <CommentLine
                  canEdit={reply.authorUserId === currentUserId}
                  comment={reply}
                  editingCommentId={editingCommentId}
                  key={reply.id}
                  menuPosition="top left"
                  onDelete={onDeleteComment}
                  onEdit={onEditComment}
                  onReply={onReplyComment}
                  onSubmitEdit={onSubmitCommentEdit}
                  prompt="reply>"
                  replies={[]}
                  reply
                />
              ))}
          </div>
        ))}
      </section>
    </article>
  );
}
