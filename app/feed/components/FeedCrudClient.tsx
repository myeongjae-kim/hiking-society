'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ArticleFormDialog } from '@/app/article/components/ArticleFormDialog';
import type { ArticleFormValues } from '@/app/article/components/articleFormTypes';
import { ArticlePanel } from '@/app/article/components/ArticlePanel';
import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { ConfirmDialog, type ConfirmState } from '@/app/common/components/ConfirmDialog';
import { LoadingOverlay } from '@/app/common/components/LoadingOverlay';
import { boxBorderClassName, gridStackClassName } from '@/app/common/components/styles';
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
import {
  cleanupArticleMediaUploads,
  createArticle as createArticleAction,
  createComment as createCommentAction,
  createHiking as createHikingAction,
  deleteArticle as deleteArticleAction,
  deleteComment as deleteCommentAction,
  deleteHiking as deleteHikingAction,
  loadHikingArticles as loadHikingArticlesAction,
  prepareArticleMediaUploads,
  toggleArticleLike as toggleArticleLikeAction,
  toggleCommentLike as toggleCommentLikeAction,
  updateArticle as updateArticleAction,
  updateComment as updateCommentAction,
  updateHiking as updateHikingAction,
  type ArticleMediaUploadTargetInput,
} from '../actions';

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
  { error?: undefined; status: 'idle' | 'loading' | 'loaded' } | { error: string; status: 'error' };

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
  const hikingSectionElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const loadingHikingIdsRef = useRef<Set<string>>(new Set());
  const scrolledHikingIdRef = useRef<HikingId | null>(null);
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
  const visibleArticleCount = articleCount;
  const visibleCommentCount = commentCount;
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

  const getHikingArticleCount = useCallback(
    (hikingId: HikingId) => hikingArticleCountById.get(hikingId) ?? 0,
    [hikingArticleCountById],
  );

  const loadHikingArticles = useCallback(
    (hikingId: HikingId, options: { retry?: boolean } = {}) => {
      const articleTotal = getHikingArticleCount(hikingId);

      if (articleTotal === 0) {
        setHikingArticleLoadStateById((currentStates) => ({
          ...currentStates,
          [hikingId]: { status: 'loaded' },
        }));
        setArticlesByHikingId((currentArticles) =>
          hasRecordKey(currentArticles, hikingId)
            ? currentArticles
            : { ...currentArticles, [hikingId]: [] },
        );
        setCommentsByHikingId((currentComments) =>
          hasRecordKey(currentComments, hikingId)
            ? currentComments
            : { ...currentComments, [hikingId]: [] },
        );
        return;
      }

      if (loadingHikingIdsRef.current.has(hikingId)) {
        return;
      }

      if (!options.retry && hasRecordKey(articlesByHikingId, hikingId)) {
        return;
      }

      loadingHikingIdsRef.current.add(hikingId);
      setHikingArticleLoadStateById((currentStates) => ({
        ...currentStates,
        [hikingId]: { status: 'loading' },
      }));

      void loadHikingArticlesAction(hikingId)
        .then((result) => {
          if (!result.ok) {
            setHikingArticleLoadStateById((currentStates) => ({
              ...currentStates,
              [hikingId]: {
                error: result.error ?? '게시글을 불러오지 못했습니다.',
                status: 'error',
              },
            }));
            return;
          }

          setArticlesByHikingId((currentArticles) => ({
            ...currentArticles,
            [hikingId]: result.articles,
          }));
          setCommentsByHikingId((currentComments) => ({
            ...currentComments,
            [hikingId]: result.comments,
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

    loadingHikingIdsRef.current.clear();
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setArticlesByHikingId({});
      setCommentsByHikingId({});
      setHikingArticleLoadStateById({});
    });

    return () => {
      cancelled = true;
    };
  }, [hikingArticleCounts, initialHikings]);

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

  const runAction = <T extends { error?: string; ok: boolean }>(
    action: () => Promise<T>,
    options: {
      errorKey: string;
      loadingLabel?: string;
      onSettled?: () => void;
      onSuccess?: (result: Extract<T, { ok: true }>) => void;
      refresh?: boolean;
    },
  ) => {
    if (options.loadingLabel) {
      setLoadingLabel(options.loadingLabel);
    } else {
      setLoadingLabel(null);
    }

    startTransition(async () => {
      try {
        const result = await action();

        if (!result.ok) {
          setError(options.errorKey, result.error ?? '요청을 처리하지 못했습니다.');
          return;
        }

        options.onSuccess?.(result as Extract<T, { ok: true }>);
        setError(options.errorKey, null);
        if (options.refresh !== false) {
          router.refresh();
        }
      } finally {
        options.onSettled?.();
      }
    });
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

  const createHikingFormData = (values: HikingFormValues) => {
    const formData = new FormData();

    for (const [key, value] of Object.entries(values)) {
      formData.set(key, value);
    }

    return formData;
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
    const targetResult = await prepareArticleMediaUploads(targetInput);

    if (!targetResult.ok) {
      throw new Error(targetResult.error ?? '업로드 URL을 만들지 못했습니다.');
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
        await cleanupArticleMediaUploads(uploadedObjectKeys);
      }

      throw error;
    }

    return { uploadedMedia, uploadedObjectKeys };
  };

  const createArticleFormData = async (
    values: ArticleFormValues,
    identifiers: { articleId?: ArticleId; hikingId?: HikingId },
  ) => {
    const formData = new FormData();
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

    if (identifiers.articleId) {
      formData.set('articleId', identifiers.articleId);
    }

    if (identifiers.hikingId) {
      formData.set('hikingId', identifiers.hikingId);
    }

    formData.set('body', values.body);
    formData.set('existingMedia', JSON.stringify(existingMedia));
    formData.set('uploadedMedia', JSON.stringify(uploadedMedia));

    return { formData, uploadedObjectKeys };
  };

  const createHiking = (values: HikingFormValues) => {
    runAction(() => createHikingAction(createHikingFormData(values)), {
      errorKey: 'hiking-new',
      loadingLabel: '산행 저장 중',
      onSuccess: () => setActiveHikingForm(null),
    });
  };

  const updateHiking = (hikingId: HikingId, values: HikingFormValues) => {
    const formData = createHikingFormData(values);
    formData.set('hikingId', hikingId);

    runAction(() => updateHikingAction(formData), {
      errorKey: `hiking-edit-${hikingId}`,
      loadingLabel: '산행 저장 중',
      onSuccess: () => setActiveHikingForm(null),
    });
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
        const formData = new FormData();
        formData.set('hikingId', hiking.id);
        runAction(() => deleteHikingAction(formData), {
          errorKey: `hiking-${hiking.id}`,
          onSuccess: () => setConfirmState(null),
        });
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
        try {
          const { formData, uploadedObjectKeys } = await createArticleFormData(values, {
            hikingId,
          });

          setLoadingLabel('게시글 저장 중');
          const result = await createArticleAction(formData);

          if (!result.ok && uploadedObjectKeys.length > 0) {
            setLoadingLabel('업로드 파일 정리 중');
            await cleanupArticleMediaUploads(uploadedObjectKeys);
          }

          return result;
        } catch (error) {
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
      },
    );
  };

  const updateArticle = (articleId: ArticleId, values: ArticleFormValues) => {
    if (values.media.length === 0) {
      setError(`article-edit-${articleId}`, '게시글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    const scrollYBeforeSubmit = window.scrollY;

    runAction(
      async () => {
        try {
          const { formData, uploadedObjectKeys } = await createArticleFormData(values, {
            articleId,
          });

          setLoadingLabel('게시글 저장 중');
          const result = await updateArticleAction(formData);

          if (!result.ok && uploadedObjectKeys.length > 0) {
            setLoadingLabel('업로드 파일 정리 중');
            await cleanupArticleMediaUploads(uploadedObjectKeys);
          }

          return result;
        } catch (error) {
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
          window.requestAnimationFrame(() => {
            window.scrollTo({ top: scrollYBeforeSubmit });
          });
        },
        refresh: false,
      },
    );
  };

  const requestDeleteArticle = (article: Article) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        const formData = new FormData();
        formData.set('articleId', article.id);
        runAction(() => deleteArticleAction(formData), {
          errorKey: `article-${article.id}`,
          onSuccess: () => setConfirmState(null),
        });
      },
      title: '게시글 삭제',
    });
  };

  const createComment = (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => {
    const formData = new FormData();
    formData.set('articleId', articleId);
    formData.set('body', body);

    if (parentCommentId) {
      formData.set('parentCommentId', parentCommentId);
    }

    runAction(() => createCommentAction(formData), {
      errorKey: `comment-new-${articleId}`,
      onSuccess: () => {
        if (parentCommentId === null) {
          setCommentFormResetKeyByArticleId((currentKeys) => ({
            ...currentKeys,
            [articleId]: (currentKeys[articleId] ?? 0) + 1,
          }));
        }

        setReplyingCommentId(null);
      },
    });
  };

  const updateComment = (commentId: CommentId, body: string) => {
    const formData = new FormData();
    formData.set('commentId', commentId);
    formData.set('body', body);

    runAction(() => updateCommentAction(formData), {
      errorKey: `comment-edit-${commentId}`,
      onSuccess: () => setEditingCommentId(null),
    });
  };

  const requestDeleteComment = (comment: Comment) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        const formData = new FormData();
        formData.set('commentId', comment.id);
        runAction(() => deleteCommentAction(formData), {
          errorKey: `comment-${comment.id}`,
          onSuccess: () => setConfirmState(null),
        });
      },
      title: '댓글 삭제',
    });
  };

  const toggleArticleLike = (articleId: ArticleId) => {
    const likePendingKey = `article-${articleId}` as LikePendingKey;
    const formData = new FormData();
    formData.set('articleId', articleId);

    setLikePending(likePendingKey, true);
    runAction(() => toggleArticleLikeAction(formData), {
      errorKey: `article-${articleId}`,
      onSettled: () => setLikePending(likePendingKey, false),
    });
  };

  const toggleCommentLike = (commentId: CommentId) => {
    const likePendingKey = `comment-${commentId}` as LikePendingKey;
    const formData = new FormData();
    formData.set('commentId', commentId);

    setLikePending(likePendingKey, true);
    runAction(() => toggleCommentLikeAction(formData), {
      errorKey: `comment-${commentId}`,
      onSettled: () => setLikePending(likePendingKey, false),
    });
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
                  {groupLoadState.status === 'error' ? (
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
                  ) : group.articles.length > 0 ? (
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
                        isCommentLikePending={(commentId) =>
                          pendingLikeByKey[`comment-${commentId}`] === true
                        }
                        replyingCommentId={replyingCommentId}
                      />
                    ))
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
        submitting={isPending && loadingLabel !== null}
        title={activeHikingFormTitle}
      />
      <ArticleFormDialog
        article={activeArticle}
        disableCloseAutoFocus={activeArticleForm?.type === 'edit'}
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
        submitting={isPending && loadingLabel !== null}
        title={activeArticleFormTitle}
      />
      <LoadingOverlay label={loadingLabel ?? undefined} open={isPending && loadingLabel !== null} />
    </main>
  );
}
