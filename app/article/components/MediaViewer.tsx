'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { MouseEvent, PointerEvent, ReactNode, RefObject } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { photoDialogOverlayClassName } from '@/app/common/components/styles';
import type { ArticleMedia } from '@/core/article/domain';

type MediaViewerProps = {
  articleId: string;
  authorName: string;
  initialIndex?: number;
  media: readonly ArticleMedia[];
  thumbnailGridClassName?: string;
  trigger?: ReactNode;
  triggerClassName?: string;
  viewerCommand?: string;
  viewerLabel?: string;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
};

const mediaControlClassName =
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

export function MediaViewer({
  articleId,
  authorName,
  initialIndex = 0,
  media,
  thumbnailGridClassName = 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3',
  trigger,
  triggerClassName = 'inline-flex !h-auto appearance-none items-center justify-center overflow-hidden rounded-full !border-0 !bg-transparent !bg-none p-0 text-left leading-none !shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
  viewerCommand,
  viewerLabel,
}: MediaViewerProps) {
  const viewerId = useId();
  const dragStateRef = useRef<DragState | null>(null);
  const isPinchGestureRef = useRef(false);
  const selectedMediaSurfaceRef = useRef<HTMLElement>(null);
  const shouldSuppressStageClickRef = useRef(false);
  const touchPointerIdsRef = useRef<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasMultipleMedia = media.length > 1;
  const selectedMedia = media[selectedIndex] ?? media[0];
  const title = viewerLabel ?? `${authorName}의 산행 미디어`;
  const descriptionId = `media-viewer-description-${viewerId}`;
  const displayCommand =
    viewerCommand ?? (viewerLabel ? 'profile.media' : `article.media ${articleId}`);
  const description = hasMultipleMedia
    ? '좌우 화살표로 미디어를 이동하고 Escape 키로 닫을 수 있습니다.'
    : 'Escape 키로 닫을 수 있습니다.';

  const showPreviousMedia = useCallback(() => {
    setSelectedIndex((currentIndex) => getWrappedIndex(currentIndex - 1, media.length));
  }, [media.length]);

  const showNextMedia = useCallback(() => {
    setSelectedIndex((currentIndex) => getWrappedIndex(currentIndex + 1, media.length));
  }, [media.length]);

  const resetMediaDragFeedback = useCallback((withTransition: boolean) => {
    const selectedMediaSurface = selectedMediaSurfaceRef.current;

    if (!selectedMediaSurface) {
      return;
    }

    const canAnimate =
      withTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    selectedMediaSurface.style.transition = canAnimate
      ? 'transform 160ms ease-out, opacity 160ms ease-out'
      : '';
    selectedMediaSurface.style.transform = '';
    selectedMediaSurface.style.opacity = '';

    if (!canAnimate) {
      return;
    }

    window.setTimeout(() => {
      if (selectedMediaSurfaceRef.current !== selectedMediaSurface) {
        return;
      }

      selectedMediaSurface.style.transition = '';
    }, 180);
  }, []);

  const updateMediaDragFeedback = useCallback((deltaX: number) => {
    const selectedMediaSurface = selectedMediaSurfaceRef.current;

    if (!selectedMediaSurface) {
      return;
    }

    const offsetX = clamp(deltaX, -dragFeedbackMaxOffsetPx, dragFeedbackMaxOffsetPx);
    const dragProgress = Math.min(Math.abs(offsetX) / dragFeedbackMaxOffsetPx, 1);
    const opacity = 1 - (1 - dragFeedbackMinOpacity) * dragProgress;

    selectedMediaSurface.style.transition = '';
    selectedMediaSurface.style.transform = `translateX(${offsetX}px)`;
    selectedMediaSurface.style.opacity = String(opacity);
  }, []);

  const startMediaDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!hasMultipleMedia) {
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
          resetMediaDragFeedback(false);

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
      resetMediaDragFeedback(false);

      if (event.pointerType !== 'touch') {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [hasMultipleMedia, resetMediaDragFeedback],
  );

  const resetMediaDrag = useCallback(
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
      resetMediaDragFeedback(withTransition);
    },
    [resetMediaDragFeedback],
  );

  const updateMediaDrag = useCallback(
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

      updateMediaDragFeedback(deltaX);
    },
    [updateMediaDragFeedback],
  );

  const finishMediaDrag = useCallback(
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
        resetMediaDragFeedback(false);
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

      resetMediaDrag(event, !isSwipe);

      if (!isSwipe) {
        return;
      }

      event.preventDefault();

      if (deltaX > 0) {
        showPreviousMedia();
        return;
      }

      showNextMedia();
    },
    [resetMediaDrag, resetMediaDragFeedback, showNextMedia, showPreviousMedia],
  );

  const handleMediaStageClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!shouldSuppressStageClickRef.current) {
      if (event.target === selectedMediaSurfaceRef.current) {
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

    if (target instanceof Element && !target.closest('[data-media-modal-surface]')) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open || !hasMultipleMedia) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPreviousMedia();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNextMedia();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasMultipleMedia, open, showNextMedia, showPreviousMedia]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {trigger ? (
        <Dialog.Trigger asChild>
          <button
            className={triggerClassName}
            onClick={() => {
              setSelectedIndex(clamp(initialIndex, 0, Math.max(media.length - 1, 0)));
            }}
            type="button"
          >
            {trigger}
          </button>
        </Dialog.Trigger>
      ) : (
        <div className={thumbnailGridClassName}>
          {media.map((item, index) => (
            <figure
              className="m-0 min-w-0 overflow-hidden border border-[var(--overlay0)] bg-[var(--surface0)]"
              key={`${articleId}-${item.order}`}
            >
              <Dialog.Trigger asChild>
                <button
                  className="group block h-auto w-full appearance-none bg-transparent p-0 text-left leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                  onClick={() => {
                    setSelectedIndex(index);
                  }}
                  type="button"
                >
                  <span className="relative block">
                    <img
                      alt={`${authorName}의 산행 미디어 ${item.order}`}
                      className="block aspect-4/3 w-full bg-[var(--background0)] object-contain transition-[filter] group-hover:brightness-110"
                      src={item.thumbnailUrl ?? item.url}
                    />
                    {item.mediaType === 'video' ? (
                      <span className="absolute right-2 bottom-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-1.5 py-0.5 font-mono text-xs text-[var(--foreground0)]">
                        video
                      </span>
                    ) : null}
                  </span>
                </button>
              </Dialog.Trigger>
              <figcaption className="px-2 py-1 font-mono text-[0.8125rem] leading-snug text-[var(--subtext0)]">
                {item.mediaType} {item.order}/{media.length}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <Dialog.Portal>
        <Dialog.Overlay className={photoDialogOverlayClassName} />
        <Dialog.Content
          aria-describedby={descriptionId}
          className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] gap-3 p-3 text-[var(--foreground0)] outline-none sm:p-5"
          onClick={closeOnBackdropClick}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only" id={descriptionId}>
            {description}
          </Dialog.Description>

          <div
            className="flex items-center justify-between gap-3 font-mono text-sm"
            data-media-modal-surface
          >
            <span className="border border-[var(--overlay0)] bg-[var(--surface0)] px-2 py-1">
              {displayCommand}
            </span>
            <Dialog.Close asChild>
              <button
                aria-label="미디어 닫기"
                className={`${mediaControlClassName} !size-10 text-2xl`}
                type="button"
              >
                ×
              </button>
            </Dialog.Close>
          </div>

          <div className="grid min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            {hasMultipleMedia ? (
              <button
                aria-label="이전 미디어"
                className={`${mediaControlClassName} !size-11 font-mono text-2xl sm:!size-14`}
                data-media-modal-surface
                onClick={showPreviousMedia}
                type="button"
              >
                ←
              </button>
            ) : (
              <span aria-hidden="true" className="size-0 sm:size-14" />
            )}

            <div
              className="grid h-full min-h-0 w-full [touch-action:pan-y_pinch-zoom] place-items-center select-none"
              data-media-modal-surface
              onClick={handleMediaStageClick}
              onPointerCancel={resetMediaDrag}
              onPointerDown={startMediaDrag}
              onPointerMove={updateMediaDrag}
              onPointerUp={finishMediaDrag}
            >
              {selectedMedia.mediaType === 'video' ? (
                <video
                  className="max-h-[calc(100svh-10rem)] max-w-full border border-[var(--overlay0)] bg-[var(--surface0)] will-change-transform select-none"
                  controls
                  playsInline
                  poster={selectedMedia.thumbnailUrl ?? undefined}
                  preload="metadata"
                  ref={selectedMediaSurfaceRef as RefObject<HTMLVideoElement>}
                  src={selectedMedia.url}
                />
              ) : (
                <img
                  alt={`${authorName}의 산행 미디어 ${selectedMedia.order}`}
                  className="max-h-[calc(100svh-10rem)] max-w-full border border-[var(--overlay0)] bg-[var(--surface0)] object-contain will-change-transform select-none"
                  draggable={false}
                  ref={selectedMediaSurfaceRef as RefObject<HTMLImageElement>}
                  src={selectedMedia.url}
                />
              )}
            </div>

            {hasMultipleMedia ? (
              <button
                aria-label="다음 미디어"
                className={`${mediaControlClassName} !size-11 font-mono text-2xl sm:!size-14`}
                data-media-modal-surface
                onClick={showNextMedia}
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
            data-media-modal-surface
          >
            {selectedMedia.mediaType} {selectedIndex + 1}/{media.length}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
