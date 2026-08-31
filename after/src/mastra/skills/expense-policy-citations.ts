import { createSkill } from '@mastra/core/skills';

export const expensePolicyCitationsSkill = createSkill({
  name: 'expense-policy-citations',
  description: 'Use whenever answering a question about expense policy (limits, approval rules, receipt requirements, etc.).',
  instructions: `When answering a question that draws on expense policy:

1. Look up the relevant passage with the search_expense_policy tool.
2. Cite the source for every claim: add a bookmark/citation naming the policy document it
   came from, using the "title" field returned by the tool. Format: [Title] immediately after
   the claim, e.g. "Hotel bookings are capped at $250/night in major cities [Business Travel Policy]."
3. If a statement is supported by more than one passage, cite all of them: [Title A][Title B].
4. Never state a policy rule, limit, or approval threshold without a citation.
5. If the search tool returns no relevant passage, say so explicitly instead of guessing.`,
});
