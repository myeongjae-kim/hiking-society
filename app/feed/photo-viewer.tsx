'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { PointerEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import type { ArticlePhoto } from '@/core/article/domain';

type PhotoViewerProps = {
  articleId: string;
  authorName: string;
  photos: readonly ArticlePhoto[];
};

function getWrappedIndex(index: number, length: number) {
  return (index + length) % length;
}

export function PhotoViewer({ articleId, authorName, photos }: PhotoViewerProps) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasMultiplePhotos = photos.length > 1;
  const selectedPhoto = photos[selectedIndex] ?? photos[0];

  const showPhoto = useCallback(
    (index: number) => {
      setSelectedIndex(getWrappedIndex(index, photos.length));
    },
    [photos.length],
  );

  const showPreviousPhoto = useCallback(() => {
    showPhoto(selectedIndex - 1);
  }, [selectedIndex, showPhoto]);

  const showNextPhoto = useCallback(() => {
    showPhoto(selectedIndex + 1);
  }, [selectedIndex, showPhoto]);

  const closeOnBackdropPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target;

    if (target instanceof Element && !target.closest('[data-photo-modal-surface]')) {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open || !hasMultiplePhotos) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPreviousPhoto();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNextPhoto();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasMultiplePhotos, open, showNextPhoto, showPreviousPhoto]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">
        {photos.map((photo, index) => (
          <figure
            className="m-0 min-w-0 border border-[var(--overlay0)] bg-[var(--surface0)]"
            key={`${articleId}-${photo.order}`}
          >
            <Dialog.Trigger asChild>
              <button
                className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                onClick={() => {
                  setSelectedIndex(index);
                }}
                type="button"
              >
                <img
                  alt={`${authorName}의 산행 사진 ${photo.order}`}
                  className="block aspect-4/3 w-full object-cover transition-[filter] group-hover:brightness-110"
                  src={photo.url}
                />
              </button>
            </Dialog.Trigger>
            <figcaption className="px-2 py-1 font-mono text-[0.8125rem] leading-snug text-[var(--subtext0)]">
              photo {photo.order}/{photos.length} order={photo.order}
            </figcaption>
          </figure>
        ))}
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--background0)_86%,black)]" />
        <Dialog.Content
          aria-describedby={`photo-viewer-description-${articleId}`}
          className="fixed inset-0 z-50 grid grid-rows-[auto_1fr_auto] gap-3 p-3 text-[var(--foreground0)] outline-none sm:p-5"
          onPointerDown={closeOnBackdropPointerDown}
        >
          <Dialog.Title className="sr-only">{authorName}의 산행 사진</Dialog.Title>
          <Dialog.Description className="sr-only" id={`photo-viewer-description-${articleId}`}>
            좌우 화살표로 사진을 이동하고 Escape 키로 닫을 수 있습니다.
          </Dialog.Description>

          <div
            className="flex items-center justify-between gap-3 font-mono text-sm"
            data-photo-modal-surface
          >
            <span className="border border-[var(--overlay0)] bg-[var(--surface0)] px-2 py-1">
              article.photo {articleId}
            </span>
            <Dialog.Close asChild>
              <button
                aria-label="사진 닫기"
                className="grid size-10 place-items-center border border-[var(--overlay0)] bg-[var(--surface0)] text-2xl leading-none text-[var(--foreground0)] hover:bg-[var(--surface1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                type="button"
              >
                ×
              </button>
            </Dialog.Close>
          </div>

          <div className="grid min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            {hasMultiplePhotos ? (
              <button
                aria-label="이전 사진"
                className="grid size-11 place-items-center border border-[var(--overlay0)] bg-[var(--surface0)] font-mono text-2xl text-[var(--foreground0)] hover:bg-[var(--surface1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)] sm:size-14"
                data-photo-modal-surface
                onClick={showPreviousPhoto}
                type="button"
              >
                ←
              </button>
            ) : (
              <span aria-hidden="true" className="size-0 sm:size-14" />
            )}

            <div className="grid min-h-0 place-items-center" data-photo-modal-surface>
              <img
                alt={`${authorName}의 산행 사진 ${selectedPhoto.order}`}
                className="max-h-[calc(100svh-10rem)] max-w-full border border-[var(--overlay0)] bg-[var(--surface0)] object-contain"
                src={selectedPhoto.url}
              />
            </div>

            {hasMultiplePhotos ? (
              <button
                aria-label="다음 사진"
                className="grid size-11 place-items-center border border-[var(--overlay0)] bg-[var(--surface0)] font-mono text-2xl text-[var(--foreground0)] hover:bg-[var(--surface1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)] sm:size-14"
                data-photo-modal-surface
                onClick={showNextPhoto}
                type="button"
              >
                →
              </button>
            ) : (
              <span aria-hidden="true" className="size-0 sm:size-14" />
            )}
          </div>

          <p
            className="m-0 justify-self-center border border-[var(--overlay0)] bg-[var(--surface0)] px-2 py-1 font-mono text-sm text-[var(--subtext0)]"
            data-photo-modal-surface
          >
            photo {selectedIndex + 1}/{photos.length} order={selectedPhoto.order}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
