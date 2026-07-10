"use client";

import { FeedFooter } from "#/society/feed/components/FeedFooter";
import { FeedTopbar } from "#/society/feed/components/FeedTopbar";
import { StatusPanel } from "#/society/feed/components/StatusPanel";
import type { ConfirmState } from "#/society/shared/components/ConfirmDialog";
import { gridStackClassName } from "#/society/shared/components/styles";
import { useMutationRunner } from "#/society/shared/hooks/useMutationRunner";
import { useRouter } from "#/society/shared/hooks/useRouter";
import type { AuthenticatedUserViewModel as AuthenticatedUser } from "#/society/shared/viewModels";
import type { CommentViewId as CommentId } from "#/society/shared/viewModels";
import type { HikingViewId as HikingId, HikingViewModel as Hiking } from "#/society/shared/viewModels";
import type { NotificationListViewModel as NotificationListSnapshot } from "#/society/shared/viewModels";
import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type {
	FeedActionEnvironment,
	FeedArticleStore,
	FeedDialogState,
	FeedSectionState,
} from "../hooks/feedActionTypes";
import { useFeedArticleLoader } from "../hooks/useFeedArticleLoader";
import { getAuthorName } from "../utils/feed-crud-utils";
import type {
	ActiveArticleForm,
	ActiveHikingForm,
} from "../utils/feedCrudTypes";
import { FeedDialogs } from "./FeedDialogs";
import { FeedHikingSection } from "./FeedHikingSection";
import { FeedIntroPanel } from "./FeedIntroPanel";

type FeedCrudClientProps = {
	articleCount: number;
	commentCount: number;
	currentTheme: string;
	currentUser: AuthenticatedUser;
	hikingArticleCounts: readonly {
		articleCount: number;
		hikingId: HikingId;
	}[];
	hikings: readonly Hiking[];
	notificationSnapshot: NotificationListSnapshot;
	selectedHikingId: HikingId | null;
};

export function FeedCrudClient({
	articleCount,
	commentCount,
	currentTheme,
	currentUser,
	hikingArticleCounts,
	hikings: initialHikings,
	notificationSnapshot,
	selectedHikingId,
}: FeedCrudClientProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const runner = useMutationRunner();
	const [confirmState, setConfirmState] = useState<ConfirmState>(null);
	const [activeHikingForm, setActiveHikingForm] =
		useState<ActiveHikingForm>(null);
	const [activeArticleForm, setActiveArticleForm] =
		useState<ActiveArticleForm>(null);
	const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(
		null,
	);
	const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(
		null,
	);
	const [commentCountDeltaState, setCommentCountDeltaState] = useState({
		baseCommentCount: commentCount,
		delta: 0,
	});
	const currentAuthorName = useMemo(
		() => getAuthorName(currentUser),
		[currentUser],
	);
	const articleLoader = useFeedArticleLoader({
		hikingArticleCounts,
		hikings: initialHikings,
		selectedHikingId,
	});

	const invalidateQueryKeys = useCallback(
		(queryKeys: readonly QueryKey[]) => {
			void Promise.all(
				queryKeys.map((queryKey) =>
					queryClient.invalidateQueries({ queryKey }),
				),
			);
		},
		[queryClient],
	);
	const refreshRoute = useCallback(() => router.refresh(), [router]);
	const adjustVisibleCommentCount = useCallback(
		(delta: number) => {
			setCommentCountDeltaState((currentState) => ({
				baseCommentCount: commentCount,
				delta:
					(currentState.baseCommentCount === commentCount
						? currentState.delta
						: 0) + delta,
			}));
		},
		[commentCount],
	);
	const commentCountDelta =
		commentCountDeltaState.baseCommentCount === commentCount
			? commentCountDeltaState.delta
			: 0;
	const visibleCommentCount = Math.max(0, commentCount + commentCountDelta);
	const env: FeedActionEnvironment = {
		confirmState,
		invalidateQueryKeys,
		refreshRoute,
		runner,
		setConfirmState,
	};
	const articleStore: FeedArticleStore = {
		articleHikingIdByArticleId: articleLoader.articleHikingIdByArticleId,
		commentArticleIdByCommentId: articleLoader.commentArticleIdByCommentId,
		getHikingArticleCount: articleLoader.getHikingArticleCount,
		refreshArticleComments: articleLoader.refreshArticleComments,
		setArticlesByHikingId: articleLoader.setArticlesByHikingId,
		setCommentsByHikingId: articleLoader.setCommentsByHikingId,
	};
	const sectionState: FeedSectionState = {
		adjustVisibleCommentCount,
		editingCommentId,
		replyingCommentId,
		selectedHikingId,
		setActiveArticleForm,
		setActiveHikingForm,
		setEditingCommentId,
		setReplyingCommentId,
	};
	const dialogState: FeedDialogState = {
		activeArticleForm,
		activeHikingForm,
		setActiveArticleForm,
		setActiveHikingForm,
	};
	const activeHiking =
		activeHikingForm?.type === "edit"
			? initialHikings.find((hiking) => hiking.id === activeHikingForm.hikingId)
			: undefined;
	const activeArticle =
		activeArticleForm?.type === "edit"
			? articleLoader.loadedArticles.find(
					(article) => article.id === activeArticleForm.articleId,
				)
			: undefined;
	const activeArticleHiking =
		activeArticleForm?.type === "create"
			? initialHikings.find(
					(hiking) => hiking.id === activeArticleForm.hikingId,
				)
			: activeArticle
				? initialHikings.find((hiking) => hiking.id === activeArticle.hikingId)
				: undefined;

	return (
		<main className="min-h-svh bg-[length:2rem_2rem] bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] text-[var(--foreground0)]">
			<FeedTopbar
				currentAuthorName={currentAuthorName}
				currentTheme={currentTheme}
				notificationSnapshot={notificationSnapshot}
				user={currentUser}
			/>

			<div className="mx-auto grid w-[min(100%,78rem)] grid-cols-1 gap-4 px-1.5 py-4 sm:px-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:p-5">
				<section className={gridStackClassName} aria-label="산행 글 피드">
					<FeedIntroPanel
						onCreateHiking={() => setActiveHikingForm({ type: "create" })}
					/>
					{articleLoader.groups.map((group, groupIndex) => (
						<FeedHikingSection
							currentUserId={currentUser.id}
							env={env}
							group={group}
							groupIndex={groupIndex}
							key={group.hiking.id}
							loader={{
								articlesByHikingId: articleLoader.articlesByHikingId,
								commentsByArticleId: articleLoader.commentsByArticleId,
								getHikingArticleCount: articleLoader.getHikingArticleCount,
								loadHikingArticles: articleLoader.loadHikingArticles,
								loadStateByHikingId: articleLoader.hikingArticleLoadStateById,
								registerHikingSection: articleLoader.registerHikingSection,
							}}
							state={sectionState}
							store={articleStore}
						/>
					))}
				</section>

				<StatusPanel
					articleCount={articleCount}
					commentCount={visibleCommentCount}
					currentAuthorName={currentAuthorName}
					groupCount={articleLoader.groups.length}
					hikingCount={initialHikings.length}
				/>
			</div>
			<FeedFooter
				articleCount={articleCount}
				commentCount={visibleCommentCount}
				hikingCount={initialHikings.length}
			/>
			<FeedDialogs
				env={env}
				entities={{ activeArticle, activeArticleHiking, activeHiking }}
				state={dialogState}
				store={{
					setArticlesByHikingId: articleLoader.setArticlesByHikingId,
					setCommentsByHikingId: articleLoader.setCommentsByHikingId,
				}}
			/>
		</main>
	);
}
