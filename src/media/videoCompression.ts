type CompressVideoOptions = {
  maxDurationMs: number;
  maxSourceBytes: number;
  maxWidth: number;
  onProgress?: (progress: number) => void;
};

export type CompressedVideoResult = {
  durationMs: number;
  file: File;
  height: number;
  thumbnailFile: File;
  width: number;
};

const outputContentType = 'video/mp4';
const thumbnailContentType = 'image/webp';

let ffmpegInstancePromise: Promise<import('@ffmpeg/ffmpeg').FFmpeg> | null = null;

function getBaseFileName(fileName: string, fallback: string) {
  const extensionStartIndex = fileName.lastIndexOf('.');

  return extensionStartIndex > 0 ? fileName.slice(0, extensionStartIndex) : fileName || fallback;
}

function getMp4FileName(fileName: string) {
  return `${getBaseFileName(fileName, 'video')}.mp4`;
}

function getThumbnailFileName(fileName: string) {
  return `${getBaseFileName(fileName, 'video')}-thumbnail.webp`;
}

function readVideoMetadata(file: File) {
  return new Promise<{ durationMs: number; height: number; width: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      const durationMs = Math.round(video.duration * 1000);
      const width = video.videoWidth;
      const height = video.videoHeight;

      cleanup();

      if (!Number.isFinite(durationMs) || durationMs <= 0 || width <= 0 || height <= 0) {
        reject(new Error('Invalid video metadata.'));
        return;
      }

      resolve({ durationMs, height, width });
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('Video metadata is not readable.'));
    };
    video.src = url;
  });
}

function createThumbnail(file: File, fileName: string) {
  return new Promise<File>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(Math.max(video.duration * 0.1, 0), 1);
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const longestSide = Math.max(video.videoWidth, video.videoHeight);
      const scale = longestSide > 720 ? 720 / longestSide : 1;

      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const context = canvas.getContext('2d');

      if (!context) {
        cleanup();
        reject(new Error('Canvas is not available.'));
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          cleanup();

          if (!blob) {
            reject(new Error('Video thumbnail is not encodable.'));
            return;
          }

          resolve(
            new File([blob], getThumbnailFileName(fileName), {
              lastModified: Date.now(),
              type: thumbnailContentType,
            }),
          );
        },
        thumbnailContentType,
        0.82,
      );
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('Video thumbnail is not readable.'));
    };
    video.src = url;
  });
}

async function getFfmpeg() {
  ffmpegInstancePromise ??= (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const ffmpeg = new FFmpeg();

    await ffmpeg.load();

    return ffmpeg;
  })();

  return ffmpegInstancePromise;
}

function toUint8Array(data: Awaited<ReturnType<import('@ffmpeg/ffmpeg').FFmpeg['readFile']>>) {
  if (data instanceof Uint8Array) {
    return data;
  }

  return new TextEncoder().encode(data);
}

export async function createCompressedMp4File(
  file: File,
  options: CompressVideoOptions,
): Promise<CompressedVideoResult> {
  if (file.size > options.maxSourceBytes) {
    throw new Error('동영상은 120MB 이하만 선택해주세요.');
  }

  const sourceMetadata = await readVideoMetadata(file);

  if (sourceMetadata.durationMs > options.maxDurationMs) {
    throw new Error('동영상은 90초 이하만 선택해주세요.');
  }

  const sourceThumbnailPromise = createThumbnail(file, file.name).catch(() => null);

  const [{ fetchFile }, ffmpeg] = await Promise.all([import('@ffmpeg/util'), getFfmpeg()]);
  const inputPath = `input-${crypto.randomUUID()}`;
  const outputPath = `output-${crypto.randomUUID()}.mp4`;
  const progressHandler = ({ progress }: { progress: number }) => {
    options.onProgress?.(Math.max(0, Math.min(progress, 1)));
  };

  ffmpeg.on('progress', progressHandler);

  try {
    await ffmpeg.writeFile(inputPath, await fetchFile(file));
    await ffmpeg.exec([
      '-i',
      inputPath,
      '-vf',
      `scale=w='if(gt(iw,ih),min(${options.maxWidth},iw),-2)':h='if(gt(iw,ih),-2,min(${options.maxWidth},ih))',fps=30`,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputPath,
    ]);

    const outputData = toUint8Array(await ffmpeg.readFile(outputPath));
    const outputBuffer = new ArrayBuffer(outputData.byteLength);
    new Uint8Array(outputBuffer).set(outputData);
    const outputFile = new File([outputBuffer], getMp4FileName(file.name), {
      lastModified: Date.now(),
      type: outputContentType,
    });
    const outputMetadata = await readVideoMetadata(outputFile);
    const sourceThumbnailFile = await sourceThumbnailPromise;
    const thumbnailFile = sourceThumbnailFile ?? (await createThumbnail(outputFile, file.name));

    options.onProgress?.(1);

    return {
      ...outputMetadata,
      file: outputFile,
      thumbnailFile,
    };
  } finally {
    ffmpeg.off('progress', progressHandler);
    await Promise.allSettled([ffmpeg.deleteFile(inputPath), ffmpeg.deleteFile(outputPath)]);
  }
}
