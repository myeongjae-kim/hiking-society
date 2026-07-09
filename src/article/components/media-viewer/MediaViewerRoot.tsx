'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useId } from 'react';

import { MediaInlineCarousel } from './MediaInlineCarousel';
import { MediaThumbnailGrid } from './MediaThumbnailGrid';
import { MediaViewerDialog } from './MediaViewerDialog';
import type { MediaViewerProps } from './types';
import { useMediaKeyboardNavigation } from './useMediaKeyboardNavigation';
import { useMediaViewerController } from './useMediaViewerController';
import { useVideoAutoplay } from './useVideoAutoplay';

export function MediaViewerRoot({
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
  const { actions, refs, state } = useMediaViewerController(media);
  const hasMultipleMedia = media.length > 1;
  const selectedMedia = media[state.selectedIndex] ?? media[0];
  const selectedMediaIsVideo = selectedMedia.mediaType === 'video';
  const title = viewerLabel ?? `${authorName}의 산행 사진이나 동영상`;
  const descriptionId = `media-viewer-description-${viewerId}`;
  const displayCommand =
    viewerCommand ?? (viewerLabel ? 'profile.media' : `article.media ${articleId}`);
  const description = !hasMultipleMedia
    ? 'Escape 키로 닫을 수 있습니다.'
    : selectedMediaIsVideo
      ? '좌우 스와이프 또는 키보드 화살표로 동영상을 이동하고 Escape 키로 닫을 수 있습니다.'
      : '좌우 화살표 또는 화면 가장자리 클릭으로 사진이나 동영상을 이동하고 Escape 키로 닫을 수 있습니다.';

  useMediaKeyboardNavigation({
    hasMultipleMedia,
    onNext: actions.showNext,
    onPrevious: actions.showPrevious,
    open: state.open,
  });
  useVideoAutoplay({
    media: selectedMedia,
    open: state.open,
    selectedMediaSurfaceRef: refs.selectedMediaSurfaceRef,
  });

  return (
    <Dialog.Root open={state.open} onOpenChange={actions.setOpen}>
      {trigger ? (
        <Dialog.Trigger asChild>
          <button
            className={triggerClassName}
            onClick={() => {
              actions.openAt(initialIndex);
            }}
            type="button"
          >
            {trigger}
          </button>
        </Dialog.Trigger>
      ) : (
        <>
          <MediaInlineCarousel
            activeInlineIndex={state.inlineIndex}
            articleId={articleId}
            authorName={authorName}
            hasMultipleMedia={hasMultipleMedia}
            inlineCarousel={inlineCarousel}
            inlineSwipeGestureRef={refs.inlineSwipeGestureRef}
            inlineSwipeTrack={state.inlineSwipeTrack}
            media={media}
            onOpenAt={actions.openAt}
            setInlineIndex={actions.setInlineIndex}
            setInlineSwipeTrack={actions.setInlineSwipeTrack}
            shouldSuppressInlineClickRef={refs.shouldSuppressInlineClickRef}
          />
          <MediaThumbnailGrid
            articleId={articleId}
            authorName={authorName}
            className={thumbnailGridClassName}
            inlineCarousel={inlineCarousel}
            media={media}
            onOpenAt={actions.openAt}
          />
        </>
      )}

      <MediaViewerDialog
        activePointersRef={refs.activePointersRef}
        authorName={authorName}
        description={description}
        descriptionId={descriptionId}
        displayCommand={displayCommand}
        hasMultipleMedia={hasMultipleMedia}
        isMediaGestureActive={state.isMediaGestureActive}
        media={media}
        mediaDoubleTapRef={refs.mediaDoubleTapRef}
        mediaTransform={state.mediaTransform}
        mediaTransformRef={refs.mediaTransformRef}
        onClose={actions.close}
        onNext={actions.showNext}
        onPrevious={actions.showPrevious}
        panGestureRef={refs.panGestureRef}
        pinchGestureRef={refs.pinchGestureRef}
        resetMediaDoubleTap={actions.resetMediaDoubleTap}
        selectedIndex={state.selectedIndex}
        selectedMedia={selectedMedia}
        selectedMediaSurfaceRef={refs.selectedMediaSurfaceRef}
        setIsMediaGestureActive={actions.setMediaGestureActive}
        setMediaTransformState={actions.setMediaTransformState}
        setSwipeOffsetState={actions.setSwipeOffsetState}
        shouldSuppressStageClickRef={refs.shouldSuppressStageClickRef}
        swipeGestureRef={refs.swipeGestureRef}
        swipeOffset={state.swipeOffset}
        title={title}
      />
    </Dialog.Root>
  );
}
