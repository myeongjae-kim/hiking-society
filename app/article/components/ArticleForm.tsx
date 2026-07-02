'use client';

import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { useRef, useState } from 'react';

import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { FieldLabel } from '@/app/common/components/FieldLabel';
import {
  boxBorderClassName,
  fieldClassName,
  hiddenFileInputClassName,
  inlineButtonClassName,
} from '@/app/common/components/styles';
import type { Article } from '@/core/article/domain';

import type { ArticleFormValues, DraftPhoto } from './articleFormTypes';
import {
  createCompressedDraftPhoto,
  getArticleFormDefaults,
  getDuplicatePhotoKeys,
  getPhotoDuplicateKey,
  revokeDraftPhotoUrl,
} from './articleFormUtils';

type ArticleFormProps = {
  article?: Article;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: ArticleFormValues) => void;
};

function reorderDraftPhotos(photos: readonly DraftPhoto[]) {
  return photos.map((photo, index) => ({
    ...photo,
    order: index + 1,
  }));
}

export function ArticleForm({ article, error, onCancel, onSubmit }: ArticleFormProps) {
  const [values, setValues] = useState<ArticleFormValues>(() => getArticleFormDefaults(article));
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [draggedPhotoOrder, setDraggedPhotoOrder] = useState<number | null>(null);
  const dragPreviewRef = useRef<HTMLElement | null>(null);

  const removePhotoDragPreview = () => {
    dragPreviewRef.current?.remove();
    dragPreviewRef.current = null;
  };

  const setPhotoDragPreview = (event: DragEvent<HTMLLIElement>) => {
    removePhotoDragPreview();

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

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    input.value = '';

    setPhotoError(null);

    const settledPhotos = await Promise.allSettled(
      files.map(async (file, index) => {
        try {
          return await createCompressedDraftPhoto(file, index + 1);
        } catch {
          throw new Error(`${file.name} 이미지를 변환하지 못했습니다.`);
        }
      }),
    );
    const compressedPhotos = settledPhotos.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    const failedFileNames = settledPhotos.flatMap((result) =>
      result.status === 'rejected' && result.reason instanceof Error ? [result.reason.message] : [],
    );

    if (failedFileNames.length > 0) {
      setPhotoError(failedFileNames.join(' '));
    }

    if (compressedPhotos.length === 0) {
      return;
    }

    setValues((currentValues) => {
      const appendedPhotos = [
        ...currentValues.photos,
        ...compressedPhotos.map((photo, index) => ({
          ...photo,
          order: currentValues.photos.length + index + 1,
        })),
      ];

      return {
        ...currentValues,
        photos: reorderDraftPhotos(appendedPhotos),
      };
    });
  };

  const movePhoto = (fromOrder: number, toOrder: number) => {
    if (fromOrder === toOrder) {
      return;
    }

    setValues((currentValues) => {
      const fromIndex = currentValues.photos.findIndex((photo) => photo.order === fromOrder);
      const toIndex = currentValues.photos.findIndex((photo) => photo.order === toOrder);

      if (fromIndex === -1 || toIndex === -1) {
        return currentValues;
      }

      const reorderedPhotos = [...currentValues.photos];
      const [movedPhoto] = reorderedPhotos.splice(fromIndex, 1);

      if (!movedPhoto) {
        return currentValues;
      }

      reorderedPhotos.splice(toIndex, 0, movedPhoto);

      return {
        ...currentValues,
        photos: reorderDraftPhotos(reorderedPhotos),
      };
    });
  };

  const handlePhotoDragStart = (event: DragEvent<HTMLLIElement>, order: number) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(order));
    setPhotoDragPreview(event);
    setDraggedPhotoOrder(order);
  };

  const handlePhotoDragOver = (event: DragEvent<HTMLLIElement>, order: number) => {
    if (draggedPhotoOrder === null || draggedPhotoOrder === order) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handlePhotoDrop = (event: DragEvent<HTMLLIElement>, order: number) => {
    event.preventDefault();

    const transferOrder = Number(event.dataTransfer.getData('text/plain'));
    const fromOrder = draggedPhotoOrder ?? transferOrder;

    if (Number.isFinite(fromOrder)) {
      movePhoto(fromOrder, order);
    }

    setDraggedPhotoOrder(null);
    removePhotoDragPreview();
  };

  const removePhoto = (order: number) => {
    setValues((currentValues) => ({
      ...currentValues,
      photos: currentValues.photos
        .filter((photo) => {
          const keepPhoto = photo.order !== order;

          if (!keepPhoto) {
            revokeDraftPhotoUrl(photo);
          }

          return keepPhoto;
        })
        .map((photo, index) => ({
          ...photo,
          order: index + 1,
        })),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  const handleCancel = () => {
    values.photos.forEach(revokeDraftPhotoUrl);
    onCancel();
  };

  const duplicatePhotoKeys = getDuplicatePhotoKeys(values.photos);

  return (
    <form
      className={`grid gap-4 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
      box-="round"
      onSubmit={handleSubmit}
    >
      <Command>{article ? `article.edit ${article.id}` : 'article.new'}</Command>
      <FieldLabel label="사진">
        <label className={inlineButtonClassName}>
          사진 선택
          <input
            accept="image/*,.heic,.heif,image/heic,image/heif"
            className={hiddenFileInputClassName}
            multiple
            onChange={handlePhotoChange}
            type="file"
          />
        </label>
      </FieldLabel>
      {photoError ? <p className="m-0 text-sm text-[var(--red)]">{photoError}</p> : null}
      {values.photos.length > 0 ? (
        <ol className="m-0 flex list-none flex-wrap gap-3 p-0">
          {values.photos.map((photo: DraftPhoto) => {
            const duplicateKey = getPhotoDuplicateKey(photo);
            const isDuplicate = duplicateKey !== null && duplicatePhotoKeys.has(duplicateKey);
            const isDragged = draggedPhotoOrder === photo.order;
            const canMoveUp = photo.order > 1;
            const canMoveDown = photo.order < values.photos.length;

            return (
              <li
                aria-label={`선택한 게시글 사진 ${photo.order}번째`}
                className={`grid w-full min-w-0 cursor-grab overflow-hidden bg-[var(--background0)] transition-[background-color,border-color,opacity] active:cursor-grabbing sm:w-[16rem] ${
                  isDuplicate ? 'border-2 border-[var(--peach)]' : 'border border-[var(--overlay0)]'
                } ${
                  isDragged
                    ? '!border-[var(--blue)] !bg-[var(--surface1)] opacity-70'
                    : 'hover:border-[var(--blue)]'
                }`}
                draggable
                key={`${photo.fileName}-${photo.order}`}
                onDragEnd={() => {
                  setDraggedPhotoOrder(null);
                  removePhotoDragPreview();
                }}
                onDragOver={(event) => handlePhotoDragOver(event, photo.order)}
                onDragStart={(event) => handlePhotoDragStart(event, photo.order)}
                onDrop={(event) => handlePhotoDrop(event, photo.order)}
              >
                <img
                  alt={`선택한 게시글 사진 ${photo.order}`}
                  className="aspect-4/3 w-full border-b border-[var(--overlay0)] bg-[var(--background0)] object-contain"
                  src={photo.url}
                />
                <div className="grid gap-2 px-3 py-2">
                  <span className="min-w-0 font-mono text-sm [overflow-wrap:anywhere] text-[var(--foreground1)]">
                    order={photo.order} {photo.fileName}
                  </span>
                  {isDuplicate ? (
                    <span className="text-sm leading-[1.35] text-[var(--peach)]">
                      동일한 사진이 선택되었습니다.
                    </span>
                  ) : null}
                  <div className="grid grid-cols-3 gap-2">
                    <ActionButton
                      disabled={!canMoveUp}
                      onClick={() => movePhoto(photo.order, photo.order - 1)}
                    >
                      위로
                    </ActionButton>
                    <ActionButton
                      disabled={!canMoveDown}
                      onClick={() => movePhoto(photo.order, photo.order + 1)}
                    >
                      아래로
                    </ActionButton>
                    <ActionButton onClick={() => removePhoto(photo.order)} tone="danger">
                      제거
                    </ActionButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="m-0 text-sm text-[var(--subtext0)]">사진을 1개 이상 선택해야 합니다.</p>
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
        <ActionButton onClick={handleCancel}>취소</ActionButton>
        <ActionButton type="submit">저장</ActionButton>
      </div>
    </form>
  );
}
