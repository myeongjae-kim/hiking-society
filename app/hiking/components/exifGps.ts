type PhotoMetadata = {
  latitude?: number;
  longitude?: number;
  takenAt?: {
    date: string;
    time: string;
  };
};

function parseExifGpsCoordinate(values: number[], reference: string) {
  const [degrees = 0, minutes = 0, seconds = 0] = values;
  const sign = reference === 'S' || reference === 'W' ? -1 : 1;
  return sign * (degrees + minutes / 60 + seconds / 3600);
}

function readAscii(view: DataView, offset: number, count: number) {
  let value = '';

  for (let index = 0; index < count; index += 1) {
    const charCode = view.getUint8(offset + index);

    if (charCode !== 0) {
      value += String.fromCharCode(charCode);
    }
  }

  return value;
}

function getRational(view: DataView, offset: number, littleEndian: boolean) {
  const numerator = view.getUint32(offset, littleEndian);
  const denominator = view.getUint32(offset + 4, littleEndian);
  return denominator === 0 ? 0 : numerator / denominator;
}

function getExifEntryValueOffset(
  view: DataView,
  tiffStart: number,
  entryOffset: number,
  valueSize: number,
  littleEndian: boolean,
) {
  if (valueSize <= 4) {
    return entryOffset + 8;
  }

  return tiffStart + view.getUint32(entryOffset + 8, littleEndian);
}

function findExifSegment(view: DataView) {
  let offset = 2;

  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      return null;
    }

    const marker = view.getUint8(offset + 1);
    const segmentLength = view.getUint16(offset + 2, false);

    if (marker === 0xe1 && readAscii(view, offset + 4, 6) === 'Exif') {
      return offset + 10;
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function findIfdPointer(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  tagToFind: number,
  littleEndian: boolean,
) {
  const entryCount = view.getUint16(ifdOffset, littleEndian);

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    const tag = view.getUint16(entryOffset, littleEndian);

    if (tag === tagToFind) {
      return tiffStart + view.getUint32(entryOffset + 8, littleEndian);
    }
  }

  return null;
}

function parseExifGps(
  view: DataView,
  tiffStart: number,
  gpsIfdOffset: number | null,
  littleEndian: boolean,
) {
  if (gpsIfdOffset === null) {
    return {};
  }

  const gpsEntryCount = view.getUint16(gpsIfdOffset, littleEndian);
  let latitudeRef = '';
  let longitudeRef = '';
  let latitudeValues: number[] | null = null;
  let longitudeValues: number[] | null = null;

  for (let index = 0; index < gpsEntryCount; index += 1) {
    const entryOffset = gpsIfdOffset + 2 + index * 12;
    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);

    if ((tag === 1 || tag === 3) && type === 2) {
      const valueOffset = getExifEntryValueOffset(
        view,
        tiffStart,
        entryOffset,
        count,
        littleEndian,
      );
      const value = readAscii(view, valueOffset, count);

      if (tag === 1) {
        latitudeRef = value;
      } else {
        longitudeRef = value;
      }
    }

    if ((tag === 2 || tag === 4) && type === 5) {
      const valueOffset = getExifEntryValueOffset(
        view,
        tiffStart,
        entryOffset,
        count * 8,
        littleEndian,
      );
      const values = Array.from({ length: count }, (_, valueIndex) =>
        getRational(view, valueOffset + valueIndex * 8, littleEndian),
      );

      if (tag === 2) {
        latitudeValues = values;
      } else {
        longitudeValues = values;
      }
    }
  }

  if (!latitudeRef || !longitudeRef || !latitudeValues || !longitudeValues) {
    return {};
  }

  return {
    latitude: parseExifGpsCoordinate(latitudeValues, latitudeRef),
    longitude: parseExifGpsCoordinate(longitudeValues, longitudeRef),
  };
}

function readAsciiEntry(
  view: DataView,
  tiffStart: number,
  ifdOffset: number | null,
  tagsToFind: readonly number[],
  littleEndian: boolean,
) {
  if (ifdOffset === null) {
    return null;
  }

  const entryCount = view.getUint16(ifdOffset, littleEndian);
  const tagValues = new Map<number, string>();

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);

    if (!tagsToFind.includes(tag) || type !== 2) {
      continue;
    }

    const valueOffset = getExifEntryValueOffset(view, tiffStart, entryOffset, count, littleEndian);
    tagValues.set(tag, readAscii(view, valueOffset, count));
  }

  for (const tag of tagsToFind) {
    const value = tagValues.get(tag);

    if (value) {
      return value;
    }
  }

  return null;
}

function parseExifDateTime(value: string | null) {
  if (value === null) {
    return undefined;
  }

  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return undefined;
  }

  const [, year, month, day, hour, minute] = match;

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

function parseExifMetadata(arrayBuffer: ArrayBuffer): PhotoMetadata {
  const view = new DataView(arrayBuffer);

  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
    return {};
  }

  const tiffStart = findExifSegment(view);

  if (tiffStart === null) {
    return {};
  }

  const byteOrder = readAscii(view, tiffStart, 2);
  const littleEndian = byteOrder === 'II';

  if (!littleEndian && byteOrder !== 'MM') {
    return {};
  }

  const firstIfdOffset = tiffStart + view.getUint32(tiffStart + 4, littleEndian);
  const gpsIfdOffset = findIfdPointer(view, tiffStart, firstIfdOffset, 0x8825, littleEndian);
  const exifIfdOffset = findIfdPointer(view, tiffStart, firstIfdOffset, 0x8769, littleEndian);
  const dateTime =
    readAsciiEntry(view, tiffStart, exifIfdOffset, [0x9003, 0x9004], littleEndian) ??
    readAsciiEntry(view, tiffStart, firstIfdOffset, [0x0132], littleEndian);

  return {
    ...parseExifGps(view, tiffStart, gpsIfdOffset, littleEndian),
    takenAt: parseExifDateTime(dateTime),
  };
}

export async function readPhotoMetadataFromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return parseExifMetadata(arrayBuffer);
}
