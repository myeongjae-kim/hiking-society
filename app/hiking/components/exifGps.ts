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

function parseExifGps(arrayBuffer: ArrayBuffer) {
  const view = new DataView(arrayBuffer);

  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
    return null;
  }

  const tiffStart = findExifSegment(view);

  if (tiffStart === null) {
    return null;
  }

  const byteOrder = readAscii(view, tiffStart, 2);
  const littleEndian = byteOrder === 'II';

  if (!littleEndian && byteOrder !== 'MM') {
    return null;
  }

  const firstIfdOffset = tiffStart + view.getUint32(tiffStart + 4, littleEndian);
  const entryCount = view.getUint16(firstIfdOffset, littleEndian);
  let gpsIfdOffset: number | null = null;

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = firstIfdOffset + 2 + index * 12;
    const tag = view.getUint16(entryOffset, littleEndian);

    if (tag === 0x8825) {
      gpsIfdOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
      break;
    }
  }

  if (gpsIfdOffset === null) {
    return null;
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
    return null;
  }

  return {
    latitude: parseExifGpsCoordinate(latitudeValues, latitudeRef),
    longitude: parseExifGpsCoordinate(longitudeValues, longitudeRef),
  };
}

export async function readGpsFromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return parseExifGps(arrayBuffer);
}
