"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { $api } from "#/api/client/$api";
import type { Article, ArticleId } from "@/core/article/domain";
import type { Comment, CommentId } from "@/core/comment/domain";
import type { Hiking, HikingId } from "@/core/hiking/domain";

import {
	getCommentsByArticleId,
	getFeedGroups,
} from "../utils/feed-crud-utils";
import type { HikingArticleLoadState } from "../utils/feedCrudTypes";
import { hasRecordKey } from "../utils/feedCrudTypes";
import {
	createArticleHikingIdByArticleId,
	createCommentArticleIdByCommentId,
	createHikingArticleCountById,
	filterRecordByActiveHikingIds,
} from "./feedArticleLoaderState";

type UseFeedArticleLoaderInput = {
	hikingArticleCounts: readonly {
		articleCount: number;
		hikingId: HikingId;
	}[];
	hikings: readonly Hiking[];
	selectedHikingId: HikingId | null;
};

export function useFeedArticleLoader({
	hikingArticleCounts,
	hikings,
	selectedHikingId,
}: UseFeedArticleLoaderInput) {
	const queryClient = useQueryClient();
	const hikingSectionElementsRef = useRef<Map<string, HTMLElement>>(new Map());
	const loadingHikingIdsRef = useRef<Set<string>>(new Set());
	const scrolledHikingIdRef = useRef<HikingId | null>(null);
	const [articlesByHikingId, setArticlesByHikingId] = useState<
		Record<string, readonly Article[]>
	>({});
	const [commentsByHikingId, setCommentsByHikingId] = useState<
		Record<string, readonly Comment[]>
	>({});
	const [hikingArticleLoadStateById, setHikingArticleLoadStateById] = useState<
		Record<string, HikingArticleLoadState>
	>({});

	const hikingArticleCountById = useMemo(
		() => createHikingArticleCountById(hikingArticleCounts),
		[hikingArticleCounts],
	);
	const loadedArticles = useMemo(
		() => Object.values(articlesByHikingId).flat(),
		[articlesByHikingId],
	);
	const loadedComments = useMemo(
		() => Object.values(commentsByHikingId).flat(),
		[commentsByHikingId],
	);
	const groups = useMemo(
		() => getFeedGroups(hikings, loadedArticles),
		[hikings, loadedArticles],
	);
	const commentsByArticleId = useMemo(
		() => getCommentsByArticleId(loadedComments),
		[loadedComments],
	);
	const articleHikingIdByArticleId = useMemo(
		() => createArticleHikingIdByArticleId(loadedArticles),
		[loadedArticles],
	);
	const commentArticleIdByCommentId = useMemo(
		() => createCommentArticleIdByCommentId(loadedComments),
		[loadedComments],
	);

	const getHikingArticleCount = useCallback(
		(hikingId: HikingId) => hikingArticleCountById.get(hikingId) ?? 0,
		[hikingArticleCountById],
	);

	const loadHikingArticles = useCallback(
		(hikingId: HikingId, options: { retry?: boolean } = {}) => {
			const articleTotal = getHikingArticleCount(hikingId);
			const hasPreviousArticles = hasRecordKey(articlesByHikingId, hikingId);

			if (articleTotal === 0) {
				setHikingArticleLoadStateById((currentStates) => ({
					...currentStates,
					[hikingId]: { status: "loaded" },
				}));
				setArticlesByHikingId((currentArticles) => ({
					...currentArticles,
					[hikingId]: [],
				}));
				setCommentsByHikingId((currentComments) => ({
					...currentComments,
					[hikingId]: [],
				}));
				return;
			}

			if (loadingHikingIdsRef.current.has(hikingId)) {
				return;
			}

			if (!options.retry && hasPreviousArticles) {
				return;
			}

			loadingHikingIdsRef.current.add(hikingId);
			setHikingArticleLoadStateById((currentStates) => ({
				...currentStates,
				[hikingId]: { status: hasPreviousArticles ? "refreshing" : "loading" },
			}));

			void queryClient
				.fetchQuery(
					$api.queryOptions("get", "/api/feed/hikings/{hikingId}/articles", {
						params: { path: { hikingId } },
					}),
				)
				.then((data) => {
					const articles = data.articles as unknown as readonly Article[];
					const comments = data.comments as unknown as readonly Comment[];

					setArticlesByHikingId((currentArticles) => ({
						...currentArticles,
						[hikingId]: articles,
					}));
					setCommentsByHikingId((currentComments) => ({
						...currentComments,
						[hikingId]: comments,
					}));
					setHikingArticleLoadStateById((currentStates) => ({
						...currentStates,
						[hikingId]: { status: "loaded" },
					}));
				})
				.catch((error: unknown) => {
					setHikingArticleLoadStateById((currentStates) => ({
						...currentStates,
						[hikingId]: {
							error:
								error instanceof Error
									? error.message
									: "글을 불러오지 못했습니다.",
							status: "error",
						},
					}));
				})
				.finally(() => {
					loadingHikingIdsRef.current.delete(hikingId);
				});
		},
		[articlesByHikingId, getHikingArticleCount, queryClient],
	);

	const refreshArticleComments = useCallback(
		async (articleId: ArticleId) => {
			const hikingId = articleHikingIdByArticleId.get(articleId);

			if (!hikingId) {
				throw new Error("댓글을 갱신할 글을 찾을 수 없습니다.");
			}

			const result = await queryClient.fetchQuery(
				$api.queryOptions("get", "/api/articles/{articleId}/comments", {
					params: { path: { articleId } },
				}),
			);
			const comments = result.comments as unknown as readonly Comment[];

			setCommentsByHikingId((currentComments) => {
				const hikingComments = currentComments[hikingId];

				if (!hikingComments) {
					return currentComments;
				}

				return {
					...currentComments,
					[hikingId]: [
						...hikingComments.filter(
							(comment) => comment.articleId !== articleId,
						),
						...comments,
					],
				};
			});

			return true;
		},
		[articleHikingIdByArticleId, queryClient],
	);

	const registerHikingSection = useCallback(
		(hikingId: HikingId, element: HTMLElement | null) => {
			if (!element) {
				hikingSectionElementsRef.current.delete(hikingId);
				return;
			}

			hikingSectionElementsRef.current.set(hikingId, element);
		},
		[],
	);

	useEffect(() => {
		let cancelled = false;
		const activeHikingIds = new Set(hikings.map((hiking) => hiking.id));

		loadingHikingIdsRef.current.clear();
		queueMicrotask(() => {
			if (cancelled) {
				return;
			}

			setArticlesByHikingId((currentArticles) =>
				filterRecordByActiveHikingIds(currentArticles, activeHikingIds),
			);
			setCommentsByHikingId((currentComments) =>
				filterRecordByActiveHikingIds(currentComments, activeHikingIds),
			);
			setHikingArticleLoadStateById((currentStates) =>
				filterRecordByActiveHikingIds(currentStates, activeHikingIds),
			);
		});

		return () => {
			cancelled = true;
		};
	}, [hikings]);

	useEffect(() => {
		let cancelled = false;

		for (const [hikingId, articles] of Object.entries(articlesByHikingId)) {
			const typedHikingId = hikingId as HikingId;

			if (getHikingArticleCount(typedHikingId) !== articles.length) {
				queueMicrotask(() => {
					if (!cancelled) {
						loadHikingArticles(typedHikingId, { retry: true });
					}
				});
			}
		}

		return () => {
			cancelled = true;
		};
	}, [articlesByHikingId, getHikingArticleCount, loadHikingArticles]);

	useEffect(() => {
		if (!selectedHikingId) {
			return;
		}

		let cancelled = false;

		queueMicrotask(() => {
			if (!cancelled) {
				loadHikingArticles(selectedHikingId);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [loadHikingArticles, selectedHikingId]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) {
						continue;
					}

					const hikingId = entry.target.getAttribute(
						"data-hiking-id",
					) as HikingId | null;

					if (!hikingId) {
						continue;
					}

					loadHikingArticles(hikingId);
					observer.unobserve(entry.target);
				}
			},
			{ rootMargin: "640px 0px" },
		);

		for (const [hikingId, element] of hikingSectionElementsRef.current) {
			const typedHikingId = hikingId as HikingId;

			if (
				getHikingArticleCount(typedHikingId) === 0 ||
				hasRecordKey(articlesByHikingId, hikingId)
			) {
				continue;
			}

			observer.observe(element);
		}

		return () => observer.disconnect();
	}, [articlesByHikingId, getHikingArticleCount, groups, loadHikingArticles]);

	useEffect(() => {
		if (!selectedHikingId || scrolledHikingIdRef.current === selectedHikingId) {
			return;
		}

		const selectedHikingElement = document.getElementById(
			`hiking-section-${selectedHikingId}`,
		);

		if (!selectedHikingElement) {
			return;
		}

		const alignSelectedHikingToTop = () => {
			const selectedHikingTop =
				selectedHikingElement.getBoundingClientRect().top + window.scrollY;

			scrolledHikingIdRef.current = selectedHikingId;
			window.scrollTo({ top: Math.max(0, selectedHikingTop) });
			selectedHikingElement.focus({ preventScroll: true });
		};
		const animationFrameId = window.requestAnimationFrame(
			alignSelectedHikingToTop,
		);
		const timeoutIds = [100, 350, 800].map((delay) =>
			window.setTimeout(alignSelectedHikingToTop, delay),
		);

		return () => {
			window.cancelAnimationFrame(animationFrameId);
			timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
		};
	}, [selectedHikingId]);

	return {
		articleHikingIdByArticleId,
		articlesByHikingId,
		commentArticleIdByCommentId,
		commentsByArticleId,
		commentsByHikingId,
		getHikingArticleCount,
		groups,
		hikingArticleLoadStateById,
		loadHikingArticles,
		loadedArticles,
		loadedComments,
		registerHikingSection,
		refreshArticleComments,
		setArticlesByHikingId,
		setCommentsByHikingId,
	};
}
