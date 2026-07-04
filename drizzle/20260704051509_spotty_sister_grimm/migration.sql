ALTER TABLE "notification" ADD COLUMN "content_excerpt" text;
--> statement-breakpoint
UPDATE "notification" AS "notification_row"
SET "content_excerpt" = substring(regexp_replace(trim("article"."body"), '[[:space:]]+', ' ', 'g') FROM 1 FOR 160)
FROM "article"
WHERE "notification_row"."type" = 'article_like'
	AND "notification_row"."article_id" = "article"."id";
--> statement-breakpoint
UPDATE "notification" AS "notification_row"
SET "content_excerpt" = substring(regexp_replace(trim("comment"."body"), '[[:space:]]+', ' ', 'g') FROM 1 FOR 160)
FROM "comment"
WHERE "notification_row"."type" <> 'article_like'
	AND "notification_row"."comment_id" = "comment"."id";
--> statement-breakpoint
UPDATE "notification"
SET "content_excerpt" = ''
WHERE "content_excerpt" IS NULL;
--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "content_excerpt" SET NOT NULL;
