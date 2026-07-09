import { env } from "@/core/config/env.server";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";
import { AsyncLocalStorage } from "node:async_hooks";

const primaryDb = drizzle(env.DATABASE_URL);
const replicaDb = drizzle(env.DATABASE_URL);
type DrizzleDatabase = typeof primaryDb;

type DrizzleTransactionOptions = {
	readOnly?: boolean;
	transactionConfig?: PgTransactionConfig;
};

type DrizzleTransactionContext = {
	database: DrizzleDatabase;
	readOnly: boolean;
};

const currentTransactionStorage =
	new AsyncLocalStorage<DrizzleTransactionContext>();

const writeMethodNames = new Set<PropertyKey>([
	"delete",
	"execute",
	"insert",
	"refreshMaterializedView",
	"update",
]);

function assertWritable(
	context: DrizzleTransactionContext | undefined,
	property: PropertyKey,
) {
	if (context?.readOnly && writeMethodNames.has(property)) {
		throw new Error(
			`Cannot call db.${String(property)} inside a read-only transaction.`,
		);
	}
}

export const db = new Proxy(primaryDb, {
	get(target, property, receiver) {
		const currentContext = currentTransactionStorage.getStore();

		if (property === "transaction") {
			return async <T>(
				callback: (tx: DrizzleDatabase) => Promise<T>,
				config?: PgTransactionConfig,
			) => {
				const activeContext = currentTransactionStorage.getStore();
				const requestedReadOnly = config?.accessMode === "read only";

				if (activeContext) {
					if (activeContext.readOnly && !requestedReadOnly) {
						throw new Error(
							"Cannot start a read-write transaction inside a read-only transaction.",
						);
					}

					return callback(activeContext.database);
				}

				return runInDrizzleTransaction(
					() => {
						const nestedContext = currentTransactionStorage.getStore();

						if (!nestedContext) {
							throw new Error("Drizzle transaction context is not available.");
						}

						return callback(nestedContext.database);
					},
					{
						readOnly: requestedReadOnly,
						transactionConfig: config,
					},
				);
			};
		}

		assertWritable(currentContext, property);

		const database = currentContext?.database ?? target;
		const value = Reflect.get(database, property, receiver);
		return typeof value === "function" ? value.bind(database) : value;
	},
}) as DrizzleDatabase;

export function runInDrizzleTransaction<T>(
	// 트랜잭션 callback 안에서 비동기 작업을 띄워두고 await하지 않은 채 callback이 끝나면,
	// 그 작업이 나중에 닫힌 tx를 잡고 DB를 호출할 수 있습니다.
	// transaction 안의 DB 작업은 반드시 callback 안에서 모두 await되어야 합니다.
	work: () => Promise<T>,
	options: DrizzleTransactionOptions = {},
) {
	const readOnly = options.readOnly ?? true;
	const currentContext = currentTransactionStorage.getStore();

	if (currentContext) {
		if (currentContext.readOnly && !readOnly) {
			throw new Error(
				"Cannot start a read-write transaction inside a read-only transaction.",
			);
		}

		return work();
	}

	const rootDb = readOnly ? replicaDb : primaryDb;

	return rootDb.transaction(
		(tx) =>
			currentTransactionStorage.run(
				{
					database: tx as unknown as DrizzleDatabase,
					readOnly,
				},
				work,
			),
		{
			...options.transactionConfig,
			accessMode: readOnly ? "read only" : "read write",
		},
	);
}
