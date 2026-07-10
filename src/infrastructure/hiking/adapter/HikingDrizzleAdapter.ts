import { and, eq, isNull, sql } from "drizzle-orm";
import type {
	DrizzleTransactionRunner,
	DrizzleExecutor,
} from "#/infrastructure/common/adapter/DrizzleTransactionRunner";
import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import type { HikingCommandPort } from "@/core/hiking/application/port/out/HikingCommandPort";
import type { HikingId } from "@/core/hiking/domain";
import { articleTable, hikingTable } from "@/drizzle/schema";

function toNumericId(id: string) {
	const numericId = Number(id);

	if (!Number.isInteger(numericId) || numericId <= 0) {
		throw applicationError.badRequest("잘못된 id입니다.");
	}

	return numericId;
}

async function reorderActiveHikings(tx: Pick<DrizzleExecutor, "execute">) {
	await tx.execute(sql`
    UPDATE ${hikingTable}
    SET "order" = NULL
    WHERE ${hikingTable.deletedAt} IS NULL
  `);
	await tx.execute(sql`
    WITH ranked_hiking AS (
      SELECT
        ${hikingTable.id} AS id,
        row_number() OVER (
          ORDER BY ${hikingTable.hikingDate} ASC, ${hikingTable.id} ASC
        ) AS next_order
      FROM ${hikingTable}
      WHERE ${hikingTable.deletedAt} IS NULL
    )
    UPDATE ${hikingTable}
    SET "order" = ranked_hiking.next_order
    FROM ranked_hiking
    WHERE ${hikingTable.id} = ranked_hiking.id
  `);
}

export class HikingDrizzleAdapter implements HikingCommandPort {
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	async create(input: Parameters<HikingCommandPort["create"]>[0]) {
		await this.transactionRunner.write(async (tx) => {
			await tx.insert(hikingTable).values({
				altitude: input.altitude,
				authorUserId: input.authorUserId,
				completedAt: input.completedAt,
				hikingDate: input.hikingDate,
				latitude: input.latitude,
				longitude: input.longitude,
				mountainName: input.mountainName,
				participantsCsv: input.participantsCsv,
				restaurantAddress: input.restaurantAddress,
				startedAt: input.startedAt,
				timezone: input.timezone,
			});
			await reorderActiveHikings(tx);
		});
	}

	async delete(input: Parameters<HikingCommandPort["delete"]>[0]) {
		return this.transactionRunner.write(async (tx) => {
			const hikingId = toNumericId(input.hikingId);

			const [updated] = await tx
				.update(hikingTable)
				.set({ deletedAt: input.now, order: null, updatedAt: input.now })
				.where(and(eq(hikingTable.id, hikingId), isNull(hikingTable.deletedAt)))
				.returning({ id: hikingTable.id });

			if (!updated) {
				return false;
			}

			await reorderActiveHikings(tx);
			return true;
		});
	}

	async findActiveHikingById(hikingId: HikingId) {
		return this.transactionRunner.read(async (tx) => {
			const numericHikingId = toNumericId(hikingId);
			const hikingRows = await tx
				.select({
					authorUserId: hikingTable.authorUserId,
					id: hikingTable.id,
				})
				.from(hikingTable)
				.where(
					and(
						eq(hikingTable.id, numericHikingId),
						isNull(hikingTable.deletedAt),
					),
				)
				.limit(1);
			const articleCountRows = await tx
				.select({ articleCount: sql<number>`count(*)::int` })
				.from(articleTable)
				.where(
					and(
						eq(articleTable.hikingId, numericHikingId),
						isNull(articleTable.deletedAt),
					),
				);
			const hiking = hikingRows[0];

			if (!hiking) {
				return null;
			}

			return {
				activeArticleCount: articleCountRows[0]?.articleCount ?? 0,
				authorUserId: hiking.authorUserId,
				id: String(hiking.id) as HikingId,
			};
		});
	}

	async update(input: Parameters<HikingCommandPort["update"]>[0]) {
		return this.transactionRunner.write(async (tx) => {
			const [updated] = await tx
				.update(hikingTable)
				.set({ ...input.values, updatedAt: input.now })
				.where(
					and(
						eq(hikingTable.id, toNumericId(input.hikingId)),
						isNull(hikingTable.deletedAt),
					),
				)
				.returning({ id: hikingTable.id });

			if (!updated) {
				return false;
			}

			await reorderActiveHikings(tx);
			return true;
		});
	}
}
