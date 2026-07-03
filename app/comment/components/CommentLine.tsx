import { ActionButton } from '@/app/common/components/ActionButton';
import { AuthorBadge } from '@/app/common/components/AuthorBadge';
import { DateTimeLabel } from '@/app/common/components/DateTimeLabel';
import type { Comment, CommentId } from '@/core/comment/domain';

import { CommentForm } from './CommentForm';

type CommentLineProps = {
  canEdit: boolean;
  comment: Comment;
  editingCommentId: CommentId | null;
  menuPosition?: 'bottom left' | 'top left';
  onDelete: (comment: Comment) => void;
  onEdit: (commentId: CommentId | null) => void;
  onReply: (commentId: CommentId | null) => void;
  onSubmitEdit: (commentId: CommentId, body: string) => void;
  onToggleLike: (commentId: CommentId) => void;
  likeDisabled: boolean;
  prompt: string;
  replies: readonly Comment[];
  reply?: boolean;
};

export function CommentLine({
  canEdit,
  comment,
  editingCommentId,
  menuPosition = 'bottom left',
  onDelete,
  onEdit,
  onReply,
  onSubmitEdit,
  onToggleLike,
  likeDisabled,
  prompt,
  replies,
  reply,
}: CommentLineProps) {
  const isDeleted = comment.deletedAt !== null;
  const shouldShowDeletedPlaceholder = isDeleted && replies.length > 0;
  const runMenuAction = (event: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    event.currentTarget.closest('details')?.removeAttribute('open');
    action();
  };

  if (isDeleted && !shouldShowDeletedPlaceholder) {
    return null;
  }

  return (
    <div
      className={`grid min-w-0 gap-1.5 text-[0.95rem] leading-[1.45] ${
        reply ? 'ml-4 text-[var(--subtext0)]' : 'text-[var(--foreground1)]'
      }`}
    >
      {editingCommentId === comment.id ? (
        <CommentForm
          autoFocus
          initialBody={comment.body}
          onCancel={() => onEdit(null)}
          onSubmit={(body) => onSubmitEdit(comment.id, body)}
          prompt={`${prompt}.edit`}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="font-mono text-[var(--green)]">{prompt}</span>
              <span aria-hidden="true" className="mx-1 text-[var(--overlay1)]">
                ·
              </span>
              <DateTimeLabel
                className="font-mono text-[0.8125rem] whitespace-nowrap text-[var(--subtext0)]"
                value={comment.createdAt}
              />
            </div>
            {!isDeleted ? (
              <div className="flex flex-wrap gap-1.5">
                <ActionButton
                  ariaPressed={comment.likedByCurrentUser}
                  disabled={likeDisabled}
                  onClick={() => onToggleLike(comment.id)}
                  title={comment.likedByCurrentUser ? '댓글 좋아요 취소' : '댓글 좋아요'}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className={comment.likedByCurrentUser ? 'text-[var(--red)]' : undefined}>
                      {comment.likedByCurrentUser ? '❤' : '♡'}
                    </span>
                    <span>{comment.likeCount}</span>
                  </span>
                </ActionButton>
                {!reply ? (
                  <ActionButton onClick={() => onReply(comment.id)}>답글</ActionButton>
                ) : null}
                {canEdit ? (
                  <details className="relative" is-="popover" position-={menuPosition}>
                    <summary
                      aria-label="댓글 관리 메뉴"
                      className="inline-flex !h-auto !min-h-[1.75rem] min-w-[2.25rem] cursor-pointer list-none items-center justify-center !border !border-[var(--overlay0)] !bg-[var(--surface0)] !bg-none px-2 py-1 font-mono !text-sm leading-[1.2] whitespace-nowrap !text-[var(--foreground0)] hover:!bg-[var(--surface1)] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)] active:!bg-[var(--surface2)] active:!text-[var(--foreground0)] [&::-webkit-details-marker]:hidden"
                      title="댓글 관리 메뉴"
                    >
                      ⋮
                    </summary>
                    <div className="grid min-w-24 gap-1 border border-[var(--overlay0)] bg-[var(--background1)] p-1 shadow-[0_0.35rem_0_var(--background0)]">
                      <button
                        className="!h-auto !min-h-0 w-full appearance-none !border-0 !bg-transparent !bg-none px-3 py-1.5 text-left font-mono text-sm leading-[1.2] whitespace-nowrap !text-[var(--foreground0)] hover:!bg-[var(--surface1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                        onClick={(event) => runMenuAction(event, () => onEdit(comment.id))}
                        type="button"
                      >
                        수정
                      </button>
                      <button
                        className="!h-auto !min-h-0 w-full appearance-none !border-0 !bg-transparent !bg-none px-3 py-1.5 text-left font-mono text-sm leading-[1.2] whitespace-nowrap !text-[var(--red)] hover:!bg-[var(--surface1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                        onClick={(event) => runMenuAction(event, () => onDelete(comment))}
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="m-0 min-w-0 [overflow-wrap:anywhere]">
            {isDeleted ? (
              <span className="text-[var(--subtext0)]">삭제된 댓글</span>
            ) : (
              <>
                <AuthorBadge
                  name={comment.authorName}
                  profileImageUrl={comment.authorProfileImageUrl}
                />
                <span aria-hidden="true" className="mx-1 text-[var(--overlay1)]">
                  :
                </span>
                <span className="min-w-0 [overflow-wrap:anywhere]">{comment.body}</span>
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}
