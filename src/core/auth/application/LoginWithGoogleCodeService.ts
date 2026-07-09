import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { LoginWithGoogleCodeUseCase } from "./port/in/LoginWithGoogleCodeUseCase";
import type { AuthCommandPort } from "./port/out/AuthCommandPort";
import type { GoogleOAuthPort } from "./port/out/GoogleOAuthPort";

export class LoginWithGoogleCodeService implements LoginWithGoogleCodeUseCase {
	constructor(
		@Autowired("GoogleOAuthPort")
		private googleOAuthPort: GoogleOAuthPort,
		@Autowired("AuthCommandPort")
		private authCommandPort: AuthCommandPort,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async login(input: { code: string; now: Date }) {
		const payload = await this.googleOAuthPort.verifyCode(input.code);
		const user = await this.transactionPort.run(
			() =>
				this.authCommandPort.upsertGoogleAccount({
					now: input.now,
					payload,
				}),
			{ readOnly: false },
		);

		return {
			session: {
				email: user.email,
				provider: user.provider ?? payload.provider,
				role: user.role,
				userId: user.id,
			},
			user,
		};
	}
}
