import type { ArticleMedia } from "@/core/article/domain";
import { InlineMediaFrame } from "./MediaPrimitives";
import { getMediaTakenTimeLabel } from "./metadata";
import type { InlineSwipeTrack, SwipeGesture } from "./types";
import { useInlineCarouselGesture } from "./useInlineCarouselGesture";
import { getWrappedIndex } from "./utils";

type MediaInlineCarouselProps = {
	activeInlineIndex: number;
	articleId: string;
	authorName: string;
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

export function MediaInlineCarousel({
	activeInlineIndex,
	articleId,
	authorName,
	hasMultipleMedia,
	inlineCarousel,
	inlineSwipeGestureRef,
	inlineSwipeTrack,
	media,
	onOpenAt,
	setInlineIndex,
	setInlineSwipeTrack,
	shouldSuppressInlineClickRef,
}: MediaInlineCarouselProps) {
	const normalizedActiveInlineIndex =
		media.length > 0 ? getWrappedIndex(activeInlineIndex, media.length) : 0;
	const activeInlineMedia = media[normalizedActiveInlineIndex] ?? media[0];
	const activeInlineTakenTime = getMediaTakenTimeLabel(activeInlineMedia);
	const {
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
		renderedInlineSwipeTrack,
	} = useInlineCarouselGesture({
		activeInlineIndex: normalizedActiveInlineIndex,
		hasMultipleMedia,
		inlineCarousel,
		inlineSwipeGestureRef,
		inlineSwipeTrack,
		media,
		onOpenAt,
		setInlineIndex,
		setInlineSwipeTrack,
		shouldSuppressInlineClickRef,
	});

	if (!inlineCarousel) {
		return null;
	}

	return (
		<figure
			aria-label={`${authorName}의 글 미디어`}
			className="m-0 min-w-0 overflow-hidden border border-[var(--overlay0)] bg-[var(--surface0)] sm:hidden"
		>
			<button
				aria-label={`${authorName}의 산행 사진이나 동영상 ${activeInlineMedia.order}`}
				className="group relative block h-auto w-full appearance-none overflow-hidden bg-transparent p-0 text-left leading-none focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2"
				onClick={handleInlineTriggerClick}
				onPointerCancel={handleInlinePointerCancel}
				onPointerDown={handleInlinePointerDown}
				onPointerMove={handleInlinePointerMove}
				onPointerUp={handleInlinePointerUp}
				onTouchCancel={handleInlineTouchCancel}
				onTouchEnd={handleInlineTouchEnd}
				onTouchMove={handleInlineTouchMove}
				onTouchStart={handleInlineTouchStart}
				type="button"
			>
				<InlineMediaFrame authorName={authorName} media={activeInlineMedia} />
				{renderedInlineSwipeTrack ? (
					<span
						aria-hidden="true"
						className={`pointer-events-none absolute inset-0 grid w-[300%] grid-cols-3 will-change-transform ${
							renderedInlineSwipeTrack.settling
								? "transition-transform duration-150 ease-out"
								: ""
						}`}
						onTransitionEnd={handleInlineSwipeTrackTransitionEnd}
						style={{
							transform: `translate3d(calc(-33.333333% + ${renderedInlineSwipeTrack.offsetX}px), 0, 0)`,
						}}
					>
						<InlineMediaFrame
							authorName={authorName}
							media={media[renderedInlineSwipeTrack.previousIndex] ?? null}
						/>
						<InlineMediaFrame
							authorName={authorName}
							media={media[renderedInlineSwipeTrack.fromIndex] ?? null}
						/>
						<InlineMediaFrame
							authorName={authorName}
							media={media[renderedInlineSwipeTrack.nextIndex] ?? null}
						/>
					</span>
				) : null}
			</button>

			<figcaption className="grid min-w-0 gap-1 px-2 py-1 font-mono text-[0.8125rem] text-[var(--subtext0)] leading-snug">
				<div className="flex min-w-0 items-center justify-between gap-2">
					<span>
						{activeInlineMedia.mediaType} {activeInlineMedia.order}/
						{media.length}
					</span>
					{activeInlineTakenTime ? <span>{activeInlineTakenTime}</span> : null}
				</div>
				{hasMultipleMedia ? (
					// biome-ignore lint/a11y/useAriaPropsSupportedByRole: TODO: fix
					<div
						aria-label="글 미디어 위치"
						className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-1.5 overflow-hidden px-2 py-1"
					>
						{media.map((item, index) => (
							<span
								aria-current={
									index === normalizedActiveInlineIndex ? "true" : undefined
								}
								aria-label={`${index + 1}번째 미디어`}
								className={`block size-1.5 border border-[var(--overlay0)] ${
									index === normalizedActiveInlineIndex
										? "bg-[var(--foreground0)]"
										: "bg-transparent"
								}`}
								key={`${articleId}-${item.order}-dot`}
								role="img"
							/>
						))}
					</div>
				) : null}
			</figcaption>
		</figure>
	);
}
