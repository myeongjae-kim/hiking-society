import type { MouseEvent, PointerEvent, TouchEvent, TransitionEvent } from 'react';
import { useCallback } from 'react';

import type { ArticleMedia } from '@/core/article/domain';

import {
  mediaHorizontalSwipeRatio,
  mediaNavigationClickZoneRatio,
  mediaPanClickSuppressThresholdPx,
  mediaSwipeThresholdPx,
} from './constants';
import type { InlineSwipeTrack, SwipeGesture } from './types';
import {
  clamp,
  getInlineSwipeAxis,
  getTouchByIdentifier,
  getWrappedIndex,
  releasePointerCaptureIfActive,
  suppressNextClickTemporarily,
} from './utils';

type UseInlineCarouselGestureOptions = {
  activeInlineIndex: number;
  hasMultipleMedia: boolean;
  inlineCarousel: boolean;
  inlineSwipeGestureRef: React.MutableRefObject<SwipeGesture | null>;
  inlineSwipeTrack: InlineSwipeTrack | null;
  media: readonly ArticleMedia[];
  onOpenAt: (index: number) => void;
  setInlineIndex: (index: number) => void;
  setInlineSwipeTrack: (track: InlineSwipeTrack | null) => void;
  shouldSuppressInlineClickRef: React.MutableRefObject<boolean>;
};

export function useInlineCarouselGesture({
  activeInlineIndex,
  hasMultipleMedia,
  inlineCarousel,
  inlineSwipeGestureRef,
  inlineSwipeTrack,
  media,
  onOpenAt,
  setInlineIndex,
  setInlineSwipeTrack,
  shouldSuppressInlineClickRef,
}: UseInlineCarouselGestureOptions) {
  const createInlineSwipeTrack = useCallback(
    (offsetX: number, settling: boolean, targetIndex = activeInlineIndex) => {
      const fromIndex = activeInlineIndex;

      if (!hasMultipleMedia || media.length === 0) {
        return null;
      }

      return {
        fromIndex,
        nextIndex: getWrappedIndex(fromIndex + 1, media.length),
        offsetX,
        previousIndex: getWrappedIndex(fromIndex - 1, media.length),
        settling,
        targetIndex,
      };
    },
    [activeInlineIndex, hasMultipleMedia, media.length],
  );

  const showPreviousInlineMedia = useCallback(() => {
    setInlineSwipeTrack(null);
    setInlineIndex(media.length > 0 ? getWrappedIndex(activeInlineIndex - 1, media.length) : 0);
  }, [activeInlineIndex, media.length, setInlineIndex, setInlineSwipeTrack]);

  const showNextInlineMedia = useCallback(() => {
    setInlineSwipeTrack(null);
    setInlineIndex(media.length > 0 ? getWrappedIndex(activeInlineIndex + 1, media.length) : 0);
  }, [activeInlineIndex, media.length, setInlineIndex, setInlineSwipeTrack]);

  const resetInlineSwipeGesture = useCallback(() => {
    inlineSwipeGestureRef.current = null;
    setInlineSwipeTrack(null);
  }, [inlineSwipeGestureRef, setInlineSwipeTrack]);

  const handleInlineTriggerClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
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
          showPreviousInlineMedia();
          return;
        }

        if (clickPositionRatio >= 1 - mediaNavigationClickZoneRatio) {
          event.preventDefault();
          event.stopPropagation();
          showNextInlineMedia();
          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();
      onOpenAt(activeInlineIndex);
    },
    [
      activeInlineIndex,
      hasMultipleMedia,
      onOpenAt,
      shouldSuppressInlineClickRef,
      showNextInlineMedia,
      showPreviousInlineMedia,
    ],
  );

  const handleInlinePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!inlineCarousel || !hasMultipleMedia) {
        return;
      }

      if (event.pointerType === 'touch') {
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
      shouldSuppressInlineClickRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [hasMultipleMedia, inlineCarousel, inlineSwipeGestureRef, shouldSuppressInlineClickRef],
  );

  const handleInlinePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'touch') {
        return;
      }

      const inlineSwipeGesture = inlineSwipeGestureRef.current;

      if (!inlineSwipeGesture || inlineSwipeGesture.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - inlineSwipeGesture.startX;
      const deltaY = event.clientY - inlineSwipeGesture.startY;
      const axis = inlineSwipeGesture.axis ?? getInlineSwipeAxis(deltaX, deltaY);

      if (
        Math.abs(deltaX) >= mediaPanClickSuppressThresholdPx ||
        Math.abs(deltaY) >= mediaPanClickSuppressThresholdPx
      ) {
        shouldSuppressInlineClickRef.current = true;
      }

      if (!axis) {
        return;
      }

      inlineSwipeGesture.axis = axis;

      if (axis === 'horizontal') {
        const maxSwipeOffsetX = event.currentTarget.clientWidth || window.innerWidth;

        event.preventDefault();
        setInlineSwipeTrack(
          createInlineSwipeTrack(clamp(deltaX, -maxSwipeOffsetX, maxSwipeOffsetX), false),
        );
        return;
      }

      setInlineSwipeTrack(null);
    },
    [
      createInlineSwipeTrack,
      inlineSwipeGestureRef,
      setInlineSwipeTrack,
      shouldSuppressInlineClickRef,
    ],
  );

  const handleInlinePointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'touch') {
        return;
      }

      const inlineSwipeGesture = inlineSwipeGestureRef.current;

      if (!inlineSwipeGesture || inlineSwipeGesture.pointerId !== event.pointerId) {
        return;
      }

      releasePointerCaptureIfActive(event.currentTarget, event.pointerId);

      inlineSwipeGestureRef.current = null;

      const deltaX = event.clientX - inlineSwipeGesture.startX;
      const deltaY = event.clientY - inlineSwipeGesture.startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const axis = inlineSwipeGesture.axis ?? getInlineSwipeAxis(deltaX, deltaY);
      const isHorizontalSwipe =
        axis === 'horizontal' &&
        absDeltaX >= mediaSwipeThresholdPx &&
        absDeltaX >= absDeltaY * mediaHorizontalSwipeRatio;

      if (axis === 'horizontal' && absDeltaX >= mediaPanClickSuppressThresholdPx) {
        suppressNextClickTemporarily(shouldSuppressInlineClickRef);
      }

      if (!isHorizontalSwipe || !hasMultipleMedia) {
        if (
          inlineSwipeTrack &&
          axis === 'horizontal' &&
          absDeltaX >= mediaPanClickSuppressThresholdPx
        ) {
          setInlineSwipeTrack(createInlineSwipeTrack(0, true));
          return;
        }

        setInlineSwipeTrack(null);
        return;
      }

      event.preventDefault();
      const width = event.currentTarget.clientWidth || window.innerWidth;
      const targetIndex =
        deltaX > 0
          ? getWrappedIndex(activeInlineIndex - 1, media.length)
          : getWrappedIndex(activeInlineIndex + 1, media.length);

      if (deltaX > 0) {
        setInlineSwipeTrack(createInlineSwipeTrack(width, true, targetIndex));
        return;
      }

      setInlineSwipeTrack(createInlineSwipeTrack(-width, true, targetIndex));
    },
    [
      activeInlineIndex,
      createInlineSwipeTrack,
      hasMultipleMedia,
      inlineSwipeGestureRef,
      inlineSwipeTrack,
      media.length,
      setInlineSwipeTrack,
      shouldSuppressInlineClickRef,
    ],
  );

  const handleInlinePointerCancel = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'touch') {
        return;
      }

      releasePointerCaptureIfActive(event.currentTarget, event.pointerId);
      resetInlineSwipeGesture();
    },
    [resetInlineSwipeGesture],
  );

  const handleInlineTouchStart = useCallback(
    (event: TouchEvent<HTMLButtonElement>) => {
      if (!inlineCarousel || !hasMultipleMedia) {
        return;
      }

      if (event.touches.length !== 1) {
        resetInlineSwipeGesture();
        suppressNextClickTemporarily(shouldSuppressInlineClickRef);
        return;
      }

      const touch = event.touches.item(0);

      if (!touch) {
        return;
      }

      inlineSwipeGestureRef.current = {
        axis: null,
        pointerId: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
      };
      shouldSuppressInlineClickRef.current = false;
    },
    [
      hasMultipleMedia,
      inlineCarousel,
      inlineSwipeGestureRef,
      resetInlineSwipeGesture,
      shouldSuppressInlineClickRef,
    ],
  );

  const handleInlineTouchMove = useCallback(
    (event: TouchEvent<HTMLButtonElement>) => {
      const inlineSwipeGesture = inlineSwipeGestureRef.current;

      if (!inlineSwipeGesture || event.touches.length !== 1) {
        resetInlineSwipeGesture();
        suppressNextClickTemporarily(shouldSuppressInlineClickRef);
        return;
      }

      const touch = getTouchByIdentifier(event.touches, inlineSwipeGesture.pointerId);

      if (!touch) {
        resetInlineSwipeGesture();
        return;
      }

      const deltaX = touch.clientX - inlineSwipeGesture.startX;
      const deltaY = touch.clientY - inlineSwipeGesture.startY;
      const axis = inlineSwipeGesture.axis ?? getInlineSwipeAxis(deltaX, deltaY);

      if (
        Math.abs(deltaX) >= mediaPanClickSuppressThresholdPx ||
        Math.abs(deltaY) >= mediaPanClickSuppressThresholdPx
      ) {
        shouldSuppressInlineClickRef.current = true;
      }

      if (!axis) {
        return;
      }

      inlineSwipeGesture.axis = axis;

      if (axis === 'horizontal') {
        const maxSwipeOffsetX = event.currentTarget.clientWidth || window.innerWidth;

        event.preventDefault();
        setInlineSwipeTrack(
          createInlineSwipeTrack(clamp(deltaX, -maxSwipeOffsetX, maxSwipeOffsetX), false),
        );
        return;
      }

      setInlineSwipeTrack(null);
    },
    [
      createInlineSwipeTrack,
      inlineSwipeGestureRef,
      resetInlineSwipeGesture,
      setInlineSwipeTrack,
      shouldSuppressInlineClickRef,
    ],
  );

  const handleInlineTouchEnd = useCallback(
    (event: TouchEvent<HTMLButtonElement>) => {
      const inlineSwipeGesture = inlineSwipeGestureRef.current;

      if (!inlineSwipeGesture) {
        return;
      }

      const touch = getTouchByIdentifier(event.changedTouches, inlineSwipeGesture.pointerId);

      if (!touch) {
        return;
      }

      inlineSwipeGestureRef.current = null;

      const deltaX = touch.clientX - inlineSwipeGesture.startX;
      const deltaY = touch.clientY - inlineSwipeGesture.startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const axis = inlineSwipeGesture.axis ?? getInlineSwipeAxis(deltaX, deltaY);
      const isHorizontalSwipe =
        axis === 'horizontal' &&
        absDeltaX >= mediaSwipeThresholdPx &&
        absDeltaX >= absDeltaY * mediaHorizontalSwipeRatio;

      if (axis === 'horizontal' && absDeltaX >= mediaPanClickSuppressThresholdPx) {
        suppressNextClickTemporarily(shouldSuppressInlineClickRef);
      }

      if (!isHorizontalSwipe || !hasMultipleMedia) {
        if (
          inlineSwipeTrack &&
          axis === 'horizontal' &&
          absDeltaX >= mediaPanClickSuppressThresholdPx
        ) {
          event.preventDefault();
          setInlineSwipeTrack(createInlineSwipeTrack(0, true));
          return;
        }

        setInlineSwipeTrack(null);
        return;
      }

      event.preventDefault();
      const width = event.currentTarget.clientWidth || window.innerWidth;
      const targetIndex =
        deltaX > 0
          ? getWrappedIndex(activeInlineIndex - 1, media.length)
          : getWrappedIndex(activeInlineIndex + 1, media.length);

      if (deltaX > 0) {
        setInlineSwipeTrack(createInlineSwipeTrack(width, true, targetIndex));
        return;
      }

      setInlineSwipeTrack(createInlineSwipeTrack(-width, true, targetIndex));
    },
    [
      activeInlineIndex,
      createInlineSwipeTrack,
      hasMultipleMedia,
      inlineSwipeGestureRef,
      inlineSwipeTrack,
      media.length,
      setInlineSwipeTrack,
      shouldSuppressInlineClickRef,
    ],
  );

  const handleInlineTouchCancel = useCallback(() => {
    resetInlineSwipeGesture();
  }, [resetInlineSwipeGesture]);

  const handleInlineSwipeTrackTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLSpanElement>) => {
      if (event.target !== event.currentTarget || event.propertyName !== 'transform') {
        return;
      }

      if (!inlineSwipeTrack?.settling) {
        return;
      }

      setInlineIndex(inlineSwipeTrack.targetIndex);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setInlineSwipeTrack(null);
        });
      });
    },
    [inlineSwipeTrack, setInlineIndex, setInlineSwipeTrack],
  );

  return {
    handleInlinePointerCancel,
    handleInlinePointerDown,
    handleInlinePointerMove,
    handleInlinePointerUp,
    handleInlineSwipeTrackTransitionEnd,
    handleInlineTouchCancel,
    handleInlineTouchEnd,
    handleInlineTouchMove,
    handleInlineTouchStart,
    handleInlineTriggerClick,
    renderedInlineSwipeTrack: hasMultipleMedia
      ? (inlineSwipeTrack ?? createInlineSwipeTrack(0, false))
      : null,
  };
}
