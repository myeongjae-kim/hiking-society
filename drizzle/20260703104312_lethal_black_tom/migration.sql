CREATE TYPE "notification_type" AS ENUM('article_comment', 'article_reply', 'comment_reply', 'article_like', 'comment_like');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" serial PRIMARY KEY,
	"recipient_user_id" integer NOT NULL,
	"actor_user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"article_id" integer NOT NULL,
	"comment_id" integer,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notification_recipient_read_at_created_at_idx" ON "notification" ("recipient_user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "notification_recipient_created_at_idx" ON "notification" ("recipient_user_id","created_at");--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_user_id_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_article_id_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id");--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_comment_id_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comment"("id");