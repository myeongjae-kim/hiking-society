import * as Dialog from "@radix-ui/react-dialog";
import type { MouseEvent } from "react";

import { photoDialogOverlayClassName } from "#/features/shared/components/styles";
import type { ArticleMedia } from "@/core/article/domain";

import { mediaControlClassName } from "./constants";
import { MediaStage } from "./MediaStage";
import type {
	DoubleTapTrack,
	GesturePointer,
	MediaTransform,
	PanGesture,
	PinchGesture,
	SwipeGesture,
	SwipeOffset,
} from "./types";

type MediaViewerDialogProps = {
	activePointersRef: React.MutableRefObject<Map<number, GesturePointer>>;
	authorName: string;
	description: string;
	descriptionId: string;
	displayCommand: string;
	hasMultipleMedia: boolean;
	isMediaGestureActive: boolean;
	media: readonly ArticleMedia[];
	mediaDoubleTapRef: React.MutableRefObject<DoubleTapTrack | null>;
	mediaTransform: MediaTransform;
	mediaTransformRef: React.MutableRefObject<MediaTransform>;
	onClose: () => void;
	onNext: () => void;
	onPrevious: () => void;
	panGestureRef: React.MutableRefObject<PanGesture | null>;
	pinchGestureRef: React.MutableRefObject<PinchGesture | null>;
	resetMediaDoubleTap: () => void;
	selectedIndex: number;
	selectedMedia: ArticleMedia;
	selectedMediaSurfaceRef: React.MutableRefObject<HTMLElement | null>;
	setIsMediaGestureActive: (active: boolean) => void;
	setMediaTransformState: (nextTransform: MediaTransform) => void;
	setSwipeOffsetState: (nextOffset: SwipeOffset) => void;
	shouldSuppressStageClickRef: React.MutableRefObject<boolean>;
	swipeGestureRef: React.MutableRefObject<SwipeGesture | null>;
	swipeOffset: SwipeOffset;
	title: string;
};

export function MediaViewerDialog({
	activePointersRef,
	authorName,
	description,
	descriptionId,
	displayCommand,
	hasMultipleMedia,
	isMediaGestureActive,
	media,
	mediaDoubleTapRef,
	mediaTransform,
	mediaTransformRef,
	onClose,
	onNext,
	onPrevious,
	panGestureRef,
	pinchGestureRef,
	resetMediaDoubleTap,
	selectedIndex,
	selectedMedia,
	selectedMediaSurfaceRef,
	setIsMediaGestureActive,
	setMediaTransformState,
	setSwipeOffsetState,
	shouldSuppressStageClickRef,
	swipeGestureRef,
	swipeOffset,
	title,
}: MediaViewerDialogProps) {
	const selectedMediaIsVideo = selectedMedia.mediaType === "video";

	const closeOnBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
		const target = event.target;

		if (
			target instanceof Element &&
			!target.closest("[data-media-modal-surface]")
		) {
			event.preventDefault();
			event.stopPropagation();
			resetMediaDoubleTap();
			onClose();
		}
	};

	return (
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
							? "grid-cols-1"
							: "grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
					}`}
				>
					{hasMultipleMedia && !selectedMediaIsVideo ? (
						<button
							aria-label="이전 사진이나 동영상"
							className={`${mediaControlClassName} !size-11 sm:!size-14 hidden font-mono text-2xl sm:grid`}
							data-media-modal-surface
							onClick={onPrevious}
							type="button"
						>
							←
						</button>
					) : selectedMediaIsVideo ? null : (
						<span aria-hidden="true" className="hidden sm:block sm:size-14" />
					)}

					<MediaStage
						activePointersRef={activePointersRef}
						authorName={authorName}
						hasMultipleMedia={hasMultipleMedia}
						isMediaGestureActive={isMediaGestureActive}
						media={media}
						mediaDoubleTapRef={mediaDoubleTapRef}
						mediaTransform={mediaTransform}
						mediaTransformRef={mediaTransformRef}
						onClose={onClose}
						onNext={onNext}
						onPrevious={onPrevious}
						panGestureRef={panGestureRef}
						pinchGestureRef={pinchGestureRef}
						resetMediaDoubleTap={resetMediaDoubleTap}
						selectedIndex={selectedIndex}
						selectedMedia={selectedMedia}
						selectedMediaSurfaceRef={selectedMediaSurfaceRef}
						setIsMediaGestureActive={setIsMediaGestureActive}
						setMediaTransformState={setMediaTransformState}
						setSwipeOffsetState={setSwipeOffsetState}
						shouldSuppressStageClickRef={shouldSuppressStageClickRef}
						swipeGestureRef={swipeGestureRef}
						swipeOffset={swipeOffset}
					/>

					{hasMultipleMedia && !selectedMediaIsVideo ? (
						<button
							aria-label="다음 사진이나 동영상"
							className={`${mediaControlClassName} !size-11 sm:!size-14 hidden font-mono text-2xl sm:grid`}
							data-media-modal-surface
							onClick={onNext}
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
	);
}
