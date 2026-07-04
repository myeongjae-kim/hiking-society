import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/core/config/env';
import type { ProfileImageStoragePort } from '../application/port/out/ProfileImageStoragePort';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

function joinPublicUrl(baseUrl: string, objectKey: string) {
  return `${baseUrl.replace(/\/$/, '')}/${objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;
}

export class S3ProfileImageStorageAdapter implements ProfileImageStoragePort {
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
    if (!objectKey.startsWith(`profile-images/users/${userId}/`)) {
      throw new Error('삭제할 수 없는 프로필 이미지입니다.');
    }
  }

  async createUploadTarget(input: Parameters<ProfileImageStoragePort['createUploadTarget']>[0]) {
    const objectKey = `profile-images/users/${input.userId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${sanitizeFileName(input.fileName)}`;
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        ContentType: input.contentType,
        Key: objectKey,
      }),
      { expiresIn: 10 * 60 },
    );

    return {
      objectKey,
      uploadUrl,
      url: joinPublicUrl(env.S3_PUBLIC_BASE_URL, objectKey),
    };
  }

  async deleteObjects(input: Parameters<ProfileImageStoragePort['deleteObjects']>[0]) {
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
