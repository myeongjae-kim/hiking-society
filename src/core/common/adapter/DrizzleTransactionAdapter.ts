import type { DrizzleTransactionRunner } from "@/core/common/adapter/drizzle.server";
import { Autowired } from "@/core/config/Autowired";
import type {
	TransactionOptions,
	TransactionPort,
} from "../application/port/out/TransactionPort";

export class DrizzleTransactionAdapter implements TransactionPort {
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	run<T>(work: () => Promise<T>, options?: TransactionOptions) {
		return this.transactionRunner.run(() => work(), options);
	}
}
