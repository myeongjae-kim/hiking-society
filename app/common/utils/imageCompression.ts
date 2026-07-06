type CompressImageOptions = {
  maxWidth: number;
  originalMetadata?: Record<string, unknown> | null;
  quality: number;
};

type Bytes = Uint8Array<ArrayBuffer>;

const heicImageTypes = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);
const heicFileNamePattern = /\.(heic|heif)$/i;
const textEncoder = new TextEncoder();
const webpVp8xChunkSize = 10;
const webpXmpFlag = 0x04;

function getWebpFileName(fileName: string) {
  const extensionStartIndex = fileName.lastIndexOf('.');
  const baseName =
    extensionStartIndex > 0 ? fileName.slice(0, extensionStartIndex) : fileName || 'image';

  return `${baseName}.webp`;
}

function getJpegFileName(fileName: string) {
  const extensionStartIndex = fileName.lastIndexOf('.');
  const baseName =
    extensionStartIndex > 0 ? fileName.slice(0, extensionStartIndex) : fileName || 'image';

  return `${baseName}.jpg`;
}

export function isHeicImageFile(file: File) {
  return heicImageTypes.has(file.type.toLowerCase()) || heicFileNamePattern.test(file.name);
}

async function createBrowserReadableFile(file: File) {
  if (!isHeicImageFile(file)) {
    return file;
  }

  const heicConvertModule = await import('heic-convert/browser');
  const convert = heicConvertModule.default;
  const output = await convert({
    buffer: new Uint8Array(await file.arrayBuffer()),
    format: 'JPEG',
    quality: 0.92,
  });
  const outputBuffer = new ArrayBuffer(output.byteLength);
  new Uint8Array(outputBuffer).set(output);

  return new File([outputBuffer], getJpegFileName(file.name), {
    lastModified: file.lastModified,
    type: 'image/jpeg',
  });
}

async function encodeImageDataToWebpBlob(imageData: ImageData, quality: number) {
  const { encode } = await import('@jsquash/webp');
  const buffer = await encode(imageData, { quality });

  return new Blob([buffer], { type: 'image/webp' });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function getMetadataTag(metadata: Record<string, unknown>, tagName: string) {
  const exif = metadata.exif;

  if (!isPlainObject(exif)) {
    return null;
  }

  const tag = exif[tagName];

  return isPlainObject(tag) ? tag : null;
}

function getMetadataDescription(metadata: Record<string, unknown>, tagName: string) {
  const tag = getMetadataTag(metadata, tagName);
  const description = tag?.description;

  if (typeof description === 'string') {
    return description.trim() || null;
  }

  if (typeof description === 'number' && Number.isFinite(description)) {
    return String(description);
  }

  return null;
}

function getNumberPair(value: unknown) {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const [numerator, denominator] = value;

  if (
    typeof numerator !== 'number' ||
    typeof denominator !== 'number' ||
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return null;
  }

  return [numerator, denominator] as const;
}

function getMetadataRationalValue(metadata: Record<string, unknown>, tagName: string) {
  const tag = getMetadataTag(metadata, tagName);
  const value = tag?.value;
  const pair = getNumberPair(value);

  if (pair) {
    return `${pair[0]}/${pair[1]}`;
  }

  if (Array.isArray(value)) {
    const nestedPair = getNumberPair(value[0]);

    if (nestedPair) {
      return `${nestedPair[0]}/${nestedPair[1]}`;
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return getMetadataDescription(metadata, tagName);
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function addXmpAttribute(
  attributes: string[],
  metadata: Record<string, unknown>,
  tagName: string,
  xmpName: string,
) {
  const value = getMetadataDescription(metadata, tagName);

  if (value) {
    attributes.push(`${xmpName}="${escapeXml(value)}"`);
  }
}

function addXmpRationalAttribute(
  attributes: string[],
  metadata: Record<string, unknown>,
  tagName: string,
  xmpName: string,
) {
  const value = getMetadataRationalValue(metadata, tagName);

  if (value) {
    attributes.push(`${xmpName}="${escapeXml(value)}"`);
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
}

function readAscii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function readUint32LittleEndian(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)
  );
}

function writeUint24LittleEndian(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
  bytes[offset + 2] = (value >> 16) & 0xff;
}

function writeUint32LittleEndian(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
  bytes[offset + 2] = (value >> 16) & 0xff;
  bytes[offset + 3] = (value >> 24) & 0xff;
}

function concatBytes(parts: readonly Uint8Array[]): Bytes {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

function createRiffChunk(fourCc: string, payload: Uint8Array): Bytes {
  const chunk = new Uint8Array(8 + payload.length + (payload.length % 2));

  chunk.set(textEncoder.encode(fourCc), 0);
  writeUint32LittleEndian(chunk, 4, payload.length);
  chunk.set(payload, 8);

  return chunk;
}

function createVp8xChunk(flags: number, width: number, height: number) {
  const payload = new Uint8Array(webpVp8xChunkSize);

  payload[0] = flags;
  writeUint24LittleEndian(payload, 4, width - 1);
  writeUint24LittleEndian(payload, 7, height - 1);

  return createRiffChunk('VP8X', payload);
}

function createStandardXmp(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return null;
  }

  const attributes = [
    'xmlns:tiff="http://ns.adobe.com/tiff/1.0/"',
    'xmlns:exif="http://ns.adobe.com/exif/1.0/"',
    'xmlns:xmp="http://ns.adobe.com/xap/1.0/"',
  ];

  addXmpAttribute(attributes, metadata, 'Make', 'tiff:Make');
  addXmpAttribute(attributes, metadata, 'Model', 'tiff:Model');
  addXmpAttribute(attributes, metadata, 'DateTimeOriginal', 'exif:DateTimeOriginal');
  addXmpAttribute(attributes, metadata, 'DateTimeDigitized', 'exif:DateTimeDigitized');
  addXmpAttribute(attributes, metadata, 'DateTime', 'xmp:CreateDate');
  addXmpRationalAttribute(attributes, metadata, 'ExposureTime', 'exif:ExposureTime');
  addXmpRationalAttribute(attributes, metadata, 'FNumber', 'exif:FNumber');
  addXmpRationalAttribute(attributes, metadata, 'FocalLength', 'exif:FocalLength');
  addXmpAttribute(attributes, metadata, 'FocalLengthIn35mmFilm', 'exif:FocalLengthIn35mmFilm');
  addXmpAttribute(attributes, metadata, 'ISOSpeedRatings', 'exif:ISOSpeedRatings');
  addXmpRationalAttribute(attributes, metadata, 'ShutterSpeedValue', 'exif:ShutterSpeedValue');
  addXmpAttribute(attributes, metadata, 'GPSLatitude', 'exif:GPSLatitude');
  addXmpAttribute(attributes, metadata, 'GPSLongitude', 'exif:GPSLongitude');
  addXmpAttribute(attributes, metadata, 'GPSAltitude', 'exif:GPSAltitude');

  if (attributes.length === 3) {
    return null;
  }

  return textEncoder.encode(
    [
      '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>',
      '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
      '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
      `<rdf:Description rdf:about="" ${attributes.join(' ')} />`,
      '</rdf:RDF>',
      '</x:xmpmeta>',
      '<?xpacket end="w"?>',
    ].join(''),
  );
}

async function attachXmpToWebpBlob(
  webpBlob: Blob,
  xmp: Uint8Array | null,
  dimensions: { width: number; height: number },
) {
  if (!xmp) {
    return webpBlob;
  }

  const sourceBytes = new Uint8Array(await webpBlob.arrayBuffer());

  if (readAscii(sourceBytes, 0, 4) !== 'RIFF' || readAscii(sourceBytes, 8, 4) !== 'WEBP') {
    return webpBlob;
  }

  const xmpChunk = createRiffChunk('XMP ', xmp);

  if (readAscii(sourceBytes, 12, 4) === 'VP8X') {
    const vp8xChunkSize = readUint32LittleEndian(sourceBytes, 16);
    const vp8xChunkEnd = 20 + vp8xChunkSize + (vp8xChunkSize % 2);

    if (vp8xChunkSize !== webpVp8xChunkSize || vp8xChunkEnd > sourceBytes.length) {
      return webpBlob;
    }

    const prefix = sourceBytes.slice(0, vp8xChunkEnd);

    prefix[20] |= webpXmpFlag;

    const result = concatBytes([prefix, sourceBytes.slice(vp8xChunkEnd), xmpChunk]);
    writeUint32LittleEndian(result, 4, result.length - 8);

    return new Blob([toArrayBuffer(result)], { type: 'image/webp' });
  }

  const vp8xChunk = createVp8xChunk(webpXmpFlag, dimensions.width, dimensions.height);
  const result = concatBytes([
    sourceBytes.slice(0, 12),
    vp8xChunk,
    sourceBytes.slice(12),
    xmpChunk,
  ]);
  writeUint32LittleEndian(result, 4, result.length - 8);

  return new Blob([toArrayBuffer(result)], { type: 'image/webp' });
}

export async function createCompressedWebpFile(
  file: File,
  options: CompressImageOptions,
): Promise<File> {
  const browserReadableFile = await createBrowserReadableFile(file);
  const imageBitmap = await createImageBitmap(browserReadableFile);
  const longestSide = Math.max(imageBitmap.width, imageBitmap.height);
  const scale = longestSide > options.maxWidth ? options.maxWidth / longestSide : 1;
  const targetWidth = Math.round(imageBitmap.width * scale);
  const targetHeight = Math.round(imageBitmap.height * scale);

  if (targetWidth <= 0 || targetHeight <= 0) {
    imageBitmap.close();
    throw new Error('Invalid image dimensions.');
  }

  const canvas = document.createElement('canvas');

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');

  if (!context) {
    imageBitmap.close();
    throw new Error('Canvas is not available.');
  }

  context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
  imageBitmap.close();

  const blob = await encodeImageDataToWebpBlob(imageData, options.quality);
  const blobWithMetadata = await attachXmpToWebpBlob(
    blob,
    createStandardXmp(options.originalMetadata),
    {
      height: targetHeight,
      width: targetWidth,
    },
  );

  return new File([blobWithMetadata], getWebpFileName(file.name), {
    lastModified: Date.now(),
    type: 'image/webp',
  });
}
