import type { ArticleMedia } from '@/core/article/domain';

import type { MetadataPanelItem } from './types';

function normalizeMetadataValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function formatMetadataDateTime(value: string | null | undefined) {
  return (
    normalizeMetadataValue(value)?.replace(/^(\d{4}):(\d{2}):(\d{2})(?=[ T]|$)/, '$1-$2-$3') ?? null
  );
}

export function getMediaTakenTimeLabel(media: ArticleMedia) {
  if (media.mediaType !== 'image') {
    return null;
  }

  const dateTime = normalizeMetadataValue(media.metadata?.dateTime);

  if (!dateTime) {
    return null;
  }

  const match = dateTime.match(
    /^(?:(?:\d{4}[:/-]\d{2}[:/-]\d{2})[ T])?(\d{1,2}):(\d{2})(?::\d{2})?/,
  );

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getCameraLabel(media: ArticleMedia) {
  const make = normalizeMetadataValue(media.metadata?.make);
  const model = normalizeMetadataValue(media.metadata?.model);

  if (make && model) {
    return model.toLowerCase().includes(make.toLowerCase()) ? model : `${make} ${model}`;
  }

  return model ?? make;
}

function formatIso(value: string | null | undefined) {
  const normalized = normalizeMetadataValue(value);

  if (!normalized) {
    return null;
  }

  return normalized.toLowerCase().startsWith('iso')
    ? normalized.toUpperCase()
    : `ISO ${normalized}`;
}

function getExposureItems(media: ArticleMedia) {
  const shutterSpeed =
    normalizeMetadataValue(media.metadata?.exposureTime) ??
    normalizeMetadataValue(media.metadata?.shutterSpeedValue);

  return [
    normalizeMetadataValue(media.metadata?.fNumber),
    shutterSpeed,
    formatIso(media.metadata?.isoSpeedRatings),
  ].filter((value): value is string => Boolean(value));
}

export function getMetadataPanelItems(media: ArticleMedia): MetadataPanelItem[] {
  if (media.mediaType !== 'image' || !media.metadata) {
    return [];
  }

  const camera = getCameraLabel(media);
  const exposureItems = getExposureItems(media);
  const focalLength = normalizeMetadataValue(media.metadata.focalLengthIn35mmFilm);
  const dateTime = formatMetadataDateTime(media.metadata.dateTime);

  return [
    camera ? { label: 'camera', value: camera } : null,
    exposureItems.length > 0 ? { label: 'exposure', value: exposureItems.join(' · ') } : null,
    focalLength ? { label: 'lens', value: focalLength } : null,
    dateTime ? { label: 'taken', value: dateTime } : null,
  ].filter((item): item is MetadataPanelItem => item !== null);
}
