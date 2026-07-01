import type {
  AuthorName,
  Brand,
  IsoDateTimeString,
} from '@/core/common/domain';
import type { HikingId } from '@/core/hiking/domain';

export type ArticleId = Brand<string, 'ArticleId'>;

export type ArticlePhoto = {
  readonly url: string;
  readonly order: number;
};

export type ArticlePhotos = readonly [ArticlePhoto, ...ArticlePhoto[]];

export type Article = {
  readonly id: ArticleId;
  readonly hikingId: HikingId;
  readonly photos: ArticlePhotos;
  readonly body: string;
  readonly authorName: AuthorName;
  readonly createdAt: IsoDateTimeString;
  readonly updatedAt: IsoDateTimeString;
  readonly deletedAt: IsoDateTimeString | null;
  readonly edited: boolean;
};

export type CreateArticleInput = {
  readonly hikingId: HikingId;
  readonly photos: ArticlePhotos;
  readonly body: string;
  readonly authorName: AuthorName;
};

export type UpdateArticleInput = {
  readonly photos?: ArticlePhotos;
  readonly body?: string;
};
