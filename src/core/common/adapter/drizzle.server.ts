import { AsyncLocalStorage } from "node:async_hooks";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/core/config/env.server";

const rootDb = drizzle(env.DATABASE_URL);
type DrizzleDatabase = typeof rootDb;

const currentTransactionStorage = new AsyncLocalStorage<DrizzleDatabase>();

export const db = new Proxy(rootDb, {
	get(target, property, receiver) {
		const currentTransaction = currentTransactionStorage.getStore();

		if (property === "transaction" && currentTransaction) {
			return async <T>(callback: (tx: DrizzleDatabase) => Promise<T>) =>
				callback(currentTransaction);
		}

		const database = currentTransaction ?? target;
		const value = Reflect.get(database, property, receiver);
		return typeof value === "function" ? value.bind(database) : value;
	},
}) as DrizzleDatabase;

export function runInDrizzleTransaction<T>(work: () => Promise<T>) {
	const currentTransaction = currentTransactionStorage.getStore();

	if (currentTransaction) {
		return work();
	}

	return rootDb.transaction((tx) =>
		currentTransactionStorage.run(tx as unknown as DrizzleDatabase, work),
	);
}
