import type { TouchEvent } from "react";

import {
	mediaHorizontalSwipeRatio,
	mediaPanClickSuppressThresholdPx,
} from "./constants";
import type { GesturePointer, SwipeAxis } from "./types";

export function suppressNextClickTemporarily(suppressClickRef: {
	current: boolean;
}) {
	suppressClickRef.current = true;
	window.setTimeout(() => {
		suppressClickRef.current = false;
	}, 250);
}

export function releasePointerCaptureIfActive(
	element: HTMLElement,
	pointerId: number,
) {
	if (element.hasPointerCapture(pointerId)) {
		element.releasePointerCapture(pointerId);
	}
}

export function getWrappedIndex(index: number, length: number) {
	return (index + length) % length;
}

export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function getPointerDistance(
	firstPointer: GesturePointer,
	secondPointer: GesturePointer,
) {
	return Math.hypot(
		firstPointer.x - secondPointer.x,
		firstPointer.y - secondPointer.y,
	);
}

export function getTouchByIdentifier(
	touches: TouchEvent<HTMLElement>["touches"],
	identifier: number,
) {
	for (let index = 0; index < touches.length; index += 1) {
		const touch = touches.item(index);

		if (touch?.identifier === identifier) {
			return touch;
		}
	}

	return null;
}

export function getDominantSwipeAxis(
	deltaX: number,
	deltaY: number,
): SwipeAxis | null {
	const absDeltaX = Math.abs(deltaX);
	const absDeltaY = Math.abs(deltaY);

	if (
		absDeltaX < mediaPanClickSuppressThresholdPx &&
		absDeltaY < mediaPanClickSuppressThresholdPx
	) {
		return null;
	}

	return absDeltaX >= absDeltaY ? "horizontal" : "vertical";
}

export function getInlineSwipeAxis(
	deltaX: number,
	deltaY: number,
): SwipeAxis | null {
	const absDeltaX = Math.abs(deltaX);
	const absDeltaY = Math.abs(deltaY);

	if (
		absDeltaX < mediaPanClickSuppressThresholdPx &&
		absDeltaY < mediaPanClickSuppressThresholdPx
	) {
		return null;
	}

	if (absDeltaY >= absDeltaX * mediaHorizontalSwipeRatio) {
		return "vertical";
	}

	return "horizontal";
}
