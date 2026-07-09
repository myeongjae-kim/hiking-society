'use client';

import type { Dispatch, SetStateAction } from 'react';

import type { ArticleFormValues } from '#/article/components/articleFormTypes';
import { useArticleMediaUploader } from '#/article/hooks/useArticleMediaUploader';
import type { UploadedArticleMedia } from '#/article/utils/article-media-upload';
import { $api } from '#/api/client/$api';
import { apiQueryKeys } from '#/api/client/queryKeys';
import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment } from '@/core/comment/domain';
import type { HikingId } from '@/core/hiking/domain';

import type { ActiveArticleForm } from '../utils/feedCrudTypes';
import type { FeedActionDeps } from './feedActionTypes';

type UseFeedArticleActionsInput = FeedActionDeps & {
  activeArticleForm: ActiveArticleForm;
  setArticlesByHikingId: Dispatch<SetStateAction<Record<string, readonly Article[]>>>;
  setActiveArticleForm: (form: ActiveArticleForm) => void;
  setCommentsByHikingId: Dispatch<SetStateAction<Record<string, readonly Comment[]>>>;
};

export function useFeedArticleActions({
  invalidateQueryKeys,
  refreshRoute,
  runner,
  activeArticleForm,
  setArticlesByHikingId,
  setActiveArticleForm,
  setCommentsByHikingId,
}: UseFeedArticleActionsInput) {
  const { deleteUploadedArticleMedia, uploadArticleMedia } = useArticleMediaUploader();
  const createArticleMutation = $api.useMutation('post', '/api/articles');
  const updateArticleMutation = $api.useMutation('patch', '/api/articles/{articleId}');
  const activeArticleSingleFlightKey =
    activeArticleForm?.type === 'create'
      ? `article-create-${activeArticleForm.hikingId}`
      : activeArticleForm?.type === 'edit'
        ? `article-update-${activeArticleForm.articleId}`
        : null;
  const activeArticleSubmitting =
    (activeArticleSingleFlightKey !== null && runner.isRunning(activeArticleSingleFlightKey)) ||
    (runner.isPending && runner.loadingLabel !== null);

  const closeActiveArticleForm = () => {
    if (activeArticleForm?.type === 'create') {
      runner.setError(`article-new-${activeArticleForm.hikingId}`, null);
    }

    if (activeArticleForm?.type === 'edit') {
      runner.setError(`article-edit-${activeArticleForm.articleId}`, null);
    }

    setActiveArticleForm(null);
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
    const { uploadedMedia, uploadedObjectKeys } = await uploadArticleMedia(
      values,
      runner.setLoadingLabel,
    );
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

  const createArticle = (hikingId: HikingId, values: ArticleFormValues) => {
    if (values.media.length === 0) {
      runner.setError(`article-new-${hikingId}`, '글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runner.runMutation(
      {
        errorKey: `article-new-${hikingId}`,
        loadingLabel: '글 저장 중',
        singleFlightKey: `article-create-${hikingId}`,
      },
      async () => {
        let uploadedObjectKeys: string[] = [];
        try {
          const articleFormData = await createArticleFormData(values, {
            hikingId,
          });
          uploadedObjectKeys = articleFormData.uploadedObjectKeys;

          runner.setLoadingLabel('글 저장 중');
          await createArticleMutation.mutateAsync({
            body: { ...articleFormData.body, hikingId },
          });

          setActiveArticleForm(null);
          invalidateQueryKeys([
            apiQueryKeys.feed(),
            apiQueryKeys.hikingArticles(hikingId),
            apiQueryKeys.notifications(),
          ]);
          refreshRoute();
        } catch (error) {
          if (uploadedObjectKeys.length > 0) {
            runner.setLoadingLabel('업로드 파일 정리 중');
            await deleteUploadedArticleMedia(uploadedObjectKeys);
          }

          throw new Error(error instanceof Error ? error.message : '글을 저장하지 못했습니다.');
        }
      },
    );
  };

  const updateArticle = (articleId: ArticleId, values: ArticleFormValues) => {
    if (values.media.length === 0) {
      runner.setError(`article-edit-${articleId}`, '글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runner.runMutation(
      {
        errorKey: `article-edit-${articleId}`,
        loadingLabel: '글 저장 중',
        singleFlightKey: `article-update-${articleId}`,
      },
      async () => {
        let uploadedObjectKeys: string[] = [];
        try {
          const articleFormData = await createArticleFormData(values, {
            articleId,
          });
          uploadedObjectKeys = articleFormData.uploadedObjectKeys;

          runner.setLoadingLabel('글 저장 중');
          const result = await updateArticleMutation.mutateAsync({
            body: articleFormData.body,
            params: { path: { articleId } },
          });

          if (!result) {
            throw new Error('글을 저장하지 못했습니다.');
          }

          const snapshot = result as unknown as { article: Article; comments: readonly Comment[] };

          setArticlesByHikingId((currentArticles) => {
            const hikingArticles = currentArticles[snapshot.article.hikingId];

            if (!hikingArticles) {
              return currentArticles;
            }

            return {
              ...currentArticles,
              [snapshot.article.hikingId]: hikingArticles.map((article) =>
                article.id === snapshot.article.id ? snapshot.article : article,
              ),
            };
          });
          setCommentsByHikingId((currentComments) => {
            const hikingComments = currentComments[snapshot.article.hikingId];

            if (!hikingComments) {
              return currentComments;
            }

            return {
              ...currentComments,
              [snapshot.article.hikingId]: [
                ...hikingComments.filter((comment) => comment.articleId !== snapshot.article.id),
                ...snapshot.comments,
              ],
            };
          });
          setActiveArticleForm(null);
          invalidateQueryKeys([
            apiQueryKeys.articleDetail(articleId),
            apiQueryKeys.hikingArticles(snapshot.article.hikingId),
          ]);
        } catch (error) {
          if (uploadedObjectKeys.length > 0) {
            runner.setLoadingLabel('업로드 파일 정리 중');
            await deleteUploadedArticleMedia(uploadedObjectKeys);
          }

          throw new Error(error instanceof Error ? error.message : '글을 저장하지 못했습니다.');
        }
      },
    );
  };

  return {
    activeArticleSubmitting,
    closeActiveArticleForm,
    createArticle,
    updateArticle,
  };
}
