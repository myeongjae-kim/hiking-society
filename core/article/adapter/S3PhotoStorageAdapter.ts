import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ArticlePhotoUpload } from '@/core/article/application/port/in/ArticleCommandUseCase';
import type { PhotoStoragePort } from '@/core/article/application/port/out/PhotoStoragePort';
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

export class S3PhotoStorageAdapter implements PhotoStoragePort {
  private readonly client = new S3Client({
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true,
    region: env.S3_REGION,
  });

  async upload(input: ArticlePhotoUpload) {
    const objectKey = `article-photos/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${sanitizeFileName(input.fileName)}`;

    await this.client.send(
      new PutObjectCommand({
        Body: input.bytes,
        Bucket: env.S3_BUCKET,
        ContentLength: input.byteSize,
        ContentType: input.contentType,
        Key: objectKey,
      }),
    );

    return {
      byteSize: input.byteSize,
      contentType: input.contentType,
      objectKey,
      order: input.order,
      url: joinPublicUrl(env.S3_PUBLIC_BASE_URL, objectKey),
    };
  }
}
