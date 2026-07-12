
import { $api } from "#/api/client/$api";

import {
	type ArticleMediaUploadCleanup,
	type ArticleMediaUploadTargetCreator,
	createArticleMediaUploader,
} from "../utils/article-media-upload";

export function useArticleMediaUploader() {
	const createUploadTargetsMutation = $api.useMutation(
		"post",
		"/api/article-media/upload-targets",
	);
	const deleteUploadsMutation = $api.useMutation(
		"delete",
		"/api/article-media/uploads",
	);

	const createUploadTargets: ArticleMediaUploadTargetCreator = async (body) => {
		const result = await createUploadTargetsMutation.mutateAsync({ body });

		if (!result) {
			throw new Error("업로드 URL을 만들지 못했습니다.");
		}

		return result;
	};

	const deleteUploads: ArticleMediaUploadCleanup = async (objectKeys) => {
		if (objectKeys.length === 0) {
			return;
		}

		await deleteUploadsMutation.mutateAsync({
			body: { objectKeys: [...objectKeys] },
		});
	};

	return createArticleMediaUploader({ createUploadTargets, deleteUploads });
}
