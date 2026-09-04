import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  department: text('department').notNull(),
  managerId: text('manager_id'),
  costCenter: text('cost_center').notNull(),
  currency: text('currency').notNull(),
});

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

export type Employee = typeof employees.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
