import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  department: text('department').notNull(),
  managerId: text('manager_id'),
  costCenter: text('cost_center').notNull(),
  currency: text('currency').notNull(),
});
