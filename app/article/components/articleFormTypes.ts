import type { ArticleMedia } from '@/core/article/domain';

export type DraftMedia = ArticleMedia & {
  readonly file?: File;
  readonly fileName: string;
  readonly fileSize?: number;
  readonly lastModified?: number;
  readonly originalMetadata?: Record<string, unknown> | null;
  readonly thumbnailFile?: File;
};

export type ArticleFormValues = {
  body: string;
  media: DraftMedia[];
};
