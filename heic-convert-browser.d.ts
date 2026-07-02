declare module 'heic-convert/browser' {
  type HeicConvertOptions = {
    buffer: Uint8Array;
    format: 'JPEG' | 'PNG';
    quality?: number;
  };

  export default function convert(options: HeicConvertOptions): Promise<Uint8Array>;
}
