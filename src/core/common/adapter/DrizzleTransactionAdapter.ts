import { runInDrizzleTransaction } from "@/core/common/adapter/drizzle.server";
import type { TransactionPort } from "../application/port/out/TransactionPort";

export class DrizzleTransactionAdapter implements TransactionPort {
	run<T>(
		work: () => Promise<T>,
		options?: Parameters<TransactionPort["run"]>[1],
	) {
		return runInDrizzleTransaction(work, options);
	}
}
