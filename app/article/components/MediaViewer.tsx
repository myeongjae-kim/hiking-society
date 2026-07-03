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

type MediaTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

type GesturePointer = {
  x: number;
  y: number;
};

type PanGesture = {
  pointerId: number;
  startTranslateX: number;
  startTranslateY: number;
  startX: number;
  startY: number;
};

type PinchGesture = {
  startDistance: number;
  startScale: number;
};

const mediaControlClassName =
  'grid place-items-center border border-[var(--overlay0)] bg-[var(--surface0)] !bg-none p-0 font-normal leading-none text-[var(--foreground0)] no-underline hover:bg-[var(--surface1)] active:bg-[var(--surface2)] active:text-[var(--foreground0)] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]';
const mediaNavigationClickZoneRatio = 0.3;
const mediaMinScale = 1;
const mediaMaxScale = 4;
const mediaPanClickSuppressThresholdPx = 6;
const initialMediaTransform: MediaTransform = {
  scale: mediaMinScale,
  translateX: 0,
  translateY: 0,
};

function getWrappedIndex(index: number, length: number) {
  return (index + length) % length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPointerDistance(firstPointer: GesturePointer, secondPointer: GesturePointer) {
  return Math.hypot(firstPointer.x - secondPointer.x, firstPointer.y - secondPointer.y);
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
  const activePointersRef = useRef<Map<number, GesturePointer>>(new Map());
  const mediaTransformRef = useRef<MediaTransform>(initialMediaTransform);
  const panGestureRef = useRef<PanGesture | null>(null);
  const pinchGestureRef = useRef<PinchGesture | null>(null);
  const selectedMediaSurfaceRef = useRef<HTMLElement>(null);
  const shouldSuppressStageClickRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [isMediaGestureActive, setIsMediaGestureActive] = useState(false);
  const [mediaTransform, setMediaTransform] = useState<MediaTransform>(initialMediaTransform);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasMultipleMedia = media.length > 1;
  const selectedMedia = media[selectedIndex] ?? media[0];
  const selectedMediaIsVideo = selectedMedia.mediaType === 'video';
  const isMediaZoomed = mediaTransform.scale > mediaMinScale;
  const title = viewerLabel ?? `${authorName}의 산행 사진이나 동영상`;
  const descriptionId = `media-viewer-description-${viewerId}`;
  const displayCommand =
    viewerCommand ?? (viewerLabel ? 'profile.media' : `article.media ${articleId}`);
  const description = hasMultipleMedia
    ? '좌우 화살표 또는 화면 가장자리 클릭으로 사진이나 동영상을 이동하고 Escape 키로 닫을 수 있습니다.'
    : 'Escape 키로 닫을 수 있습니다.';

  const setMediaTransformState = useCallback((nextTransform: MediaTransform) => {
    const normalizedTransform =
      nextTransform.scale <= mediaMinScale
        ? initialMediaTransform
        : {
            scale: clamp(nextTransform.scale, mediaMinScale, mediaMaxScale),
            translateX: nextTransform.translateX,
            translateY: nextTransform.translateY,
          };

    mediaTransformRef.current = normalizedTransform;
    setMediaTransform(normalizedTransform);
  }, []);

  const resetMediaGesture = useCallback(() => {
    activePointersRef.current.clear();
    panGestureRef.current = null;
    pinchGestureRef.current = null;
    shouldSuppressStageClickRef.current = false;
    setIsMediaGestureActive(false);
    setMediaTransformState(initialMediaTransform);
  }, [setMediaTransformState]);

  const showPreviousMedia = useCallback(() => {
    resetMediaGesture();
    setSelectedIndex((currentIndex) => getWrappedIndex(currentIndex - 1, media.length));
  }, [media.length, resetMediaGesture]);

  const showNextMedia = useCallback(() => {
    resetMediaGesture();
    setSelectedIndex((currentIndex) => getWrappedIndex(currentIndex + 1, media.length));
  }, [media.length, resetMediaGesture]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (!nextOpen) {
        resetMediaGesture();
      }
    },
    [resetMediaGesture],
  );

  const handleMediaStageClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const selectedMediaSurface = selectedMediaSurfaceRef.current;
      const isSelectedMediaClick = selectedMediaSurface?.contains(event.target as Node) ?? false;

      if (shouldSuppressStageClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
        shouldSuppressStageClickRef.current = false;
        return;
      }

      if (selectedMediaIsVideo && isSelectedMediaClick) {
        return;
      }

      if (isSelectedMediaClick && isMediaZoomed) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (isSelectedMediaClick && hasMultipleMedia) {
        const clickPositionRatio = event.clientX / window.innerWidth;

        if (clickPositionRatio <= mediaNavigationClickZoneRatio) {
          event.preventDefault();
          event.stopPropagation();
          showPreviousMedia();
          return;
        }

        if (clickPositionRatio >= 1 - mediaNavigationClickZoneRatio) {
          event.preventDefault();
          event.stopPropagation();
          showNextMedia();
          return;
        }
      }

      if (isSelectedMediaClick) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    },
    [hasMultipleMedia, isMediaZoomed, selectedMediaIsVideo, showNextMedia, showPreviousMedia],
  );

  const startImageGesture = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (selectedMediaIsVideo) {
        return;
      }

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsMediaGestureActive(true);

      const activePointers = Array.from(activePointersRef.current.values());

      if (activePointers.length >= 2) {
        panGestureRef.current = null;
        pinchGestureRef.current = {
          startDistance: getPointerDistance(activePointers[0], activePointers[1]),
          startScale: mediaTransformRef.current.scale,
        };
        shouldSuppressStageClickRef.current = true;
        return;
      }

      if (mediaTransformRef.current.scale <= mediaMinScale) {
        return;
      }

      panGestureRef.current = {
        pointerId: event.pointerId,
        startTranslateX: mediaTransformRef.current.translateX,
        startTranslateY: mediaTransformRef.current.translateY,
        startX: event.clientX,
        startY: event.clientY,
      };
    },
    [selectedMediaIsVideo],
  );

  const updateImageGesture = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (selectedMediaIsVideo || !activePointersRef.current.has(event.pointerId)) {
        return;
      }

      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const activePointers = Array.from(activePointersRef.current.values());

      if (activePointers.length >= 2) {
        const pinchGesture = pinchGestureRef.current;

        if (!pinchGesture || pinchGesture.startDistance === 0) {
          return;
        }

        const nextScale = clamp(
          (pinchGesture.startScale * getPointerDistance(activePointers[0], activePointers[1])) /
            pinchGesture.startDistance,
          mediaMinScale,
          mediaMaxScale,
        );

        shouldSuppressStageClickRef.current = true;
        setMediaTransformState({
          scale: nextScale,
          translateX: mediaTransformRef.current.translateX,
          translateY: mediaTransformRef.current.translateY,
        });
        return;
      }

      const panGesture = panGestureRef.current;

      if (!panGesture || panGesture.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - panGesture.startX;
      const deltaY = event.clientY - panGesture.startY;

      if (
        Math.abs(deltaX) >= mediaPanClickSuppressThresholdPx ||
        Math.abs(deltaY) >= mediaPanClickSuppressThresholdPx
      ) {
        shouldSuppressStageClickRef.current = true;
      }

      setMediaTransformState({
        scale: mediaTransformRef.current.scale,
        translateX: panGesture.startTranslateX + deltaX,
        translateY: panGesture.startTranslateY + deltaY,
      });
    },
    [selectedMediaIsVideo, setMediaTransformState],
  );

  const finishImageGesture = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(event.pointerId)) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointersRef.current.delete(event.pointerId);

    const activePointers = Array.from(activePointersRef.current.entries());

    if (activePointers.length >= 2) {
      const [, firstPointer] = activePointers[0];
      const [, secondPointer] = activePointers[1];
      pinchGestureRef.current = {
        startDistance: getPointerDistance(firstPointer, secondPointer),
        startScale: mediaTransformRef.current.scale,
      };
      return;
    }

    pinchGestureRef.current = null;

    if (activePointers.length === 1 && mediaTransformRef.current.scale > mediaMinScale) {
      const [pointerId, pointer] = activePointers[0];
      panGestureRef.current = {
        pointerId,
        startTranslateX: mediaTransformRef.current.translateX,
        startTranslateY: mediaTransformRef.current.translateY,
        startX: pointer.x,
        startY: pointer.y,
      };
      return;
    }

    panGestureRef.current = null;
    setIsMediaGestureActive(false);
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
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <Dialog.Trigger asChild>
          <button
            className={triggerClassName}
            onClick={() => {
              resetMediaGesture();
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
                    resetMediaGesture();
                    setSelectedIndex(index);
                  }}
                  type="button"
                >
                  <span className="relative block">
                    <img
                      alt={`${authorName}의 산행 사진이나 동영상 ${item.order}`}
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
                aria-label="사진이나 동영상 닫기"
                className={`${mediaControlClassName} !size-10 text-2xl`}
                type="button"
              >
                ×
              </button>
            </Dialog.Close>
          </div>

          <div
            className={`grid min-h-0 items-center gap-2 ${
              selectedMediaIsVideo
                ? 'grid-cols-[auto_minmax(0,1fr)_auto]'
                : 'grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto]'
            }`}
          >
            {hasMultipleMedia ? (
              <button
                aria-label="이전 사진이나 동영상"
                className={`${mediaControlClassName} ${
                  selectedMediaIsVideo ? 'grid' : 'hidden sm:grid'
                } !size-11 font-mono text-2xl sm:!size-14`}
                data-media-modal-surface
                onClick={showPreviousMedia}
                type="button"
              >
                ←
              </button>
            ) : (
              <span aria-hidden="true" className="hidden sm:block sm:size-14" />
            )}

            <div
              className={`grid h-full min-h-0 w-full place-items-center select-none ${
                selectedMediaIsVideo ? '[touch-action:manipulation]' : '[touch-action:none]'
              }`}
              data-media-modal-surface
              onClick={handleMediaStageClick}
              onPointerCancel={finishImageGesture}
              onPointerDown={startImageGesture}
              onPointerMove={updateImageGesture}
              onPointerUp={finishImageGesture}
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
                  alt={`${authorName}의 산행 사진이나 동영상 ${selectedMedia.order}`}
                  className={`max-h-[calc(100svh-10rem)] max-w-full border border-[var(--overlay0)] bg-[var(--surface0)] object-contain will-change-transform select-none ${
                    isMediaZoomed ? (isMediaGestureActive ? 'cursor-grabbing' : 'cursor-grab') : ''
                  }`}
                  draggable={false}
                  ref={selectedMediaSurfaceRef as RefObject<HTMLImageElement>}
                  src={selectedMedia.url}
                  style={{
                    transform: `translate3d(${mediaTransform.translateX}px, ${mediaTransform.translateY}px, 0) scale(${mediaTransform.scale})`,
                  }}
                />
              )}
            </div>

            {hasMultipleMedia ? (
              <button
                aria-label="다음 사진이나 동영상"
                className={`${mediaControlClassName} ${
                  selectedMediaIsVideo ? 'grid' : 'hidden sm:grid'
                } !size-11 font-mono text-2xl sm:!size-14`}
                data-media-modal-surface
                onClick={showNextMedia}
                type="button"
              >
                →
              </button>
            ) : (
              <span aria-hidden="true" className="hidden sm:block sm:size-14" />
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
