import { applicationError } from "@/core/common/application/ApplicationError";
import { UploadOwnershipPolicy } from "@/core/common/domain/UploadOwnershipPolicy";
import { Autowired } from "@/core/config/Autowired";
import type { UpdateProfileImageUseCase } from "./port/in/UpdateProfileImageUseCase";
import type { ProfileCommandPort } from "./port/out/ProfileCommandPort";

export class UpdateProfileImageService implements UpdateProfileImageUseCase {
	constructor(
		@Autowired("ProfileCommandPort")
		private profileCommandPort: ProfileCommandPort,
		@Autowired("S3_PUBLIC_BASE_URL")
		private s3PublicBaseUrl: string,
	) {}

	async updateProfileImage(
		input: Parameters<UpdateProfileImageUseCase["updateProfileImage"]>[0],
	) {
		if (!input.removeProfileImage && !input.profileImage) {
			throw applicationError.badRequest("새 프로필 이미지를 선택해주세요.");
		}

		if (input.profileImage) {
			const ownershipPolicy = UploadOwnershipPolicy.forUser({
				objectPrefix: "profile-images",
				publicBaseUrl: this.s3PublicBaseUrl,
				userId: input.userId,
			});

			if (
				!ownershipPolicy.hasOwnedObjectKey(input.profileImage.objectKey) ||
				!ownershipPolicy.hasExpectedPublicUrl({
					objectKey: input.profileImage.objectKey,
					url: input.profileImage.url,
				})
			) {
				throw applicationError.badRequest("잘못된 프로필 이미지입니다.");
			}
		}

		await this.profileCommandPort.updateActiveProfileImage({
			now: input.now,
			profileImageUrl: input.profileImage ? input.profileImage.url : null,
			userId: input.userId,
		});
	}
}
