import type { ConfirmState } from '@/app/common/components/ConfirmDialog';
import type { useMutationRunner } from '@/app/common/hooks/useMutationRunner';
import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';
import type { QueryKey } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';

export type FeedMutationRunner = ReturnType<typeof useMutationRunner>;

export type FeedActionDeps = {
  invalidateQueryKeys: (queryKeys: readonly QueryKey[]) => void;
  refreshRoute: () => void;
  runner: FeedMutationRunner;
  setConfirmState: Dispatch<SetStateAction<ConfirmState>>;
};

export type FeedArticleStore = {
  articleHikingIdByArticleId: Map<ArticleId, HikingId>;
  commentArticleIdByCommentId: Map<CommentId, ArticleId>;
  getHikingArticleCount: (hikingId: HikingId) => number;
  refreshArticleComments: (articleId: ArticleId) => Promise<boolean>;
  setArticlesByHikingId: Dispatch<SetStateAction<Record<string, readonly Article[]>>>;
  setCommentsByHikingId: Dispatch<SetStateAction<Record<string, readonly Comment[]>>>;
};

export type FeedLinkActions = {
  copyArticleLink: (article: Article) => void;
  copyHikingLink: (hiking: Hiking) => void;
  highlightedHikingId: HikingId | null;
};
