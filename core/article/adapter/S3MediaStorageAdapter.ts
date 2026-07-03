import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ArticleMediaUpload } from '@/core/article/application/port/in/ArticleCommandUseCase';
import type { MediaStoragePort } from '@/core/article/application/port/out/MediaStoragePort';
import { env } from '@/core/config/env';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

function joinPublicUrl(baseUrl: string, objectKey: string) {
  return `${baseUrl.replace(/\/$/, '')}/${objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;
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

  async upload(input: ArticleMediaUpload) {
    const datePath = new Date().toISOString().slice(0, 10);
    const objectKey = `article-media/${datePath}/${crypto.randomUUID()}-${sanitizeFileName(input.fileName)}`;
    const thumbnailObjectKey = input.thumbnailUpload
      ? `article-media/${datePath}/${crypto.randomUUID()}-${sanitizeFileName(input.thumbnailUpload.fileName)}`
      : null;

    const uploadMedia = this.client.send(
      new PutObjectCommand({
        Body: input.bytes,
        Bucket: env.S3_BUCKET,
        ContentLength: input.byteSize,
        ContentType: input.contentType,
        Key: objectKey,
      }),
    );
    const uploadThumbnail = input.thumbnailUpload
      ? this.client.send(
          new PutObjectCommand({
            Body: input.thumbnailUpload.bytes,
            Bucket: env.S3_BUCKET,
            ContentLength: input.thumbnailUpload.byteSize,
            ContentType: input.thumbnailUpload.contentType,
            Key: thumbnailObjectKey ?? undefined,
          }),
        )
      : Promise.resolve();

    await Promise.all([uploadMedia, uploadThumbnail]);

    return {
      byteSize: input.byteSize,
      contentType: input.contentType,
      durationMs: input.durationMs,
      height: input.height,
      mediaType: input.mediaType,
      objectKey,
      originalMetadata: input.originalMetadata ?? null,
      order: input.order,
      thumbnailUrl: thumbnailObjectKey
        ? joinPublicUrl(env.S3_PUBLIC_BASE_URL, thumbnailObjectKey)
        : null,
      url: joinPublicUrl(env.S3_PUBLIC_BASE_URL, objectKey),
      width: input.width,
    };
  }
}
