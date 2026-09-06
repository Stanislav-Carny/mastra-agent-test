import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { callExpenseTool } from '../mcp/expense-service';
import { calculateApprovalRoute } from '../tools/approval-route-tool';

/**
 * Where the agent decides what to do next, this workflow fixes the order: draft, price
 * the approval route, submit, then wait for a human. Only the first step uses the model;
 * the rest are deterministic, and every write goes through the expense MCP service.
 */

const draftSchema = z.object({
  employeeId: z.string(),
  amount: z.number().positive(),
  currency: z.string().describe('ISO currency code, e.g. USD'),
  category: z.string().describe('e.g. travel, meals, lodging, software, equipment'),
  description: z.string(),
  policyNotes: z
    .string()
    .describe('Policy limits or receipt requirements found while drafting this claim'),
});

const routedSchema = draftSchema.extend({
  approvers: z.array(z.enum(['manager', 'finance'])),
  autoApproved: z.boolean(),
  receiptRequired: z.boolean(),
  approvalSummary: z.string(),
});

const submittedSchema = routedSchema.extend({
  expenseId: z.string(),
});

const decidedSchema = submittedSchema.extend({
  status: z.enum(['approved', 'rejected']),
  approverNote: z.string().optional(),
});

const workflowInputSchema = z.object({
  employeeId: z.string().describe('Employee id, e.g. emp-002'),
  requestText: z.string().describe('Free-form description of the expense to submit'),
});

/** Step 1: the only step that uses the model, to turn free text into a structured claim. */
const draftClaim = createStep({
  id: 'draft-claim',
  description: 'Ask the expense agent to turn a free-form request into a structured claim',
  inputSchema: workflowInputSchema,
  outputSchema: draftSchema,
  execute: async ({ inputData, mastra }) => {
    const { employeeId, requestText } = inputData;

    // Resolved from the registry rather than imported: the agent also lists this workflow,
    // and importing it here would make the two files depend on each other.
    const expenseAgent = mastra.getAgent('expenseAgent');

    const response = await expenseAgent.generate(
      `Employee ${employeeId} wants to submit this expense: "${requestText}". ` +
        `Look up the employee's currency if the request does not state one, search the expense ` +
        `policy for any limits or receipt requirements that apply, and fill in the claim.`,
      { structuredOutput: { schema: draftSchema } },
    );

    return { ...response.object, employeeId };
  },
});

/** Step 2: deterministic, so it calls the same local tool the agent uses. */
const routeForApproval = createStep({
  id: 'route-for-approval',
  description: 'Work out the required approvers from the claim amount',
  inputSchema: draftSchema,
  outputSchema: routedSchema,
  execute: async ({ inputData }) => {
    const route = calculateApprovalRoute(inputData.amount, inputData.currency);

    return {
      ...inputData,
      approvers: route.approvers,
      autoApproved: route.autoApproved,
      receiptRequired: route.receiptRequired,
      approvalSummary: route.summary,
    };
  },
});

/** Step 3: create the claim through the MCP service that owns the expenses database. */
const submitClaim = createStep({
  id: 'submit-claim',
  description: 'Create the claim through the expense submission service',
  inputSchema: routedSchema,
  outputSchema: submittedSchema,
  execute: async ({ inputData }) => {
    const claim = await callExpenseTool('submitExpense', {
      employeeId: inputData.employeeId,
      amount: inputData.amount,
      currency: inputData.currency,
      category: inputData.category,
      description: inputData.description,
      status: inputData.autoApproved ? 'approved' : 'pending_approval',
    });

    return { ...inputData, expenseId: claim.id };
  },
});

/**
 * Step 4: pause for a human. `suspend()` saves a snapshot and returns; the run continues
 * when someone resumes it with a decision, which Studio exposes as a form.
 */
const humanApproval = createStep({
  id: 'human-approval',
  description: 'Wait for an approver to accept or reject the claim, then record the decision',
  inputSchema: submittedSchema,
  suspendSchema: submittedSchema,
  resumeSchema: z.object({
    approved: z.boolean().describe('True to approve the claim, false to reject it'),
    approverNote: z.string().optional().describe('Optional note explaining the decision'),
  }),
  outputSchema: decidedSchema,
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData) {
      return await suspend(inputData);
    }

    const status = resumeData.approved ? ('approved' as const) : ('rejected' as const);
    await callExpenseTool('updateExpenseStatus', { expenseId: inputData.expenseId, status });

    return { ...inputData, status, approverNote: resumeData.approverNote };
  },
});

export const expenseWorkflow = createWorkflow({
  id: 'expense-workflow',
  description:
    'Draft an expense claim from a free-form request, route it for approval, submit it, and wait for a human decision.',
  inputSchema: workflowInputSchema,
  outputSchema: decidedSchema,
})
  .then(draftClaim)
  .then(routeForApproval)
  .then(submitClaim)
  .then(humanApproval)
  .commit();
