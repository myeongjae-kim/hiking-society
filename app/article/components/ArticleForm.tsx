'use client';

import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { FieldLabel } from '@/app/common/components/FieldLabel';
import { LoadingOverlay } from '@/app/common/components/LoadingOverlay';
import {
  boxBorderClassName,
  fieldClassName,
  hiddenFileInputClassName,
  inlineButtonClassName,
} from '@/app/common/components/styles';
import type { Article } from '@/core/article/domain';

import type { ArticleFormValues, DraftMedia } from './articleFormTypes';
import {
  createCompressedDraftMedia,
  getArticleFormDefaults,
  getDuplicateMediaKeys,
  getMediaDuplicateKey,
  revokeDraftMediaUrl,
} from './articleFormUtils';
import { MediaViewer } from './MediaViewer';

type ArticleFormProps = {
  article?: Article;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: ArticleFormValues) => void;
  submitting?: boolean;
};

function reorderDraftMedias(media: readonly DraftMedia[]) {
  return media.map((media, index) => ({
    ...media,
    order: index + 1,
  }));
}

export function ArticleForm({
  article,
  error,
  onCancel,
  onSubmit,
  submitting = false,
}: ArticleFormProps) {
  const [values, setValues] = useState<ArticleFormValues>(() => getArticleFormDefaults(article));
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('사진이나 동영상 처리 중');
  const [draggedMediaOrder, setDraggedMediaOrder] = useState<number | null>(null);
  const dragPreviewRef = useRef<HTMLElement | null>(null);
  const valuesRef = useRef(values);
  const disabled = isProcessingMedia || submitting;

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    return () => {
      dragPreviewRef.current?.remove();
      dragPreviewRef.current = null;
      valuesRef.current.media.forEach(revokeDraftMediaUrl);
    };
  }, []);

  const removeMediaDragPreview = () => {
    dragPreviewRef.current?.remove();
    dragPreviewRef.current = null;
  };

  const setMediaDragPreview = (event: DragEvent<HTMLLIElement>) => {
    removeMediaDragPreview();

    const sourceCard = event.currentTarget;
    const sourceRect = sourceCard.getBoundingClientRect();
    const previewCard = sourceCard.cloneNode(true) as HTMLElement;
    const offsetX = event.clientX - sourceRect.left;
    const offsetY = event.clientY - sourceRect.top;

    previewCard.setAttribute('aria-hidden', 'true');
    previewCard.style.width = `${sourceRect.width}px`;
    previewCard.style.position = 'fixed';
    previewCard.style.top = '-10000px';
    previewCard.style.left = '-10000px';
    previewCard.style.pointerEvents = 'none';
    previewCard.style.opacity = '0.94';
    previewCard.style.boxShadow = '0 18px 48px color-mix(in_srgb, var(--background0) 72%, black)';
    previewCard.style.zIndex = '9999';

    document.body.append(previewCard);
    dragPreviewRef.current = previewCard;
    event.dataTransfer.setDragImage(previewCard, offsetX, offsetY);
  };

  const handleMediaChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    input.value = '';

    setMediaError(null);
    setIsProcessingMedia(true);

    try {
      const settledMedias = await Promise.allSettled(
        files.map(async (file, index) => {
          try {
            return await createCompressedDraftMedia(file, index + 1, (progress) => {
              setProcessingLabel(
                `${file.name} 변환 중 ${Math.round(Math.max(0, Math.min(progress, 1)) * 100)}%`,
              );
            });
          } catch (error) {
            throw new Error(
              error instanceof Error
                ? `${file.name}: ${error.message}`
                : `${file.name}: 사진이나 동영상을 변환하지 못했습니다.`,
            );
          }
        }),
      );
      const compressedMedias = settledMedias.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      );
      const failedFileNames = settledMedias.flatMap((result) =>
        result.status === 'rejected' && result.reason instanceof Error
          ? [result.reason.message]
          : [],
      );

      if (failedFileNames.length > 0) {
        setMediaError(failedFileNames.join(' '));
      }

      if (compressedMedias.length === 0) {
        return;
      }

      setValues((currentValues) => {
        const appendedMedias = [
          ...currentValues.media,
          ...compressedMedias.map((media, index) => ({
            ...media,
            order: currentValues.media.length + index + 1,
          })),
        ];

        return {
          ...currentValues,
          media: reorderDraftMedias(appendedMedias),
        };
      });
    } finally {
      setProcessingLabel('사진이나 동영상 처리 중');
      setIsProcessingMedia(false);
    }
  };

  const moveMedia = (fromOrder: number, toOrder: number) => {
    if (fromOrder === toOrder) {
      return;
    }

    setValues((currentValues) => {
      const fromIndex = currentValues.media.findIndex((media) => media.order === fromOrder);
      const toIndex = currentValues.media.findIndex((media) => media.order === toOrder);

      if (fromIndex === -1 || toIndex === -1) {
        return currentValues;
      }

      const reorderedMedias = [...currentValues.media];
      const [movedMedia] = reorderedMedias.splice(fromIndex, 1);

      if (!movedMedia) {
        return currentValues;
      }

      reorderedMedias.splice(toIndex, 0, movedMedia);

      return {
        ...currentValues,
        media: reorderDraftMedias(reorderedMedias),
      };
    });
  };

  const handleMediaDragStart = (event: DragEvent<HTMLLIElement>, order: number) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(order));
    setMediaDragPreview(event);
    setDraggedMediaOrder(order);
  };

  const handleMediaDragOver = (event: DragEvent<HTMLLIElement>, order: number) => {
    if (draggedMediaOrder === null || draggedMediaOrder === order) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleMediaDrop = (event: DragEvent<HTMLLIElement>, order: number) => {
    event.preventDefault();

    const transferOrder = Number(event.dataTransfer.getData('text/plain'));
    const fromOrder = draggedMediaOrder ?? transferOrder;

    if (Number.isFinite(fromOrder)) {
      moveMedia(fromOrder, order);
    }

    setDraggedMediaOrder(null);
    removeMediaDragPreview();
  };

  const removeMedia = (order: number) => {
    setValues((currentValues) => ({
      ...currentValues,
      media: currentValues.media
        .filter((media) => {
          const keepMedia = media.order !== order;

          if (!keepMedia) {
            revokeDraftMediaUrl(media);
          }

          return keepMedia;
        })
        .map((media, index) => ({
          ...media,
          order: index + 1,
        })),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    onSubmit(values);
  };

  const handleCancel = () => {
    values.media.forEach(revokeDraftMediaUrl);
    onCancel();
  };

  const duplicateMediaKeys = getDuplicateMediaKeys(values.media);

  return (
    <>
      <form
        className={`grid gap-4 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
        box-="round"
        onSubmit={handleSubmit}
      >
        <Command>{article ? `article.edit ${article.id}` : 'article.new'}</Command>
        <FieldLabel label="사진이나 동영상">
          <label
            className={`${inlineButtonClassName} ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
          >
            사진이나 동영상 선택
            <input
              accept="image/*,.heic,.heif,image/heic,image/heif,video/*"
              className={hiddenFileInputClassName}
              disabled={disabled}
              multiple
              onChange={handleMediaChange}
              type="file"
            />
          </label>
        </FieldLabel>
        {mediaError ? <p className="m-0 text-sm text-[var(--red)]">{mediaError}</p> : null}
        {values.media.length > 0 ? (
          <ol className="m-0 flex list-none flex-wrap gap-3 p-0">
            {values.media.map((media: DraftMedia) => {
              const duplicateKey = getMediaDuplicateKey(media);
              const isDuplicate = duplicateKey !== null && duplicateMediaKeys.has(duplicateKey);
              const isDragged = draggedMediaOrder === media.order;
              const canMoveUp = media.order > 1;
              const canMoveDown = media.order < values.media.length;

              return (
                <li
                  aria-label={`선택한 게시글 사진이나 동영상 ${media.order}번째`}
                  className={`grid w-full min-w-0 cursor-grab overflow-hidden bg-[var(--background0)] transition-[background-color,border-color,opacity] active:cursor-grabbing sm:w-[16rem] ${
                    isDuplicate
                      ? 'border-2 border-[var(--peach)]'
                      : 'border border-[var(--overlay0)]'
                  } ${
                    isDragged
                      ? '!border-[var(--blue)] !bg-[var(--surface1)] opacity-70'
                      : 'hover:border-[var(--blue)]'
                  }`}
                  draggable
                  key={`${media.fileName}-${media.order}`}
                  onDragEnd={() => {
                    setDraggedMediaOrder(null);
                    removeMediaDragPreview();
                  }}
                  onDragOver={(event) => handleMediaDragOver(event, media.order)}
                  onDragStart={(event) => handleMediaDragStart(event, media.order)}
                  onDrop={(event) => handleMediaDrop(event, media.order)}
                >
                  <MediaViewer
                    articleId={article?.id ?? 'draft'}
                    authorName="선택한 게시글"
                    initialIndex={media.order - 1}
                    media={values.media}
                    trigger={
                      <span className="relative block">
                        <img
                          alt={`선택한 게시글 사진이나 동영상 ${media.order}`}
                          className="aspect-4/3 w-full border-b border-[var(--overlay0)] bg-[var(--background0)] object-contain transition-[filter] group-hover:brightness-110"
                          draggable={false}
                          src={media.thumbnailUrl ?? media.url}
                        />
                        {media.mediaType === 'video' ? (
                          <span className="absolute right-2 bottom-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-1.5 py-0.5 font-mono text-xs text-[var(--foreground0)]">
                            video
                          </span>
                        ) : null}
                      </span>
                    }
                    triggerClassName="group block h-auto w-full appearance-none !border-0 !bg-transparent !bg-none p-0 text-left leading-none !shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                    viewerCommand="article.media.preview"
                    viewerLabel="선택한 게시글 사진이나 동영상"
                  />
                  <div className="grid gap-2 px-3 py-2">
                    <span className="min-w-0 font-mono text-sm [overflow-wrap:anywhere] text-[var(--foreground1)]">
                      order={media.order} {media.fileName}
                    </span>
                    {isDuplicate ? (
                      <span className="text-sm leading-[1.35] text-[var(--peach)]">
                        동일한 사진이나 동영상이 선택되었습니다.
                      </span>
                    ) : null}
                    <div className="grid grid-cols-3 gap-2">
                      <ActionButton
                        disabled={!canMoveUp}
                        onClick={() => moveMedia(media.order, media.order - 1)}
                      >
                        위로
                      </ActionButton>
                      <ActionButton
                        disabled={!canMoveDown}
                        onClick={() => moveMedia(media.order, media.order + 1)}
                      >
                        아래로
                      </ActionButton>
                      <ActionButton onClick={() => removeMedia(media.order)} tone="danger">
                        제거
                      </ActionButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="m-0 text-sm text-[var(--subtext0)]">
            사진이나 동영상을 1개 이상 선택해야 합니다.
          </p>
        )}
        <FieldLabel label="본문">
          <textarea
            className={`${fieldClassName} min-h-[8rem] resize-y`}
            onChange={(event) => {
              const body = event.currentTarget.value;

              setValues((currentValues) => ({
                ...currentValues,
                body,
              }));
            }}
            required
            value={values.body}
          />
        </FieldLabel>
        {error ? <p className="m-0 text-sm text-[var(--red)]">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <ActionButton disabled={submitting} onClick={handleCancel}>
            취소
          </ActionButton>
          <ActionButton disabled={disabled} type="submit">
            저장
          </ActionButton>
        </div>
      </form>
      <LoadingOverlay label={processingLabel} open={isProcessingMedia} />
    </>
  );
}
