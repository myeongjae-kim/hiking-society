import "dotenv/config";
import { Autowired } from "@/core/config/Autowired";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";
import { AsyncLocalStorage } from "node:async_hooks";

export type DrizzleExecutor = Pick<
	ReturnType<typeof drizzle>,
	| "delete"
	| "execute"
	| "insert"
	| "refreshMaterializedView"
	| "select"
	| "update"
>;

export type DrizzleTransactionOptions = {
	readOnly?: boolean;
	transactionConfig?: PgTransactionConfig;
};

type DrizzleTransactionContext = {
	database: DrizzleExecutor;
	readOnly: boolean;
};

export class DrizzleTransactionRunner {
	private readonly primaryDb: ReturnType<typeof drizzle>;
	private readonly replicaDb: ReturnType<typeof drizzle>;

	constructor(
		@Autowired("DATABASE_PRIMARY_URL")
		databasePrimaryUrl: string,
		@Autowired("DATABASE_REPLICA_URL")
		databaseReplicaUrl: string,
	) {
		this.primaryDb = drizzle(databasePrimaryUrl);
		this.replicaDb = drizzle(databaseReplicaUrl);
	}

	// AsyncLocalStorage는 같은 Node 프로세스 안에서도 요청/async chain별로
	// 현재 트랜잭션 컨텍스트를 분리해 저장합니다.
	// 중첩 호출에서는 getStore()로 이미 열린 tx를 찾아 새 트랜잭션 대신 재사용합니다.
	private readonly currentTransactionStorage =
		new AsyncLocalStorage<DrizzleTransactionContext>();

	read<T>(work: (tx: DrizzleExecutor) => Promise<T>) {
		return this.run(work);
	}

	write<T>(work: (tx: DrizzleExecutor) => Promise<T>) {
		return this.run(work, { readOnly: false });
	}

	run<T>(
		// 트랜잭션 callback 안에서 비동기 작업을 띄워두고 await하지 않은 채 callback이 끝나면,
		// 그 작업이 나중에 닫힌 tx를 잡고 DB를 호출할 수 있습니다.
		// transaction 안의 DB 작업은 반드시 callback 안에서 모두 await되어야 합니다.
		//
		// 트랜잭션 범위 안에서는 DB 쿼리에 Promise.all을 쓰지 마세요.
		// 트랜잭션 범위는 PostgreSQL 클라이언트/커넥션 하나를 공유하므로, 이전 쿼리가 끝나기 전에
		// 다음 쿼리를 시작하면 같은 client.query()에 동시 작업이 큐잉됩니다. pg@8에서는
		// DeprecationWarning이 발생하고, pg@9에서는 에러가 될 수 있습니다. 트랜잭션 안의 DB 쿼리는
		// 순차적으로 await하거나, 독립적인 병렬 읽기는 트랜잭션 밖으로 빼야 합니다.
		work: (tx: DrizzleExecutor) => Promise<T>,
		options: DrizzleTransactionOptions = {},
	) {
		const readOnly = options.readOnly ?? true;
		const currentContext = this.currentTransactionStorage.getStore();

		if (currentContext) {
			if (currentContext.readOnly && !readOnly) {
				throw new Error(
					"Cannot start a read-write transaction inside a read-only transaction.",
				);
			}

			return work(currentContext.database);
		}

		const rootDb = readOnly ? this.replicaDb : this.primaryDb;

		return rootDb.transaction(
			(tx) => {
				return this.currentTransactionStorage.run(
					{
						database: tx,
						readOnly,
					},
					() => work(tx),
				);
			},
			{
				...options.transactionConfig,
				accessMode: readOnly ? "read only" : "read write",
			},
		);
	}
}
