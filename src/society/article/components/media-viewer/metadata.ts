import type { ArticleMediaViewModel as ArticleMedia } from "#/society/shared/viewModels";

import type { MetadataPanelItem } from "./types";

function normalizeMetadataValue(value: string | null | undefined) {
	const normalized = value?.trim();
	return normalized ? normalized : null;
}

function formatMetadataTime(
	rawPeriodPrefix: string | undefined,
	rawHour: string,
	rawMinute: string,
	rawSecond: string | undefined,
	rawPeriodSuffix: string | undefined,
) {
	const hour = Number(rawHour);
	const minute = Number(rawMinute);
	const second = rawSecond ? Number(rawSecond) : null;

	if (
		!Number.isInteger(hour) ||
		!Number.isInteger(minute) ||
		hour > 23 ||
		minute > 59 ||
		(second !== null && (!Number.isInteger(second) || second > 59))
	) {
		return null;
	}

	const period = (rawPeriodPrefix ?? rawPeriodSuffix)?.toLowerCase();
	let normalizedHour = hour;

	if (period === "pm" || period === "오후") {
		normalizedHour = hour === 12 ? 12 : hour + 12;
	} else if (period === "am" || period === "오전") {
		normalizedHour = hour === 12 ? 0 : hour;
	}

	if (normalizedHour > 23) {
		return null;
	}

	return [
		String(normalizedHour).padStart(2, "0"),
		String(minute).padStart(2, "0"),
		second === null ? null : String(second).padStart(2, "0"),
	]
		.filter((part): part is string => part !== null)
		.join(":");
}

function formatMetadataDateTime(value: string | null | undefined) {
	const normalized = normalizeMetadataValue(value)?.replace(
		/^(\d{4})[:/-](\d{2})[:/-](\d{2})(?=[ T]|$)/,
		"$1-$2-$3",
	);

	if (!normalized) {
		return null;
	}

	const match = normalized.match(
		/^(?:(\d{4}-\d{2}-\d{2})(?:[ T]+|$))?(?:(AM|PM|오전|오후)\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM|오전|오후))?$/i,
	);

	if (!match) {
		return normalized;
	}

	const [, date, periodPrefix, hour, minute, second, periodSuffix] = match;
	const time = formatMetadataTime(
		periodPrefix,
		hour,
		minute,
		second,
		periodSuffix,
	);

	if (!time) {
		return normalized;
	}

	return date ? `${date} ${time}` : time;
}

export function getMediaTakenTimeLabel(media: ArticleMedia) {
	if (media.mediaType !== "image") {
		return null;
	}

	const dateTime = normalizeMetadataValue(media.metadata?.dateTime);

	if (!dateTime) {
		return null;
	}

	const match = dateTime.match(
		/^(?:(?:\d{4}[:/-]\d{2}[:/-]\d{2})[ T])?(\d{1,2}):(\d{2})(?::\d{2})?/,
	);

	if (!match) {
		return null;
	}

	const hour = Number(match[1]);
	const minute = Number(match[2]);

	if (
		!Number.isInteger(hour) ||
		!Number.isInteger(minute) ||
		hour > 23 ||
		minute > 59
	) {
		return null;
	}

	return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getCameraLabel(media: ArticleMedia) {
	const make = normalizeMetadataValue(media.metadata?.make);
	const model = normalizeMetadataValue(media.metadata?.model);

	if (make && model) {
		return model.toLowerCase().includes(make.toLowerCase())
			? model
			: `${make} ${model}`;
	}

	return model ?? make;
}

function formatIso(value: string | null | undefined) {
	const normalized = normalizeMetadataValue(value);

	if (!normalized) {
		return null;
	}

	return normalized.toLowerCase().startsWith("iso")
		? normalized.toUpperCase()
		: `ISO ${normalized}`;
}

function getExposureItems(media: ArticleMedia) {
	const shutterSpeed =
		normalizeMetadataValue(media.metadata?.exposureTime) ??
		normalizeMetadataValue(media.metadata?.shutterSpeedValue);

	return [
		normalizeMetadataValue(media.metadata?.fNumber),
		shutterSpeed,
		formatIso(media.metadata?.isoSpeedRatings),
	].filter((value): value is string => Boolean(value));
}

export function getMetadataPanelItems(
	media: ArticleMedia,
): MetadataPanelItem[] {
	if (media.mediaType !== "image" || !media.metadata) {
		return [];
	}

	const camera = getCameraLabel(media);
	const exposureItems = getExposureItems(media);
	const focalLength = normalizeMetadataValue(
		media.metadata.focalLengthIn35mmFilm,
	);
	const dateTime = formatMetadataDateTime(media.metadata.dateTime);

	return [
		camera ? { label: "camera", value: camera } : null,
		exposureItems.length > 0
			? { label: "exposure", value: exposureItems.join(" · ") }
			: null,
		focalLength ? { label: "lens", value: focalLength } : null,
		dateTime ? { label: "taken", value: dateTime } : null,
	].filter((item): item is MetadataPanelItem => item !== null);
}
