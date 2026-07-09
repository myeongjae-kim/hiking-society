import type { ArticleId } from "@/core/article/domain";
import {
	ARTICLE_MEDIA_REQUIRED_MESSAGE,
	ArticleMediaCollection,
} from "@/core/article/domain/ArticlePolicy";
import type {
	ArticleMediaUpload,
	ExistingArticleMediaInput,
} from "@/core/article/model/ArticleMediaCommand";
import type { UserRole } from "@/core/auth/model/roles";
import type {
	Altitude,
	IsoDateString,
	IsoDateTimeString,
	Latitude,
	Longitude,
	Timezone,
} from "@/core/common/domain";
import type { HikingId } from "@/core/hiking/domain";
import { ApiError } from "./ApiError";

export function badRequest(message: string) {
	return new ApiError({ error: "BAD_REQUEST", message, status: 400 });
}

export function forbidden(message = "권한이 없습니다.") {
	return new ApiError({ error: "FORBIDDEN", message, status: 403 });
}

export function notFound(message = "대상을 찾을 수 없습니다.") {
	return new ApiError({ error: "NOT_FOUND", message, status: 404 });
}

export function toNumericId<T extends string>(
	value: string | undefined,
	label = "id",
) {
	if (!value || !/^\d+$/.test(value)) {
		throw badRequest(`잘못된 ${label}입니다.`);
	}

	return value as T;
}

export function makeDateTime(date: string, time: string, timezone: string) {
	const offset = timezone === "Asia/Seoul" ? "+09:00" : "";
	return `${date}T${time}:00${offset}` as IsoDateTimeString;
}

export function toHikingValues(values: {
	altitude?: number | null;
	completedTime: string;
	hikingDate: string;
	latitude: number;
	longitude: number;
	mountainName: string;
	participantsCsv: string;
	restaurantAddress: string;
	startedTime: string;
	timezone: string;
}) {
	return {
		altitude: values.altitude == null ? null : (values.altitude as Altitude),
		completedAt: makeDateTime(
			values.hikingDate,
			values.completedTime,
			values.timezone,
		),
		hikingDate: values.hikingDate as IsoDateString,
		latitude: values.latitude as Latitude,
		longitude: values.longitude as Longitude,
		mountainName: values.mountainName,
		participantsCsv: values.participantsCsv,
		restaurantAddress: values.restaurantAddress || null,
		startedAt: makeDateTime(
			values.hikingDate,
			values.startedTime,
			values.timezone,
		),
		timezone: values.timezone as Timezone,
	};
}

export function toArticleMedia(input: {
	existingMedia: readonly ExistingArticleMediaInput[];
	uploadedMedia: readonly ArticleMediaUpload[];
}) {
	const media = ArticleMediaCollection.from([
		...input.existingMedia,
		...input.uploadedMedia,
	]);

	if (!media.isPublishable()) {
		throw badRequest(ARTICLE_MEDIA_REQUIRED_MESSAGE);
	}

	return media.sortByOrder();
}

export function successRevalidationPaths(articleId?: ArticleId | null) {
	const paths = ["/feed"];

	if (articleId) {
		paths.push(`/article/${articleId}`);
	}

	return paths;
}

export function assertMutableRole(value: string): asserts value is UserRole {
	if (value !== "associate" && value !== "member" && value !== "admin") {
		throw badRequest("잘못된 권한입니다.");
	}
}

export function getArticlePath(articleId: ArticleId) {
	return `/article/${articleId}`;
}

export function toHikingId(value: string | undefined) {
	return toNumericId<HikingId>(value, "산행 id");
}

export function toArticleId(value: string | undefined) {
	return toNumericId<ArticleId>(value, "글 id");
}
