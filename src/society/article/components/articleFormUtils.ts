import {
	compressPreparedImageSource,
	type PreparedImageSource,
	prepareImageSource,
} from "#/society/media/imageCompression";
import {
	createArticleMediaMetadataSummary,
	readOriginalPhotoMetadata,
} from "#/society/media/photoMetadata";
import { createCompressedMp4File } from "#/society/media/videoCompression";
import type { Article } from "@/core/article/domain";
import type { DraftMedia } from "./articleFormTypes";

const maxCompressedPhotoWidth = 2048;
const maxCompressedVideoWidth = 1080;
const maxVideoDurationMs = 90 * 1000;
const maxVideoSourceBytes = 120 * 1024 * 1024;
const webpQuality = 50;

export function getArticleFormDefaults(article?: Article) {
	return {
		body: article?.body ?? "",
		media:
			article?.media.map((media) => ({
				...media,
				fileName: media.url.split("/").at(-1) ?? `media-${media.order}`,
				fileSize: media.byteSize,
			})) ?? [],
	};
}

export function createDraftMedia(
	file: File,
	order: number,
	metadata: Pick<
		DraftMedia,
		| "durationMs"
		| "height"
		| "mediaType"
		| "metadata"
		| "originalMetadata"
		| "preparedSource"
		| "rotation"
		| "thumbnailFile"
		| "thumbnailUrl"
		| "width"
	>,
): DraftMedia {
	return {
		...metadata,
		fileName: file.name,
		file,
		fileSize: file.size,
		lastModified: file.lastModified,
		order,
		url: URL.createObjectURL(file),
	};
}

export async function createCompressedDraftMedia(
	file: File,
	order: number,
	onProgress?: (progress: number) => void,
): Promise<DraftMedia> {
	if (file.type.startsWith("video/")) {
		const compressedVideo = await createCompressedMp4File(file, {
			maxDurationMs: maxVideoDurationMs,
			maxSourceBytes: maxVideoSourceBytes,
			maxWidth: maxCompressedVideoWidth,
			onProgress,
		});

		return createDraftMedia(compressedVideo.file, order, {
			durationMs: compressedVideo.durationMs,
			height: compressedVideo.height,
			mediaType: "video",
			metadata: null,
			originalMetadata: null,
			thumbnailFile: compressedVideo.thumbnailFile,
			thumbnailUrl: URL.createObjectURL(compressedVideo.thumbnailFile),
			width: compressedVideo.width,
		});
	}

	const [preparedSource, originalMetadata] = await Promise.all([
		prepareImageSource(file),
		readOriginalPhotoMetadata(file),
	]);
	const compressedFile = await compressPreparedImageSource(preparedSource, {
		maxWidth: maxCompressedPhotoWidth,
		quality: webpQuality,
	});

	return createDraftMedia(compressedFile, order, {
		durationMs: null,
		height: null,
		mediaType: "image",
		metadata: createArticleMediaMetadataSummary(originalMetadata),
		originalMetadata,
		preparedSource,
		rotation: 0,
		thumbnailFile: undefined,
		thumbnailUrl: null,
		width: null,
	});
}

// Rotation re-encodes the already-prepared source at the new cumulative angle, so
// repeated rotations stay a single encode generation without re-decoding the source.
export async function rotateDraftMediaFile(
	source: PreparedImageSource,
	quarterTurns: number,
): Promise<File> {
	return compressPreparedImageSource(source, {
		maxWidth: maxCompressedPhotoWidth,
		quality: webpQuality,
		quarterTurns,
	});
}

function getDraftMediaTakenTimeMs(media: DraftMedia) {
	if (media.mediaType !== "image") {
		return null;
	}

	const dateTime = media.metadata?.dateTime?.trim();

	if (!dateTime) {
		return null;
	}

	const match = dateTime.match(
		/^(\d{4})[:/-](\d{2})[:/-](\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
	);

	if (!match) {
		return null;
	}

	const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
	const dateParts = [year, month, day, hour, minute, second].map(Number);

	if (dateParts.some((part) => !Number.isInteger(part))) {
		return null;
	}

	const [
		parsedYear,
		parsedMonth,
		parsedDay,
		parsedHour,
		parsedMinute,
		parsedSecond,
	] = dateParts;

	if (
		parsedMonth < 1 ||
		parsedMonth > 12 ||
		parsedDay < 1 ||
		parsedDay > 31 ||
		parsedHour > 23 ||
		parsedMinute > 59 ||
		parsedSecond > 59
	) {
		return null;
	}

	return Date.UTC(
		parsedYear,
		parsedMonth - 1,
		parsedDay,
		parsedHour,
		parsedMinute,
		parsedSecond,
	);
}

function getBatchSortRank(media: DraftMedia) {
	if (media.mediaType === "video") {
		return 0;
	}

	return getDraftMediaTakenTimeMs(media) === null ? 2 : 1;
}

export function sortNewDraftMedias(mediaItems: readonly DraftMedia[]) {
	return [...mediaItems].sort((left, right) => {
		const rankDiff = getBatchSortRank(left) - getBatchSortRank(right);

		if (rankDiff !== 0) {
			return rankDiff;
		}

		const leftTakenTimeMs = getDraftMediaTakenTimeMs(left);
		const rightTakenTimeMs = getDraftMediaTakenTimeMs(right);

		if (leftTakenTimeMs !== null && rightTakenTimeMs !== null) {
			const takenTimeDiff = leftTakenTimeMs - rightTakenTimeMs;

			if (takenTimeDiff !== 0) {
				return takenTimeDiff;
			}
		}

		return left.order - right.order;
	});
}

export function getMediaDuplicateKey(media: DraftMedia) {
	if (
		typeof media.fileSize !== "number" ||
		typeof media.lastModified !== "number"
	) {
		return null;
	}

	return `${media.fileName}:${media.fileSize}:${media.lastModified}`;
}

export function getDuplicateMediaKeys(mediaItems: readonly DraftMedia[]) {
	const mediaKeyCounts = new Map<string, number>();

	for (const media of mediaItems) {
		const duplicateKey = getMediaDuplicateKey(media);

		if (duplicateKey === null) {
			continue;
		}

		mediaKeyCounts.set(
			duplicateKey,
			(mediaKeyCounts.get(duplicateKey) ?? 0) + 1,
		);
	}

	return new Set(
		[...mediaKeyCounts.entries()]
			.filter(([, count]) => count > 1)
			.map(([duplicateKey]) => duplicateKey),
	);
}

export function revokeDraftMediaUrl(media: DraftMedia) {
	if (media.url.startsWith("blob:")) {
		URL.revokeObjectURL(media.url);
	}

	if (media.thumbnailUrl?.startsWith("blob:")) {
		URL.revokeObjectURL(media.thumbnailUrl);
	}
}
