CREATE TABLE "article_like" (
	"id" serial PRIMARY KEY,
	"article_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_like" (
	"id" serial PRIMARY KEY,
	"comment_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "article_like_article_id_user_id_unique" ON "article_like" ("article_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_like_comment_id_user_id_unique" ON "comment_like" ("comment_id","user_id");--> statement-breakpoint
ALTER TABLE "article_like" ADD CONSTRAINT "article_like_article_id_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id");--> statement-breakpoint
ALTER TABLE "article_like" ADD CONSTRAINT "article_like_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "comment_like" ADD CONSTRAINT "comment_like_comment_id_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comment"("id");--> statement-breakpoint
ALTER TABLE "comment_like" ADD CONSTRAINT "comment_like_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");