import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { MediaStoragePort } from "@/core/article/application/port/out/MediaStoragePort";
import { applicationError } from "@/core/common/application/ApplicationError";
import { env } from "@/core/config/env.server";

function sanitizeFileName(fileName: string) {
	return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function joinPublicUrl(baseUrl: string, objectKey: string) {
	return `${baseUrl.replace(/\/$/, "")}/${objectKey
		.split("/")
		.map((part) => encodeURIComponent(part))
		.join("/")}`;
}

export class S3MediaStorageAdapter implements MediaStoragePort {
	private readonly client = new S3Client({
		credentials: {
			accessKeyId: env.S3_ACCESS_KEY_ID,
			secretAccessKey: env.S3_SECRET_ACCESS_KEY,
		},
		endpoint: env.S3_ENDPOINT,
		forcePathStyle: true,
		region: env.S3_REGION,
	});

	private assertOwnedObjectKey(objectKey: string, userId: number) {
		if (!objectKey.startsWith(`article-media/users/${userId}/`)) {
			throw applicationError.forbidden("삭제할 수 없는 업로드 파일입니다.");
		}
	}

	private async createSignedPutUrl(input: {
		contentType: string;
		objectKey: string;
	}) {
		return getSignedUrl(
			this.client,
			new PutObjectCommand({
				Bucket: env.S3_BUCKET,
				ContentType: input.contentType,
				Key: input.objectKey,
			}),
			{ expiresIn: 10 * 60 },
		);
	}

	async createUploadTarget(
		input: Parameters<MediaStoragePort["createUploadTarget"]>[0],
	) {
		const datePath = input.now.toISOString().slice(0, 10);
		const objectKey = `article-media/users/${input.userId}/${datePath}/${crypto.randomUUID()}-${sanitizeFileName(input.fileName)}`;
		const thumbnailObjectKey = input.thumbnail
			? `article-media/users/${input.userId}/${datePath}/${crypto.randomUUID()}-${sanitizeFileName(input.thumbnail.fileName)}`
			: null;

		const [uploadUrl, thumbnailUploadUrl] = await Promise.all([
			this.createSignedPutUrl({ contentType: input.contentType, objectKey }),
			thumbnailObjectKey && input.thumbnail
				? this.createSignedPutUrl({
						contentType: input.thumbnail.contentType,
						objectKey: thumbnailObjectKey,
					})
				: Promise.resolve(null),
		]);

		return {
			objectKey,
			uploadUrl,
			thumbnail:
				thumbnailObjectKey && thumbnailUploadUrl
					? {
							objectKey: thumbnailObjectKey,
							uploadUrl: thumbnailUploadUrl,
							url: joinPublicUrl(env.S3_PUBLIC_BASE_URL, thumbnailObjectKey),
						}
					: undefined,
			url: joinPublicUrl(env.S3_PUBLIC_BASE_URL, objectKey),
		};
	}

	async deleteObjects(input: Parameters<MediaStoragePort["deleteObjects"]>[0]) {
		const uniqueObjectKeys = [...new Set(input.objectKeys.filter(Boolean))];

		await Promise.all(
			uniqueObjectKeys.map(async (objectKey) => {
				this.assertOwnedObjectKey(objectKey, input.userId);

				await this.client.send(
					new DeleteObjectCommand({
						Bucket: env.S3_BUCKET,
						Key: objectKey,
					}),
				);
			}),
		);
	}
}
