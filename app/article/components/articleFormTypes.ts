import type { ArticlePhoto } from '@/core/article/domain';

export type DraftPhoto = ArticlePhoto & {
  readonly fileName: string;
};

export type ArticleFormValues = {
  body: string;
  photos: DraftPhoto[];
};
