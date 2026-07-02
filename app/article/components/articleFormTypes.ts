import type { ArticlePhoto } from '@/core/article/domain';

export type DraftPhoto = ArticlePhoto & {
  readonly file?: File;
  readonly fileName: string;
  readonly fileSize?: number;
  readonly lastModified?: number;
};

export type ArticleFormValues = {
  body: string;
  photos: DraftPhoto[];
};
