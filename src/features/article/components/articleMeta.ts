import { createElement, type ReactNode } from "react";
import Link from "#/features/shared/components/AppLink";

import { DateTimeLabel } from "#/features/shared/components/DateTimeLabel";
import type { Article } from "@/core/article/domain";

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
