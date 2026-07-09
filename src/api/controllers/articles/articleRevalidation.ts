import { successRevalidationPaths } from "#/api/config/apiUtils";
import { revalidatePath } from "#/api/config/revalidate";
import type { ArticleId } from "@/core/article/domain";

export function revalidateArticleSuccess(articleId?: ArticleId | null) {
	for (const path of successRevalidationPaths(articleId)) {
		revalidatePath(path);
	}
}
