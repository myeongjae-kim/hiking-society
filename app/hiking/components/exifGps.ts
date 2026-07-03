import type { ExpandedTags, IncludeTagsOptions } from 'exifreader';

type PhotoMetadata = {
  latitude?: number;
  longitude?: number;
  takenAt?: {
    date: string;
    time: string;
  };
};

type ExifTagValue = {
  computed?: unknown;
  description?: string;
  value?: unknown;
};

const metadataIncludeTags: IncludeTagsOptions = {
  exif: [
    'DateTime',
    'DateTimeDigitized',
    'DateTimeOriginal',
    'GPSLatitude',
    'GPSLatitudeRef',
    'GPSLongitude',
    'GPSLongitudeRef',
  ],
  gps: true,
};

const metadataTagOptions = {
  expanded: true,
  computed: true,
  includeTags: metadataIncludeTags,
} as const;

function parseExifGpsCoordinate(values: number[], reference: string) {
  const [degrees = 0, minutes = 0, seconds = 0] = values;
  const sign = reference === 'S' || reference === 'W' ? -1 : 1;
  return sign * (degrees + minutes / 60 + seconds / 3600);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function readStringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    const strings = value.filter((item): item is string => typeof item === 'string');

    if (strings.length > 0) {
      return strings.join('');
    }
  }

  return null;
}

function readTagString(tag: ExifTagValue | undefined) {
  if (!tag) {
    return null;
  }

  return (
    readStringValue(tag.computed) ?? readStringValue(tag.value) ?? readStringValue(tag.description)
  );
}

function readCoordinateValues(tag: ExifTagValue | undefined) {
  if (!tag) {
    return null;
  }

  if (Array.isArray(tag.computed) && tag.computed.every(isFiniteNumber)) {
    return tag.computed;
  }

  if (
    Array.isArray(tag.value) &&
    tag.value.every(
      (item): item is [number, number] =>
        Array.isArray(item) &&
        item.length >= 2 &&
        isFiniteNumber(item[0]) &&
        isFiniteNumber(item[1]),
    )
  ) {
    return tag.value.map(([numerator, denominator]) =>
      denominator === 0 ? 0 : numerator / denominator,
    );
  }

  return null;
}

function parseGpsFromExifTags(tags: ExpandedTags) {
  const latitude = tags.gps?.Latitude;
  const longitude = tags.gps?.Longitude;

  if (isFiniteNumber(latitude) && isFiniteNumber(longitude)) {
    return { latitude, longitude };
  }

  const latitudeRef = readTagString(tags.exif?.GPSLatitudeRef);
  const longitudeRef = readTagString(tags.exif?.GPSLongitudeRef);
  const latitudeValues = readCoordinateValues(tags.exif?.GPSLatitude);
  const longitudeValues = readCoordinateValues(tags.exif?.GPSLongitude);

  if (!latitudeRef || !longitudeRef || !latitudeValues || !longitudeValues) {
    return {};
  }

  return {
    latitude: parseExifGpsCoordinate(latitudeValues, latitudeRef),
    longitude: parseExifGpsCoordinate(longitudeValues, longitudeRef),
  };
}

function parseExifDateTime(value: string | null) {
  if (value === null) {
    return undefined;
  }

  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?/);

  if (!match) {
    return undefined;
  }

  const [, year, month, day, hour, minute] = match;

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

function parseTakenAt(tags: ExpandedTags) {
  const dateTime =
    readTagString(tags.exif?.DateTimeOriginal) ??
    readTagString(tags.exif?.DateTimeDigitized) ??
    readTagString(tags.exif?.DateTime);

  return parseExifDateTime(dateTime);
}

export async function readPhotoMetadataFromFile(file: File): Promise<PhotoMetadata> {
  const { errors, load } = await import('exifreader');
  let tags: ExpandedTags;

  try {
    tags = await load(file, metadataTagOptions);
  } catch (error) {
    if (error instanceof errors.MetadataMissingError) {
      return {};
    }

    throw error;
  }

  return {
    ...parseGpsFromExifTags(tags),
    takenAt: parseTakenAt(tags),
  };
}
