import type { ClockPort } from "@/core/common/application/port/out/ClockPort";
import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { UpdateDisplayNameUseCase } from "./port/in/UpdateDisplayNameUseCase";
import type { ProfileCommandPort } from "./port/out/ProfileCommandPort";

export class UpdateDisplayNameService implements UpdateDisplayNameUseCase {
	constructor(
		@Autowired("ProfileCommandPort")
		private profileCommandPort: ProfileCommandPort,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
		@Autowired("ClockPort")
		private clockPort: ClockPort,
	) {}

	async updateDisplayName(
		input: Parameters<UpdateDisplayNameUseCase["updateDisplayName"]>[0],
	) {
		await this.transactionPort.run(
			() =>
				this.profileCommandPort.updateActiveDisplayName({
					displayName: input.displayName,
					now: this.clockPort.now(),
					userId: input.userId,
				}),
			{ readOnly: false },
		);
	}
}
