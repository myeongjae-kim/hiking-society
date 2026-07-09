import { and, eq, isNull, ne, sql } from "drizzle-orm";
import type { ArticleCommandPort } from "@/core/article/application/port/out/ArticleCommandPort";
import type {
	ArticleId,
	ArticleMediaMetadataSummary,
} from "@/core/article/domain";
import type {
	ExistingArticleMediaInput,
	StoredArticleMedia,
} from "@/core/article/model/ArticleMediaCommand";
import { applicationError } from "@/core/common/application/ApplicationError";
import { db } from "@/core/common/adapter/drizzle.server";
import type { HikingId } from "@/core/hiking/domain";
import {
	articleMediaMetadataTable,
	articleMediaTable,
	articleTable,
	hikingTable,
	userTable,
} from "@/drizzle/schema";

function toNumericId(id: string) {
	const numericId = Number(id);

	if (!Number.isInteger(numericId) || numericId <= 0) {
		throw applicationError.badRequest("잘못된 id입니다.");
	}

	return numericId;
}

function toOriginalMetadata(value: unknown) {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === "string") {
		try {
			const parsed: unknown = JSON.parse(value);
			return toOriginalMetadata(parsed);
		} catch {
			return null;
		}
	}

	if (typeof value !== "object" || Array.isArray(value)) {
		return null;
	}

	return value as Record<string, unknown>;
}

function toRequiredOriginalMetadataJsonb(value: Record<string, unknown>) {
	return sql`${JSON.stringify(value)}::jsonb`;
}

function getMetadataDescription(
	metadata: Record<string, unknown>,
	tagName: string,
) {
	const exif = metadata.exif;

	if (typeof exif !== "object" || exif === null || Array.isArray(exif)) {
		return null;
	}

	const tag = (exif as Record<string, unknown>)[tagName];

	if (typeof tag !== "object" || tag === null || Array.isArray(tag)) {
		return null;
	}

	const description = (tag as Record<string, unknown>).description;

	if (typeof description === "string") {
		return description;
	}

	if (typeof description === "number" && Number.isFinite(description)) {
		return String(description);
	}

	return null;
}

function getMetadataTakenDateTime(metadata: Record<string, unknown>) {
	return (
		getMetadataDescription(metadata, "DateTimeOriginal") ??
		getMetadataDescription(metadata, "DateTimeDigitized") ??
		getMetadataDescription(metadata, "DateTime")
	);
}

function getGpsNumber(metadata: Record<string, unknown>, tagName: string) {
	const gps = metadata.gps;

	if (typeof gps !== "object" || gps === null || Array.isArray(gps)) {
		return null;
	}

	const value = (gps as Record<string, unknown>)[tagName];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getMetadataInsert(
	mediaId: number,
	metadata: Record<string, unknown> | null | undefined,
) {
	if (!metadata) {
		return null;
	}

	return {
		articleMediaId: mediaId,
		dateTime: getMetadataTakenDateTime(metadata),
		exposureTime: getMetadataDescription(metadata, "ExposureTime"),
		fNumber: getMetadataDescription(metadata, "FNumber"),
		focalLengthIn35mmFilm: getMetadataDescription(
			metadata,
			"FocalLengthIn35mmFilm",
		),
		gpsAltitude: getGpsNumber(metadata, "Altitude"),
		gpsLatitude: getGpsNumber(metadata, "Latitude"),
		gpsLongitude: getGpsNumber(metadata, "Longitude"),
		isoSpeedRatings: getMetadataDescription(metadata, "ISOSpeedRatings"),
		make: getMetadataDescription(metadata, "Make"),
		model: getMetadataDescription(metadata, "Model"),
		originalMetadata: toRequiredOriginalMetadataJsonb(metadata),
		shutterSpeedValue: getMetadataDescription(metadata, "ShutterSpeedValue"),
	};
}

function getExistingMediaInput(
	media: ExistingArticleMediaInput,
): StoredArticleMedia {
	return {
		byteSize: media.byteSize ?? 0,
		contentType:
			media.contentType ??
			(media.mediaType === "video" ? "video/mp4" : "image/webp"),
		durationMs: media.durationMs ?? null,
		height: media.height ?? null,
		mediaType: media.mediaType,
		metadata: media.metadata as ArticleMediaMetadataSummary | null | undefined,
		objectKey: media.objectKey ?? media.url,
		order: media.order,
		thumbnailUrl: media.thumbnailUrl ?? null,
		url: media.url,
		width: media.width ?? null,
	};
}

export class ArticleCommandDrizzleAdapter implements ArticleCommandPort {
	async create(input: Parameters<ArticleCommandPort["create"]>[0]) {
		return db.transaction(async (tx) => {
			const [article] = await tx
				.insert(articleTable)
				.values({
					authorUserId: input.authorUserId,
					body: input.body,
					hikingId: toNumericId(input.hikingId),
				})
				.returning({ id: articleTable.id });

			if (!article) {
				throw applicationError.internal("글을 저장하지 못했습니다.");
			}

			const insertedMedia = await tx
				.insert(articleMediaTable)
				.values(
					input.storedMedia.map((media) => ({
						articleId: article.id,
						byteSize: media.byteSize,
						contentType: media.contentType,
						durationMs: media.durationMs,
						height: media.height,
						mediaType: media.mediaType,
						objectKey: media.objectKey,
						order: media.order,
						thumbnailUrl: media.thumbnailUrl,
						url: media.url,
						width: media.width,
					})),
				)
				.returning({
					id: articleMediaTable.id,
					mediaType: articleMediaTable.mediaType,
					order: articleMediaTable.order,
				});

			const metadataRows = insertedMedia.flatMap((media) => {
				if (media.mediaType !== "image") {
					return [];
				}

				const storedMedia = input.storedMedia.find(
					(item) => item.order === media.order,
				);
				const metadata = getMetadataInsert(
					media.id,
					storedMedia?.originalMetadata,
				);
				return metadata ? [metadata] : [];
			});

			if (metadataRows.length > 0) {
				await tx.insert(articleMediaMetadataTable).values(metadataRows);
			}

			return String(article.id) as ArticleId;
		});
	}

	async delete(input: Parameters<ArticleCommandPort["delete"]>[0]) {
		const [updated] = await db
			.update(articleTable)
			.set({ deletedAt: input.now, updatedAt: input.now })
			.where(
				and(
					eq(articleTable.id, toNumericId(input.articleId)),
					isNull(articleTable.deletedAt),
				),
			)
			.returning({ id: articleTable.id });

		return Boolean(updated);
	}

	async findActiveArticleById(articleId: ArticleId) {
		const [row] = await db
			.select({
				authorUserId: articleTable.authorUserId,
				body: articleTable.body,
				hikingId: articleTable.hikingId,
				id: articleTable.id,
			})
			.from(articleTable)
			.where(
				and(
					eq(articleTable.id, toNumericId(articleId)),
					isNull(articleTable.deletedAt),
				),
			)
			.limit(1);

		if (!row) {
			return null;
		}

		return {
			authorUserId: row.authorUserId,
			body: row.body,
			hikingId: String(row.hikingId) as HikingId,
			id: String(row.id) as ArticleId,
		};
	}

	async hasActiveHiking(hikingId: HikingId) {
		const [hiking] = await db
			.select({ id: hikingTable.id })
			.from(hikingTable)
			.where(
				and(
					eq(hikingTable.id, toNumericId(hikingId)),
					isNull(hikingTable.deletedAt),
				),
			)
			.limit(1);

		return Boolean(hiking);
	}

	async listActiveNotificationRecipientIds(
		input: Parameters<
			ArticleCommandPort["listActiveNotificationRecipientIds"]
		>[0],
	) {
		const recipients = await db
			.select({ id: userTable.id })
			.from(userTable)
			.where(
				and(isNull(userTable.deletedAt), ne(userTable.id, input.excludeUserId)),
			);

		return recipients.map((recipient) => recipient.id);
	}

	async update(input: Parameters<ArticleCommandPort["update"]>[0]) {
		const articleId = toNumericId(input.articleId);

		return db.transaction(async (tx) => {
			const [updated] = await tx
				.update(articleTable)
				.set({ body: input.values.body, updatedAt: input.now })
				.where(
					and(eq(articleTable.id, articleId), isNull(articleTable.deletedAt)),
				)
				.returning({ id: articleTable.id });

			if (!updated) {
				return false;
			}

			const existingMediaRows = await tx
				.select({
					objectKey: articleMediaTable.objectKey,
					originalMetadata: articleMediaMetadataTable.originalMetadata,
					url: articleMediaTable.url,
				})
				.from(articleMediaTable)
				.leftJoin(
					articleMediaMetadataTable,
					eq(articleMediaMetadataTable.articleMediaId, articleMediaTable.id),
				)
				.where(eq(articleMediaTable.articleId, articleId));
			const existingMetadataByKey = new Map<string, Record<string, unknown>>();

			for (const media of existingMediaRows) {
				const metadata = toOriginalMetadata(media.originalMetadata);

				if (!metadata) {
					continue;
				}

				existingMetadataByKey.set(media.objectKey, metadata);
				existingMetadataByKey.set(media.url, metadata);
			}

			const storedMedia: StoredArticleMedia[] = input.storedMedia.map(
				(media) => {
					const normalized = getExistingMediaInput(media);
					const uploadedMetadata =
						"originalMetadata" in media ? media.originalMetadata : null;
					const originalMetadata =
						uploadedMetadata ??
						existingMetadataByKey.get(normalized.objectKey) ??
						existingMetadataByKey.get(normalized.url) ??
						null;

					return { ...normalized, originalMetadata };
				},
			);

			await tx
				.delete(articleMediaTable)
				.where(eq(articleMediaTable.articleId, articleId));
			const insertedMedia = await tx
				.insert(articleMediaTable)
				.values(
					storedMedia.map((media) => ({
						articleId,
						byteSize: media.byteSize,
						contentType: media.contentType,
						durationMs: media.durationMs,
						height: media.height,
						mediaType: media.mediaType,
						objectKey: media.objectKey,
						order: media.order,
						thumbnailUrl: media.thumbnailUrl,
						url: media.url,
						width: media.width,
					})),
				)
				.returning({
					id: articleMediaTable.id,
					mediaType: articleMediaTable.mediaType,
					order: articleMediaTable.order,
				});

			const metadataRows = insertedMedia.flatMap((media) => {
				if (media.mediaType !== "image") {
					return [];
				}

				const stored = storedMedia.find((item) => item.order === media.order);
				const metadata = getMetadataInsert(media.id, stored?.originalMetadata);
				return metadata ? [metadata] : [];
			});

			if (metadataRows.length > 0) {
				await tx.insert(articleMediaMetadataTable).values(metadataRows);
			}

			return true;
		});
	}
}
