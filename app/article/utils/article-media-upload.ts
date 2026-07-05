import type { ArticleFormValues } from '@/app/article/components/articleFormTypes';
import { fetchClient } from '@/app/common/api/$api';

export type UploadedArticleMedia = {
  byteSize: number;
  contentType: string;
  durationMs: number | null;
  height: number | null;
  mediaType: 'image' | 'video';
  objectKey: string;
  order: number;
  originalMetadata: Record<string, unknown> | null;
  thumbnailUrl: string | null;
  url: string;
  width: number | null;
};

type ArticleMediaUploadTargetInput = {
  byteSize: number;
  contentType: string;
  fileName: string;
  mediaType: 'image' | 'video';
  thumbnail?: {
    byteSize: number;
    contentType: string;
    fileName: string;
  };
};

export async function deleteUploadedArticleMedia(objectKeys: readonly string[]) {
  if (objectKeys.length === 0) {
    return;
  }

  await fetchClient.DELETE('/api/article-media/uploads', {
    body: { objectKeys: [...objectKeys] },
  });
}

async function uploadDirectToS3(file: File, uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    body: file,
    headers: {
      'Content-Type': file.type,
    },
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error('S3 업로드에 실패했습니다.');
  }
}

async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const item = items[currentIndex];

        if (item !== undefined) {
          await worker(item, currentIndex);
        }
      }
    }),
  );
}

export async function uploadArticleMedia(
  values: ArticleFormValues,
  onLoadingLabelChange: (label: string) => void,
) {
  const newMedia = values.media.filter((media) => media.file);
  const uploadedObjectKeys: string[] = [];

  if (newMedia.length === 0) {
    return { uploadedMedia: [] as UploadedArticleMedia[], uploadedObjectKeys };
  }

  onLoadingLabelChange('업로드 URL 준비 중');

  const targetInput: ArticleMediaUploadTargetInput[] = newMedia.map((media) => ({
    byteSize: media.file?.size ?? 0,
    contentType: media.file?.type ?? '',
    fileName: media.file?.name ?? media.fileName,
    mediaType: media.mediaType,
    thumbnail: media.thumbnailFile
      ? {
          byteSize: media.thumbnailFile.size,
          contentType: media.thumbnailFile.type,
          fileName: media.thumbnailFile.name,
        }
      : undefined,
  }));
  const { data: targetResult } = await fetchClient.POST('/api/article-media/upload-targets', {
    body: targetInput,
  });

  if (!targetResult) {
    throw new Error('업로드 URL을 만들지 못했습니다.');
  }

  const uploadedMedia = new Array<UploadedArticleMedia>(newMedia.length);
  let uploadedCount = 0;

  try {
    await runWithConcurrency(newMedia, 4, async (media, index) => {
      const target = targetResult.targets[index];

      if (!target || !media.file) {
        throw new Error('업로드 대상을 만들지 못했습니다.');
      }

      await uploadDirectToS3(media.file, target.uploadUrl);
      uploadedObjectKeys.push(target.objectKey);

      if (media.thumbnailFile && target.thumbnail) {
        await uploadDirectToS3(media.thumbnailFile, target.thumbnail.uploadUrl);
        uploadedObjectKeys.push(target.thumbnail.objectKey);
      }

      uploadedMedia[index] = {
        byteSize: media.file.size,
        contentType: media.file.type,
        durationMs: media.durationMs ?? null,
        height: media.height ?? null,
        mediaType: media.mediaType,
        objectKey: target.objectKey,
        order: media.order,
        originalMetadata: media.originalMetadata ?? null,
        thumbnailUrl: target.thumbnail?.url ?? null,
        url: target.url,
        width: media.width ?? null,
      };
      uploadedCount += 1;
      onLoadingLabelChange(`S3 업로드 중 ${uploadedCount}/${newMedia.length}`);
    });
  } catch (error) {
    if (uploadedObjectKeys.length > 0) {
      onLoadingLabelChange('업로드 파일 정리 중');
      await deleteUploadedArticleMedia(uploadedObjectKeys);
    }

    throw error;
  }

  return { uploadedMedia, uploadedObjectKeys };
}
