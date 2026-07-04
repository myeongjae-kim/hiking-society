ALTER TABLE "hiking" ADD COLUMN "order" integer;--> statement-breakpoint
WITH ranked_hiking AS (
	SELECT
		"id",
		row_number() OVER (ORDER BY "hiking_date" ASC, "id" ASC) AS "next_order"
	FROM "hiking"
	WHERE "deleted_at" IS NULL
)
UPDATE "hiking"
SET "order" = ranked_hiking."next_order"
FROM ranked_hiking
WHERE "hiking"."id" = ranked_hiking."id";--> statement-breakpoint
CREATE UNIQUE INDEX "hiking_order_active_unique" ON "hiking" ("order") WHERE "deleted_at" IS NULL;
