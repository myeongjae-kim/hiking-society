import type { ArticleId } from '@/core/article/domain';
import { env } from '@/core/config/env';
import { z } from '@hono/zod-openapi';
import { revalidatePath } from '@/app/api/[...route]/config/revalidate';
import { badRequest, successRevalidationPaths } from '@/app/api/[...route]/config/apiUtils';
import { articleBodySchema } from '@/app/api/[...route]/schemas';

export function revalidateArticleSuccess(articleId?: ArticleId | null) {
  for (const path of successRevalidationPaths(articleId)) {
    revalidatePath(path);
  }
}

function assertArticleObjectKey(objectKey: string, userId: number) {
  if (!objectKey.startsWith(`article-media/users/${userId}/`)) {
    throw badRequest('잘못된 업로드 파일입니다.');
  }
}

function assertPublicUrl(url: string, objectKey: string) {
  const expectedUrl = `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;

  if (url !== expectedUrl) {
    throw badRequest('잘못된 업로드 URL입니다.');
  }
}

function assertArticleUploadPublicUrl(url: string, userId: number) {
  const expectedPrefix = `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/article-media/users/${userId}/`;

  if (!url.startsWith(expectedPrefix)) {
    throw badRequest('잘못된 업로드 URL입니다.');
  }
}

export function validateUploadedMedia(
  userId: number,
  media: Readonly<z.infer<typeof articleBodySchema>['uploadedMedia']>,
) {
  for (const item of media) {
    assertArticleObjectKey(item.objectKey, userId);
    assertPublicUrl(item.url, item.objectKey);

    if (item.thumbnailUrl) {
      assertArticleUploadPublicUrl(item.thumbnailUrl, userId);
    }
  }
}
