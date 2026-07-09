import { Autowired } from "@/core/config/Autowired";
import type { ProfileImageUploadUseCase } from "./port/in/ProfileImageUploadUseCase";
import type { ProfileImageStoragePort } from "./port/out/ProfileImageStoragePort";

export class ProfileImageUploadService implements ProfileImageUploadUseCase {
	constructor(
		@Autowired("ProfileImageStoragePort")
		private profileImageStoragePort: ProfileImageStoragePort,
	) {}

	createUploadTarget(
		input: Parameters<ProfileImageUploadUseCase["createUploadTarget"]>[0],
	) {
		return this.profileImageStoragePort.createUploadTarget(input);
	}

	async deleteUploads(
		input: Parameters<ProfileImageUploadUseCase["deleteUploads"]>[0],
	) {
		await this.profileImageStoragePort.deleteObjects(input);
	}
}
