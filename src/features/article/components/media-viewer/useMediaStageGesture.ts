import type { MouseEvent, PointerEvent } from "react";
import { useCallback } from "react";

import {
	initialMediaTransform,
	initialSwipeOffset,
	mediaDoubleTapMaxDistancePx,
	mediaDoubleTapScale,
	mediaDoubleTapTimeoutMs,
	mediaHorizontalSwipeRatio,
	mediaMaxScale,
	mediaMinScale,
	mediaNavigationClickZoneRatio,
	mediaPanClickSuppressThresholdPx,
	mediaSwipePreviewMaxHeightRatio,
	mediaSwipePreviewMaxWidthRatio,
	mediaSwipeThresholdPx,
} from "./constants";
import type {
	DoubleTapTrack,
	GesturePointer,
	MediaTransform,
	PanGesture,
	PinchGesture,
	SwipeGesture,
	SwipeOffset,
} from "./types";
import { clamp, getDominantSwipeAxis, getPointerDistance } from "./utils";

type UseMediaStageGestureOptions = {
	activePointersRef: React.MutableRefObject<Map<number, GesturePointer>>;
	hasMultipleMedia: boolean;
	isMediaZoomed: boolean;
	mediaDoubleTapRef: React.MutableRefObject<DoubleTapTrack | null>;
	mediaTransformRef: React.MutableRefObject<MediaTransform>;
	onClose: () => void;
	onNext: () => void;
	onPrevious: () => void;
	panGestureRef: React.MutableRefObject<PanGesture | null>;
	pinchGestureRef: React.MutableRefObject<PinchGesture | null>;
	resetMediaDoubleTap: () => void;
	selectedMediaSurfaceRef: React.MutableRefObject<HTMLElement | null>;
	selectedMediaIsVideo: boolean;
	setIsMediaGestureActive: (active: boolean) => void;
	setMediaTransformState: (nextTransform: MediaTransform) => void;
	setSwipeOffsetState: (nextOffset: SwipeOffset) => void;
	shouldSuppressStageClickRef: React.MutableRefObject<boolean>;
	swipeGestureRef: React.MutableRefObject<SwipeGesture | null>;
};

export function useMediaStageGesture({
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
}: UseMediaStageGestureOptions) {
	const handleMediaDoubleTapCandidate = useCallback(
		(event: PointerEvent<HTMLDivElement>, startX: number, startY: number) => {
			if (event.pointerType !== "touch" || selectedMediaIsVideo) {
				resetMediaDoubleTap();
				return false;
			}

			const deltaX = event.clientX - startX;
			const deltaY = event.clientY - startY;

			if (
				Math.abs(deltaX) >= mediaPanClickSuppressThresholdPx ||
				Math.abs(deltaY) >= mediaPanClickSuppressThresholdPx
			) {
				resetMediaDoubleTap();
				return false;
			}

			const mediaRect =
				selectedMediaSurfaceRef.current?.getBoundingClientRect();

			if (
				!mediaRect ||
				event.clientX < mediaRect.left ||
				event.clientX > mediaRect.right ||
				event.clientY < mediaRect.top ||
				event.clientY > mediaRect.bottom
			) {
				resetMediaDoubleTap();
				return false;
			}

			const tapPositionRatio =
				mediaRect.width > 0
					? (event.clientX - mediaRect.left) / mediaRect.width
					: 0.5;
			const isCurrentlyZoomed = mediaTransformRef.current.scale > mediaMinScale;

			if (
				!isCurrentlyZoomed &&
				(tapPositionRatio <= mediaNavigationClickZoneRatio ||
					tapPositionRatio >= 1 - mediaNavigationClickZoneRatio)
			) {
				resetMediaDoubleTap();
				return false;
			}

			const lastTap = mediaDoubleTapRef.current;
			const isDoubleTap =
				lastTap !== null &&
				event.timeStamp - lastTap.timeStamp <= mediaDoubleTapTimeoutMs &&
				Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) <=
					mediaDoubleTapMaxDistancePx;

			if (!isDoubleTap) {
				mediaDoubleTapRef.current = {
					timeStamp: event.timeStamp,
					x: event.clientX,
					y: event.clientY,
				};
				return false;
			}

			event.preventDefault();
			shouldSuppressStageClickRef.current = true;
			resetMediaDoubleTap();

			if (isCurrentlyZoomed) {
				setMediaTransformState(initialMediaTransform);
				return true;
			}

			setMediaTransformState({
				scale: mediaDoubleTapScale,
				translateX: 0,
				translateY: 0,
			});
			return true;
		},
		[
			mediaDoubleTapRef,
			mediaTransformRef,
			resetMediaDoubleTap,
			selectedMediaIsVideo,
			selectedMediaSurfaceRef,
			setMediaTransformState,
			shouldSuppressStageClickRef,
		],
	);

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
				resetMediaDoubleTap();
				onClose();
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
					mediaRect.width > 0
						? (event.clientX - mediaRect.left) / mediaRect.width
						: 0.5;

				if (clickPositionRatio <= mediaNavigationClickZoneRatio) {
					onPrevious();
					return;
				}

				if (clickPositionRatio >= 1 - mediaNavigationClickZoneRatio) {
					onNext();
				}
			}
		},
		[
			hasMultipleMedia,
			isMediaZoomed,
			onClose,
			onNext,
			onPrevious,
			resetMediaDoubleTap,
			selectedMediaIsVideo,
			selectedMediaSurfaceRef,
			shouldSuppressStageClickRef,
		],
	);

	const handleMetadataClick = useCallback(
		(event: MouseEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			resetMediaDoubleTap();
			onClose();
		},
		[onClose, resetMediaDoubleTap],
	);

	const startMediaGesture = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (event.pointerType === "mouse" && event.button !== 0) {
				return;
			}

			const selectedMediaSurface = selectedMediaSurfaceRef.current;

			if (
				!(event.target instanceof Node) ||
				!selectedMediaSurface?.contains(event.target)
			) {
				return;
			}

			activePointersRef.current.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			});
			event.currentTarget.setPointerCapture(event.pointerId);
			setIsMediaGestureActive(true);

			if (selectedMediaIsVideo) {
				resetMediaDoubleTap();

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
				resetMediaDoubleTap();
				panGestureRef.current = null;
				pinchGestureRef.current = {
					startDistance: getPointerDistance(
						activePointers[0],
						activePointers[1],
					),
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
		[
			activePointersRef,
			mediaTransformRef,
			panGestureRef,
			pinchGestureRef,
			resetMediaDoubleTap,
			selectedMediaIsVideo,
			selectedMediaSurfaceRef,
			setIsMediaGestureActive,
			setSwipeOffsetState,
			shouldSuppressStageClickRef,
			swipeGestureRef,
		],
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

				if (axis === "horizontal") {
					const maxSwipeOffsetX =
						window.innerWidth * mediaSwipePreviewMaxWidthRatio;
					setSwipeOffsetState({
						x: clamp(deltaX, -maxSwipeOffsetX, maxSwipeOffsetX),
						y: 0,
					});
					return;
				}

				const maxSwipeOffsetY =
					window.innerHeight * mediaSwipePreviewMaxHeightRatio;
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
					(pinchGesture.startScale *
						getPointerDistance(activePointers[0], activePointers[1])) /
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

				if (axis === "horizontal") {
					const maxSwipeOffsetX =
						window.innerWidth * mediaSwipePreviewMaxWidthRatio;
					setSwipeOffsetState({
						x: clamp(deltaX, -maxSwipeOffsetX, maxSwipeOffsetX),
						y: 0,
					});
					return;
				}

				const maxSwipeOffsetY =
					window.innerHeight * mediaSwipePreviewMaxHeightRatio;
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
		[
			activePointersRef,
			mediaTransformRef,
			panGestureRef,
			pinchGestureRef,
			selectedMediaIsVideo,
			setMediaTransformState,
			setSwipeOffsetState,
			shouldSuppressStageClickRef,
			swipeGestureRef,
		],
	);

	const finishMediaGesture = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (!activePointersRef.current.has(event.pointerId)) {
				return;
			}

			if (event.currentTarget.hasPointerCapture(event.pointerId)) {
				event.currentTarget.releasePointerCapture(event.pointerId);
			}

			const pointerStartedWithMultiplePointers =
				activePointersRef.current.size > 1;
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
					axis === "horizontal" &&
					absDeltaX >= mediaSwipeThresholdPx &&
					absDeltaX >= absDeltaY * mediaHorizontalSwipeRatio;
				const isVerticalSwipe =
					axis === "vertical" &&
					absDeltaY >= mediaSwipeThresholdPx &&
					absDeltaY >= absDeltaX * mediaHorizontalSwipeRatio;

				if (isHorizontalSwipe && hasMultipleMedia) {
					shouldSuppressStageClickRef.current = true;

					if (deltaX > 0) {
						onPrevious();
					} else {
						onNext();
					}

					return;
				}

				if (isVerticalSwipe) {
					shouldSuppressStageClickRef.current = true;
					resetMediaDoubleTap();
					setSwipeOffsetState(initialSwipeOffset);
					onClose();
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
					axis === "horizontal" &&
					absDeltaX >= mediaSwipeThresholdPx &&
					absDeltaX >= absDeltaY * mediaHorizontalSwipeRatio;
				const isVerticalSwipe =
					axis === "vertical" &&
					absDeltaY >= mediaSwipeThresholdPx &&
					absDeltaY >= absDeltaX * mediaHorizontalSwipeRatio;
				swipeGestureRef.current = null;

				if (isHorizontalSwipe && hasMultipleMedia) {
					shouldSuppressStageClickRef.current = true;

					if (deltaX > 0) {
						onPrevious();
					} else {
						onNext();
					}

					return;
				}

				if (isVerticalSwipe) {
					shouldSuppressStageClickRef.current = true;
					resetMediaDoubleTap();
					setIsMediaGestureActive(false);
					setSwipeOffsetState(initialSwipeOffset);
					onClose();
					return;
				}

				if (
					!pointerStartedWithMultiplePointers &&
					handleMediaDoubleTapCandidate(
						event,
						swipeGesture.startX,
						swipeGesture.startY,
					)
				) {
					setIsMediaGestureActive(false);
					setSwipeOffsetState(initialSwipeOffset);
					return;
				}

				setSwipeOffsetState(initialSwipeOffset);
			}

			if (
				!pointerStartedWithMultiplePointers &&
				panGestureRef.current?.pointerId === event.pointerId &&
				handleMediaDoubleTapCandidate(
					event,
					panGestureRef.current.startX,
					panGestureRef.current.startY,
				)
			) {
				panGestureRef.current = null;
				setIsMediaGestureActive(false);
				setSwipeOffsetState(initialSwipeOffset);
				return;
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

			if (
				activePointers.length === 1 &&
				mediaTransformRef.current.scale > mediaMinScale
			) {
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
		[
			activePointersRef,
			handleMediaDoubleTapCandidate,
			hasMultipleMedia,
			mediaTransformRef,
			onClose,
			onNext,
			onPrevious,
			panGestureRef,
			pinchGestureRef,
			resetMediaDoubleTap,
			selectedMediaIsVideo,
			setIsMediaGestureActive,
			setSwipeOffsetState,
			shouldSuppressStageClickRef,
			swipeGestureRef,
		],
	);

	return {
		finishMediaGesture,
		handleMediaStageClick,
		handleMetadataClick,
		startMediaGesture,
		updateMediaGesture,
	};
}
