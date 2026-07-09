import type { RefObject } from "react";

import type { ArticleMedia } from "@/core/article/domain";

import { mediaMinScale } from "./constants";
import { MediaMetadata } from "./MediaMetadata";
import { getMetadataPanelItems } from "./metadata";
import type {
	DoubleTapTrack,
	GesturePointer,
	MediaTransform,
	PanGesture,
	PinchGesture,
	SwipeGesture,
	SwipeOffset,
} from "./types";
import { useMediaStageGesture } from "./useMediaStageGesture";

type MediaStageProps = {
	activePointersRef: React.MutableRefObject<Map<number, GesturePointer>>;
	authorName: string;
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
};

export function MediaStage({
	activePointersRef,
	authorName,
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
}: MediaStageProps) {
	const selectedMediaIsVideo = selectedMedia.mediaType === "video";
	const selectedVideoAspectRatio =
		selectedMediaIsVideo &&
		selectedMedia.width &&
		selectedMedia.height &&
		selectedMedia.width > 0 &&
		selectedMedia.height > 0
			? selectedMedia.width / selectedMedia.height
			: null;
	const isMediaZoomed = mediaTransform.scale > mediaMinScale;
	const selectedMetadataItems = getMetadataPanelItems(selectedMedia);
	const {
		finishMediaGesture,
		handleMediaStageClick,
		handleMetadataClick,
		startMediaGesture,
		updateMediaGesture,
	} = useMediaStageGesture({
		activePointersRef,
		hasMultipleMedia,
		isMediaZoomed,
		mediaDoubleTapRef,
		mediaTransformRef,
		onClose,
		onNext,
		onPrevious,
		panGestureRef,
		pinchGestureRef,
		resetMediaDoubleTap,
		selectedMediaSurfaceRef,
		selectedMediaIsVideo,
		setIsMediaGestureActive,
		setMediaTransformState,
		setSwipeOffsetState,
		shouldSuppressStageClickRef,
		swipeGestureRef,
	});

	return (
		<div
			className="flex h-full min-h-0 w-full touch-none select-none flex-col items-center justify-center gap-4"
			data-media-modal-surface
			onClickCapture={handleMediaStageClick}
			onPointerCancel={finishMediaGesture}
			onPointerDown={startMediaGesture}
			onPointerMove={updateMediaGesture}
			onPointerUp={finishMediaGesture}
			role="presentation"
		>
			{selectedMedia.mediaType === "video" ? (
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
							className={`block h-full max-h-[calc(100svh-10rem)] w-full select-none border border-[var(--overlay0)] bg-[var(--surface0)] object-contain will-change-transform ${
								isMediaGestureActive
									? ""
									: "transition-transform duration-150 ease-out"
							}`}
							controls
							loop
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
						className={`max-h-[calc(100svh-10rem)] max-w-full select-none border border-[var(--overlay0)] bg-[var(--surface0)] will-change-transform ${
							isMediaGestureActive
								? ""
								: "transition-transform duration-150 ease-out"
						}`}
						controls
						loop
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
					className={`max-h-[calc(100svh-10rem)] max-w-full select-none border border-[var(--overlay0)] bg-[var(--surface0)] object-contain will-change-transform ${
						isMediaGestureActive
							? ""
							: "transition-transform duration-150 ease-out"
					} ${isMediaZoomed ? (isMediaGestureActive ? "cursor-grabbing" : "cursor-grab") : ""}`}
					draggable={false}
					ref={selectedMediaSurfaceRef as RefObject<HTMLImageElement>}
					src={selectedMedia.url}
					style={{
						transform: `translate3d(${mediaTransform.translateX + swipeOffset.x}px, ${
							mediaTransform.translateY + swipeOffset.y
						}px, 0) scale(${mediaTransform.scale})`,
					}}
				/>
			)}

			<MediaMetadata
				itemCount={media.length}
				items={selectedMetadataItems}
				onClick={handleMetadataClick}
				selectedIndex={selectedIndex}
			/>
		</div>
	);
}
