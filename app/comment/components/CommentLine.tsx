import { ActionButton } from '@/app/common/components/ActionButton';
import { DateTimeLabel } from '@/app/common/components/DateTimeLabel';
import type { Comment, CommentId } from '@/core/comment/domain';

import { CommentForm } from './CommentForm';

type CommentLineProps = {
  canEdit: boolean;
  comment: Comment;
  editingCommentId: CommentId | null;
  onDelete: (comment: Comment) => void;
  onEdit: (commentId: CommentId | null) => void;
  onReply: (commentId: CommentId | null) => void;
  onSubmitEdit: (commentId: CommentId, body: string) => void;
  prompt: string;
  replies: readonly Comment[];
  reply?: boolean;
};

export function CommentLine({
  canEdit,
  comment,
  editingCommentId,
  onDelete,
  onEdit,
  onReply,
  onSubmitEdit,
  prompt,
  replies,
  reply,
}: CommentLineProps) {
  const isDeleted = comment.deletedAt !== null;
  const shouldShowDeletedPlaceholder = isDeleted && replies.length > 0;

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
                {!reply ? (
                  <ActionButton onClick={() => onReply(comment.id)}>답글</ActionButton>
                ) : null}
                {canEdit ? (
                  <>
                    <ActionButton onClick={() => onEdit(comment.id)}>수정</ActionButton>
                    <ActionButton onClick={() => onDelete(comment)} tone="danger">
                      삭제
                    </ActionButton>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="m-0 min-w-0 [overflow-wrap:anywhere]">
            {isDeleted ? (
              <span className="text-[var(--subtext0)]">삭제된 댓글</span>
            ) : (
              <>
                <span className="whitespace-nowrap text-[var(--pink)]">{comment.authorName}</span>
                <span aria-hidden="true" className="mx-1 text-[var(--overlay1)]">
                  :
                </span>
                <span>{comment.body}</span>
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}
