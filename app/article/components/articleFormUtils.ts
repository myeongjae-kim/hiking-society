import type { Article } from '@/core/article/domain';

import type { DraftPhoto } from './articleFormTypes';

export function getArticleFormDefaults(article?: Article) {
  return {
    body: article?.body ?? '',
    photos:
      article?.photos.map((photo) => ({
        ...photo,
        fileName: photo.url.split('/').at(-1) ?? `photo-${photo.order}`,
      })) ?? [],
  };
}

export function createDraftPhoto(file: File, order: number): DraftPhoto {
  return {
    fileName: file.name,
    fileSize: file.size,
    lastModified: file.lastModified,
    order,
    url: URL.createObjectURL(file),
  };
}

export function getPhotoDuplicateKey(photo: DraftPhoto) {
  if (typeof photo.fileSize !== 'number' || typeof photo.lastModified !== 'number') {
    return null;
  }

  return `${photo.fileName}:${photo.fileSize}:${photo.lastModified}`;
}

export function getDuplicatePhotoKeys(photos: readonly DraftPhoto[]) {
  const photoKeyCounts = new Map<string, number>();

  for (const photo of photos) {
    const duplicateKey = getPhotoDuplicateKey(photo);

    if (duplicateKey === null) {
      continue;
    }

    photoKeyCounts.set(duplicateKey, (photoKeyCounts.get(duplicateKey) ?? 0) + 1);
  }

  return new Set(
    [...photoKeyCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([duplicateKey]) => duplicateKey),
  );
}

export function revokeDraftPhotoUrl(photo: DraftPhoto) {
  if (photo.url.startsWith('blob:')) {
    URL.revokeObjectURL(photo.url);
  }
}
