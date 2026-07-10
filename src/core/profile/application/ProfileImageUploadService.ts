import type { ClockPort } from "@/core/common/application/port/out/ClockPort";
import { Autowired } from "@/core/config/Autowired";
import type { ProfileImageUploadUseCase } from "./port/in/ProfileImageUploadUseCase";
import type { ProfileImageStoragePort } from "./port/out/ProfileImageStoragePort";

export class ProfileImageUploadService implements ProfileImageUploadUseCase {
	constructor(
		@Autowired("ProfileImageStoragePort")
		private profileImageStoragePort: ProfileImageStoragePort,
		@Autowired("ClockPort")
		private clockPort: ClockPort,
	) {}

	createUploadTarget(
		input: Parameters<ProfileImageUploadUseCase["createUploadTarget"]>[0],
	) {
		return this.profileImageStoragePort.createUploadTarget({
			...input,
			now: this.clockPort.now(),
		});
	}

	async deleteUploads(
		input: Parameters<ProfileImageUploadUseCase["deleteUploads"]>[0],
	) {
		await this.profileImageStoragePort.deleteObjects(input);
	}
}
