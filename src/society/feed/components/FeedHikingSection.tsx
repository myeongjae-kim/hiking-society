
import { ArticlePanel } from "#/society/article/components/ArticlePanel";
import { HikingHeader } from "#/society/hiking/components/HikingHeader";
import { gridStackClassName } from "#/society/shared/components/styles";
import type { ArticleViewId as ArticleId, ArticleViewModel as Article } from "#/society/shared/viewModels";
import type { CommentViewModel as Comment } from "#/society/shared/viewModels";
import type { HikingViewId as HikingId } from "#/society/shared/viewModels";

import type {
	FeedActionEnvironment,
	FeedArticleStore,
	FeedSectionState,
} from "../hooks/feedActionTypes";
import { useFeedArticleSectionActions } from "../hooks/useFeedArticleSectionActions";
import { useFeedCommentActions } from "../hooks/useFeedCommentActions";
import { useFeedHikingActions } from "../hooks/useFeedHikingActions";
import { useFeedLikeActions } from "../hooks/useFeedLikeActions";
import { useFeedLinkActions } from "../hooks/useFeedLinkActions";
import { type FeedGroup, getArticleComments } from "../utils/feed-crud-utils";
import {
	type HikingArticleLoadState,
	hasRecordKey,
} from "../utils/feedCrudTypes";
import {
	FeedArticleLoadStateView,
	FeedEmptyArticlesView,
} from "./FeedArticleLoadStateView";

type FeedHikingSectionProps = {
	currentUserId: number;
	env: FeedActionEnvironment;
	group: FeedGroup;
	groupIndex: number;
	loader: {
		articlesByHikingId: Record<string, readonly Article[]>;
		commentsByArticleId: Map<ArticleId, Comment[]>;
		getHikingArticleCount: (hikingId: HikingId) => number;
		loadHikingArticles: (
			hikingId: HikingId,
			options?: { retry?: boolean },
		) => void;
		loadStateByHikingId: Record<string, HikingArticleLoadState>;
		registerHikingSection: (
			hikingId: HikingId,
			element: HTMLElement | null,
		) => void;
	};
	state: FeedSectionState;
	store: FeedArticleStore;
};

export function FeedHikingSection({
	currentUserId,
	env,
	group,
	groupIndex,
	loader,
	state,
	store,
}: FeedHikingSectionProps) {
	const actionDeps = {
		invalidateQueryKeys: env.invalidateQueryKeys,
		refreshRoute: env.refreshRoute,
		runner: env.runner,
		setConfirmState: env.setConfirmState,
	};
	const hikingActions = useFeedHikingActions({
		...actionDeps,
		getHikingArticleCount: store.getHikingArticleCount,
		setActiveHikingForm: state.setActiveHikingForm,
	});
	const articleActions = useFeedArticleSectionActions({
		...actionDeps,
		setActiveArticleForm: state.setActiveArticleForm,
	});
	const commentActions = useFeedCommentActions({
		...actionDeps,
		adjustVisibleCommentCount: state.adjustVisibleCommentCount,
		commentArticleIdByCommentId: store.commentArticleIdByCommentId,
		editingCommentId: state.editingCommentId,
		refreshArticleComments: store.refreshArticleComments,
		replyingCommentId: state.replyingCommentId,
		setEditingCommentId: state.setEditingCommentId,
		setReplyingCommentId: state.setReplyingCommentId,
	});
	const likeActions = useFeedLikeActions({
		articleHikingIdByArticleId: store.articleHikingIdByArticleId,
		commentArticleIdByCommentId: store.commentArticleIdByCommentId,
		invalidateQueryKeys: env.invalidateQueryKeys,
		refreshArticleComments: store.refreshArticleComments,
		runner: env.runner,
		setArticlesByHikingId: store.setArticlesByHikingId,
	});
	const linkActions = useFeedLinkActions({
		selectedHikingId: state.selectedHikingId,
		setError: env.runner.setError,
	});
	const groupArticleCount = loader.getHikingArticleCount(group.hiking.id);
	const hasLoadedHikingArticles = hasRecordKey(
		loader.articlesByHikingId,
		group.hiking.id,
	);
	const groupLoadState =
		loader.loadStateByHikingId[group.hiking.id] ??
		(groupArticleCount === 0
			? ({ status: "loaded" } satisfies HikingArticleLoadState)
			: ({ status: "idle" } satisfies HikingArticleLoadState));

	return (
		<section
			className={`${gridStackClassName} focus:outline-none ${
				linkActions.highlightedHikingId === group.hiking.id
					? "shadow-[0_0_0_2px_var(--blue)]"
					: ""
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
				error={env.runner.errorByKey[`hiking-${group.hiking.id}`]}
				hiking={group.hiking}
				onAddArticle={() =>
					articleActions.setActiveArticleForm({
						hikingId: group.hiking.id,
						type: "create",
					})
				}
				onCopyLink={() => linkActions.copyHikingLink(group.hiking)}
				onDelete={() => hikingActions.requestDeleteHiking(group.hiking)}
				onEdit={() =>
					hikingActions.setActiveHikingForm({
						hikingId: group.hiking.id,
						type: "edit",
					})
				}
			/>
			<div className={gridStackClassName}>
				<FeedArticleLoadStateView
					articleCount={groupArticleCount}
					hasLoadedArticles={hasLoadedHikingArticles}
					hikingId={group.hiking.id}
					loadState={groupLoadState}
					onRetry={() =>
						loader.loadHikingArticles(group.hiking.id, { retry: true })
					}
				/>
				{hasLoadedHikingArticles ? (
					group.articles.length > 0 ? (
						group.articles.map((article) => (
							<ArticlePanel
								article={article}
								articleDetailHref={`/article/${article.id}`}
								articleLikePending={
									likeActions.pendingLikeByKey[`article-${article.id}`] === true
								}
								canEdit={article.authorUserId === currentUserId}
								comments={getArticleComments(
									loader.commentsByArticleId,
									article.id,
								)}
								commentFormResetKey={
									commentActions.commentFormResetKeyByArticleId[article.id] ?? 0
								}
								currentUserId={currentUserId}
								editingCommentId={commentActions.editingCommentId}
								errorByKey={env.runner.errorByKey}
								isCommentCreateSubmitting={
									commentActions.isCommentCreateSubmitting
								}
								isCommentEditSubmitting={commentActions.isCommentEditSubmitting}
								isCommentLikePending={likeActions.isCommentLikePending}
								key={article.id}
								mobileMediaCarousel
								onCreateComment={commentActions.createComment}
								onCopyArticleLink={() => linkActions.copyArticleLink(article)}
								onDeleteArticle={() =>
									articleActions.requestDeleteArticle(article)
								}
								onDeleteComment={commentActions.requestDeleteComment}
								onEditArticle={() =>
									articleActions.setActiveArticleForm({
										articleId: article.id,
										type: "edit",
									})
								}
								onEditComment={commentActions.setEditingCommentId}
								onReplyComment={commentActions.setReplyingCommentId}
								onSubmitCommentEdit={commentActions.updateComment}
								onToggleArticleLike={likeActions.toggleArticleLike}
								onToggleCommentLike={likeActions.toggleCommentLike}
								replyingCommentId={commentActions.replyingCommentId}
							/>
						))
					) : (
						<FeedEmptyArticlesView hikingId={group.hiking.id} />
					)
				) : groupLoadState.status === "loaded" ? (
					<FeedEmptyArticlesView hikingId={group.hiking.id} />
				) : null}
			</div>
		</section>
	);
}
