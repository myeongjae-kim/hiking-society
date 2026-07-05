import { useEffect } from 'react';
import type { RefObject } from 'react';

import type { ArticleMedia } from '@/core/article/domain';

type UseVideoAutoplayOptions = {
  media: ArticleMedia;
  open: boolean;
  selectedMediaSurfaceRef: RefObject<HTMLElement | null>;
};

export function useVideoAutoplay({
  media,
  open,
  selectedMediaSurfaceRef,
}: UseVideoAutoplayOptions) {
  useEffect(() => {
    if (!open || media.mediaType !== 'video') {
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
  }, [media.mediaType, media.url, open, selectedMediaSurfaceRef]);
}
