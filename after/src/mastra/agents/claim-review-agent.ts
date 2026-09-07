import { Agent } from '@mastra/core/agent';
import { expenseMcpClient } from '../mcp/expense-mcp-client';
import { expensePolicyCitationsSkill } from '../skills/expense-policy-citations';

/**
 * The second agent, and the only one this project could justify. It reviews a submitted
 * claim on behalf of finance and recommends a decision to the human approver.
 *
 * It exists as a separate agent rather than more instructions on the Expense Assistant for
 * three reasons that the assistant cannot satisfy on its own:
 *
 * 1. The goals conflict. The assistant works for the claimant and wants a well-formed claim
 *    submitted; this one works for finance and asks whether the claim should be paid.
 * 2. It must not be able to write. The tool list below is an allowlist, so it cannot submit
 *    a claim or change a status even if it decides it should.
 * 3. It did not draft the claim, so it is not reviewing its own work.
 *
 * It is deliberately NOT wired as a subagent of the Expense Assistant. Letting the
 * claimant's own assistant decide when to invite scrutiny of the claimant's expenses puts
 * back the conflict of interest this split exists to remove. The workflow calls it instead.
 */

const allTools = await expenseMcpClient.listTools();

/**
 * Read-only by construction: an allowlist, so a tool added to a service later is denied
 * until someone names it here. The two omissions are the point — `expenseTool_submitExpense`
 * and `expenseTool_updateExpenseStatus` are the only tools that change anything.
 */
const readOnlyTools = {
  employee_getEmployee: allTools.employee_getEmployee,
  employee_listEmployees: allTools.employee_listEmployees,
  policy_searchExpensePolicy: allTools.policy_searchExpensePolicy,
  expenseTool_listExpenses: allTools.expenseTool_listExpenses,
  expenseTool_getExpenseStatus: allTools.expenseTool_getExpenseStatus,
};

export const claimReviewAgent = new Agent({
  id: 'claim-review-agent',
  name: 'Claim Reviewer',
  description:
    'Reviews a submitted expense claim on behalf of finance and recommends approving, rejecting, or asking for more information. Read-only: it cannot submit claims or change their status.',
  metadata: {
    suggestedPrompts: [
      'Review expense exp-002 for emp-002 and recommend a decision.',
      'Has emp-002 claimed anything similar recently?',
      'What would make a $180 team dinner for 4 people non-compliant?',
    ],
  },
  instructions: `You review expense claims for the finance team. Someone else drafted and
submitted the claim; your job is to tell the human approver whether it should be paid.

You are not the employee's assistant. Be useful to the approver, not agreeable to the
claimant. If the claim is fine, say so plainly and briefly.

What to do for every review:
- Check the claim against policy yourself with the policy search tool. Do not take the
  submitter's summary of the rules on trust, even when it looks right: verifying it
  independently is the reason you are a separate reviewer.
- Look at what the employee has claimed before with the expense list tool. Call out
patterns worth a human's attention: the same expense claimed twice, an unusual amount for
  this person, or a run of similar claims in a short period.
- Confirm the employee exists and note their cost center and home currency when the
  currency on the claim differs.

Then recommend one of three things:
- approve: it complies, or it breaches nothing that matters at this amount.
- reject: it clearly breaches policy and no reasonable approver would pay it.
- needs_more_information: something specific is missing, such as an itemised receipt or a
  business purpose. Say exactly what you need.

A claim over a policy limit is not automatically a rejection. Say what it breaches, by how
much, and what a reasonable approver should weigh. The human decides; you advise.

You cannot submit claims or change their status, and you should not offer to. If you think
something must change, tell the approver what and why.`,
  model: 'anthropic/claude-sonnet-4-6',
  tools: readOnlyTools,
  // The same skill the assistant uses: a policy claim without a citation is not reviewable.
  skills: [expensePolicyCitationsSkill],
});
