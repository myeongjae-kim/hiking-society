const binaryTagNames = new Set([
  'Thumbnail',
  'JFIF Thumbnail',
  'MakerNote',
  'Maker Note',
  'PreviewImage',
]);

const maxArrayItems = 1024;
const maxBinaryArrayItems = 256;
const maxStringLength = 20_000;

function shouldSkipMetadataKey(key: string) {
  const normalizedKey = key.toLowerCase().replaceAll(/[\s_-]/g, '');

  return (
    binaryTagNames.has(key) ||
    normalizedKey.includes('thumbnail') ||
    normalizedKey.includes('makernote') ||
    normalizedKey.includes('previewimage')
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isBinaryLike(value: unknown) {
  return (
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    (typeof Blob !== 'undefined' && value instanceof Blob) ||
    (typeof File !== 'undefined' && value instanceof File)
  );
}

function sanitizeMetadataValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replaceAll('\u0000', '');

    if (normalized.length === 0 && value.length > 0) {
      return undefined;
    }

    return normalized.length <= maxStringLength ? normalized : undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value !== 'object' || isBinaryLike(value)) {
    return undefined;
  }

  if (seen.has(value)) {
    return undefined;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    if (value.length > maxArrayItems) {
      return undefined;
    }

    if (
      value.length > maxBinaryArrayItems &&
      value.every((item) => Number.isInteger(item) && Number(item) >= 0 && Number(item) <= 255)
    ) {
      return undefined;
    }

    const items = value
      .map((item) => sanitizeMetadataValue(item, seen))
      .filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }

  if (!isPlainObject(value)) {
    return undefined;
  }

  const result: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    if (shouldSkipMetadataKey(key)) {
      continue;
    }

    const sanitized = sanitizeMetadataValue(item, seen);

    if (sanitized !== undefined) {
      result[key] = sanitized;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function sanitizeOriginalPhotoMetadata(value: unknown) {
  const sanitized = sanitizeMetadataValue(value);

  return isPlainObject(sanitized) ? sanitized : null;
}

export async function readOriginalPhotoMetadata(file: File) {
  try {
    const { load } = await import('exifreader');
    const tags = await load(file, { computed: true, expanded: true });

    return sanitizeOriginalPhotoMetadata(tags);
  } catch {
    return null;
  }
}
