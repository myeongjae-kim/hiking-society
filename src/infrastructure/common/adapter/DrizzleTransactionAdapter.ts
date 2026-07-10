import type { DrizzleTransactionRunner } from "#/infrastructure/common/adapter/DrizzleTransactionRunner";
import { Autowired } from "@/core/config/Autowired";
import type {
	TransactionOptions,
	TransactionPort,
} from "@/core/common/application/port/out/TransactionPort";

export class DrizzleTransactionAdapter implements TransactionPort {
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	run<T>(work: () => Promise<T>, options?: TransactionOptions) {
		return this.transactionRunner.run(() => work(), options);
	}
}
