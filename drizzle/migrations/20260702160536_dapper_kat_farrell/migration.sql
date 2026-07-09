CREATE TABLE "article_photo" (
	"id" serial PRIMARY KEY,
	"article_id" integer NOT NULL,
	"url" varchar(2048) NOT NULL,
	"object_key" varchar(1024) NOT NULL,
	"order" integer NOT NULL,
	"content_type" varchar(120) NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article" (
	"id" serial PRIMARY KEY,
	"hiking_id" integer NOT NULL,
	"body" text NOT NULL,
	"author_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" serial PRIMARY KEY,
	"article_id" integer NOT NULL,
	"parent_comment_id" integer,
	"body" text NOT NULL,
	"author_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "hiking" (
	"id" serial PRIMARY KEY,
	"mountain_name" varchar(120) NOT NULL,
	"hiking_date" varchar(10) NOT NULL,
	"timezone" varchar(80) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"started_at" varchar(40) NOT NULL,
	"completed_at" varchar(40) NOT NULL,
	"participants_csv" text NOT NULL,
	"restaurant_address" text,
	"author_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "article_photo_article_id_order_unique" ON "article_photo" ("article_id","order");--> statement-breakpoint
ALTER TABLE "article_photo" ADD CONSTRAINT "article_photo_article_id_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id");--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_hiking_id_hiking_id_fkey" FOREIGN KEY ("hiking_id") REFERENCES "hiking"("id");--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_article_id_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_comment_id_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comment"("id");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "hiking" ADD CONSTRAINT "hiking_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id");