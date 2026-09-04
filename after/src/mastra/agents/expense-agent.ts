import { Agent } from '@mastra/core/agent';
import { expenseMcpClient } from '../mcp/expense-mcp-client';
import { expensePolicyCitationsSkill } from '../skills/expense-policy-citations';
import { approvalRouteTool } from '../tools/approval-route-tool';

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

How to work:
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
  skills: [expensePolicyCitationsSkill],
});
