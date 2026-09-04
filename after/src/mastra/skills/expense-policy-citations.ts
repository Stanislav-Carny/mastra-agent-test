import { createSkill } from '@mastra/core/skills';

/**
 * A runtime agent skill: instructions the agent loads when the task matches the
 * description. Not to be confused with the `mastra` Cursor skill in `.agents/skills/`,
 * which guides the coding assistant while you write this project.
 */
export const expensePolicyCitationsSkill = createSkill({
  name: 'expense-policy-citations',
  description:
    'Use whenever answering a question about expense policy: limits, approval rules, receipt requirements, or deadlines.',
  instructions: `When your answer draws on expense policy:

1. Look up the relevant passage with the policy search tool before answering.
2. Cite the source for every claim. Put the policy document title in square brackets
   immediately after the claim, using the "title" field the search tool returned.
   Example: "Hotel bookings are capped at $250/night in major cities [Business Travel Policy]."
3. If a statement rests on more than one passage, cite all of them: [Title A][Title B].
4. Never state a policy rule, limit, or approval threshold without a citation.
5. If the search returns nothing relevant, say so plainly instead of guessing.`,
});
