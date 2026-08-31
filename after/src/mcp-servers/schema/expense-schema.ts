import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  status: text('status').notNull().default('submitted'),
  submittedAt: text('submitted_at').notNull(),
});
