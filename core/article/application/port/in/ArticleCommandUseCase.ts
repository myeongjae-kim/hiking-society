import type {
  ArticleId,
  ArticleMedia,
  ArticleMediaType,
  CreateArticleInput,
} from '@/core/article/domain';

export type ArticleMediaUpload = {
  readonly byteSize: number;
  readonly contentType: string;
  readonly durationMs?: number | null;
  readonly fileName: string;
  readonly height?: number | null;
  readonly mediaType: ArticleMediaType;
  readonly order: number;
  readonly bytes: Uint8Array;
  readonly thumbnailUpload?: {
    readonly bytes: Uint8Array;
    readonly byteSize: number;
    readonly contentType: string;
    readonly fileName: string;
  };
  readonly width?: number | null;
};

export type ExistingArticleMediaInput = ArticleMedia & {
  readonly objectKey?: string;
  readonly byteSize?: number;
  readonly contentType?: string;
};

export interface ArticleCommandUseCase {
  create(
    input: Omit<CreateArticleInput, 'media'> & { media: readonly ArticleMediaUpload[] },
  ): Promise<void>;
  update(input: {
    articleId: ArticleId;
    body: string;
    userId: number;
    media: readonly (ArticleMediaUpload | ExistingArticleMediaInput)[];
  }): Promise<void>;
  delete(input: { articleId: ArticleId; userId: number }): Promise<void>;
}
