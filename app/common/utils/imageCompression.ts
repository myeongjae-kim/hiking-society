type CompressImageOptions = {
  maxWidth: number;
  quality: number;
};

type Bytes = Uint8Array<ArrayBuffer>;

type WebpMetadataChunks = {
  exif?: Bytes;
  icc?: Bytes;
  xmp?: Bytes;
};

type MetadataBlock = {
  end: number;
  start: number;
  type: string;
};

const heicImageTypes = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);
const heicFileNamePattern = /\.(heic|heif)$/i;
const textEncoder = new TextEncoder();
const jpegExifHeader = textEncoder.encode('Exif\0\0');
const jpegXmpHeader = textEncoder.encode('http://ns.adobe.com/xap/1.0/\0');
const pngXmpKeyword = textEncoder.encode('XML:com.adobe.xmp');
const webpVp8xChunkSize = 10;
const webpIccFlag = 0x20;
const webpExifFlag = 0x08;
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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
}

function readAscii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function startsWithBytes(bytes: Uint8Array, offset: number, expected: Uint8Array) {
  if (offset + expected.length > bytes.length) {
    return false;
  }

  return expected.every((byte, index) => bytes[offset + index] === byte);
}

function readUint32BigEndian(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] * 0x1000000 +
    ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])
  );
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

function isTiffHeader(bytes: Uint8Array, offset: number) {
  return (
    offset + 4 <= bytes.length &&
    ((bytes[offset] === 0x49 &&
      bytes[offset + 1] === 0x49 &&
      bytes[offset + 2] === 0x2a &&
      bytes[offset + 3] === 0x00) ||
      (bytes[offset] === 0x4d &&
        bytes[offset + 1] === 0x4d &&
        bytes[offset + 2] === 0x00 &&
        bytes[offset + 3] === 0x2a))
  );
}

function normalizeExifPayload(payload: Bytes) {
  if (startsWithBytes(payload, 0, jpegExifHeader)) {
    return payload;
  }

  if (isTiffHeader(payload, 0)) {
    return concatBytes([jpegExifHeader, payload]);
  }

  if (payload.length >= 4) {
    const tiffOffset = 4 + readUint32BigEndian(payload, 0);

    if (isTiffHeader(payload, tiffOffset)) {
      return concatBytes([jpegExifHeader, payload.slice(tiffOffset)]);
    }
  }

  return null;
}

function getJpegBlockPayload(bytes: Uint8Array, block: MetadataBlock) {
  if (block.start + 4 > block.end) {
    return null;
  }

  return bytes.slice(block.start + 4, block.end);
}

function getPngBlockPayload(bytes: Uint8Array, block: MetadataBlock) {
  if (block.start + 12 > block.end) {
    return null;
  }

  return bytes.slice(block.start + 8, block.end - 4);
}

function extractJpegXmpPayload(payload: Bytes) {
  return startsWithBytes(payload, 0, jpegXmpHeader) ? payload.slice(jpegXmpHeader.length) : null;
}

function extractPngXmpPayload(payload: Bytes) {
  if (!startsWithBytes(payload, 0, pngXmpKeyword)) {
    return null;
  }

  const keywordEndOffset = pngXmpKeyword.length;

  if (
    payload[keywordEndOffset] !== 0 ||
    payload[keywordEndOffset + 1] !== 0 ||
    payload[keywordEndOffset + 2] !== 0
  ) {
    return null;
  }

  let offset = keywordEndOffset + 3;

  while (offset < payload.length && payload[offset] !== 0) {
    offset += 1;
  }

  offset += 1;

  while (offset < payload.length && payload[offset] !== 0) {
    offset += 1;
  }

  offset += 1;

  return offset <= payload.length ? payload.slice(offset) : null;
}

async function inflateBytes(bytes: Uint8Array) {
  if (!('DecompressionStream' in globalThis)) {
    return null;
  }

  const stream = new Blob([toArrayBuffer(bytes)])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'));

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extractPngIccPayload(payload: Bytes) {
  const nullIndex = payload.indexOf(0);

  if (nullIndex < 0 || payload[nullIndex + 1] !== 0) {
    return null;
  }

  return inflateBytes(payload.slice(nullIndex + 2));
}

function mergeMetadataChunks(chunks: readonly WebpMetadataChunks[]) {
  const result: WebpMetadataChunks = {};
  const iccChunks: Bytes[] = [];

  for (const chunk of chunks) {
    result.exif ??= chunk.exif;
    result.xmp ??= chunk.xmp;

    if (chunk.icc) {
      iccChunks.push(chunk.icc);
    }
  }

  if (iccChunks.length > 0) {
    result.icc = concatBytes(iccChunks);
  }

  return result;
}

async function extractOriginalMetadataChunks(file: File): Promise<WebpMetadataChunks> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const { load } = await import('exifreader');
    const tags = await load(toArrayBuffer(bytes), {
      async: true,
      expanded: true,
      includeOffsets: true,
    });
    const blocks = tags.metadataRange?.blocks ?? [];
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
    const isPng = readAscii(bytes, 1, 3) === 'PNG';
    const isWebp = readAscii(bytes, 0, 4) === 'RIFF' && readAscii(bytes, 8, 4) === 'WEBP';
    const extractedChunks = await Promise.all(
      blocks.map(async (block): Promise<WebpMetadataChunks> => {
        if (block.start < 0 || block.end > bytes.length || block.start >= block.end) {
          return {};
        }

        if (isWebp) {
          const payloadSize = readUint32LittleEndian(bytes, block.start + 4);
          const payload = bytes.slice(block.start + 8, block.start + 8 + payloadSize);

          if (block.type === 'exif') {
            return { exif: payload };
          }

          if (block.type === 'xmp') {
            return { xmp: payload };
          }

          if (block.type === 'icc') {
            return { icc: payload };
          }
        }

        if (block.type === 'exif') {
          const payload = isJpeg
            ? getJpegBlockPayload(bytes, block)
            : isPng
              ? getPngBlockPayload(bytes, block)
              : bytes.slice(block.start, block.end);
          const exif = payload ? normalizeExifPayload(payload) : null;

          return exif ? { exif } : {};
        }

        if (block.type === 'xmp') {
          const payload = isJpeg
            ? getJpegBlockPayload(bytes, block)
            : isPng
              ? getPngBlockPayload(bytes, block)
              : bytes.slice(block.start, block.end);
          const xmp = isJpeg
            ? payload
              ? extractJpegXmpPayload(payload)
              : null
            : isPng
              ? payload
                ? extractPngXmpPayload(payload)
                : null
              : payload;

          return xmp ? { xmp } : {};
        }

        if (block.type === 'icc') {
          const payload = isJpeg
            ? bytes.slice(block.start + 18, block.end)
            : isPng
              ? getPngBlockPayload(bytes, block)
              : bytes.slice(block.start, block.end);
          const icc = isPng ? (payload ? await extractPngIccPayload(payload) : null) : payload;

          return icc ? { icc } : {};
        }

        return {};
      }),
    );

    return mergeMetadataChunks(extractedChunks);
  } catch {
    return {};
  }
}

function hasMetadataChunks(metadata: WebpMetadataChunks) {
  return Boolean(metadata.exif || metadata.icc || metadata.xmp);
}

async function attachMetadataToWebpBlob(
  webpBlob: Blob,
  metadata: WebpMetadataChunks,
  dimensions: { width: number; height: number },
) {
  if (!hasMetadataChunks(metadata)) {
    return webpBlob;
  }

  const sourceBytes = new Uint8Array(await webpBlob.arrayBuffer());

  if (readAscii(sourceBytes, 0, 4) !== 'RIFF' || readAscii(sourceBytes, 8, 4) !== 'WEBP') {
    return webpBlob;
  }

  const metadataFlags =
    (metadata.icc ? webpIccFlag : 0) |
    (metadata.exif ? webpExifFlag : 0) |
    (metadata.xmp ? webpXmpFlag : 0);
  const iccChunk = metadata.icc ? createRiffChunk('ICCP', metadata.icc) : null;
  const trailingMetadataChunks = [
    metadata.exif ? createRiffChunk('EXIF', metadata.exif) : null,
    metadata.xmp ? createRiffChunk('XMP ', metadata.xmp) : null,
  ].filter((chunk): chunk is Bytes => chunk !== null);

  if (readAscii(sourceBytes, 12, 4) === 'VP8X') {
    const vp8xChunkSize = readUint32LittleEndian(sourceBytes, 16);
    const vp8xChunkEnd = 20 + vp8xChunkSize + (vp8xChunkSize % 2);

    if (vp8xChunkSize !== webpVp8xChunkSize || vp8xChunkEnd > sourceBytes.length) {
      return webpBlob;
    }

    const prefix = sourceBytes.slice(0, vp8xChunkEnd);

    prefix[20] |= metadataFlags;

    const result = concatBytes([
      prefix,
      ...(iccChunk ? [iccChunk] : []),
      sourceBytes.slice(vp8xChunkEnd),
      ...trailingMetadataChunks,
    ]);
    writeUint32LittleEndian(result, 4, result.length - 8);

    return new Blob([toArrayBuffer(result)], { type: 'image/webp' });
  }

  const vp8xChunk = createVp8xChunk(metadataFlags, dimensions.width, dimensions.height);
  const result = concatBytes([
    sourceBytes.slice(0, 12),
    vp8xChunk,
    ...(iccChunk ? [iccChunk] : []),
    sourceBytes.slice(12),
    ...trailingMetadataChunks,
  ]);
  writeUint32LittleEndian(result, 4, result.length - 8);

  return new Blob([toArrayBuffer(result)], { type: 'image/webp' });
}

export async function createCompressedWebpFile(
  file: File,
  options: CompressImageOptions,
): Promise<File> {
  const metadataChunksPromise = extractOriginalMetadataChunks(file);
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
  const blobWithMetadata = await attachMetadataToWebpBlob(blob, await metadataChunksPromise, {
    height: targetHeight,
    width: targetWidth,
  });

  return new File([blobWithMetadata], getWebpFileName(file.name), {
    lastModified: Date.now(),
    type: 'image/webp',
  });
}
