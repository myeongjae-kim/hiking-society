import type { PreparedImageSource } from '#/features/media/imageCompression';
import type { ArticleMedia } from '@/core/article/domain';

export type DraftMedia = ArticleMedia & {
  readonly file?: File;
  readonly fileName: string;
  readonly fileSize?: number;
  readonly lastModified?: number;
  readonly originalMetadata?: Record<string, unknown> | null;
  readonly preparedSource?: PreparedImageSource;
  readonly rotation?: number;
  readonly thumbnailFile?: File;
};

export type ArticleFormValues = {
  body: string;
  media: DraftMedia[];
};
