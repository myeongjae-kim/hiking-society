import { applicationError } from "@/core/common/application/ApplicationError";
import type { ClockPort } from "@/core/common/application/port/out/ClockPort";
import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
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
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
		@Autowired("ClockPort")
		private clockPort: ClockPort,
	) {}

	async updateEmail(input: Parameters<UpdateEmailUseCase["updateEmail"]>[0]) {
		await this.transactionPort.run(
			async () => {
				const emailExists =
					await this.profileQueryPort.existsActiveUserByEmailExceptUserId({
						email: input.email,
						userId: input.userId,
					});

				if (emailExists) {
					throw applicationError.conflict("이미 사용 중인 이메일입니다.");
				}

				await this.profileCommandPort.updateActiveEmail({
					email: input.email,
					now: this.clockPort.now(),
					userId: input.userId,
				});
			},
			{ readOnly: false },
		);
	}
}
