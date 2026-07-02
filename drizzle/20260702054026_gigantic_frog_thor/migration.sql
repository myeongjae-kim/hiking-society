CREATE TYPE "user_role" AS ENUM('admin', 'member', 'associate');--> statement-breakpoint
CREATE TABLE "social_account" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"provider" varchar(40) NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"display_name" varchar(100),
	"profile_image_url" varchar(2048),
	"raw_claims" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email" varchar(320);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_name" varchar(100);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "profile_image_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'associate'::"user_role" NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_key" UNIQUE("email");--> statement-breakpoint
CREATE UNIQUE INDEX "social_account_provider_user_id_unique" ON "social_account" ("provider","provider_user_id");--> statement-breakpoint
ALTER TABLE "social_account" ADD CONSTRAINT "social_account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");