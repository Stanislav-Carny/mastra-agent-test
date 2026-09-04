import './_load-env';
import { randomUUID } from 'node:crypto';
import { createTool } from '@mastra/core/tools';
import { MCPServer } from '@mastra/mcp';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { expenseDb } from '../db/client';
import { ensureExpenseData } from '../db/migrate';
import { expenses } from '../db/schema';

// This service owns expenses.db, so it sets that up and leaves the others alone.
await ensureExpenseData();

/**
 * This server is the only writer of `expenses.db`. The agent and the workflow both go
 * through these tools rather than opening the database themselves, so there is a single
 * place where a claim can be created or have its status changed.
 */

const expenseStatuses = ['submitted', 'pending_approval', 'approved', 'rejected'] as const;

const expenseShape = z.object({
  id: z.string(),
  employeeId: z.string(),
  amount: z.number(),
  currency: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  submittedAt: z.string(),
});

const submitExpense = createTool({
  id: 'submitExpense',
  description: 'Submit a new expense claim for an employee and return the created claim',
  inputSchema: z.object({
    employeeId: z.string().describe('Employee id, e.g. emp-002'),
    amount: z.number().positive(),
    currency: z.string().describe('ISO currency code, e.g. USD'),
    category: z.string().describe('e.g. travel, meals, lodging, software, equipment'),
    description: z.string().optional(),
    status: z
      .enum(expenseStatuses)
      .default('submitted')
      .describe('Initial status; the approval workflow submits claims as pending_approval'),
  }),
  outputSchema: expenseShape,
  mcp: {
    annotations: { title: 'Submit expense', readOnlyHint: false, destructiveHint: false },
  },
  execute: async ({ employeeId, amount, currency, category, description, status }) => {
    const claim = {
      id: `exp-${randomUUID().slice(0, 8)}`,
      employeeId,
      amount,
      currency,
      category,
      description: description ?? null,
      status,
      submittedAt: new Date().toISOString(),
    };

    await expenseDb.insert(expenses).values(claim);
    return claim;
  },
});

const getExpenseStatus = createTool({
  id: 'getExpenseStatus',
  description: 'Get the status and details of a submitted expense claim by id',
  inputSchema: z.object({
    expenseId: z.string().describe('Expense claim id, e.g. exp-1001'),
  }),
  outputSchema: expenseShape,
  mcp: {
    annotations: { title: 'Get expense status', readOnlyHint: true, destructiveHint: false },
  },
  execute: async ({ expenseId }) => {
    const [expense] = await expenseDb.select().from(expenses).where(eq(expenses.id, expenseId));
    if (!expense) {
      throw new Error(`Expense not found: ${expenseId}`);
    }
    return expense;
  },
});

const listExpenses = createTool({
  id: 'listExpenses',
  description: 'List all expense claims submitted by a given employee, newest first',
  inputSchema: z.object({
    employeeId: z.string().describe('Employee id, e.g. emp-002'),
  }),
  // MCP requires a tool's structured result to be an object, not a bare array.
  outputSchema: z.object({ expenses: z.array(expenseShape) }),
  mcp: {
    annotations: { title: 'List expenses', readOnlyHint: true, destructiveHint: false },
  },
  execute: async ({ employeeId }) => {
    const rows = await expenseDb
      .select()
      .from(expenses)
      .where(eq(expenses.employeeId, employeeId))
      .orderBy(desc(expenses.submittedAt));

    return { expenses: rows };
  },
});

const updateExpenseStatus = createTool({
  id: 'updateExpenseStatus',
  description:
    'Record an approval decision by moving an existing expense claim to a new status',
  inputSchema: z.object({
    expenseId: z.string(),
    status: z.enum(expenseStatuses),
  }),
  outputSchema: expenseShape,
  mcp: {
    annotations: { title: 'Update expense status', readOnlyHint: false, destructiveHint: true },
  },
  execute: async ({ expenseId, status }) => {
    const [updated] = await expenseDb
      .update(expenses)
      .set({ status })
      .where(eq(expenses.id, expenseId))
      .returning();

    if (!updated) {
      throw new Error(`Expense not found: ${expenseId}`);
    }
    return updated;
  },
});

const server = new MCPServer({
  id: 'expense-submission',
  name: 'Expense Submission Service',
  version: '1.0.0',
  description:
    'Mock expense submission service. Owns the expenses SQLite database and is the only writer of expense claims.',
  tools: { submitExpense, getExpenseStatus, listExpenses, updateExpenseStatus },
});

await server.startStdio();
