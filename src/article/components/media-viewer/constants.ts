import type { MediaTransform, SwipeOffset } from './types';

export const mediaControlClassName =
  'grid place-items-center border border-[var(--overlay0)] bg-[var(--surface0)] !bg-none p-0 font-normal leading-none text-[var(--foreground0)] no-underline hover:bg-[var(--surface1)] active:bg-[var(--surface2)] active:text-[var(--foreground0)] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]';

export const mediaNavigationClickZoneRatio = 0.3;
export const mediaMinScale = 1;
export const mediaMaxScale = 4;
export const mediaDoubleTapScale = 2;
export const mediaDoubleTapTimeoutMs = 300;
export const mediaDoubleTapMaxDistancePx = 32;
export const mediaPanClickSuppressThresholdPx = 6;
export const mediaSwipeThresholdPx = 48;
export const mediaHorizontalSwipeRatio = 1.25;
export const mediaSwipePreviewMaxWidthRatio = 0.35;
export const mediaSwipePreviewMaxHeightRatio = 0.35;

export const initialMediaTransform: MediaTransform = {
  scale: mediaMinScale,
  translateX: 0,
  translateY: 0,
};

export const initialSwipeOffset: SwipeOffset = {
  x: 0,
  y: 0,
};
