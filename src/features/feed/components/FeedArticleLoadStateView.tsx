import { ActionButton } from "#/features/shared/components/ActionButton";
import { Command } from "#/features/shared/components/Command";
import { boxBorderClassName } from "#/features/shared/components/styles";
import type { HikingId } from "@/core/hiking/domain";

import type { HikingArticleLoadState } from "../utils/feedCrudTypes";

type FeedArticleLoadStateViewProps = {
	articleCount: number;
	hasLoadedArticles: boolean;
	hikingId: HikingId;
	loadState: HikingArticleLoadState;
	onRetry: () => void;
};

export function FeedArticleLoadStateView({
	articleCount,
	hasLoadedArticles,
	hikingId,
	loadState,
	onRetry,
}: FeedArticleLoadStateViewProps) {
	if (hasLoadedArticles && loadState.status === "refreshing") {
		return (
			<div
				className={`flex flex-wrap items-center gap-2 bg-[var(--surface0)] !p-3 text-[0.9rem] text-[var(--subtext0)] ${boxBorderClassName}`}
				box-="round"
			>
				<Command>articles.refresh {hikingId}</Command>
				<span is-="spinner" variant-="dots" />
				<span>글을 갱신하는 중</span>
			</div>
		);
	}

	if (hasLoadedArticles && loadState.status === "error") {
		return (
			<div
				className={`flex flex-wrap items-center gap-3 bg-[var(--surface0)] !p-3 text-[0.9rem] ${boxBorderClassName}`}
				box-="round"
			>
				<Command>articles.stale {hikingId}</Command>
				<span className="text-[var(--red)]">{loadState.error}</span>
				<ActionButton onClick={onRetry}>다시 불러오기</ActionButton>
			</div>
		);
	}

	if (!hasLoadedArticles && loadState.status === "error") {
		return (
			<div
				className={`grid min-h-40 content-center gap-3 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
				box-="round"
			>
				<Command>articles.error {hikingId}</Command>
				<p className="m-0 text-[var(--red)]">{loadState.error}</p>
				<div>
					<ActionButton onClick={onRetry}>다시 불러오기</ActionButton>
				</div>
			</div>
		);
	}

	if (!hasLoadedArticles && loadState.status !== "loaded") {
		return (
			<div
				className={`grid min-h-64 content-center gap-3 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
				box-="round"
			>
				<Command>articles.lazy {hikingId}</Command>
				<p className="m-0 flex items-center gap-2 text-[var(--subtext0)]">
					<span is-="spinner" variant-="dots" />
					<span>글 {articleCount}개를 불러오는 중</span>
				</p>
			</div>
		);
	}

	return null;
}

export function FeedEmptyArticlesView({ hikingId }: { hikingId: HikingId }) {
	return (
		<div
			className={`bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
			box-="round"
		>
			<Command>articles.empty {hikingId}</Command>
			<p className="m-0 text-[var(--subtext0)]">
				아직 이 산행에 글이 없습니다.
			</p>
		</div>
	);
}
