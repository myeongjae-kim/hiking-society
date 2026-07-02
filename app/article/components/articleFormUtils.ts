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

export function revokeDraftPhotoUrl(photo: DraftPhoto) {
  if (photo.url.startsWith('blob:')) {
    URL.revokeObjectURL(photo.url);
  }
}
