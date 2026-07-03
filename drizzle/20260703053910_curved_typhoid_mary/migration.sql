CREATE TYPE "article_media_type" AS ENUM('image', 'video');--> statement-breakpoint
ALTER TABLE "article_photo" RENAME TO "article_media";--> statement-breakpoint
ALTER INDEX "article_photo_article_id_order_unique" RENAME TO "article_media_article_id_order_unique";--> statement-breakpoint
ALTER TABLE "article_media" ADD COLUMN "media_type" "article_media_type" DEFAULT 'image'::"article_media_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "article_media" ADD COLUMN "thumbnail_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "article_media" ADD COLUMN "duration_ms" integer;--> statement-breakpoint
ALTER TABLE "article_media" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "article_media" ADD COLUMN "height" integer;