import './_chdir-to-project-root';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient } from '@libsql/client';
import { createTool } from '@mastra/core/tools';
import { MCPServer } from '@mastra/mcp';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { z } from 'zod';
import { expenses } from './schema/expense-schema';

const client = createClient({ url: 'file:./src/mock-data/expenses.db' });
const db = drizzle(client, { schema: { expenses } });

await client.execute(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    submitted_at TEXT NOT NULL
  )
`);

const submitExpenseTool = createTool({
  id: 'submit_expense',
  description: 'Submit a new expense claim for an employee',
  inputSchema: z.object({
    employeeId: z.string(),
    amount: z.number().positive(),
    currency: z.string().describe('ISO currency code, e.g. USD'),
    category: z.string().describe('e.g. travel, meals, lodging, software'),
    description: z.string().optional(),
  }),
  execute: async ({ employeeId, amount, currency, category, description }) => {
    const id = `exp-${randomUUID().slice(0, 8)}`;
    const submittedAt = new Date().toISOString();
    await db.insert(expenses).values({
      id,
      employeeId,
      amount,
      currency,
      category,
      description: description ?? null,
      status: 'submitted',
      submittedAt,
    });
    return { id, status: 'submitted', submittedAt };
  },
});

const getExpenseStatusTool = createTool({
  id: 'get_expense_status',
  description: 'Get the status and details of a submitted expense by id',
  inputSchema: z.object({
    expenseId: z.string(),
  }),
  execute: async ({ expenseId }) => {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
    if (!expense) {
      throw new Error(`Expense not found: ${expenseId}`);
    }
    return expense;
  },
});

const listExpensesTool = createTool({
  id: 'list_expenses',
  description: 'List all expenses submitted by a given employee',
  inputSchema: z.object({
    employeeId: z.string(),
  }),
  execute: async ({ employeeId }) => {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.employeeId, employeeId))
      .orderBy(desc(expenses.submittedAt));
  },
});

const server = new MCPServer({
  id: 'expense-submission',
  name: 'Expense Submission Tool',
  version: '1.0.0',
  description: 'Mock service for submitting and tracking expense claims',
  tools: { submitExpenseTool, getExpenseStatusTool, listExpensesTool },
});

await server.startStdio();
