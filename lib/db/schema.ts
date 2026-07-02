import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'associate']);

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

export type User = typeof userTable.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type SocialAccount = typeof socialAccountTable.$inferSelect;
