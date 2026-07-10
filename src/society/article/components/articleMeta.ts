import Link from "#/society/shared/components/AppLink";
import { createElement, type ReactNode } from "react";

import { DateTimeLabel } from "#/society/shared/components/DateTimeLabel";
import type { ArticleViewModel as Article } from "#/society/shared/viewModels";

export function getArticleMeta(
	article: Article,
	commentCount: number,
	articleDetailHref?: string,
): ReactNode[] {
	const createdAtLabel = createElement(DateTimeLabel, {
		className: "whitespace-nowrap",
		value: article.createdAt,
	});

	return [
		articleDetailHref
			? createElement(
					Link,
					{
						className:
							"text-[var(--pink)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]",
						href: articleDetailHref,
						key: `${article.id}-created-at`,
					},
					createdAtLabel,
				)
			: createdAtLabel,
		`${article.media.length} media`,
		`${commentCount} comments`,
		...(article.edited ? ["edited"] : []),
	];
}
