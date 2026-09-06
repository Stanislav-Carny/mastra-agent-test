import { Agent } from '@mastra/core/agent';
import { expenseMcpClient } from '../mcp/expense-mcp-client';
import { expensePolicyCitationsSkill } from '../skills/expense-policy-citations';
import { approvalRouteTool } from '../tools/approval-route-tool';
import { expenseWorkflow } from '../workflows/expense-workflow';

export const expenseAgent = new Agent({
  id: 'expense-agent',
  name: 'Expense Assistant',
  description:
    'Helps employees check expense policy and submit expense claims correctly, using the employee directory, the policy knowledge base, and the expense submission service.',
  metadata: {
    suggestedPrompts: [
      'What is the daily meal limit when travelling?',
      'Who is Grace Hopper and what currency does she get paid in?',
      'Submit a $40 client lunch for emp-002 and tell me who has to approve it.',
      'Show me every expense emp-002 has submitted.',
    ],
  },
  instructions: `You help employees understand expense policy and submit expense claims correctly.

Your tools come from three separate mock services, plus one local calculation:
- employee directory: look up who an employee is, their cost center, and their home currency
- expense policy knowledge base: search policy documents for limits, deadlines, and approval rules
- expense submission service: create claims, list them, and check their status
- calculateApprovalRoute: a local tool that works out required approvers and receipt rules from an amount

You also have the expense workflow, which is the company's submission process: it drafts the
claim, routes it, creates it, and then waits for a named approver to accept or reject it.

How to work:
- To submit a claim, run the expense workflow. Do not call submitExpense yourself: the
  workflow records the approval decision, and submitting directly skips that step.
- Pass everything you know about the expense to the workflow as the request text. If the
  employee attached a receipt, read it first and include the vendor, date, total, currency,
  and what was bought.
- Answering questions is different. For policy questions, lookups, and listing existing
  claims, use the tools directly; the workflow is only for submitting something new.
- A claim that breaches a policy limit still goes through the workflow. Say clearly what it
  breaches and put that in the request text, but do not refuse to submit it and do not stop
  to ask first: the workflow ends with a human approver, and that decision is theirs.
- Before submitting a claim, search the policy for anything that applies (amount limits,
  receipt requirements, deadlines) and call calculateApprovalRoute for the approval path.
- Confirm the employee's currency from the directory when the request does not state one.
- Never do approval-threshold arithmetic in your head; call calculateApprovalRoute.
- Explain any policy limit that affects the claim, and say clearly when a claim exceeds one.
- Ask for the employee id if you were not given one, rather than guessing.`,
  // Provider and model come from Mastra's model router: "provider/model-name".
  // Swap this string to change providers; see docs/06-validate-and-extend.md.
  model: 'anthropic/claude-sonnet-4-6',
  tools: {
    ...(await expenseMcpClient.listTools()),
    calculateApprovalRoute: approvalRouteTool,
  },
  // Exposed as the tool "workflow-expenseWorkflow". The workflow imports this agent for its
  // draft-claim step, so the two reference each other; Node resolves the cycle at call time.
  workflows: { expenseWorkflow },
  skills: [expensePolicyCitationsSkill],
});
