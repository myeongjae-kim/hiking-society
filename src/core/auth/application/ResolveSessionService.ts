import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { CreateSessionTokenUseCase } from "./port/in/CreateSessionTokenUseCase";
import type { ResolveSessionUseCase } from "./port/in/ResolveSessionUseCase";
import type { VerifyAccessTokenUseCase } from "./port/in/VerifyAccessTokenUseCase";
import type { VerifyRefreshTokenUseCase } from "./port/in/VerifyRefreshTokenUseCase";
import type { AuthQueryPort } from "./port/out/AuthQueryPort";

export class ResolveSessionService implements ResolveSessionUseCase {
	constructor(
		@Autowired("VerifyAccessTokenUseCase")
		private verifyAccessTokenUseCase: VerifyAccessTokenUseCase,
		@Autowired("VerifyRefreshTokenUseCase")
		private verifyRefreshTokenUseCase: VerifyRefreshTokenUseCase,
		@Autowired("AuthQueryPort")
		private authQueryPort: AuthQueryPort,
		@Autowired("CreateSessionTokenUseCase")
		private createSessionTokenUseCase: CreateSessionTokenUseCase,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async resolve(input: Parameters<ResolveSessionUseCase["resolve"]>[0]) {
		const accessPayload = input.accessToken
			? await this.verifyAccessTokenUseCase.verifyAccessToken(input.accessToken)
			: null;

		if (accessPayload) {
			return this.transactionPort.run(async () => ({
				refreshedTokens: null,
				user: await this.authQueryPort.getUserByUserId(accessPayload.userId),
			}));
		}

		const refreshPayload = input.refreshToken
			? await this.verifyRefreshTokenUseCase.verifyRefreshToken(
					input.refreshToken,
				)
			: null;

		if (!refreshPayload) {
			return { refreshedTokens: null, user: null };
		}

		return this.transactionPort.run(async () => {
			const session = await this.authQueryPort.getSessionSnapshotByUserId(
				refreshPayload.userId,
			);

			if (!session) {
				return { refreshedTokens: null, user: null };
			}

			const [tokens, user] = await Promise.all([
				this.createSessionTokenUseCase.create({
					email: session.email,
					provider: session.provider,
					role: session.role,
					userId: session.userId,
				}),
				this.authQueryPort.getUserByUserId(session.userId),
			]);

			return { refreshedTokens: tokens, user };
		});
	}
}
