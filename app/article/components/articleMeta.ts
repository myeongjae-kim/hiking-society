import { createElement, type ReactNode } from 'react';

import { DateTimeLabel } from '@/app/common/components/DateTimeLabel';
import type { Article } from '@/core/article/domain';

export function getArticleMeta(article: Article, commentCount: number): ReactNode[] {
  return [
    createElement(DateTimeLabel, {
      key: `${article.id}-created-at`,
      value: article.createdAt,
    }),
    `${article.photos.length} photos`,
    `${commentCount} comments`,
    ...(article.edited ? ['edited'] : []),
  ];
}
