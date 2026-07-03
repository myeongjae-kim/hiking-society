import {
  AnyPgColumn,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'associate']);
export const articleMediaTypeEnum = pgEnum('article_media_type', ['image', 'video']);

export const userTable = pgTable('user', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 320 }).unique(),
  displayName: varchar('display_name', { length: 100 }),
  profileImageUrl: varchar('profile_image_url', { length: 2048 }),
  role: userRoleEnum('role').notNull().default('associate'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const socialAccountTable = pgTable(
  'social_account',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => userTable.id),
    provider: varchar('provider', { length: 40 }).notNull(),
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    email: varchar('email', { length: 320 }).notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    displayName: varchar('display_name', { length: 100 }),
    profileImageUrl: varchar('profile_image_url', { length: 2048 }),
    rawClaims: jsonb('raw_claims').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('social_account_provider_user_id_unique').on(table.provider, table.providerUserId),
  ],
);

export const hikingTable = pgTable('hiking', {
  id: serial('id').primaryKey(),
  mountainName: varchar('mountain_name', { length: 120 }).notNull(),
  hikingDate: varchar('hiking_date', { length: 10 }).notNull(),
  timezone: varchar('timezone', { length: 80 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  startedAt: varchar('started_at', { length: 40 }).notNull(),
  completedAt: varchar('completed_at', { length: 40 }).notNull(),
  participantsCsv: text('participants_csv').notNull(),
  restaurantAddress: text('restaurant_address'),
  authorUserId: integer('author_user_id')
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const articleTable = pgTable('article', {
  id: serial('id').primaryKey(),
  hikingId: integer('hiking_id')
    .notNull()
    .references(() => hikingTable.id),
  body: text('body').notNull(),
  authorUserId: integer('author_user_id')
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const articleMediaTable = pgTable(
  'article_media',
  {
    id: serial('id').primaryKey(),
    articleId: integer('article_id')
      .notNull()
      .references(() => articleTable.id),
    url: varchar('url', { length: 2048 }).notNull(),
    objectKey: varchar('object_key', { length: 1024 }).notNull(),
    order: integer('order').notNull(),
    mediaType: articleMediaTypeEnum('media_type').notNull().default('image'),
    contentType: varchar('content_type', { length: 120 }).notNull(),
    byteSize: integer('byte_size').notNull(),
    thumbnailUrl: varchar('thumbnail_url', { length: 2048 }),
    durationMs: integer('duration_ms'),
    width: integer('width'),
    height: integer('height'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('article_media_article_id_order_unique').on(table.articleId, table.order),
  ],
);

export const commentTable = pgTable('comment', {
  id: serial('id').primaryKey(),
  articleId: integer('article_id')
    .notNull()
    .references(() => articleTable.id),
  parentCommentId: integer('parent_comment_id').references((): AnyPgColumn => commentTable.id),
  body: text('body').notNull(),
  authorUserId: integer('author_user_id')
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export type User = typeof userTable.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type SocialAccount = typeof socialAccountTable.$inferSelect;
