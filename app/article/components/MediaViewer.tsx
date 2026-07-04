'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { MouseEvent, PointerEvent, ReactNode, RefObject, TransitionEvent } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { photoDialogOverlayClassName } from '@/app/common/components/styles';
import type { ArticleMedia } from '@/core/article/domain';

type MediaViewerProps = {
  articleId: string;
  authorName: string;
  initialIndex?: number;
  inlineCarousel?: boolean;
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

type SwipeGesture = {
  axis: SwipeAxis | null;
  pointerId: number;
  startX: number;
  startY: number;
};

type SwipeAxis = 'horizontal' | 'vertical';

type SwipeOffset = {
  x: number;
  y: number;
};

type InlineMediaFrameProps = {
  authorName: string;
  media: ArticleMedia | null;
};

type InlineTransitionDirection = -1 | 1;

const mediaControlClassName =
  'grid place-items-center border border-[var(--overlay0)] bg-[var(--surface0)] !bg-none p-0 font-normal leading-none text-[var(--foreground0)] no-underline hover:bg-[var(--surface1)] active:bg-[var(--surface2)] active:text-[var(--foreground0)] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]';
const mediaNavigationClickZoneRatio = 0.3;
const mediaMinScale = 1;
const mediaMaxScale = 4;
const mediaPanClickSuppressThresholdPx = 6;
const mediaSwipeThresholdPx = 48;
const mediaHorizontalSwipeRatio = 1.25;
const mediaSwipePreviewMaxWidthRatio = 0.35;
const mediaSwipePreviewMaxHeightRatio = 0.35;
const initialMediaTransform: MediaTransform = {
  scale: mediaMinScale,
  translateX: 0,
  translateY: 0,
};
const initialSwipeOffset: SwipeOffset = {
  x: 0,
  y: 0,
};

function suppressNextClickTemporarily(suppressClickRef: { current: boolean }) {
  suppressClickRef.current = true;
  window.setTimeout(() => {
    suppressClickRef.current = false;
  }, 250);
}

function getWrappedIndex(index: number, length: number) {
  return (index + length) % length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeMetadataValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function formatMetadataDateTime(value: string | null | undefined) {
  return (
    normalizeMetadataValue(value)?.replace(/^(\d{4}):(\d{2}):(\d{2})(?=[ T]|$)/, '$1-$2-$3') ?? null
  );
}

function VideoPlayOverlay() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--surface0)_78%,transparent)] text-[var(--foreground0)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--background0)_45%,transparent),0_0.75rem_2rem_color-mix(in_srgb,var(--background0)_38%,transparent)] backdrop-blur-sm transition-transform duration-150 group-hover:scale-105 group-hover:bg-[color-mix(in_srgb,var(--surface1)_86%,transparent)]"
    >
      <span className="ml-1 size-0 border-y-[0.68rem] border-l-[1.05rem] border-y-transparent border-l-[var(--foreground0)]" />
    </span>
  );
}

function InlineMediaFrame({ authorName, media }: InlineMediaFrameProps) {
  if (!media) {
    return <span aria-hidden="true" className="block aspect-4/3 w-full bg-[var(--background0)]" />;
  }

  return (
    <span className="relative block min-w-0">
      <img
        alt={`${authorName}의 산행 사진이나 동영상 ${media.order}`}
        className="block aspect-4/3 w-full bg-[var(--background0)] object-contain transition-[filter] group-hover:brightness-110"
        draggable={false}
        src={media.thumbnailUrl ?? media.url}
      />
      {media.mediaType === 'video' ? (
        <>
          <VideoPlayOverlay />
          <span className="absolute right-2 bottom-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-1.5 py-0.5 font-mono text-xs text-[var(--foreground0)]">
            video
          </span>
        </>
      ) : null}
    </span>
  );
}

export function getMediaTakenTimeLabel(media: ArticleMedia) {
  if (media.mediaType !== 'image') {
    return null;
  }

  const dateTime = normalizeMetadataValue(media.metadata?.dateTime);

  if (!dateTime) {
    return null;
  }

  const match = dateTime.match(
    /^(?:(?:\d{4}[:/-]\d{2}[:/-]\d{2})[ T])?(\d{1,2}):(\d{2})(?::\d{2})?/,
  );

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getCameraLabel(media: ArticleMedia) {
  const make = normalizeMetadataValue(media.metadata?.make);
  const model = normalizeMetadataValue(media.metadata?.model);

  if (make && model) {
    return model.toLowerCase().includes(make.toLowerCase()) ? model : `${make} ${model}`;
  }

  return model ?? make;
}

function formatIso(value: string | null | undefined) {
  const normalized = normalizeMetadataValue(value);

  if (!normalized) {
    return null;
  }

  return normalized.toLowerCase().startsWith('iso')
    ? normalized.toUpperCase()
    : `ISO ${normalized}`;
}

function getExposureItems(media: ArticleMedia) {
  const shutterSpeed =
    normalizeMetadataValue(media.metadata?.exposureTime) ??
    normalizeMetadataValue(media.metadata?.shutterSpeedValue);

  return [
    normalizeMetadataValue(media.metadata?.fNumber),
    shutterSpeed,
    formatIso(media.metadata?.isoSpeedRatings),
  ].filter((value): value is string => Boolean(value));
}

function getMetadataPanelItems(media: ArticleMedia) {
  if (media.mediaType !== 'image' || !media.metadata) {
    return [];
  }

  const camera = getCameraLabel(media);
  const exposureItems = getExposureItems(media);
  const focalLength = normalizeMetadataValue(media.metadata.focalLengthIn35mmFilm);
  const dateTime = formatMetadataDateTime(media.metadata.dateTime);

  return [
    camera ? { label: 'camera', value: camera } : null,
    exposureItems.length > 0 ? { label: 'exposure', value: exposureItems.join(' · ') } : null,
    focalLength ? { label: 'lens', value: focalLength } : null,
    dateTime ? { label: 'taken', value: dateTime } : null,
  ].filter((item): item is { label: string; value: string } => item !== null);
}

function getPointerDistance(firstPointer: GesturePointer, secondPointer: GesturePointer) {
  return Math.hypot(firstPointer.x - secondPointer.x, firstPointer.y - secondPointer.y);
}

function getDominantSwipeAxis(deltaX: number, deltaY: number): SwipeAxis | null {
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  if (
    absDeltaX < mediaPanClickSuppressThresholdPx &&
    absDeltaY < mediaPanClickSuppressThresholdPx
  ) {
    return null;
  }

  return absDeltaX >= absDeltaY ? 'horizontal' : 'vertical';
}

export function MediaViewer({
  articleId,
  authorName,
  initialIndex = 0,
  inlineCarousel = false,
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
  const swipeOffsetRef = useRef<SwipeOffset>(initialSwipeOffset);
  const swipeGestureRef = useRef<SwipeGesture | null>(null);
  const inlineSwipeGestureRef = useRef<SwipeGesture | null>(null);
  const inlineTransitionDirectionRef = useRef<InlineTransitionDirection | null>(null);
  const shouldSuppressInlineClickRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [activeInlineIndex, setActiveInlineIndex] = useState(0);
  const [inlineSwipeOffset, setInlineSwipeOffset] = useState<SwipeOffset>(initialSwipeOffset);
  const [isInlineSwipeActive, setIsInlineSwipeActive] = useState(false);
  const [isMediaGestureActive, setIsMediaGestureActive] = useState(false);
  const [mediaTransform, setMediaTransform] = useState<MediaTransform>(initialMediaTransform);
  const [swipeOffset, setSwipeOffset] = useState<SwipeOffset>(initialSwipeOffset);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasMultipleMedia = media.length > 1;
  const normalizedActiveInlineIndex =
    media.length > 0 ? getWrappedIndex(activeInlineIndex, media.length) : 0;
  const activeInlineMedia = media[normalizedActiveInlineIndex] ?? media[0];
  const previousInlineMedia = hasMultipleMedia
    ? (media[getWrappedIndex(normalizedActiveInlineIndex - 1, media.length)] ?? null)
    : null;
  const nextInlineMedia = hasMultipleMedia
    ? (media[getWrappedIndex(normalizedActiveInlineIndex + 1, media.length)] ?? null)
    : null;
  const activeInlineTakenTime = getMediaTakenTimeLabel(activeInlineMedia);
  const canShowPreviousInlineMedia = hasMultipleMedia;
  const canShowNextInlineMedia = hasMultipleMedia;
  const selectedMedia = media[selectedIndex] ?? media[0];
  const selectedMediaIsVideo = selectedMedia.mediaType === 'video';
  const selectedVideoAspectRatio =
    selectedMediaIsVideo &&
    selectedMedia.width &&
    selectedMedia.height &&
    selectedMedia.width > 0 &&
    selectedMedia.height > 0
      ? selectedMedia.width / selectedMedia.height
      : null;
  const selectedMetadataItems = getMetadataPanelItems(selectedMedia);
  const isMediaZoomed = mediaTransform.scale > mediaMinScale;
  const title = viewerLabel ?? `${authorName}의 산행 사진이나 동영상`;
  const descriptionId = `media-viewer-description-${viewerId}`;
  const displayCommand =
    viewerCommand ?? (viewerLabel ? 'profile.media' : `article.media ${articleId}`);
  const description = !hasMultipleMedia
    ? 'Escape 키로 닫을 수 있습니다.'
    : selectedMediaIsVideo
      ? '좌우 스와이프 또는 키보드 화살표로 동영상을 이동하고 Escape 키로 닫을 수 있습니다.'
      : '좌우 화살표 또는 화면 가장자리 클릭으로 사진이나 동영상을 이동하고 Escape 키로 닫을 수 있습니다.';

  const showPreviousInlineMedia = useCallback(() => {
    inlineTransitionDirectionRef.current = null;
    setInlineSwipeOffset(initialSwipeOffset);
    setIsInlineSwipeActive(false);
    setActiveInlineIndex((currentIndex) =>
      media.length > 0 ? getWrappedIndex(currentIndex - 1, media.length) : 0,
    );
  }, [media.length]);

  const showNextInlineMedia = useCallback(() => {
    inlineTransitionDirectionRef.current = null;
    setInlineSwipeOffset(initialSwipeOffset);
    setIsInlineSwipeActive(false);
    setActiveInlineIndex((currentIndex) =>
      media.length > 0 ? getWrappedIndex(currentIndex + 1, media.length) : 0,
    );
  }, [media.length]);

  const setInlineSwipeOffsetState = useCallback((nextOffset: SwipeOffset) => {
    setInlineSwipeOffset((currentOffset) =>
      currentOffset.x === nextOffset.x && currentOffset.y === nextOffset.y
        ? currentOffset
        : nextOffset,
    );
  }, []);

  const resetInlineSwipeGesture = useCallback(() => {
    inlineSwipeGestureRef.current = null;
    inlineTransitionDirectionRef.current = null;
    setIsInlineSwipeActive(false);
    setInlineSwipeOffsetState(initialSwipeOffset);
  }, [setInlineSwipeOffsetState]);

  const handleInlinePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!inlineCarousel || !hasMultipleMedia) {
        return;
      }

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      inlineSwipeGestureRef.current = {
        axis: null,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
      inlineTransitionDirectionRef.current = null;
      shouldSuppressInlineClickRef.current = false;
      setIsInlineSwipeActive(false);
      setInlineSwipeOffsetState(initialSwipeOffset);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [hasMultipleMedia, inlineCarousel, setInlineSwipeOffsetState],
  );

  const handleInlinePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const inlineSwipeGesture = inlineSwipeGestureRef.current;

      if (!inlineSwipeGesture || inlineSwipeGesture.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - inlineSwipeGesture.startX;
      const deltaY = event.clientY - inlineSwipeGesture.startY;
      const axis = inlineSwipeGesture.axis ?? getDominantSwipeAxis(deltaX, deltaY);

      if (!axis) {
        return;
      }

      inlineSwipeGesture.axis = axis;

      if (axis === 'horizontal') {
        const width = event.currentTarget.clientWidth || window.innerWidth;
        const maxOffset = width;

        event.preventDefault();
        setIsInlineSwipeActive(true);
        setInlineSwipeOffsetState({
          x: clamp(deltaX, -maxOffset, maxOffset),
          y: 0,
        });
      }
    },
    [setInlineSwipeOffsetState],
  );

  const handleInlinePointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const inlineSwipeGesture = inlineSwipeGestureRef.current;

      if (!inlineSwipeGesture || inlineSwipeGesture.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      inlineSwipeGestureRef.current = null;

      const deltaX = event.clientX - inlineSwipeGesture.startX;
      const deltaY = event.clientY - inlineSwipeGesture.startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const axis = inlineSwipeGesture.axis ?? getDominantSwipeAxis(deltaX, deltaY);
      const shouldSuppressInlineClick =
        axis === 'horizontal' && absDeltaX >= mediaPanClickSuppressThresholdPx;
      const isHorizontalSwipe =
        axis === 'horizontal' &&
        absDeltaX >= mediaSwipeThresholdPx &&
        absDeltaX >= absDeltaY * mediaHorizontalSwipeRatio;
      const canMoveToPrevious = deltaX > 0 && hasMultipleMedia;
      const canMoveToNext = deltaX < 0 && hasMultipleMedia;
      const isTap =
        absDeltaX < mediaPanClickSuppressThresholdPx &&
        absDeltaY < mediaPanClickSuppressThresholdPx;

      if (shouldSuppressInlineClick) {
        suppressNextClickTemporarily(shouldSuppressInlineClickRef);
      }

      if (isTap && event.pointerType !== 'mouse') {
        const rect = event.currentTarget.getBoundingClientRect();
        const pointerPositionRatio =
          rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;

        suppressNextClickTemporarily(shouldSuppressInlineClickRef);
        resetInlineSwipeGesture();

        if (pointerPositionRatio <= mediaNavigationClickZoneRatio) {
          if (canShowPreviousInlineMedia) {
            showPreviousInlineMedia();
          }

          return;
        }

        if (pointerPositionRatio >= 1 - mediaNavigationClickZoneRatio) {
          if (canShowNextInlineMedia) {
            showNextInlineMedia();
          }

          return;
        }

        setSelectedIndex(normalizedActiveInlineIndex);
        setOpen(true);
        return;
      }

      if (!isHorizontalSwipe || (!canMoveToPrevious && !canMoveToNext)) {
        resetInlineSwipeGesture();
        return;
      }

      const width = event.currentTarget.clientWidth || window.innerWidth;
      const direction: InlineTransitionDirection = deltaX > 0 ? -1 : 1;

      inlineTransitionDirectionRef.current = direction;
      setIsInlineSwipeActive(false);
      setInlineSwipeOffsetState({
        x: direction === -1 ? width : -width,
        y: 0,
      });
    },
    [
      canShowNextInlineMedia,
      canShowPreviousInlineMedia,
      hasMultipleMedia,
      normalizedActiveInlineIndex,
      resetInlineSwipeGesture,
      setInlineSwipeOffsetState,
      showNextInlineMedia,
      showPreviousInlineMedia,
    ],
  );

  const handleInlinePointerCancel = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      resetInlineSwipeGesture();
    },
    [resetInlineSwipeGesture],
  );

  const handleInlineTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLSpanElement>) => {
      if (event.target !== event.currentTarget || event.propertyName !== 'transform') {
        return;
      }

      const direction = inlineTransitionDirectionRef.current;

      if (direction === null) {
        return;
      }

      inlineTransitionDirectionRef.current = null;
      flushSync(() => {
        setIsInlineSwipeActive(true);
        setInlineSwipeOffsetState(initialSwipeOffset);
        setActiveInlineIndex((currentIndex) =>
          media.length > 0 ? getWrappedIndex(currentIndex + direction, media.length) : 0,
        );
      });

      event.currentTarget.getBoundingClientRect();

      window.requestAnimationFrame(() => {
        setIsInlineSwipeActive(false);
      });
    },
    [media.length, setInlineSwipeOffsetState],
  );

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

  const setSwipeOffsetState = useCallback((nextOffset: SwipeOffset) => {
    if (swipeOffsetRef.current.x === nextOffset.x && swipeOffsetRef.current.y === nextOffset.y) {
      return;
    }

    swipeOffsetRef.current = nextOffset;
    setSwipeOffset(nextOffset);
  }, []);

  const resetMediaGesture = useCallback(() => {
    activePointersRef.current.clear();
    panGestureRef.current = null;
    pinchGestureRef.current = null;
    shouldSuppressStageClickRef.current = false;
    swipeGestureRef.current = null;
    setIsMediaGestureActive(false);
    setSwipeOffsetState(initialSwipeOffset);
    setMediaTransformState(initialMediaTransform);
  }, [setMediaTransformState, setSwipeOffsetState]);

  const handleInlineTriggerClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>, index: number) => {
      if (shouldSuppressInlineClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
        shouldSuppressInlineClickRef.current = false;
        return;
      }

      if (hasMultipleMedia) {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickPositionRatio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;

        if (clickPositionRatio <= mediaNavigationClickZoneRatio) {
          event.preventDefault();
          event.stopPropagation();

          if (canShowPreviousInlineMedia) {
            showPreviousInlineMedia();
          }

          return;
        }

        if (clickPositionRatio >= 1 - mediaNavigationClickZoneRatio) {
          event.preventDefault();
          event.stopPropagation();

          if (canShowNextInlineMedia) {
            showNextInlineMedia();
          }

          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();
      resetMediaGesture();
      setSelectedIndex(index);
      setOpen(true);
    },
    [
      canShowNextInlineMedia,
      canShowPreviousInlineMedia,
      hasMultipleMedia,
      resetMediaGesture,
      showNextInlineMedia,
      showPreviousInlineMedia,
    ],
  );

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

  useEffect(() => {
    if (!open || selectedMedia.mediaType !== 'video') {
      return;
    }

    const selectedMediaSurface = selectedMediaSurfaceRef.current;

    if (!(selectedMediaSurface instanceof HTMLVideoElement)) {
      return;
    }

    selectedMediaSurface.muted = true;
    void selectedMediaSurface.play().catch(() => {
      // Some browsers can still block autoplay. Controls remain available.
    });
  }, [open, selectedMedia.mediaType, selectedMedia.url]);

  const handleMediaStageClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const selectedMediaSurface = selectedMediaSurfaceRef.current;
      const mediaRect = selectedMediaSurface?.getBoundingClientRect();

      if (shouldSuppressStageClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
        shouldSuppressStageClickRef.current = false;
        return;
      }

      if (
        !mediaRect ||
        event.clientX < mediaRect.left ||
        event.clientX > mediaRect.right ||
        event.clientY < mediaRect.top ||
        event.clientY > mediaRect.bottom
      ) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
      }

      if (selectedMediaIsVideo) {
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (isMediaZoomed) {
        return;
      }

      if (hasMultipleMedia && mediaRect) {
        const clickPositionRatio =
          mediaRect.width > 0 ? (event.clientX - mediaRect.left) / mediaRect.width : 0.5;

        if (clickPositionRatio <= mediaNavigationClickZoneRatio) {
          showPreviousMedia();
          return;
        }

        if (clickPositionRatio >= 1 - mediaNavigationClickZoneRatio) {
          showNextMedia();
          return;
        }
      }
    },
    [hasMultipleMedia, isMediaZoomed, selectedMediaIsVideo, showNextMedia, showPreviousMedia],
  );

  const handleMetadataClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
  }, []);

  const startMediaGesture = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      const selectedMediaSurface = selectedMediaSurfaceRef.current;

      if (!(event.target instanceof Node) || !selectedMediaSurface?.contains(event.target)) {
        return;
      }

      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsMediaGestureActive(true);

      if (selectedMediaIsVideo) {
        if (activePointersRef.current.size > 1) {
          swipeGestureRef.current = null;
          return;
        }

        swipeGestureRef.current = {
          axis: null,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
        };
        setSwipeOffsetState(initialSwipeOffset);
        return;
      }

      const activePointers = Array.from(activePointersRef.current.values());

      if (activePointers.length >= 2) {
        panGestureRef.current = null;
        pinchGestureRef.current = {
          startDistance: getPointerDistance(activePointers[0], activePointers[1]),
          startScale: mediaTransformRef.current.scale,
        };
        shouldSuppressStageClickRef.current = true;
        setSwipeOffsetState(initialSwipeOffset);
        swipeGestureRef.current = null;
        return;
      }

      if (mediaTransformRef.current.scale <= mediaMinScale) {
        swipeGestureRef.current = {
          axis: null,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
        };
        return;
      }

      swipeGestureRef.current = null;
      setSwipeOffsetState(initialSwipeOffset);
      panGestureRef.current = {
        pointerId: event.pointerId,
        startTranslateX: mediaTransformRef.current.translateX,
        startTranslateY: mediaTransformRef.current.translateY,
        startX: event.clientX,
        startY: event.clientY,
      };
    },
    [selectedMediaIsVideo, setSwipeOffsetState],
  );

  const updateMediaGesture = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!activePointersRef.current.has(event.pointerId)) {
        return;
      }

      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (selectedMediaIsVideo) {
        const swipeGesture = swipeGestureRef.current;

        if (!swipeGesture || swipeGesture.pointerId !== event.pointerId) {
          return;
        }

        const deltaX = event.clientX - swipeGesture.startX;
        const deltaY = event.clientY - swipeGesture.startY;
        const axis = swipeGesture.axis ?? getDominantSwipeAxis(deltaX, deltaY);

        if (
          Math.abs(deltaX) >= mediaPanClickSuppressThresholdPx ||
          Math.abs(deltaY) >= mediaPanClickSuppressThresholdPx
        ) {
          shouldSuppressStageClickRef.current = true;
        }

        if (!axis) {
          setSwipeOffsetState(initialSwipeOffset);
          return;
        }

        swipeGesture.axis = axis;

        if (axis === 'horizontal') {
          const maxSwipeOffsetX = window.innerWidth * mediaSwipePreviewMaxWidthRatio;
          setSwipeOffsetState({
            x: clamp(deltaX, -maxSwipeOffsetX, maxSwipeOffsetX),
            y: 0,
          });
          return;
        }

        const maxSwipeOffsetY = window.innerHeight * mediaSwipePreviewMaxHeightRatio;
        setSwipeOffsetState({
          x: 0,
          y: clamp(deltaY, -maxSwipeOffsetY, maxSwipeOffsetY),
        });
        return;
      }

      const activePointers = Array.from(activePointersRef.current.values());

      if (activePointers.length >= 2) {
        swipeGestureRef.current = null;
        setSwipeOffsetState(initialSwipeOffset);
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

      const swipeGesture = swipeGestureRef.current;

      if (
        swipeGesture?.pointerId === event.pointerId &&
        mediaTransformRef.current.scale <= mediaMinScale
      ) {
        const deltaX = event.clientX - swipeGesture.startX;
        const deltaY = event.clientY - swipeGesture.startY;
        const axis = swipeGesture.axis ?? getDominantSwipeAxis(deltaX, deltaY);

        if (
          Math.abs(deltaX) >= mediaPanClickSuppressThresholdPx ||
          Math.abs(deltaY) >= mediaPanClickSuppressThresholdPx
        ) {
          shouldSuppressStageClickRef.current = true;
        }

        if (!axis) {
          setSwipeOffsetState(initialSwipeOffset);
          return;
        }

        swipeGesture.axis = axis;

        if (axis === 'horizontal') {
          const maxSwipeOffsetX = window.innerWidth * mediaSwipePreviewMaxWidthRatio;
          setSwipeOffsetState({
            x: clamp(deltaX, -maxSwipeOffsetX, maxSwipeOffsetX),
            y: 0,
          });
          return;
        }

        const maxSwipeOffsetY = window.innerHeight * mediaSwipePreviewMaxHeightRatio;
        setSwipeOffsetState({
          x: 0,
          y: clamp(deltaY, -maxSwipeOffsetY, maxSwipeOffsetY),
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
    [selectedMediaIsVideo, setMediaTransformState, setSwipeOffsetState],
  );

  const finishMediaGesture = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!activePointersRef.current.has(event.pointerId)) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      activePointersRef.current.delete(event.pointerId);

      if (selectedMediaIsVideo) {
        const swipeGesture = swipeGestureRef.current;
        activePointersRef.current.clear();
        swipeGestureRef.current = null;
        setIsMediaGestureActive(false);

        if (!swipeGesture || swipeGesture.pointerId !== event.pointerId) {
          return;
        }

        const deltaX = event.clientX - swipeGesture.startX;
        const deltaY = event.clientY - swipeGesture.startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        const axis = swipeGesture.axis ?? getDominantSwipeAxis(deltaX, deltaY);
        const isHorizontalSwipe =
          axis === 'horizontal' &&
          absDeltaX >= mediaSwipeThresholdPx &&
          absDeltaX >= absDeltaY * mediaHorizontalSwipeRatio;
        const isVerticalSwipe =
          axis === 'vertical' &&
          absDeltaY >= mediaSwipeThresholdPx &&
          absDeltaY >= absDeltaX * mediaHorizontalSwipeRatio;

        if (isHorizontalSwipe && hasMultipleMedia) {
          shouldSuppressStageClickRef.current = true;

          if (deltaX > 0) {
            showPreviousMedia();
          } else {
            showNextMedia();
          }

          return;
        }

        if (isVerticalSwipe) {
          shouldSuppressStageClickRef.current = true;
          setSwipeOffsetState(initialSwipeOffset);
          setOpen(false);
          return;
        }

        setSwipeOffsetState(initialSwipeOffset);
        return;
      }

      const activePointers = Array.from(activePointersRef.current.entries());
      const swipeGesture = swipeGestureRef.current;

      if (
        swipeGesture?.pointerId === event.pointerId &&
        mediaTransformRef.current.scale <= mediaMinScale
      ) {
        const pointer = {
          x: event.clientX,
          y: event.clientY,
        };
        const deltaX = pointer.x - swipeGesture.startX;
        const deltaY = pointer.y - swipeGesture.startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        const axis = swipeGesture.axis ?? getDominantSwipeAxis(deltaX, deltaY);
        const isHorizontalSwipe =
          axis === 'horizontal' &&
          absDeltaX >= mediaSwipeThresholdPx &&
          absDeltaX >= absDeltaY * mediaHorizontalSwipeRatio;
        const isVerticalSwipe =
          axis === 'vertical' &&
          absDeltaY >= mediaSwipeThresholdPx &&
          absDeltaY >= absDeltaX * mediaHorizontalSwipeRatio;
        swipeGestureRef.current = null;

        if (isHorizontalSwipe && hasMultipleMedia) {
          shouldSuppressStageClickRef.current = true;

          if (deltaX > 0) {
            showPreviousMedia();
          } else {
            showNextMedia();
          }

          return;
        }

        if (isVerticalSwipe) {
          shouldSuppressStageClickRef.current = true;
          setIsMediaGestureActive(false);
          setSwipeOffsetState(initialSwipeOffset);
          setOpen(false);
          return;
        }

        setSwipeOffsetState(initialSwipeOffset);
      }

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
      swipeGestureRef.current = null;
      setSwipeOffsetState(initialSwipeOffset);

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
    },
    [hasMultipleMedia, selectedMediaIsVideo, setSwipeOffsetState, showNextMedia, showPreviousMedia],
  );

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
        <>
          {inlineCarousel ? (
            <figure
              aria-label={`${authorName}의 게시글 미디어`}
              className="m-0 min-w-0 overflow-hidden border border-[var(--overlay0)] bg-[var(--surface0)] sm:hidden"
            >
              <div className="relative">
                <button
                  className="group block h-auto w-full touch-pan-y appearance-none overflow-hidden bg-transparent p-0 text-left leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                  onClick={(event) => handleInlineTriggerClick(event, normalizedActiveInlineIndex)}
                  onPointerCancel={handleInlinePointerCancel}
                  onPointerDown={handleInlinePointerDown}
                  onPointerMove={handleInlinePointerMove}
                  onPointerUp={handleInlinePointerUp}
                  type="button"
                >
                  <span
                    className={`grid w-[300%] grid-cols-3 will-change-transform ${
                      isInlineSwipeActive ? '' : 'transition-transform duration-150 ease-out'
                    }`}
                    onTransitionEnd={handleInlineTransitionEnd}
                    style={{
                      transform: `translate3d(calc(-33.333333% + ${inlineSwipeOffset.x}px), 0, 0)`,
                    }}
                  >
                    <InlineMediaFrame authorName={authorName} media={previousInlineMedia} />
                    <InlineMediaFrame authorName={authorName} media={activeInlineMedia} />
                    <InlineMediaFrame authorName={authorName} media={nextInlineMedia} />
                  </span>
                </button>
              </div>

              <figcaption className="grid min-w-0 gap-1 px-2 py-1 font-mono text-[0.8125rem] leading-snug text-[var(--subtext0)]">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span>
                    {activeInlineMedia.mediaType} {activeInlineMedia.order}/{media.length}
                  </span>
                  {activeInlineTakenTime ? <span>{activeInlineTakenTime}</span> : null}
                </div>
                {hasMultipleMedia ? (
                  <div
                    aria-label="게시글 미디어 위치"
                    className="flex max-w-full min-w-0 flex-wrap items-center justify-center gap-1.5 overflow-hidden px-2 py-1"
                  >
                    {media.map((item, index) => (
                      <span
                        aria-current={index === normalizedActiveInlineIndex ? 'true' : undefined}
                        aria-label={`${index + 1}번째 미디어`}
                        className={`block size-1.5 border border-[var(--overlay0)] ${
                          index === normalizedActiveInlineIndex
                            ? 'bg-[var(--foreground0)]'
                            : 'bg-transparent'
                        }`}
                        key={`${articleId}-${item.order}-dot`}
                        role="img"
                      />
                    ))}
                  </div>
                ) : null}
              </figcaption>
            </figure>
          ) : null}

          <div className={`${inlineCarousel ? 'hidden sm:grid' : ''} ${thumbnailGridClassName}`}>
            {media.map((item, index) => {
              const takenTime = getMediaTakenTimeLabel(item);

              return (
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
                          <>
                            <VideoPlayOverlay />
                            <span className="absolute right-2 bottom-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-1.5 py-0.5 font-mono text-xs text-[var(--foreground0)]">
                              video
                            </span>
                          </>
                        ) : null}
                      </span>
                    </button>
                  </Dialog.Trigger>
                  <figcaption className="flex min-w-0 items-center justify-between gap-2 px-2 py-1 font-mono text-[0.8125rem] leading-snug text-[var(--subtext0)]">
                    <span>
                      {item.mediaType} {item.order}/{media.length}
                    </span>
                    {takenTime ? <span>{takenTime}</span> : null}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </>
      )}

      <Dialog.Portal>
        <Dialog.Overlay className={photoDialogOverlayClassName} />
        <Dialog.Content
          aria-describedby={descriptionId}
          className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr] gap-3 px-0 py-3 text-[var(--foreground0)] outline-none sm:p-5"
          onClick={closeOnBackdropClick}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only" id={descriptionId}>
            {description}
          </Dialog.Description>

          <div
            className="flex items-center justify-between gap-3 px-3 font-mono text-sm sm:px-0"
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
                ? 'grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto]'
            }`}
          >
            {hasMultipleMedia && !selectedMediaIsVideo ? (
              <button
                aria-label="이전 사진이나 동영상"
                className={`${mediaControlClassName} hidden !size-11 font-mono text-2xl sm:grid sm:!size-14`}
                data-media-modal-surface
                onClick={showPreviousMedia}
                type="button"
              >
                ←
              </button>
            ) : selectedMediaIsVideo ? null : (
              <span aria-hidden="true" className="hidden sm:block sm:size-14" />
            )}

            <div
              className="flex h-full min-h-0 w-full touch-none flex-col items-center justify-center gap-4 select-none"
              data-media-modal-surface
              onClick={handleMediaStageClick}
              onPointerCancel={finishMediaGesture}
              onPointerDown={startMediaGesture}
              onPointerMove={updateMediaGesture}
              onPointerUp={finishMediaGesture}
            >
              {selectedMedia.mediaType === 'video' ? (
                selectedVideoAspectRatio ? (
                  <div
                    className="grid w-full place-items-center"
                    style={{
                      aspectRatio: selectedVideoAspectRatio,
                      maxWidth: `min(100vw, calc((100svh - 10rem) * ${selectedVideoAspectRatio}))`,
                    }}
                  >
                    <video
                      autoPlay
                      className={`block h-full max-h-[calc(100svh-10rem)] w-full border border-[var(--overlay0)] bg-[var(--surface0)] object-contain will-change-transform select-none ${
                        isMediaGestureActive ? '' : 'transition-transform duration-150 ease-out'
                      }`}
                      controls
                      muted
                      playsInline
                      poster={selectedMedia.thumbnailUrl ?? undefined}
                      preload="metadata"
                      ref={selectedMediaSurfaceRef as RefObject<HTMLVideoElement>}
                      src={selectedMedia.url}
                      style={{
                        transform: `translate3d(${swipeOffset.x}px, ${swipeOffset.y}px, 0)`,
                      }}
                    />
                  </div>
                ) : (
                  <video
                    autoPlay
                    className={`max-h-[calc(100svh-10rem)] max-w-full border border-[var(--overlay0)] bg-[var(--surface0)] will-change-transform select-none ${
                      isMediaGestureActive ? '' : 'transition-transform duration-150 ease-out'
                    }`}
                    controls
                    muted
                    playsInline
                    poster={selectedMedia.thumbnailUrl ?? undefined}
                    preload="metadata"
                    ref={selectedMediaSurfaceRef as RefObject<HTMLVideoElement>}
                    src={selectedMedia.url}
                    style={{
                      transform: `translate3d(${swipeOffset.x}px, ${swipeOffset.y}px, 0)`,
                    }}
                  />
                )
              ) : (
                <img
                  alt={`${authorName}의 산행 사진이나 동영상 ${selectedMedia.order}`}
                  className={`max-h-[calc(100svh-10rem)] max-w-full border border-[var(--overlay0)] bg-[var(--surface0)] object-contain will-change-transform select-none ${
                    isMediaGestureActive ? '' : 'transition-transform duration-150 ease-out'
                  } ${
                    isMediaZoomed ? (isMediaGestureActive ? 'cursor-grabbing' : 'cursor-grab') : ''
                  }`}
                  draggable={false}
                  ref={selectedMediaSurfaceRef as RefObject<HTMLImageElement>}
                  src={selectedMedia.url}
                  style={{
                    transform: `translate3d(${mediaTransform.translateX + swipeOffset.x}px, ${mediaTransform.translateY + swipeOffset.y}px, 0) scale(${mediaTransform.scale})`,
                  }}
                />
              )}

              {selectedMetadataItems.length > 0 ? (
                <footer
                  className="w-fit max-w-full justify-self-center overflow-x-hidden overflow-y-hidden sm:border sm:border-[var(--overlay0)] sm:bg-[color-mix(in_srgb,var(--surface0)_92%,var(--background0))] sm:px-4 sm:py-1.5 sm:shadow-[0_0_0_1px_color-mix(in_srgb,var(--background0)_60%,transparent)] md:px-5 lg:grid lg:w-full lg:max-w-[min(100%,58rem)] lg:overflow-visible lg:px-4 lg:py-2.5"
                  data-media-modal-surface
                  onClick={handleMetadataClick}
                >
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 lg:grid lg:min-w-0 lg:grid-cols-[auto_1fr_auto] lg:items-end lg:gap-x-5 lg:gap-y-2">
                    <p className="m-0 shrink-0 font-mono text-[0.68rem] leading-tight tracking-[0.14em] text-[var(--subtext0)] uppercase lg:text-[0.72rem] lg:leading-none lg:tracking-[0.18em]">
                      frame {selectedIndex + 1}/{media.length}
                    </p>
                    <dl className="contents lg:m-0 lg:grid lg:min-w-0 lg:grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] lg:gap-x-4 lg:gap-y-2">
                      {selectedMetadataItems.map((item, index) => (
                        <div className="contents lg:grid lg:min-w-0 lg:gap-1" key={item.label}>
                          <dt className="sr-only font-mono text-[0.68rem] leading-none tracking-[0.16em] text-[var(--subtext0)] uppercase lg:not-sr-only">
                            {item.label}
                          </dt>
                          <dd className="m-0 max-w-full min-w-0 text-center font-mono text-xs leading-tight break-words text-[var(--foreground0)] lg:text-left lg:text-[0.9rem]">
                            {item.value}
                            {index < selectedMetadataItems.length - 1 ? (
                              <span
                                aria-hidden="true"
                                className="ml-2 text-[var(--overlay1)] lg:hidden"
                              >
                                ·
                              </span>
                            ) : null}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="m-0 hidden justify-self-start border-l-2 border-[var(--blue)] pl-2 font-mono text-[0.72rem] leading-none text-[var(--subtext0)] lg:block lg:justify-self-end">
                      photo data
                    </p>
                  </div>
                </footer>
              ) : (
                <p
                  className="m-0 justify-self-center font-mono text-sm text-[var(--subtext0)] sm:border sm:border-[var(--overlay0)] sm:bg-[var(--surface0)] sm:px-2 sm:py-1"
                  data-media-modal-surface
                  onClick={handleMetadataClick}
                >
                  {selectedMedia.mediaType} {selectedIndex + 1}/{media.length}
                </p>
              )}
            </div>

            {hasMultipleMedia && !selectedMediaIsVideo ? (
              <button
                aria-label="다음 사진이나 동영상"
                className={`${mediaControlClassName} hidden !size-11 font-mono text-2xl sm:grid sm:!size-14`}
                data-media-modal-surface
                onClick={showNextMedia}
                type="button"
              >
                →
              </button>
            ) : selectedMediaIsVideo ? null : (
              <span aria-hidden="true" className="hidden sm:block sm:size-14" />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
