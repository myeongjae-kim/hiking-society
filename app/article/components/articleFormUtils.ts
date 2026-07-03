import type { Article } from '@/core/article/domain';
import { createCompressedWebpFile } from '@/app/common/utils/imageCompression';
import {
  createArticleMediaMetadataSummary,
  readOriginalPhotoMetadata,
} from '@/app/common/utils/photoMetadata';
import { createCompressedMp4File } from '@/app/common/utils/videoCompression';

import type { DraftMedia } from './articleFormTypes';

const maxCompressedPhotoWidth = 1600;
const maxCompressedVideoWidth = 720;
const maxVideoDurationMs = 90 * 1000;
const maxVideoSourceBytes = 120 * 1024 * 1024;
const webpQuality = 85;

export function getArticleFormDefaults(article?: Article) {
  return {
    body: article?.body ?? '',
    media:
      article?.media.map((media) => ({
        ...media,
        fileName: media.url.split('/').at(-1) ?? `media-${media.order}`,
        fileSize: media.byteSize,
      })) ?? [],
  };
}

export function createDraftMedia(
  file: File,
  order: number,
  metadata: Pick<
    DraftMedia,
    | 'durationMs'
    | 'height'
    | 'mediaType'
    | 'metadata'
    | 'originalMetadata'
    | 'thumbnailFile'
    | 'thumbnailUrl'
    | 'width'
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
  if (file.type.startsWith('video/')) {
    const compressedVideo = await createCompressedMp4File(file, {
      maxDurationMs: maxVideoDurationMs,
      maxSourceBytes: maxVideoSourceBytes,
      maxWidth: maxCompressedVideoWidth,
      onProgress,
    });

    return createDraftMedia(compressedVideo.file, order, {
      durationMs: compressedVideo.durationMs,
      height: compressedVideo.height,
      mediaType: 'video',
      metadata: null,
      originalMetadata: null,
      thumbnailFile: compressedVideo.thumbnailFile,
      thumbnailUrl: URL.createObjectURL(compressedVideo.thumbnailFile),
      width: compressedVideo.width,
    });
  }

  const [compressedFile, originalMetadata] = await Promise.all([
    createCompressedWebpFile(file, {
      maxWidth: maxCompressedPhotoWidth,
      quality: webpQuality,
    }),
    readOriginalPhotoMetadata(file),
  ]);

  return createDraftMedia(compressedFile, order, {
    durationMs: null,
    height: null,
    mediaType: 'image',
    metadata: createArticleMediaMetadataSummary(originalMetadata),
    originalMetadata,
    thumbnailFile: undefined,
    thumbnailUrl: null,
    width: null,
  });
}

export function getMediaDuplicateKey(media: DraftMedia) {
  if (typeof media.fileSize !== 'number' || typeof media.lastModified !== 'number') {
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

    mediaKeyCounts.set(duplicateKey, (mediaKeyCounts.get(duplicateKey) ?? 0) + 1);
  }

  return new Set(
    [...mediaKeyCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([duplicateKey]) => duplicateKey),
  );
}

export function revokeDraftMediaUrl(media: DraftMedia) {
  if (media.url.startsWith('blob:')) {
    URL.revokeObjectURL(media.url);
  }

  if (media.thumbnailUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(media.thumbnailUrl);
  }
}
