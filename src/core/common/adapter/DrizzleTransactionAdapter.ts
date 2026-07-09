import { runInDrizzleTransaction } from "@/core/config/drizzle.server";
import type { TransactionPort } from "../application/port/out/TransactionPort";

export class DrizzleTransactionAdapter implements TransactionPort {
	run<T>(work: () => Promise<T>) {
		return runInDrizzleTransaction(work);
	}
}
