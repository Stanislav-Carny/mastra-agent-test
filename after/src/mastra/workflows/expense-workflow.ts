import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createClient } from '@libsql/client';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { z } from 'zod';
import { expenses } from '../../mcp-servers/schema/expense-schema';
import { expenseAgent } from '../agents/expense-agent';

// Bundled/dev builds run this module from varying working directories, so the
// database path is resolved relative to the actual project root rather than process.cwd().
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not locate project root (package.json) above ${startDir}`);
    }
    dir = parent;
  }
  return dir;
}

const projectRoot = findProjectRoot(process.cwd());
const client = createClient({ url: `file:${join(projectRoot, 'src', 'mock-data', 'expenses.db')}` });
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

const expenseTemplateSchema = z.object({
  employeeId: z.string(),
  amount: z.number().positive(),
  currency: z.string().describe('ISO currency code, e.g. USD'),
  category: z.string().describe('e.g. travel, meals, lodging, software'),
  description: z.string(),
  policyNotes: z.string().optional().describe('Relevant policy limits or receipt requirements found while drafting the claim'),
});

const draftExpenseTemplateStep = createStep({
  id: 'draft-expense-template',
  inputSchema: z.object({
    employeeId: z.string(),
    requestText: z.string().describe('Free-form description of the expense to submit'),
  }),
  outputSchema: expenseTemplateSchema,
  execute: async ({ inputData }) => {
    const { employeeId, requestText } = inputData;

    const response = await expenseAgent.generate(
      `Employee ${employeeId} wants to submit this expense: "${requestText}". ` +
        `Look up the employee's currency if it isn't stated, check the relevant expense policy ` +
        `for amount limits or receipt requirements, and fill out the expense template.`,
      { structuredOutput: { schema: expenseTemplateSchema } },
    );

    return { ...response.object, employeeId };
  },
});

const submitExpenseStep = createStep({
  id: 'submit-expense',
  inputSchema: expenseTemplateSchema,
  outputSchema: expenseTemplateSchema.extend({
    expenseId: z.string(),
    status: z.literal('pending_approval'),
  }),
  execute: async ({ inputData }) => {
    const expenseId = `exp-${randomUUID().slice(0, 8)}`;
    const submittedAt = new Date().toISOString();

    await db.insert(expenses).values({
      id: expenseId,
      employeeId: inputData.employeeId,
      amount: inputData.amount,
      currency: inputData.currency,
      category: inputData.category,
      description: inputData.description,
      status: 'pending_approval',
      submittedAt,
    });

    return { ...inputData, expenseId, status: 'pending_approval' as const };
  },
});

const humanApprovalStep = createStep({
  id: 'human-approval',
  inputSchema: expenseTemplateSchema.extend({
    expenseId: z.string(),
    status: z.literal('pending_approval'),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    approverNote: z.string().optional(),
  }),
  suspendSchema: expenseTemplateSchema.extend({
    expenseId: z.string(),
  }),
  outputSchema: expenseTemplateSchema.extend({
    expenseId: z.string(),
    status: z.enum(['approved', 'rejected']),
    approverNote: z.string().optional(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData) {
      return await suspend({ ...inputData });
    }

    const status = resumeData.approved ? 'approved' : 'rejected';
    await db.update(expenses).set({ status }).where(eq(expenses.id, inputData.expenseId));

    return { ...inputData, status, approverNote: resumeData.approverNote };
  },
});

export const expenseWorkflow = createWorkflow({
  id: 'expense-workflow',
  inputSchema: z.object({
    employeeId: z.string(),
    requestText: z.string().describe('Free-form description of the expense to submit'),
  }),
  outputSchema: expenseTemplateSchema.extend({
    expenseId: z.string(),
    status: z.enum(['approved', 'rejected']),
    approverNote: z.string().optional(),
  }),
})
  .then(draftExpenseTemplateStep)
  .then(submitExpenseStep)
  .then(humanApprovalStep)
  .commit();
