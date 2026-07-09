import { Autowired } from "@/core/config/Autowired";
import type { ArticleMediaUploadUseCase } from "./port/in/ArticleMediaUploadUseCase";
import type { MediaStoragePort } from "./port/out/MediaStoragePort";

export class ArticleMediaUploadService implements ArticleMediaUploadUseCase {
	constructor(
		@Autowired("MediaStoragePort")
		private mediaStoragePort: MediaStoragePort,
	) {}

	async createUploadTargets(
		input: Parameters<ArticleMediaUploadUseCase["createUploadTargets"]>[0],
	) {
		return Promise.all(
			input.targets.map((target) =>
				this.mediaStoragePort.createUploadTarget({
					...target,
					userId: input.userId,
				}),
			),
		);
	}

	async deleteUploads(
		input: Parameters<ArticleMediaUploadUseCase["deleteUploads"]>[0],
	) {
		await this.mediaStoragePort.deleteObjects(input);
	}
}
