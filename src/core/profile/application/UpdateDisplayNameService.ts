import { Autowired } from "@/core/config/Autowired";
import type { UpdateDisplayNameUseCase } from "./port/in/UpdateDisplayNameUseCase";
import type { ProfileCommandPort } from "./port/out/ProfileCommandPort";

export class UpdateDisplayNameService implements UpdateDisplayNameUseCase {
	constructor(
		@Autowired("ProfileCommandPort")
		private profileCommandPort: ProfileCommandPort,
	) {}

	async updateDisplayName(
		input: Parameters<UpdateDisplayNameUseCase["updateDisplayName"]>[0],
	) {
		await this.profileCommandPort.updateActiveDisplayName(input);
	}
}
