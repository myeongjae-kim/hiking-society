"use client";

import { ArticleFormDialog } from "#/society/article/components/ArticleFormDialog";
import { HikingFormDialog } from "#/society/hiking/components/HikingFormDialog";
import { ConfirmDialog } from "#/society/shared/components/ConfirmDialog";
import { LoadingOverlay } from "#/society/shared/components/LoadingOverlay";
import type { Article } from "@/core/article/domain";
import type { Hiking } from "@/core/hiking/domain";

import type {
	FeedActionEnvironment,
	FeedArticleStore,
	FeedDialogState,
} from "../hooks/feedActionTypes";
import { useFeedArticleActions } from "../hooks/useFeedArticleActions";
import { useFeedHikingDialogActions } from "../hooks/useFeedHikingDialogActions";

type FeedDialogsProps = {
	env: FeedActionEnvironment;
	entities: {
		activeArticle: Article | undefined;
		activeArticleHiking: Hiking | undefined;
		activeHiking: Hiking | undefined;
	};
	state: FeedDialogState;
	store: Pick<
		FeedArticleStore,
		"setArticlesByHikingId" | "setCommentsByHikingId"
	>;
};

export function FeedDialogs({ entities, env, state, store }: FeedDialogsProps) {
	const actionDeps = {
		invalidateQueryKeys: env.invalidateQueryKeys,
		refreshRoute: env.refreshRoute,
		runner: env.runner,
		setConfirmState: env.setConfirmState,
	};
	const hikingActions = useFeedHikingDialogActions({
		...actionDeps,
		activeHikingForm: state.activeHikingForm,
		setActiveHikingForm: state.setActiveHikingForm,
	});
	const articleActions = useFeedArticleActions({
		...actionDeps,
		activeArticleForm: state.activeArticleForm,
		setActiveArticleForm: state.setActiveArticleForm,
		setArticlesByHikingId: store.setArticlesByHikingId,
		setCommentsByHikingId: store.setCommentsByHikingId,
	});
	const activeHikingFormKey =
		state.activeHikingForm?.type === "create"
			? "hiking-new"
			: state.activeHikingForm?.type === "edit"
				? `hiking-edit-${state.activeHikingForm.hikingId}`
				: null;
	const activeHikingFormTitle =
		state.activeHikingForm?.type === "edit" ? "산행 수정" : "산행 등록";
	const hikingFormDialogOpen =
		state.activeHikingForm?.type === "create" ||
		(state.activeHikingForm?.type === "edit" &&
			entities.activeHiking !== undefined);
	const activeArticleFormKey =
		state.activeArticleForm?.type === "create"
			? `article-new-${state.activeArticleForm.hikingId}`
			: state.activeArticleForm?.type === "edit"
				? `article-edit-${state.activeArticleForm.articleId}`
				: null;
	const activeArticleFormTitle =
		state.activeArticleForm?.type === "edit" ? "글 수정" : "글 작성";
	const articleFormDialogOpen =
		state.activeArticleForm?.type === "create" ||
		(state.activeArticleForm?.type === "edit" &&
			entities.activeArticle !== undefined);

	return (
		<>
			<ConfirmDialog
				confirmState={env.confirmState}
				onOpenChange={(open) => !open && env.setConfirmState(null)}
			/>
			<HikingFormDialog
				error={
					activeHikingFormKey
						? env.runner.errorByKey[activeHikingFormKey]
						: undefined
				}
				formKey={activeHikingFormKey ?? "hiking-form"}
				hiking={entities.activeHiking}
				onCancel={hikingActions.closeActiveHikingForm}
				onOpenChange={(open) => {
					if (!open) {
						hikingActions.closeActiveHikingForm();
					}
				}}
				onSubmit={(values) => {
					if (state.activeHikingForm?.type === "create") {
						hikingActions.createHiking(values);
						return;
					}

					if (state.activeHikingForm?.type === "edit") {
						hikingActions.updateHiking(state.activeHikingForm.hikingId, values);
					}
				}}
				open={hikingFormDialogOpen}
				submitting={hikingActions.activeHikingSubmitting}
				title={activeHikingFormTitle}
			/>
			<ArticleFormDialog
				article={entities.activeArticle}
				error={
					activeArticleFormKey
						? env.runner.errorByKey[activeArticleFormKey]
						: undefined
				}
				formKey={activeArticleFormKey ?? "article-form"}
				hiking={entities.activeArticleHiking}
				onCancel={articleActions.closeActiveArticleForm}
				onOpenChange={(open) => {
					if (!open) {
						articleActions.closeActiveArticleForm();
					}
				}}
				onSubmit={(values) => {
					if (state.activeArticleForm?.type === "create") {
						articleActions.createArticle(
							state.activeArticleForm.hikingId,
							values,
						);
						return;
					}

					if (state.activeArticleForm?.type === "edit") {
						articleActions.updateArticle(
							state.activeArticleForm.articleId,
							values,
						);
					}
				}}
				open={articleFormDialogOpen}
				submitting={articleActions.activeArticleSubmitting}
				title={activeArticleFormTitle}
			/>
			<LoadingOverlay
				label={env.runner.loadingLabel ?? undefined}
				open={env.runner.isPending && env.runner.loadingLabel !== null}
			/>
		</>
	);
}
