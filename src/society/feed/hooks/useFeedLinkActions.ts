"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { ArticleViewModel as Article } from "#/society/shared/viewModels";
import type { HikingViewId as HikingId, HikingViewModel as Hiking } from "#/society/shared/viewModels";

type UseFeedLinkActionsInput = {
	selectedHikingId: HikingId | null;
	setError: (key: string, value: string | null) => void;
};

async function copyTextToClipboard(text: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textArea = document.createElement("textarea");
	textArea.value = text;
	textArea.setAttribute("readonly", "");
	textArea.style.left = "-9999px";
	textArea.style.position = "fixed";
	textArea.style.top = "0";
	document.body.appendChild(textArea);
	textArea.select();

	try {
		const copied = document.execCommand("copy");

		if (!copied) {
			throw new Error("Copy command failed.");
		}
	} finally {
		document.body.removeChild(textArea);
	}
}

export function useFeedLinkActions({
	selectedHikingId,
	setError,
}: UseFeedLinkActionsInput) {
	const [highlightedHikingId, setHighlightedHikingId] =
		useState<HikingId | null>(selectedHikingId);

	const copyHikingLink = (hiking: Hiking) => {
		const hikingHref = `/feed?hikingId=${encodeURIComponent(hiking.id)}`;
		const url = new URL(hikingHref, window.location.origin);

		setHighlightedHikingId(hiking.id);
		window.history.replaceState(window.history.state, "", hikingHref);

		copyTextToClipboard(url.toString())
			.then(() => {
				setError(`hiking-${hiking.id}`, null);
				toast.success("산행 링크를 복사했습니다.", {
					position: "bottom-center",
				});
			})
			.catch(() => {
				setError(`hiking-${hiking.id}`, "링크 복사에 실패했습니다.");
				toast.error("링크 복사에 실패했습니다.", { position: "bottom-center" });
			});
	};

	const copyArticleLink = (article: Article) => {
		const articleHref = `/article/${encodeURIComponent(article.id)}`;
		const url = new URL(articleHref, window.location.origin);

		copyTextToClipboard(url.toString())
			.then(() => {
				setError(`article-${article.id}`, null);
				toast.success("글 링크를 복사했습니다.", { position: "bottom-center" });
			})
			.catch(() => {
				setError(`article-${article.id}`, "링크 복사에 실패했습니다.");
				toast.error("링크 복사에 실패했습니다.", { position: "bottom-center" });
			});
	};

	return {
		copyArticleLink,
		copyHikingLink,
		highlightedHikingId,
	};
}
