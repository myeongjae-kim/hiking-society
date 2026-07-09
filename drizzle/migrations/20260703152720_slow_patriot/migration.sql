CREATE TABLE "article_media_metadata" (
	"id" serial PRIMARY KEY,
	"article_media_id" integer NOT NULL,
	"original_metadata" jsonb NOT NULL,
	"make" text,
	"model" text,
	"f_number" text,
	"date_time" text,
	"focal_length_in_35mm_film" text,
	"exposure_time" text,
	"iso_speed_ratings" text,
	"shutter_speed_value" text,
	"gps_altitude" double precision,
	"gps_latitude" double precision,
	"gps_longitude" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "article_media_metadata" (
	"article_media_id",
	"original_metadata",
	"make",
	"model",
	"f_number",
	"date_time",
	"focal_length_in_35mm_film",
	"exposure_time",
	"iso_speed_ratings",
	"shutter_speed_value"
)
SELECT
	"id",
	"original_metadata",
	"original_metadata" #>> '{exif,Make,description}',
	"original_metadata" #>> '{exif,Model,description}',
	"original_metadata" #>> '{exif,FNumber,description}',
	"original_metadata" #>> '{exif,DateTime,description}',
	"original_metadata" #>> '{exif,FocalLengthIn35mmFilm,description}',
	"original_metadata" #>> '{exif,ExposureTime,description}',
	"original_metadata" #>> '{exif,ISOSpeedRatings,description}',
	"original_metadata" #>> '{exif,ShutterSpeedValue,description}'
FROM "article_media"
WHERE "media_type" = 'image' AND "original_metadata" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "article_media" DROP COLUMN "original_metadata";--> statement-breakpoint
CREATE UNIQUE INDEX "article_media_metadata_article_media_id_unique" ON "article_media_metadata" ("article_media_id");--> statement-breakpoint
ALTER TABLE "article_media_metadata" ADD CONSTRAINT "article_media_metadata_article_media_id_article_media_id_fkey" FOREIGN KEY ("article_media_id") REFERENCES "article_media"("id") ON DELETE CASCADE;
