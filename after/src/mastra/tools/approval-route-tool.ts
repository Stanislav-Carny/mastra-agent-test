import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * A local tool: plain TypeScript the agent can call. The policy *text* lives in the
 * knowledge base and is retrieved by search, but the policy *arithmetic* is
 * deterministic, so it belongs in code where it always produces the same answer.
 *
 * Thresholds mirror the "Expense Submission & Approval Policy" document.
 */

const AUTO_APPROVE_UNDER = 50;
const MANAGER_ONLY_UP_TO = 500;
const RECEIPT_REQUIRED_OVER = 25;

export type ApprovalRoute = {
  amount: number;
  currency: string;
  approvers: Array<'manager' | 'finance'>;
  autoApproved: boolean;
  receiptRequired: boolean;
  summary: string;
};

/**
 * The rule itself, as an ordinary function. The tool below exposes it to the agent and
 * the workflow calls it directly, so both paths apply exactly the same thresholds.
 */
export function calculateApprovalRoute(amount: number, currency = 'USD'): ApprovalRoute {
  const approvers: Array<'manager' | 'finance'> = [];
  if (amount >= AUTO_APPROVE_UNDER) {
    approvers.push('manager');
  }
  if (amount > MANAGER_ONLY_UP_TO) {
    approvers.push('finance');
  }

  const autoApproved = approvers.length === 0;
  const receiptRequired = amount > RECEIPT_REQUIRED_OVER;

  const approvalSentence = autoApproved
    ? `${amount} ${currency} is under the ${AUTO_APPROVE_UNDER} ${currency} auto-approval limit, so no approver is required.`
    : `${amount} ${currency} requires ${approvers.join(' and ')} approval.`;

  const receiptSentence = receiptRequired
    ? `An itemized receipt is required because the amount is over ${RECEIPT_REQUIRED_OVER} ${currency}.`
    : 'No itemized receipt is required.';

  return {
    amount,
    currency,
    approvers,
    autoApproved,
    receiptRequired,
    summary: `${approvalSentence} ${receiptSentence}`,
  };
}

export const approvalRouteTool = createTool({
  id: 'calculateApprovalRoute',
  description:
    'Calculate who must approve an expense claim and whether an itemized receipt is required, based on the amount. Use this instead of doing the arithmetic yourself.',
  inputSchema: z.object({
    amount: z.number().positive().describe('Claim amount in the employee currency'),
    currency: z.string().default('USD').describe('ISO currency code, e.g. USD'),
  }),
  outputSchema: z.object({
    amount: z.number(),
    currency: z.string(),
    approvers: z.array(z.enum(['manager', 'finance'])),
    autoApproved: z.boolean(),
    receiptRequired: z.boolean(),
    summary: z.string(),
  }),
  execute: async ({ amount, currency }) => calculateApprovalRoute(amount, currency),
});
