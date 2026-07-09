import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import type { UpdateEmailUseCase } from "./port/in/UpdateEmailUseCase";
import type { ProfileCommandPort } from "./port/out/ProfileCommandPort";
import type { ProfileQueryPort } from "./port/out/ProfileQueryPort";

export class UpdateEmailService implements UpdateEmailUseCase {
	constructor(
		@Autowired("ProfileQueryPort")
		private profileQueryPort: ProfileQueryPort,
		@Autowired("ProfileCommandPort")
		private profileCommandPort: ProfileCommandPort,
	) {}

	async updateEmail(input: Parameters<UpdateEmailUseCase["updateEmail"]>[0]) {
		const emailExists =
			await this.profileQueryPort.existsActiveUserByEmailExceptUserId({
				email: input.email,
				userId: input.userId,
			});

		if (emailExists) {
			throw applicationError.conflict("이미 사용 중인 이메일입니다.");
		}

		await this.profileCommandPort.updateActiveEmail(input);
	}
}
