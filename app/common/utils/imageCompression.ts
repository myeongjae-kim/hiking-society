type CompressImageOptions = {
  maxWidth: number;
  quality: number;
};

const heicImageTypes = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);
const heicFileNamePattern = /\.(heic|heif)$/i;

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

  return new File([blob], getWebpFileName(file.name), {
    lastModified: Date.now(),
    type: 'image/webp',
  });
}
