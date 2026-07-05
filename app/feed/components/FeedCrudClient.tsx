'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ArticleFormDialog } from '@/app/article/components/ArticleFormDialog';
import type { ArticleFormValues } from '@/app/article/components/articleFormTypes';
import { ArticlePanel } from '@/app/article/components/ArticlePanel';
import { $api, fetchClient } from '@/app/common/api/$api';
import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { ConfirmDialog, type ConfirmState } from '@/app/common/components/ConfirmDialog';
import { LoadingOverlay } from '@/app/common/components/LoadingOverlay';
import { boxBorderClassName, gridStackClassName } from '@/app/common/components/styles';
import { useSingleFlightAction } from '@/app/common/hooks/useSingleFlightAction';
import { FeedFooter } from '@/app/feed/components/FeedFooter';
import { FeedTopbar } from '@/app/feed/components/FeedTopbar';
import { StatusPanel } from '@/app/feed/components/StatusPanel';
import { HikingFormDialog } from '@/app/hiking/components/HikingFormDialog';
import type { HikingFormValues } from '@/app/hiking/components/hikingFormTypes';
import { HikingHeader } from '@/app/hiking/components/HikingHeader';
import type { Article, ArticleId } from '@/core/article/domain';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';
import type { NotificationListSnapshot } from '@/core/notification/model/Notification';
import { useQueryClient } from '@tanstack/react-query';

import {
  getArticleComments,
  getAuthorName,
  getCommentsByArticleId,
  getFeedGroups,
} from '../utils/feed-crud-utils';

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

type ActiveArticleForm =
  { hikingId: HikingId; type: 'create' } | { articleId: ArticleId; type: 'edit' } | null;

type ActiveHikingForm = { type: 'create' } | { hikingId: HikingId; type: 'edit' } | null;

type LikePendingKey = `article-${ArticleId}` | `comment-${CommentId}`;

type HikingArticleLoadState =
  | { error?: undefined; status: 'idle' | 'loading' | 'loaded' | 'refreshing' }
  | { error: string; status: 'error' };

type UploadedArticleMedia = {
  byteSize: number;
  contentType: string;
  durationMs: number | null;
  height: number | null;
  mediaType: 'image' | 'video';
  objectKey: string;
  order: number;
  originalMetadata: Record<string, unknown> | null;
  thumbnailUrl: string | null;
  url: string;
  width: number | null;
};

type ArticleMediaUploadTargetInput = {
  byteSize: number;
  contentType: string;
  fileName: string;
  mediaType: 'image' | 'video';
  thumbnail?: {
    byteSize: number;
    contentType: string;
    fileName: string;
  };
};

const getCommentCreateSingleFlightKey = (articleId: ArticleId, parentCommentId: CommentId | null) =>
  `comment-create-${articleId}-${parentCommentId ?? 'root'}`;

const getCommentUpdateSingleFlightKey = (commentId: CommentId) => `comment-update-${commentId}`;

function hasRecordKey<T>(record: Record<string, T>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

async function uploadDirectToS3(file: File, uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    body: file,
    headers: {
      'Content-Type': file.type,
    },
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error('S3 업로드에 실패했습니다.');
  }
}

async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const item = items[currentIndex];

        if (item !== undefined) {
          await worker(item, currentIndex);
        }
      }
    }),
  );
}

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
  const createHikingMutation = $api.useMutation('post', '/api/hikings');
  const updateHikingMutation = $api.useMutation('patch', '/api/hikings/{hikingId}');
  const deleteHikingMutation = $api.useMutation('delete', '/api/hikings/{hikingId}');
  const createArticleMutation = $api.useMutation('post', '/api/articles');
  const updateArticleMutation = $api.useMutation('patch', '/api/articles/{articleId}');
  const deleteArticleMutation = $api.useMutation('delete', '/api/articles/{articleId}');
  const toggleArticleLikeMutation = $api.useMutation('post', '/api/articles/{articleId}/like');
  const createCommentMutation = $api.useMutation('post', '/api/articles/{articleId}/comments');
  const updateCommentMutation = $api.useMutation('patch', '/api/comments/{commentId}');
  const deleteCommentMutation = $api.useMutation('delete', '/api/comments/{commentId}');
  const toggleCommentLikeMutation = $api.useMutation('post', '/api/comments/{commentId}/like');
  const hikingSectionElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const loadingHikingIdsRef = useRef<Set<string>>(new Set());
  const scrolledHikingIdRef = useRef<HikingId | null>(null);
  const singleFlightAction = useSingleFlightAction();
  const [isPending, startTransition] = useTransition();
  const currentAuthorName = useMemo(() => getAuthorName(currentUser), [currentUser]);
  const [articlesByHikingId, setArticlesByHikingId] = useState<Record<string, readonly Article[]>>(
    {},
  );
  const [commentsByHikingId, setCommentsByHikingId] = useState<Record<string, readonly Comment[]>>(
    {},
  );
  const [hikingArticleLoadStateById, setHikingArticleLoadStateById] = useState<
    Record<string, HikingArticleLoadState>
  >({});
  const [activeHikingForm, setActiveHikingForm] = useState<ActiveHikingForm>(null);
  const [activeArticleForm, setActiveArticleForm] = useState<ActiveArticleForm>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [commentFormResetKeyByArticleId, setCommentFormResetKeyByArticleId] = useState<
    Record<string, number>
  >({});
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [highlightedHikingId, setHighlightedHikingId] = useState<HikingId | null>(selectedHikingId);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [commentCountDeltaState, setCommentCountDeltaState] = useState({
    baseCommentCount: commentCount,
    delta: 0,
  });
  const [pendingLikeByKey, setPendingLikeByKey] = useState<Record<string, boolean>>({});

  const hikingArticleCountById = useMemo(
    () =>
      new Map<HikingId, number>(
        hikingArticleCounts.map((item) => [item.hikingId, item.articleCount]),
      ),
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
    () => getFeedGroups(initialHikings, loadedArticles),
    [initialHikings, loadedArticles],
  );
  const commentsByArticleId = useMemo(
    () => getCommentsByArticleId(loadedComments),
    [loadedComments],
  );
  const articleHikingIdByArticleId = useMemo(
    () =>
      new Map<ArticleId, HikingId>(loadedArticles.map((article) => [article.id, article.hikingId])),
    [loadedArticles],
  );
  const commentArticleIdByCommentId = useMemo(
    () =>
      new Map<CommentId, ArticleId>(
        loadedComments.map((comment) => [comment.id, comment.articleId]),
      ),
    [loadedComments],
  );
  const visibleArticleCount = articleCount;
  const commentCountDelta =
    commentCountDeltaState.baseCommentCount === commentCount ? commentCountDeltaState.delta : 0;
  const visibleCommentCount = Math.max(0, commentCount + commentCountDelta);
  const activeHiking =
    activeHikingForm?.type === 'edit'
      ? initialHikings.find((hiking) => hiking.id === activeHikingForm.hikingId)
      : undefined;
  const activeHikingFormKey =
    activeHikingForm?.type === 'create'
      ? 'hiking-new'
      : activeHikingForm?.type === 'edit'
        ? `hiking-edit-${activeHikingForm.hikingId}`
        : null;
  const activeHikingFormTitle = activeHikingForm?.type === 'edit' ? '산행 수정' : '산행 등록';
  const hikingFormDialogOpen =
    activeHikingForm?.type === 'create' ||
    (activeHikingForm?.type === 'edit' && activeHiking !== undefined);
  const activeArticle =
    activeArticleForm?.type === 'edit'
      ? loadedArticles.find((article) => article.id === activeArticleForm.articleId)
      : undefined;
  const activeArticleHiking =
    activeArticleForm?.type === 'create'
      ? initialHikings.find((hiking) => hiking.id === activeArticleForm.hikingId)
      : activeArticle
        ? initialHikings.find((hiking) => hiking.id === activeArticle.hikingId)
        : undefined;
  const activeArticleFormKey =
    activeArticleForm?.type === 'create'
      ? `article-new-${activeArticleForm.hikingId}`
      : activeArticleForm?.type === 'edit'
        ? `article-edit-${activeArticleForm.articleId}`
        : null;
  const activeArticleFormTitle = activeArticleForm?.type === 'edit' ? '게시글 수정' : '게시글 작성';
  const articleFormDialogOpen =
    activeArticleForm?.type === 'create' ||
    (activeArticleForm?.type === 'edit' && activeArticle !== undefined);
  const activeHikingSingleFlightKey =
    activeHikingForm?.type === 'create'
      ? 'hiking-create'
      : activeHikingForm?.type === 'edit'
        ? `hiking-update-${activeHikingForm.hikingId}`
        : null;
  const activeArticleSingleFlightKey =
    activeArticleForm?.type === 'create'
      ? `article-create-${activeArticleForm.hikingId}`
      : activeArticleForm?.type === 'edit'
        ? `article-update-${activeArticleForm.articleId}`
        : null;
  const activeHikingSubmitting =
    (activeHikingSingleFlightKey !== null &&
      singleFlightAction.isRunning(activeHikingSingleFlightKey)) ||
    (isPending && loadingLabel !== null);
  const activeArticleSubmitting =
    (activeArticleSingleFlightKey !== null &&
      singleFlightAction.isRunning(activeArticleSingleFlightKey)) ||
    (isPending && loadingLabel !== null);

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
          [hikingId]: { status: 'loaded' },
        }));
        setArticlesByHikingId((currentArticles) => ({ ...currentArticles, [hikingId]: [] }));
        setCommentsByHikingId((currentComments) => ({ ...currentComments, [hikingId]: [] }));
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
        [hikingId]: { status: hasPreviousArticles ? 'refreshing' : 'loading' },
      }));

      void fetchClient
        .GET('/api/feed/hikings/{hikingId}/articles', {
          params: { path: { hikingId } },
        })
        .then(({ data }) => {
          if (!data) {
            throw new Error('게시글을 불러오지 못했습니다.');
          }

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
            [hikingId]: { status: 'loaded' },
          }));
        })
        .catch((error: unknown) => {
          setHikingArticleLoadStateById((currentStates) => ({
            ...currentStates,
            [hikingId]: {
              error: error instanceof Error ? error.message : '게시글을 불러오지 못했습니다.',
              status: 'error',
            },
          }));
        })
        .finally(() => {
          loadingHikingIdsRef.current.delete(hikingId);
        });
    },
    [articlesByHikingId, getHikingArticleCount],
  );

  const registerHikingSection = useCallback((hikingId: HikingId, element: HTMLElement | null) => {
    if (!element) {
      hikingSectionElementsRef.current.delete(hikingId);
      return;
    }

    hikingSectionElementsRef.current.set(hikingId, element);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const activeHikingIds = new Set(initialHikings.map((hiking) => hiking.id));

    loadingHikingIdsRef.current.clear();
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setArticlesByHikingId((currentArticles) =>
        Object.fromEntries(
          Object.entries(currentArticles).filter(([hikingId]) =>
            activeHikingIds.has(hikingId as HikingId),
          ),
        ),
      );
      setCommentsByHikingId((currentComments) =>
        Object.fromEntries(
          Object.entries(currentComments).filter(([hikingId]) =>
            activeHikingIds.has(hikingId as HikingId),
          ),
        ),
      );
      setHikingArticleLoadStateById((currentStates) =>
        Object.fromEntries(
          Object.entries(currentStates).filter(([hikingId]) =>
            activeHikingIds.has(hikingId as HikingId),
          ),
        ),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [initialHikings]);

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

          const hikingId = entry.target.getAttribute('data-hiking-id') as HikingId | null;

          if (!hikingId) {
            continue;
          }

          loadHikingArticles(hikingId);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '640px 0px' },
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

    const selectedHikingElement = document.getElementById(`hiking-section-${selectedHikingId}`);

    if (!selectedHikingElement) {
      return;
    }

    const alignSelectedHikingToTop = () => {
      const selectedHikingTop = selectedHikingElement.getBoundingClientRect().top + window.scrollY;

      scrolledHikingIdRef.current = selectedHikingId;
      window.scrollTo({ top: Math.max(0, selectedHikingTop) });
      selectedHikingElement.focus({ preventScroll: true });
    };
    const animationFrameId = window.requestAnimationFrame(alignSelectedHikingToTop);
    const timeoutIds = [100, 350, 800].map((delay) =>
      window.setTimeout(alignSelectedHikingToTop, delay),
    );

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [selectedHikingId]);

  const setError = (key: string, value: string | null) => {
    setErrorByKey((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (value === null) {
        delete nextErrors[key];
      } else {
        nextErrors[key] = value;
      }

      return nextErrors;
    });
  };

  const refreshArticleComments = async (articleId: ArticleId) => {
    const hikingId = articleHikingIdByArticleId.get(articleId);

    if (!hikingId) {
      throw new Error('댓글을 갱신할 게시글을 찾을 수 없습니다.');
    }

    const result = await fetchClient.GET('/api/articles/{articleId}/comments', {
      params: { path: { articleId } },
    });

    if (!result.data) {
      throw new Error('댓글을 불러오지 못했습니다.');
    }

    const comments = result.data.comments as unknown as readonly Comment[];

    setCommentsByHikingId((currentComments) => {
      const hikingComments = currentComments[hikingId];

      if (!hikingComments) {
        return currentComments;
      }

      return {
        ...currentComments,
        [hikingId]: [
          ...hikingComments.filter((comment) => comment.articleId !== articleId),
          ...comments,
        ],
      };
    });

    return true;
  };

  const applyArticleLikeToggle = (articleId: ArticleId) => {
    const hikingId = articleHikingIdByArticleId.get(articleId);

    if (!hikingId) {
      throw new Error('좋아요를 갱신할 게시글을 찾을 수 없습니다.');
    }

    setArticlesByHikingId((currentArticles) => {
      const hikingArticles = currentArticles[hikingId];

      if (!hikingArticles) {
        return currentArticles;
      }

      return {
        ...currentArticles,
        [hikingId]: hikingArticles.map((article) => {
          if (article.id !== articleId) {
            return article;
          }

          const likedByCurrentUser = !article.likedByCurrentUser;

          return {
            ...article,
            likedByCurrentUser,
            likeCount: Math.max(0, article.likeCount + (likedByCurrentUser ? 1 : -1)),
          };
        }),
      };
    });
  };

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.left = '-9999px';
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      const copied = document.execCommand('copy');

      if (!copied) {
        throw new Error('Copy command failed.');
      }
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const copyHikingLink = (hiking: Hiking) => {
    const hikingHref = `/feed?hikingId=${encodeURIComponent(hiking.id)}`;
    const url = new URL(hikingHref, window.location.origin);

    setHighlightedHikingId(hiking.id);
    window.history.replaceState(window.history.state, '', hikingHref);

    copyTextToClipboard(url.toString())
      .then(() => {
        setError(`hiking-${hiking.id}`, null);
        toast.success('산행 링크를 복사했습니다.', { position: 'bottom-center' });
      })
      .catch(() => {
        setError(`hiking-${hiking.id}`, '링크 복사에 실패했습니다.');
        toast.error('링크 복사에 실패했습니다.', { position: 'bottom-center' });
      });
  };

  const copyArticleLink = (article: Article) => {
    const articleHref = `/article/${encodeURIComponent(article.id)}`;
    const url = new URL(articleHref, window.location.origin);

    copyTextToClipboard(url.toString())
      .then(() => {
        setError(`article-${article.id}`, null);
        toast.success('게시글 링크를 복사했습니다.', { position: 'bottom-center' });
      })
      .catch(() => {
        setError(`article-${article.id}`, '링크 복사에 실패했습니다.');
        toast.error('링크 복사에 실패했습니다.', { position: 'bottom-center' });
      });
  };

  const runAction = <T extends { error?: string; ok: boolean }>(
    action: () => Promise<T>,
    options: {
      errorKey: string;
      loadingLabel?: string;
      onSettled?: () => void;
      onSuccess?: (result: T & { ok: true }) => Promise<void> | void;
      refresh?: boolean;
      singleFlightKey?: string;
    },
  ) => {
    const execute = async () => {
      if (options.loadingLabel) {
        setLoadingLabel(options.loadingLabel);
      } else {
        setLoadingLabel(null);
      }

      await new Promise<void>((resolve) => {
        startTransition(async () => {
          try {
            const result = await action();

            if (!result.ok) {
              setError(options.errorKey, result.error ?? '요청을 처리하지 못했습니다.');
              return;
            }

            try {
              await options.onSuccess?.(result as T & { ok: true });
              setError(options.errorKey, null);
              void queryClient.invalidateQueries();
              if (options.refresh !== false) {
                router.refresh();
              }
            } catch (error) {
              setError(
                options.errorKey,
                error instanceof Error ? error.message : '요청을 처리하지 못했습니다.',
              );
            }
          } catch (error) {
            setError(
              options.errorKey,
              error instanceof Error ? error.message : '요청을 처리하지 못했습니다.',
            );
          } finally {
            options.onSettled?.();
            resolve();
          }
        });
      });
    };

    if (options.singleFlightKey) {
      void singleFlightAction.run(options.singleFlightKey, execute);
      return;
    }

    void execute();
  };

  const setLikePending = (key: LikePendingKey, pending: boolean) => {
    setPendingLikeByKey((currentPending) => {
      const nextPending = { ...currentPending };

      if (pending) {
        nextPending[key] = true;
      } else {
        delete nextPending[key];
      }

      return nextPending;
    });
  };

  const closeActiveArticleForm = () => {
    if (activeArticleForm?.type === 'create') {
      setError(`article-new-${activeArticleForm.hikingId}`, null);
    }

    if (activeArticleForm?.type === 'edit') {
      setError(`article-edit-${activeArticleForm.articleId}`, null);
    }

    setActiveArticleForm(null);
  };

  const closeActiveHikingForm = () => {
    if (activeHikingForm?.type === 'create') {
      setError('hiking-new', null);
    }

    if (activeHikingForm?.type === 'edit') {
      setError(`hiking-edit-${activeHikingForm.hikingId}`, null);
    }

    setActiveHikingForm(null);
  };

  const createHikingBody = (values: HikingFormValues) => {
    return {
      altitude: values.altitude.trim() ? Number(values.altitude) : null,
      completedTime: values.completedTime,
      hikingDate: values.hikingDate,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      mountainName: values.mountainName,
      participantsCsv: values.participantsCsv,
      restaurantAddress: values.restaurantAddress,
      startedTime: values.startedTime,
      timezone: values.timezone,
    };
  };

  const uploadArticleMedia = async (values: ArticleFormValues) => {
    const newMedia = values.media.filter((media) => media.file);
    const uploadedObjectKeys: string[] = [];

    if (newMedia.length === 0) {
      return { uploadedMedia: [] as UploadedArticleMedia[], uploadedObjectKeys };
    }

    setLoadingLabel('업로드 URL 준비 중');

    const targetInput: ArticleMediaUploadTargetInput[] = newMedia.map((media) => ({
      byteSize: media.file?.size ?? 0,
      contentType: media.file?.type ?? '',
      fileName: media.file?.name ?? media.fileName,
      mediaType: media.mediaType,
      thumbnail: media.thumbnailFile
        ? {
            byteSize: media.thumbnailFile.size,
            contentType: media.thumbnailFile.type,
            fileName: media.thumbnailFile.name,
          }
        : undefined,
    }));
    const { data: targetResult } = await fetchClient.POST('/api/article-media/upload-targets', {
      body: targetInput,
    });

    if (!targetResult) {
      throw new Error('업로드 URL을 만들지 못했습니다.');
    }

    const uploadedMedia = new Array<UploadedArticleMedia>(newMedia.length);
    let uploadedCount = 0;

    try {
      await runWithConcurrency(newMedia, 4, async (media, index) => {
        const target = targetResult.targets[index];

        if (!target || !media.file) {
          throw new Error('업로드 대상을 만들지 못했습니다.');
        }

        await uploadDirectToS3(media.file, target.uploadUrl);
        uploadedObjectKeys.push(target.objectKey);

        if (media.thumbnailFile && target.thumbnail) {
          await uploadDirectToS3(media.thumbnailFile, target.thumbnail.uploadUrl);
          uploadedObjectKeys.push(target.thumbnail.objectKey);
        }

        uploadedMedia[index] = {
          byteSize: media.file.size,
          contentType: media.file.type,
          durationMs: media.durationMs ?? null,
          height: media.height ?? null,
          mediaType: media.mediaType,
          objectKey: target.objectKey,
          order: media.order,
          originalMetadata: media.originalMetadata ?? null,
          thumbnailUrl: target.thumbnail?.url ?? null,
          url: target.url,
          width: media.width ?? null,
        };
        uploadedCount += 1;
        setLoadingLabel(`S3 업로드 중 ${uploadedCount}/${newMedia.length}`);
      });
    } catch (error) {
      if (uploadedObjectKeys.length > 0) {
        setLoadingLabel('업로드 파일 정리 중');
        await fetchClient.DELETE('/api/article-media/uploads', {
          body: { objectKeys: uploadedObjectKeys },
        });
      }

      throw error;
    }

    return { uploadedMedia, uploadedObjectKeys };
  };

  const createArticleFormData = async (
    values: ArticleFormValues,
    identifiers: { articleId?: ArticleId; hikingId?: HikingId },
  ) => {
    const body = {
      existingMedia: [] as {
        byteSize?: number;
        contentType?: string;
        durationMs?: number | null;
        height?: number | null;
        mediaType: 'image' | 'video';
        metadata?: Record<string, string | null | undefined> | null;
        objectKey?: string;
        order: number;
        thumbnailUrl?: string | null;
        url: string;
        width?: number | null;
      }[],
      uploadedMedia: [] as UploadedArticleMedia[],
      body: values.body,
      ...identifiers,
    };
    const { uploadedMedia, uploadedObjectKeys } = await uploadArticleMedia(values);
    const existingMedia = values.media
      .filter((media) => !media.file)
      .map((media) => ({
        byteSize: media.byteSize,
        contentType: media.contentType,
        durationMs: media.durationMs,
        height: media.height,
        mediaType: media.mediaType,
        metadata: media.metadata,
        objectKey: media.objectKey,
        order: media.order,
        thumbnailUrl: media.thumbnailUrl,
        url: media.url,
        width: media.width,
      }));

    return { body: { ...body, existingMedia, uploadedMedia }, uploadedObjectKeys };
  };

  const createHiking = (values: HikingFormValues) => {
    runAction(
      () =>
        createHikingMutation
          .mutateAsync({ body: createHikingBody(values) })
          .then(() => ({ ok: true as const })),
      {
        errorKey: 'hiking-new',
        loadingLabel: '산행 저장 중',
        onSuccess: () => setActiveHikingForm(null),
        singleFlightKey: 'hiking-create',
      },
    );
  };

  const updateHiking = (hikingId: HikingId, values: HikingFormValues) => {
    runAction(
      () =>
        updateHikingMutation
          .mutateAsync({
            body: createHikingBody(values),
            params: { path: { hikingId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `hiking-edit-${hikingId}`,
        loadingLabel: '산행 저장 중',
        onSuccess: () => setActiveHikingForm(null),
        singleFlightKey: `hiking-update-${hikingId}`,
      },
    );
  };

  const requestDeleteHiking = (hiking: Hiking) => {
    const hasArticles = getHikingArticleCount(hiking.id) > 0;

    if (hasArticles) {
      setError(`hiking-${hiking.id}`, '게시글이 있는 산행은 삭제할 수 없습니다.');
      return;
    }

    setConfirmState({
      body: `${hiking.mountainName} 산행 기록을 삭제합니다.`,
      confirmLabel: '삭제',
      onConfirm: () => {
        runAction(
          () =>
            deleteHikingMutation
              .mutateAsync({
                params: { path: { hikingId: hiking.id } },
              })
              .then(() => ({ ok: true as const })),
          {
            errorKey: `hiking-${hiking.id}`,
            onSuccess: () => setConfirmState(null),
          },
        );
      },
      title: '산행 삭제',
    });
  };

  const createArticle = (hikingId: HikingId, values: ArticleFormValues) => {
    if (values.media.length === 0) {
      setError(`article-new-${hikingId}`, '게시글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runAction(
      async () => {
        let uploadedObjectKeys: string[] = [];
        try {
          const articleFormData = await createArticleFormData(values, {
            hikingId,
          });
          uploadedObjectKeys = articleFormData.uploadedObjectKeys;

          setLoadingLabel('게시글 저장 중');
          await createArticleMutation.mutateAsync({
            body: { ...articleFormData.body, hikingId },
          });

          return { ok: true as const };
        } catch (error) {
          if (uploadedObjectKeys.length > 0) {
            setLoadingLabel('업로드 파일 정리 중');
            await fetchClient.DELETE('/api/article-media/uploads', {
              body: { objectKeys: uploadedObjectKeys },
            });
          }

          return {
            error: error instanceof Error ? error.message : '게시글을 저장하지 못했습니다.',
            ok: false,
          };
        }
      },
      {
        errorKey: `article-new-${hikingId}`,
        loadingLabel: '게시글 저장 중',
        onSuccess: () => setActiveArticleForm(null),
        singleFlightKey: `article-create-${hikingId}`,
      },
    );
  };

  const updateArticle = (articleId: ArticleId, values: ArticleFormValues) => {
    if (values.media.length === 0) {
      setError(`article-edit-${articleId}`, '게시글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runAction(
      async () => {
        let uploadedObjectKeys: string[] = [];
        try {
          const articleFormData = await createArticleFormData(values, {
            articleId,
          });
          uploadedObjectKeys = articleFormData.uploadedObjectKeys;

          setLoadingLabel('게시글 저장 중');
          const result = await updateArticleMutation.mutateAsync({
            body: articleFormData.body,
            params: { path: { articleId } },
          });

          if (!result) {
            throw new Error('게시글을 저장하지 못했습니다.');
          }

          return {
            ok: true as const,
            snapshot: result as unknown as { article: Article; comments: readonly Comment[] },
          };
        } catch (error) {
          if (uploadedObjectKeys.length > 0) {
            setLoadingLabel('업로드 파일 정리 중');
            await fetchClient.DELETE('/api/article-media/uploads', {
              body: { objectKeys: uploadedObjectKeys },
            });
          }

          return {
            error: error instanceof Error ? error.message : '게시글을 저장하지 못했습니다.',
            ok: false,
          };
        }
      },
      {
        errorKey: `article-edit-${articleId}`,
        loadingLabel: '게시글 저장 중',
        onSuccess: (result) => {
          setArticlesByHikingId((currentArticles) => {
            const hikingArticles = currentArticles[result.snapshot.article.hikingId];

            if (!hikingArticles) {
              return currentArticles;
            }

            return {
              ...currentArticles,
              [result.snapshot.article.hikingId]: hikingArticles.map((article) =>
                article.id === result.snapshot.article.id ? result.snapshot.article : article,
              ),
            };
          });
          setCommentsByHikingId((currentComments) => {
            const hikingComments = currentComments[result.snapshot.article.hikingId];

            if (!hikingComments) {
              return currentComments;
            }

            return {
              ...currentComments,
              [result.snapshot.article.hikingId]: [
                ...hikingComments.filter(
                  (comment) => comment.articleId !== result.snapshot.article.id,
                ),
                ...result.snapshot.comments,
              ],
            };
          });
          setActiveArticleForm(null);
        },
        refresh: false,
        singleFlightKey: `article-update-${articleId}`,
      },
    );
  };

  const requestDeleteArticle = (article: Article) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        runAction(
          () =>
            deleteArticleMutation
              .mutateAsync({
                params: { path: { articleId: article.id } },
              })
              .then(() => ({ ok: true as const })),
          {
            errorKey: `article-${article.id}`,
            onSuccess: () => setConfirmState(null),
          },
        );
      },
      title: '게시글 삭제',
    });
  };

  const createComment = (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => {
    runAction(
      () =>
        createCommentMutation
          .mutateAsync({
            body: { body, parentCommentId },
            params: { path: { articleId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `comment-new-${articleId}`,
        onSuccess: async () => {
          await refreshArticleComments(articleId);
          setCommentCountDeltaState((currentState) => ({
            baseCommentCount: commentCount,
            delta: (currentState.baseCommentCount === commentCount ? currentState.delta : 0) + 1,
          }));

          if (parentCommentId === null) {
            setCommentFormResetKeyByArticleId((currentKeys) => ({
              ...currentKeys,
              [articleId]: (currentKeys[articleId] ?? 0) + 1,
            }));
          }

          setReplyingCommentId(null);
        },
        refresh: false,
        singleFlightKey: getCommentCreateSingleFlightKey(articleId, parentCommentId),
      },
    );
  };

  const updateComment = (commentId: CommentId, body: string) => {
    const articleId = commentArticleIdByCommentId.get(commentId);

    if (!articleId) {
      setError(`comment-edit-${commentId}`, '댓글을 갱신할 게시글을 찾을 수 없습니다.');
      return;
    }

    runAction(
      () =>
        updateCommentMutation
          .mutateAsync({
            body: { body },
            params: { path: { commentId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `comment-edit-${commentId}`,
        onSuccess: async () => {
          await refreshArticleComments(articleId);
          setEditingCommentId(null);
        },
        refresh: false,
        singleFlightKey: getCommentUpdateSingleFlightKey(commentId),
      },
    );
  };

  const requestDeleteComment = (comment: Comment) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        runAction(
          () =>
            deleteCommentMutation
              .mutateAsync({
                params: { path: { commentId: comment.id } },
              })
              .then(() => ({ ok: true as const })),
          {
            errorKey: `comment-${comment.id}`,
            onSuccess: async () => {
              await refreshArticleComments(comment.articleId);
              setConfirmState(null);

              if (comment.deletedAt === null) {
                setCommentCountDeltaState((currentState) => ({
                  baseCommentCount: commentCount,
                  delta:
                    (currentState.baseCommentCount === commentCount ? currentState.delta : 0) - 1,
                }));
              }
            },
            refresh: false,
          },
        );
      },
      title: '댓글 삭제',
    });
  };

  const toggleArticleLike = (articleId: ArticleId) => {
    const likePendingKey = `article-${articleId}` as LikePendingKey;

    setLikePending(likePendingKey, true);
    runAction(
      () =>
        toggleArticleLikeMutation
          .mutateAsync({
            params: { path: { articleId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `article-${articleId}`,
        onSuccess: () => applyArticleLikeToggle(articleId),
        onSettled: () => setLikePending(likePendingKey, false),
        refresh: false,
      },
    );
  };

  const toggleCommentLike = (commentId: CommentId) => {
    const articleId = commentArticleIdByCommentId.get(commentId);

    if (!articleId) {
      setError(`comment-${commentId}`, '댓글을 갱신할 게시글을 찾을 수 없습니다.');
      return;
    }

    const likePendingKey = `comment-${commentId}` as LikePendingKey;

    setLikePending(likePendingKey, true);
    runAction(
      () =>
        toggleCommentLikeMutation
          .mutateAsync({
            params: { path: { commentId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `comment-${commentId}`,
        onSuccess: async () => {
          await refreshArticleComments(articleId);
        },
        onSettled: () => setLikePending(likePendingKey, false),
        refresh: false,
      },
    );
  };

  return (
    <main className="min-h-svh bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] bg-[length:2rem_2rem] text-[var(--foreground0)]">
      <FeedTopbar
        currentAuthorName={currentAuthorName}
        currentTheme={currentTheme}
        notificationSnapshot={notificationSnapshot}
        user={currentUser}
      />

      <div className="mx-auto grid w-[min(100%,78rem)] grid-cols-1 gap-4 px-1.5 py-4 sm:px-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:p-5">
        <section className={gridStackClassName} aria-label="산행 게시글 피드">
          <section
            className={`grid gap-4 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-4 ${boxBorderClassName}`}
            box-="round"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Command>{'echo "hello, hiking!"'}</Command>
              <ActionButton onClick={() => setActiveHikingForm({ type: 'create' })}>
                산행 등록
              </ActionButton>
            </div>
          </section>

          {groups.map((group, groupIndex) => {
            const groupArticleCount = getHikingArticleCount(group.hiking.id);
            const hasLoadedHikingArticles = hasRecordKey(articlesByHikingId, group.hiking.id);
            const groupLoadState =
              hikingArticleLoadStateById[group.hiking.id] ??
              (groupArticleCount === 0
                ? ({ status: 'loaded' } satisfies HikingArticleLoadState)
                : ({ status: 'idle' } satisfies HikingArticleLoadState));

            return (
              <section
                className={`${gridStackClassName} focus:outline-none ${
                  highlightedHikingId === group.hiking.id ? 'shadow-[0_0_0_2px_var(--blue)]' : ''
                }`}
                data-hiking-id={group.hiking.id}
                id={`hiking-section-${group.hiking.id}`}
                key={`${group.hiking.id}-${groupIndex}`}
                aria-labelledby={`hiking-${group.hiking.id}`}
                ref={(element) => registerHikingSection(group.hiking.id, element)}
                tabIndex={-1}
              >
                <HikingHeader
                  canManageHiking={group.hiking.authorUserId === currentUser.id}
                  error={errorByKey[`hiking-${group.hiking.id}`]}
                  hiking={group.hiking}
                  onAddArticle={() =>
                    setActiveArticleForm({ hikingId: group.hiking.id, type: 'create' })
                  }
                  onCopyLink={() => copyHikingLink(group.hiking)}
                  onDelete={() => requestDeleteHiking(group.hiking)}
                  onEdit={() => setActiveHikingForm({ hikingId: group.hiking.id, type: 'edit' })}
                />
                <div className={gridStackClassName}>
                  {hasLoadedHikingArticles ? (
                    <>
                      {groupLoadState.status === 'refreshing' ? (
                        <div
                          className={`flex flex-wrap items-center gap-2 bg-[var(--surface0)] !p-3 text-[0.9rem] text-[var(--subtext0)] ${boxBorderClassName}`}
                          box-="round"
                        >
                          <Command>articles.refresh {group.hiking.id}</Command>
                          <span is-="spinner" variant-="dots" />
                          <span>게시글을 갱신하는 중</span>
                        </div>
                      ) : null}
                      {groupLoadState.status === 'error' ? (
                        <div
                          className={`flex flex-wrap items-center gap-3 bg-[var(--surface0)] !p-3 text-[0.9rem] ${boxBorderClassName}`}
                          box-="round"
                        >
                          <Command>articles.stale {group.hiking.id}</Command>
                          <span className="text-[var(--red)]">{groupLoadState.error}</span>
                          <ActionButton
                            onClick={() => loadHikingArticles(group.hiking.id, { retry: true })}
                          >
                            다시 불러오기
                          </ActionButton>
                        </div>
                      ) : null}
                      {group.articles.length > 0 ? (
                        group.articles.map((article) => (
                          <ArticlePanel
                            article={article}
                            articleDetailHref={`/article/${article.id}`}
                            canEdit={article.authorUserId === currentUser.id}
                            comments={getArticleComments(commentsByArticleId, article.id)}
                            commentFormResetKey={commentFormResetKeyByArticleId[article.id] ?? 0}
                            currentUserId={currentUser.id}
                            editingCommentId={editingCommentId}
                            errorByKey={errorByKey}
                            key={article.id}
                            mobileMediaCarousel
                            onCreateComment={createComment}
                            onCopyArticleLink={() => copyArticleLink(article)}
                            onDeleteArticle={() => requestDeleteArticle(article)}
                            onDeleteComment={requestDeleteComment}
                            onEditArticle={() =>
                              setActiveArticleForm({ articleId: article.id, type: 'edit' })
                            }
                            onEditComment={setEditingCommentId}
                            onReplyComment={setReplyingCommentId}
                            onSubmitCommentEdit={updateComment}
                            onToggleArticleLike={toggleArticleLike}
                            onToggleCommentLike={toggleCommentLike}
                            articleLikePending={pendingLikeByKey[`article-${article.id}`] === true}
                            isCommentCreateSubmitting={(articleId, parentCommentId) =>
                              singleFlightAction.isRunning(
                                getCommentCreateSingleFlightKey(articleId, parentCommentId),
                              )
                            }
                            isCommentEditSubmitting={(commentId) =>
                              singleFlightAction.isRunning(
                                getCommentUpdateSingleFlightKey(commentId),
                              )
                            }
                            isCommentLikePending={(commentId) =>
                              pendingLikeByKey[`comment-${commentId}`] === true
                            }
                            replyingCommentId={replyingCommentId}
                          />
                        ))
                      ) : (
                        <div
                          className={`bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
                          box-="round"
                        >
                          <Command>articles.empty {group.hiking.id}</Command>
                          <p className="m-0 text-[var(--subtext0)]">
                            아직 이 산행에 게시글이 없습니다.
                          </p>
                        </div>
                      )}
                    </>
                  ) : groupLoadState.status === 'error' ? (
                    <div
                      className={`grid min-h-40 content-center gap-3 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
                      box-="round"
                    >
                      <Command>articles.error {group.hiking.id}</Command>
                      <p className="m-0 text-[var(--red)]">{groupLoadState.error}</p>
                      <div>
                        <ActionButton
                          onClick={() => loadHikingArticles(group.hiking.id, { retry: true })}
                        >
                          다시 불러오기
                        </ActionButton>
                      </div>
                    </div>
                  ) : groupLoadState.status !== 'loaded' ? (
                    <div
                      className={`grid min-h-64 content-center gap-3 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
                      box-="round"
                    >
                      <Command>articles.lazy {group.hiking.id}</Command>
                      <p className="m-0 flex items-center gap-2 text-[var(--subtext0)]">
                        <span is-="spinner" variant-="dots" />
                        <span>게시글 {groupArticleCount}개를 불러오는 중</span>
                      </p>
                    </div>
                  ) : (
                    <div className={`bg-[var(--surface0)] !p-4 ${boxBorderClassName}`} box-="round">
                      <Command>articles.empty {group.hiking.id}</Command>
                      <p className="m-0 text-[var(--subtext0)]">
                        아직 이 산행에 게시글이 없습니다.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </section>

        <StatusPanel
          articleCount={visibleArticleCount}
          commentCount={visibleCommentCount}
          currentAuthorName={currentAuthorName}
          groupCount={groups.length}
          hikingCount={initialHikings.length}
        />
      </div>
      <FeedFooter
        articleCount={visibleArticleCount}
        commentCount={visibleCommentCount}
        hikingCount={initialHikings.length}
      />
      <ConfirmDialog
        confirmState={confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
      />
      <HikingFormDialog
        error={activeHikingFormKey ? errorByKey[activeHikingFormKey] : undefined}
        formKey={activeHikingFormKey ?? 'hiking-form'}
        hiking={activeHiking}
        onCancel={closeActiveHikingForm}
        onOpenChange={(open) => {
          if (!open) {
            closeActiveHikingForm();
          }
        }}
        onSubmit={(values) => {
          if (activeHikingForm?.type === 'create') {
            createHiking(values);
            return;
          }

          if (activeHikingForm?.type === 'edit') {
            updateHiking(activeHikingForm.hikingId, values);
          }
        }}
        open={hikingFormDialogOpen}
        submitting={activeHikingSubmitting}
        title={activeHikingFormTitle}
      />
      <ArticleFormDialog
        article={activeArticle}
        error={activeArticleFormKey ? errorByKey[activeArticleFormKey] : undefined}
        formKey={activeArticleFormKey ?? 'article-form'}
        hiking={activeArticleHiking}
        onCancel={closeActiveArticleForm}
        onOpenChange={(open) => {
          if (!open) {
            closeActiveArticleForm();
          }
        }}
        onSubmit={(values) => {
          if (activeArticleForm?.type === 'create') {
            createArticle(activeArticleForm.hikingId, values);
            return;
          }

          if (activeArticleForm?.type === 'edit') {
            updateArticle(activeArticleForm.articleId, values);
          }
        }}
        open={articleFormDialogOpen}
        submitting={activeArticleSubmitting}
        title={activeArticleFormTitle}
      />
      <LoadingOverlay label={loadingLabel ?? undefined} open={isPending && loadingLabel !== null} />
    </main>
  );
}
