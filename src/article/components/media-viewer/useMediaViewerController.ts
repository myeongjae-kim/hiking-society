import { useCallback, useReducer, useRef } from 'react';
import { toast } from 'sonner';

import type { ArticleMedia } from '@/core/article/domain';

import {
  initialMediaTransform,
  initialSwipeOffset,
  mediaMaxScale,
  mediaMinScale,
} from './constants';
import type {
  DoubleTapTrack,
  GesturePointer,
  InlineSwipeTrack,
  MediaTransform,
  PanGesture,
  PinchGesture,
  SwipeGesture,
  SwipeOffset,
} from './types';
import { clamp, getWrappedIndex } from './utils';

type MediaViewerState = {
  inlineIndex: number;
  inlineSwipeTrack: InlineSwipeTrack | null;
  isMediaGestureActive: boolean;
  mediaTransform: MediaTransform;
  open: boolean;
  selectedIndex: number;
  swipeOffset: SwipeOffset;
};

type MediaViewerAction =
  | { type: 'close' }
  | { index: number; type: 'openAt' }
  | { open: boolean; type: 'setOpen' }
  | { index: number; type: 'setInlineIndex' }
  | { track: InlineSwipeTrack | null; type: 'setInlineSwipeTrack' }
  | { active: boolean; type: 'setMediaGestureActive' }
  | { offset: SwipeOffset; type: 'setSwipeOffset' }
  | { transform: MediaTransform; type: 'setMediaTransform' }
  | { length: number; type: 'showNext' }
  | { length: number; type: 'showPrevious' };

const initialState: MediaViewerState = {
  inlineIndex: 0,
  inlineSwipeTrack: null,
  isMediaGestureActive: false,
  mediaTransform: initialMediaTransform,
  open: false,
  selectedIndex: 0,
  swipeOffset: initialSwipeOffset,
};

function normalizeTransform(nextTransform: MediaTransform) {
  return nextTransform.scale <= mediaMinScale
    ? initialMediaTransform
    : {
        scale: clamp(nextTransform.scale, mediaMinScale, mediaMaxScale),
        translateX: nextTransform.translateX,
        translateY: nextTransform.translateY,
      };
}

function mediaViewerReducer(state: MediaViewerState, action: MediaViewerAction): MediaViewerState {
  switch (action.type) {
    case 'close':
      return { ...state, open: false };
    case 'openAt':
      return {
        ...state,
        inlineIndex: action.index,
        inlineSwipeTrack: null,
        open: true,
        selectedIndex: action.index,
      };
    case 'setOpen':
      return { ...state, open: action.open };
    case 'setInlineIndex':
      return {
        ...state,
        inlineIndex: action.index,
        inlineSwipeTrack: null,
      };
    case 'setInlineSwipeTrack':
      return { ...state, inlineSwipeTrack: action.track };
    case 'setMediaGestureActive':
      return { ...state, isMediaGestureActive: action.active };
    case 'setMediaTransform':
      return { ...state, mediaTransform: normalizeTransform(action.transform) };
    case 'setSwipeOffset':
      return { ...state, swipeOffset: action.offset };
    case 'showNext': {
      const nextIndex = getWrappedIndex(state.selectedIndex + 1, action.length);
      return {
        ...state,
        inlineIndex: nextIndex,
        inlineSwipeTrack: null,
        selectedIndex: nextIndex,
      };
    }
    case 'showPrevious': {
      const nextIndex = getWrappedIndex(state.selectedIndex - 1, action.length);
      return {
        ...state,
        inlineIndex: nextIndex,
        inlineSwipeTrack: null,
        selectedIndex: nextIndex,
      };
    }
    default:
      return state;
  }
}

export function useMediaViewerController(media: readonly ArticleMedia[]) {
  const activePointersRef = useRef<Map<number, GesturePointer>>(new Map());
  const mediaTransformRef = useRef<MediaTransform>(initialMediaTransform);
  const panGestureRef = useRef<PanGesture | null>(null);
  const pinchGestureRef = useRef<PinchGesture | null>(null);
  const selectedMediaSurfaceRef = useRef<HTMLElement>(null);
  const mediaDoubleTapRef = useRef<DoubleTapTrack | null>(null);
  const inlineSwipeGestureRef = useRef<SwipeGesture | null>(null);
  const shouldSuppressInlineClickRef = useRef(false);
  const shouldSuppressStageClickRef = useRef(false);
  const swipeOffsetRef = useRef<SwipeOffset>(initialSwipeOffset);
  const swipeGestureRef = useRef<SwipeGesture | null>(null);
  const [state, dispatch] = useReducer(mediaViewerReducer, initialState);

  const setMediaTransformState = useCallback((nextTransform: MediaTransform) => {
    const normalizedTransform = normalizeTransform(nextTransform);
    mediaTransformRef.current = normalizedTransform;
    dispatch({ transform: normalizedTransform, type: 'setMediaTransform' });
  }, []);

  const setSwipeOffsetState = useCallback((nextOffset: SwipeOffset) => {
    if (swipeOffsetRef.current.x === nextOffset.x && swipeOffsetRef.current.y === nextOffset.y) {
      return;
    }

    swipeOffsetRef.current = nextOffset;
    dispatch({ offset: nextOffset, type: 'setSwipeOffset' });
  }, []);

  const resetMediaDoubleTap = useCallback(() => {
    mediaDoubleTapRef.current = null;
  }, []);

  const resetModalGesture = useCallback(() => {
    activePointersRef.current.clear();
    resetMediaDoubleTap();
    panGestureRef.current = null;
    pinchGestureRef.current = null;
    shouldSuppressStageClickRef.current = false;
    swipeGestureRef.current = null;
    dispatch({ active: false, type: 'setMediaGestureActive' });
    setSwipeOffsetState(initialSwipeOffset);
    setMediaTransformState(initialMediaTransform);
  }, [resetMediaDoubleTap, setMediaTransformState, setSwipeOffsetState]);

  const resetInlineGesture = useCallback(() => {
    inlineSwipeGestureRef.current = null;
    dispatch({ track: null, type: 'setInlineSwipeTrack' });
  }, []);

  const openAt = useCallback(
    (index: number) => {
      const selectedMediaIndex = clamp(index, 0, Math.max(media.length - 1, 0));
      if (media[selectedMediaIndex]?.mediaType === 'video') {
        toast('동영상이 음소거 상태로 재생됩니다.', { position: 'bottom-center' });
      }

      resetModalGesture();
      dispatch({ index: selectedMediaIndex, type: 'openAt' });
    },
    [media, resetModalGesture],
  );

  const close = useCallback(() => {
    dispatch({ type: 'close' });
    resetModalGesture();
  }, [resetModalGesture]);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        dispatch({ open: true, type: 'setOpen' });
        return;
      }

      close();
    },
    [close],
  );

  const showPrevious = useCallback(() => {
    resetModalGesture();
    dispatch({ length: media.length, type: 'showPrevious' });
  }, [media.length, resetModalGesture]);

  const showNext = useCallback(() => {
    resetModalGesture();
    dispatch({ length: media.length, type: 'showNext' });
  }, [media.length, resetModalGesture]);

  const setInlineIndex = useCallback((index: number) => {
    dispatch({ index, type: 'setInlineIndex' });
  }, []);

  const setInlineSwipeTrack = useCallback((track: InlineSwipeTrack | null) => {
    dispatch({ track, type: 'setInlineSwipeTrack' });
  }, []);

  const setMediaGestureActive = useCallback((active: boolean) => {
    dispatch({ active, type: 'setMediaGestureActive' });
  }, []);

  return {
    actions: {
      close,
      openAt,
      resetInlineGesture,
      resetMediaDoubleTap,
      resetModalGesture,
      setInlineIndex,
      setInlineSwipeTrack,
      setMediaGestureActive,
      setMediaTransformState,
      setOpen,
      setSwipeOffsetState,
      showNext,
      showPrevious,
    },
    refs: {
      activePointersRef,
      inlineSwipeGestureRef,
      mediaDoubleTapRef,
      mediaTransformRef,
      panGestureRef,
      pinchGestureRef,
      selectedMediaSurfaceRef,
      shouldSuppressInlineClickRef,
      shouldSuppressStageClickRef,
      swipeGestureRef,
    },
    state,
  };
}
