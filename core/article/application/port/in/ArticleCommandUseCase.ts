import type { ArticleId, ArticlePhoto, CreateArticleInput } from '@/core/article/domain';

export type ArticlePhotoUpload = {
  readonly byteSize: number;
  readonly contentType: string;
  readonly fileName: string;
  readonly order: number;
  readonly bytes: Uint8Array;
};

export type ExistingArticlePhotoInput = ArticlePhoto & {
  readonly objectKey?: string;
  readonly byteSize?: number;
  readonly contentType?: string;
};

export interface ArticleCommandUseCase {
  create(
    input: Omit<CreateArticleInput, 'photos'> & { photos: readonly ArticlePhotoUpload[] },
  ): Promise<void>;
  update(input: {
    articleId: ArticleId;
    body: string;
    userId: number;
    photos: readonly (ArticlePhotoUpload | ExistingArticlePhotoInput)[];
  }): Promise<void>;
  delete(input: { articleId: ArticleId; userId: number }): Promise<void>;
}
