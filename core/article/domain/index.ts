import type { AuthorName, Brand, IsoDateTimeString } from '@/core/common/domain';
import type { HikingId } from '@/core/hiking/domain';

export type ArticleId = Brand<string, 'ArticleId'>;

export type ArticleMediaType = 'image' | 'video';

export type ArticleMedia = {
  readonly byteSize?: number;
  readonly contentType?: string;
  readonly durationMs?: number | null;
  readonly height?: number | null;
  readonly mediaType: ArticleMediaType;
  readonly objectKey?: string;
  readonly thumbnailUrl?: string | null;
  readonly url: string;
  readonly order: number;
  readonly width?: number | null;
};

export type ArticleMediaItems = readonly [ArticleMedia, ...ArticleMedia[]];

export type Article = {
  readonly id: ArticleId;
  readonly authorUserId?: number;
  readonly hikingId: HikingId;
  readonly media: ArticleMediaItems;
  readonly body: string;
  readonly authorName: AuthorName;
  readonly authorProfileImageUrl: string | null;
  readonly likeCount: number;
  readonly likedByCurrentUser: boolean;
  readonly createdAt: IsoDateTimeString;
  readonly updatedAt: IsoDateTimeString;
  readonly deletedAt: IsoDateTimeString | null;
  readonly edited: boolean;
};

export type CreateArticleInput = {
  readonly authorUserId: number;
  readonly hikingId: HikingId;
  readonly media: ArticleMediaItems;
  readonly body: string;
};

export type UpdateArticleInput = {
  readonly media?: ArticleMediaItems;
  readonly body?: string;
};
