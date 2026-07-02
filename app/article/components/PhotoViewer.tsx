'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { MouseEvent, PointerEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ArticlePhoto } from '@/core/article/domain';

type PhotoViewerProps = {
  articleId: string;
  authorName: string;
  photos: readonly ArticlePhoto[];
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
};

const photoControlClassName =
  'grid place-items-center border border-[var(--overlay0)] bg-[var(--surface0)] !bg-none p-0 font-normal leading-none text-[var(--foreground0)] no-underline hover:bg-[var(--surface1)] active:bg-[var(--surface2)] active:text-[var(--foreground0)] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]';
const swipeThresholdPx = 48;
const horizontalSwipeRatio = 1.25;
const dragFeedbackMaxOffsetPx = 96;
const dragFeedbackMinOpacity = 0.86;
const dragClickSuppressThresholdPx = 8;

function getWrappedIndex(index: number, length: number) {
  return (index + length) % length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function PhotoViewer({ articleId, authorName, photos }: PhotoViewerProps) {
  const dragStateRef = useRef<DragState | null>(null);
  const isPinchGestureRef = useRef(false);
  const selectedPhotoImageRef = useRef<HTMLImageElement>(null);
  const shouldSuppressStageClickRef = useRef(false);
  const touchPointerIdsRef = useRef<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasMultiplePhotos = photos.length > 1;
  const selectedPhoto = photos[selectedIndex] ?? photos[0];

  const showPreviousPhoto = useCallback(() => {
    setSelectedIndex((currentIndex) => getWrappedIndex(currentIndex - 1, photos.length));
  }, [photos.length]);

  const showNextPhoto = useCallback(() => {
    setSelectedIndex((currentIndex) => getWrappedIndex(currentIndex + 1, photos.length));
  }, [photos.length]);

  const resetPhotoDragFeedback = useCallback((withTransition: boolean) => {
    const selectedPhotoImage = selectedPhotoImageRef.current;

    if (!selectedPhotoImage) {
      return;
    }

    const canAnimate =
      withTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    selectedPhotoImage.style.transition = canAnimate
      ? 'transform 160ms ease-out, opacity 160ms ease-out'
      : '';
    selectedPhotoImage.style.transform = '';
    selectedPhotoImage.style.opacity = '';

    if (!canAnimate) {
      return;
    }

    window.setTimeout(() => {
      if (selectedPhotoImageRef.current !== selectedPhotoImage) {
        return;
      }

      selectedPhotoImage.style.transition = '';
    }, 180);
  }, []);

  const updatePhotoDragFeedback = useCallback((deltaX: number) => {
    const selectedPhotoImage = selectedPhotoImageRef.current;

    if (!selectedPhotoImage) {
      return;
    }

    const offsetX = clamp(deltaX, -dragFeedbackMaxOffsetPx, dragFeedbackMaxOffsetPx);
    const dragProgress = Math.min(Math.abs(offsetX) / dragFeedbackMaxOffsetPx, 1);
    const opacity = 1 - (1 - dragFeedbackMinOpacity) * dragProgress;

    selectedPhotoImage.style.transition = '';
    selectedPhotoImage.style.transform = `translateX(${offsetX}px)`;
    selectedPhotoImage.style.opacity = String(opacity);
  }, []);

  const startPhotoDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!hasMultiplePhotos) {
        return;
      }

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      if (event.pointerType && !['mouse', 'pen', 'touch'].includes(event.pointerType)) {
        return;
      }

      if (event.pointerType === 'touch') {
        touchPointerIdsRef.current.add(event.pointerId);

        if (touchPointerIdsRef.current.size > 1) {
          const dragState = dragStateRef.current;

          isPinchGestureRef.current = true;
          shouldSuppressStageClickRef.current = true;
          dragStateRef.current = null;
          resetPhotoDragFeedback(false);

          if (dragState && event.currentTarget.hasPointerCapture(dragState.pointerId)) {
            event.currentTarget.releasePointerCapture(dragState.pointerId);
          }

          return;
        }
      }

      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
      shouldSuppressStageClickRef.current = false;
      resetPhotoDragFeedback(false);

      if (event.pointerType !== 'touch') {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [hasMultiplePhotos, resetPhotoDragFeedback],
  );

  const resetPhotoDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>, withTransition = true) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (event.pointerType === 'touch') {
        touchPointerIdsRef.current.delete(event.pointerId);

        if (touchPointerIdsRef.current.size === 0) {
          isPinchGestureRef.current = false;
        }
      }

      dragStateRef.current = null;
      resetPhotoDragFeedback(withTransition);
    },
    [resetPhotoDragFeedback],
  );

  const updatePhotoDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;

      if (event.pointerType === 'touch' && isPinchGestureRef.current) {
        return;
      }

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      if (
        Math.abs(deltaX) >= dragClickSuppressThresholdPx ||
        Math.abs(deltaY) >= dragClickSuppressThresholdPx
      ) {
        shouldSuppressStageClickRef.current = true;
      }

      updatePhotoDragFeedback(deltaX);
    },
    [updatePhotoDragFeedback],
  );

  const finishPhotoDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;
      const wasPinchGesture =
        event.pointerType === 'touch' &&
        (isPinchGestureRef.current || touchPointerIdsRef.current.size > 1);

      if (event.pointerType === 'touch') {
        touchPointerIdsRef.current.delete(event.pointerId);

        if (touchPointerIdsRef.current.size === 0) {
          isPinchGestureRef.current = false;
        }
      }

      if (wasPinchGesture) {
        dragStateRef.current = null;
        resetPhotoDragFeedback(false);
        return;
      }

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const isSwipe =
        absDeltaX >= swipeThresholdPx && absDeltaX >= absDeltaY * horizontalSwipeRatio;

      if (absDeltaX >= dragClickSuppressThresholdPx || absDeltaY >= dragClickSuppressThresholdPx) {
        shouldSuppressStageClickRef.current = true;
      }

      resetPhotoDrag(event, !isSwipe);

      if (!isSwipe) {
        return;
      }

      event.preventDefault();

      if (deltaX > 0) {
        showPreviousPhoto();
        return;
      }

      showNextPhoto();
    },
    [resetPhotoDrag, resetPhotoDragFeedback, showNextPhoto, showPreviousPhoto],
  );

  const handlePhotoStageClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!shouldSuppressStageClickRef.current) {
      if (event.target === selectedPhotoImageRef.current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    shouldSuppressStageClickRef.current = false;
  }, []);

  const closeOnBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;

    if (target instanceof Element && !target.closest('[data-photo-modal-surface]')) {
      event.preventDefault();
      event.stopPropagation();
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
            className="m-0 min-w-0 overflow-hidden border border-[var(--overlay0)] bg-[var(--surface0)]"
            key={`${articleId}-${photo.order}`}
          >
            <Dialog.Trigger asChild>
              <button
                className="group block h-auto w-full appearance-none bg-transparent p-0 text-left leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
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
              photo {photo.order}/{photos.length}
            </figcaption>
          </figure>
        ))}
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--background0)_86%,black)]" />
        <Dialog.Content
          aria-describedby={`photo-viewer-description-${articleId}`}
          className="fixed inset-0 z-50 grid grid-rows-[auto_1fr_auto] gap-3 p-3 text-[var(--foreground0)] outline-none sm:p-5"
          onClick={closeOnBackdropClick}
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
                className={`${photoControlClassName} !size-10 text-2xl`}
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
                className={`${photoControlClassName} !size-11 font-mono text-2xl sm:!size-14`}
                data-photo-modal-surface
                onClick={showPreviousPhoto}
                type="button"
              >
                ←
              </button>
            ) : (
              <span aria-hidden="true" className="size-0 sm:size-14" />
            )}

            <div
              className="grid h-full min-h-0 w-full [touch-action:pan-y_pinch-zoom] place-items-center select-none"
              data-photo-modal-surface
              onClick={handlePhotoStageClick}
              onPointerCancel={resetPhotoDrag}
              onPointerDown={startPhotoDrag}
              onPointerMove={updatePhotoDrag}
              onPointerUp={finishPhotoDrag}
            >
              <img
                alt={`${authorName}의 산행 사진 ${selectedPhoto.order}`}
                className="max-h-[calc(100svh-10rem)] max-w-full border border-[var(--overlay0)] bg-[var(--surface0)] object-contain will-change-transform select-none"
                draggable={false}
                ref={selectedPhotoImageRef}
                src={selectedPhoto.url}
              />
            </div>

            {hasMultiplePhotos ? (
              <button
                aria-label="다음 사진"
                className={`${photoControlClassName} !size-11 font-mono text-2xl sm:!size-14`}
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
            photo {selectedIndex + 1}/{photos.length}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
