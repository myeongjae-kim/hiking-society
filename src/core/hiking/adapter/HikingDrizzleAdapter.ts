import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/core/common/adapter/drizzle.server";
import { applicationError } from "@/core/common/application/ApplicationError";
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

async function reorderActiveHikings(executor: Pick<typeof db, "execute">) {
	await executor.execute(sql`
    UPDATE ${hikingTable}
    SET "order" = NULL
    WHERE ${hikingTable.deletedAt} IS NULL
  `);
	await executor.execute(sql`
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
	async create(input: Parameters<HikingCommandPort["create"]>[0]) {
		await db.insert(hikingTable).values({
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
		await reorderActiveHikings(db);
	}

	async delete(input: Parameters<HikingCommandPort["delete"]>[0]) {
		const hikingId = toNumericId(input.hikingId);

		const [updated] = await db
			.update(hikingTable)
			.set({ deletedAt: input.now, order: null, updatedAt: input.now })
			.where(and(eq(hikingTable.id, hikingId), isNull(hikingTable.deletedAt)))
			.returning({ id: hikingTable.id });

		if (!updated) {
			return false;
		}

		await reorderActiveHikings(db);
		return true;
	}

	async findActiveHikingById(hikingId: HikingId) {
		const numericHikingId = toNumericId(hikingId);
		const hikingRows = await db
			.select({
				authorUserId: hikingTable.authorUserId,
				id: hikingTable.id,
			})
			.from(hikingTable)
			.where(
				and(eq(hikingTable.id, numericHikingId), isNull(hikingTable.deletedAt)),
			)
			.limit(1);
		const articleCountRows = await db
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
	}

	async update(input: Parameters<HikingCommandPort["update"]>[0]) {
		const [updated] = await db
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

		await reorderActiveHikings(db);
		return true;
	}
}
