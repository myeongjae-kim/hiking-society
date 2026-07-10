import type { ReactNode } from "react";

import type { ArticleMediaViewModel as ArticleMedia } from "#/society/shared/viewModels";

export type MediaViewerProps = {
	articleId: string;
	authorName: string;
	initialIndex?: number;
	inlineCarousel?: boolean;
	media: readonly ArticleMedia[];
	thumbnailGridClassName?: string;
	trigger?: ReactNode;
	triggerClassName?: string;
	viewerCommand?: string;
	viewerLabel?: string;
};

export type MediaTransform = {
	scale: number;
	translateX: number;
	translateY: number;
};

export type GesturePointer = {
	x: number;
	y: number;
};

export type PanGesture = {
	pointerId: number;
	startTranslateX: number;
	startTranslateY: number;
	startX: number;
	startY: number;
};

export type PinchGesture = {
	startDistance: number;
	startScale: number;
};

export type SwipeAxis = "horizontal" | "vertical";

export type SwipeGesture = {
	axis: SwipeAxis | null;
	pointerId: number;
	startX: number;
	startY: number;
};

export type SwipeOffset = {
	x: number;
	y: number;
};

export type DoubleTapTrack = {
	timeStamp: number;
	x: number;
	y: number;
};

export type InlineSwipeTrack = {
	fromIndex: number;
	nextIndex: number;
	offsetX: number;
	previousIndex: number;
	settling: boolean;
	targetIndex: number;
};

export type MetadataPanelItem = {
	label: string;
	value: string;
};
