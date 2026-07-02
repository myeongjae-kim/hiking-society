import type { Article } from '@/core/article/domain';

import type { DraftPhoto } from './articleFormTypes';

const maxCompressedPhotoWidth = 1600;
const webpQuality = 85;

function getCompressedFileName(fileName: string) {
  const extensionStartIndex = fileName.lastIndexOf('.');
  const baseName =
    extensionStartIndex > 0 ? fileName.slice(0, extensionStartIndex) : fileName || 'photo';

  return `${baseName}.webp`;
}

async function encodeImageDataToWebpBlob(imageData: ImageData) {
  const { encode } = await import('@jsquash/webp');
  const buffer = await encode(imageData, { quality: webpQuality });

  return new Blob([buffer], { type: 'image/webp' });
}

export function getArticleFormDefaults(article?: Article) {
  return {
    body: article?.body ?? '',
    photos:
      article?.photos.map((photo) => ({
        ...photo,
        fileName: photo.url.split('/').at(-1) ?? `photo-${photo.order}`,
        fileSize: photo.byteSize,
      })) ?? [],
  };
}

export function createDraftPhoto(file: File, order: number): DraftPhoto {
  return {
    fileName: file.name,
    file,
    fileSize: file.size,
    lastModified: file.lastModified,
    order,
    url: URL.createObjectURL(file),
  };
}

export async function createCompressedDraftPhoto(file: File, order: number): Promise<DraftPhoto> {
  try {
    const imageBitmap = await createImageBitmap(file);
    const targetWidth = Math.min(imageBitmap.width, maxCompressedPhotoWidth);
    const targetHeight = Math.round((imageBitmap.height * targetWidth) / imageBitmap.width);

    if (targetWidth <= 0 || targetHeight <= 0) {
      imageBitmap.close();
      return createDraftPhoto(file, order);
    }

    const canvas = document.createElement('canvas');

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      imageBitmap.close();
      return createDraftPhoto(file, order);
    }

    context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
    imageBitmap.close();

    const blob = await encodeImageDataToWebpBlob(imageData);

    const compressedFile = new File([blob], getCompressedFileName(file.name), {
      lastModified: Date.now(),
      type: 'image/webp',
    });

    return createDraftPhoto(compressedFile, order);
  } catch {
    return createDraftPhoto(file, order);
  }
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
