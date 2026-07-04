import {
  AnyPgColumn,
  boolean,
  doublePrecision,
  integer,
  index,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'associate']);
export const articleMediaTypeEnum = pgEnum('article_media_type', ['image', 'video']);
export const notificationTypeEnum = pgEnum('notification_type', [
  'article_created',
  'article_comment',
  'article_reply',
  'comment_reply',
  'article_like',
  'comment_like',
]);

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

export const hikingTable = pgTable(
  'hiking',
  {
    id: serial('id').primaryKey(),
    mountainName: varchar('mountain_name', { length: 120 }).notNull(),
    hikingDate: varchar('hiking_date', { length: 10 }).notNull(),
    timezone: varchar('timezone', { length: 80 }).notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    altitude: doublePrecision('altitude'),
    order: integer('order'),
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
  },
  (table) => [
    uniqueIndex('hiking_order_active_unique')
      .on(table.order)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

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

export const articleMediaMetadataTable = pgTable(
  'article_media_metadata',
  {
    id: serial('id').primaryKey(),
    articleMediaId: integer('article_media_id')
      .notNull()
      .references(() => articleMediaTable.id, { onDelete: 'cascade' }),
    originalMetadata: jsonb('original_metadata').$type<Record<string, unknown>>().notNull(),
    make: text('make'),
    model: text('model'),
    fNumber: text('f_number'),
    dateTime: text('date_time'),
    focalLengthIn35mmFilm: text('focal_length_in_35mm_film'),
    exposureTime: text('exposure_time'),
    isoSpeedRatings: text('iso_speed_ratings'),
    shutterSpeedValue: text('shutter_speed_value'),
    gpsAltitude: doublePrecision('gps_altitude'),
    gpsLatitude: doublePrecision('gps_latitude'),
    gpsLongitude: doublePrecision('gps_longitude'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('article_media_metadata_article_media_id_unique').on(table.articleMediaId),
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

export const articleLikeTable = pgTable(
  'article_like',
  {
    id: serial('id').primaryKey(),
    articleId: integer('article_id')
      .notNull()
      .references(() => articleTable.id),
    userId: integer('user_id')
      .notNull()
      .references(() => userTable.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('article_like_article_id_user_id_unique').on(table.articleId, table.userId),
  ],
);

export const commentLikeTable = pgTable(
  'comment_like',
  {
    id: serial('id').primaryKey(),
    commentId: integer('comment_id')
      .notNull()
      .references(() => commentTable.id),
    userId: integer('user_id')
      .notNull()
      .references(() => userTable.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('comment_like_comment_id_user_id_unique').on(table.commentId, table.userId),
  ],
);

export const notificationTable = pgTable(
  'notification',
  {
    id: serial('id').primaryKey(),
    recipientUserId: integer('recipient_user_id')
      .notNull()
      .references(() => userTable.id),
    actorUserId: integer('actor_user_id')
      .notNull()
      .references(() => userTable.id),
    type: notificationTypeEnum('type').notNull(),
    articleId: integer('article_id')
      .notNull()
      .references(() => articleTable.id),
    commentId: integer('comment_id').references(() => commentTable.id),
    contentExcerpt: text('content_excerpt').notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('notification_recipient_read_at_created_at_idx').on(
      table.recipientUserId,
      table.readAt,
      table.createdAt,
    ),
    index('notification_recipient_created_at_idx').on(table.recipientUserId, table.createdAt),
  ],
);

export type User = typeof userTable.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type SocialAccount = typeof socialAccountTable.$inferSelect;
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
