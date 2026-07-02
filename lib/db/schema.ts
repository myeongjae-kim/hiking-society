import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const userTable = pgTable('user', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export type User = typeof userTable.$inferSelect;
