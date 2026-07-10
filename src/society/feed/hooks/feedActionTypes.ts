import type { QueryKey } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import type { ConfirmState } from "#/society/shared/components/ConfirmDialog";
import type { useMutationRunner } from "#/society/shared/hooks/useMutationRunner";
import type { ArticleViewId as ArticleId, ArticleViewModel as Article } from "#/society/shared/viewModels";
import type { CommentViewId as CommentId, CommentViewModel as Comment } from "#/society/shared/viewModels";
import type { HikingViewId as HikingId, HikingViewModel as Hiking } from "#/society/shared/viewModels";

import type {
	ActiveArticleForm,
	ActiveHikingForm,
} from "../utils/feedCrudTypes";

export type FeedMutationRunner = ReturnType<typeof useMutationRunner>;

export type FeedActionEnvironment = {
	confirmState: ConfirmState;
	invalidateQueryKeys: (queryKeys: readonly QueryKey[]) => void;
	refreshRoute: () => void;
	runner: FeedMutationRunner;
	setConfirmState: Dispatch<SetStateAction<ConfirmState>>;
};

export type FeedActionDeps = Omit<FeedActionEnvironment, "confirmState">;

export type FeedArticleStore = {
	articleHikingIdByArticleId: Map<ArticleId, HikingId>;
	commentArticleIdByCommentId: Map<CommentId, ArticleId>;
	getHikingArticleCount: (hikingId: HikingId) => number;
	refreshArticleComments: (articleId: ArticleId) => Promise<boolean>;
	setArticlesByHikingId: Dispatch<
		SetStateAction<Record<string, readonly Article[]>>
	>;
	setCommentsByHikingId: Dispatch<
		SetStateAction<Record<string, readonly Comment[]>>
	>;
};

export type FeedSectionState = {
	adjustVisibleCommentCount: (delta: number) => void;
	editingCommentId: CommentId | null;
	replyingCommentId: CommentId | null;
	selectedHikingId: HikingId | null;
	setActiveArticleForm: Dispatch<SetStateAction<ActiveArticleForm>>;
	setActiveHikingForm: Dispatch<SetStateAction<ActiveHikingForm>>;
	setEditingCommentId: Dispatch<SetStateAction<CommentId | null>>;
	setReplyingCommentId: Dispatch<SetStateAction<CommentId | null>>;
};

export type FeedDialogState = {
	activeArticleForm: ActiveArticleForm;
	activeHikingForm: ActiveHikingForm;
	setActiveArticleForm: Dispatch<SetStateAction<ActiveArticleForm>>;
	setActiveHikingForm: Dispatch<SetStateAction<ActiveHikingForm>>;
};

export type FeedLinkActions = {
	copyArticleLink: (article: Article) => void;
	copyHikingLink: (hiking: Hiking) => void;
	highlightedHikingId: HikingId | null;
};
