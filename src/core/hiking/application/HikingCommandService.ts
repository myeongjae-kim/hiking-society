import { applicationError } from "@/core/common/application/ApplicationError";
import type { ClockPort } from "@/core/common/application/port/out/ClockPort";
import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import { HikingEntity } from "../domain";
import type { HikingCommandUseCase } from "./port/in/HikingCommandUseCase";
import type { HikingCommandPort } from "./port/out/HikingCommandPort";

export class HikingCommandService implements HikingCommandUseCase {
	constructor(
		@Autowired("HikingCommandPort")
		private hikingCommandPort: HikingCommandPort,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
		@Autowired("ClockPort")
		private clockPort: ClockPort,
	) {}

	async create(input: Parameters<HikingCommandUseCase["create"]>[0]) {
		await this.transactionPort.run(() => this.hikingCommandPort.create(input), {
			readOnly: false,
		});
	}

	async update(input: Parameters<HikingCommandUseCase["update"]>[0]) {
		await this.transactionPort.run(
			async () => {
				const hiking = await this.hikingCommandPort.findActiveHikingById(
					input.hikingId,
				);

				const updatePlan = hiking
					? HikingEntity.rehydrate(hiking).planUpdate({
							userId: input.userId,
							values: input.values,
						})
					: null;

				if (!updatePlan) {
					throw applicationError.notFound(
						"산행을 수정할 권한이 없거나 산행을 찾을 수 없습니다.",
					);
				}

				const updated = await this.hikingCommandPort.update({
					hikingId: updatePlan.hikingId,
					now: this.clockPort.now(),
					values: updatePlan.values,
				});

				if (!updated) {
					throw applicationError.notFound(
						"산행을 수정할 권한이 없거나 산행을 찾을 수 없습니다.",
					);
				}
			},
			{ readOnly: false },
		);
	}

	async delete(input: Parameters<HikingCommandUseCase["delete"]>[0]) {
		await this.transactionPort.run(
			async () => {
				const hiking = await this.hikingCommandPort.findActiveHikingById(
					input.hikingId,
				);

				const deleteDecision = hiking
					? HikingEntity.rehydrate(hiking).planDelete({
							userId: input.userId,
						})
					: null;

				if (!deleteDecision || deleteDecision.status === "forbidden") {
					throw applicationError.notFound(
						"산행을 삭제할 권한이 없거나 산행을 찾을 수 없습니다.",
					);
				}

				if (deleteDecision.status === "has-active-articles") {
					throw applicationError.badRequest(
						"글이 있는 산행은 삭제할 수 없습니다.",
					);
				}

				const deleted = await this.hikingCommandPort.delete({
					hikingId: deleteDecision.hikingId,
					now: this.clockPort.now(),
				});

				if (!deleted) {
					throw applicationError.notFound(
						"산행을 삭제할 권한이 없거나 산행을 찾을 수 없습니다.",
					);
				}
			},
			{ readOnly: false },
		);
	}
}
