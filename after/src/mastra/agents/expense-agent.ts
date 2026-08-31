import { Agent } from '@mastra/core/agent';
import { expenseMcpClient } from '../mcp/expense-mcp-client';
import { expensePolicyCitationsSkill } from '../skills/expense-policy-citations';

export const expenseAgent = new Agent({
  id: 'expense-agent',
  name: 'Expense Assistant',
  instructions: `You help employees submit and track expenses correctly.

You have tools backed by three separate mock services (each its own MCP server / SQLite database):
- employee directory: look up who an employee is and their cost center/currency
- expense policy knowledge base: semantic search over policy documents to check limits and approval rules
- expense submission tool: submit new expense claims and check their status

Before submitting an expense, check the relevant policy (amount limits, receipt requirements,
approval thresholds) via the policy search tool, and confirm the employee's currency via the
employee directory if not given. Explain any policy limits that apply to the claim.`,
  model: 'openai/gpt-5-mini',
  tools: await expenseMcpClient.listTools(),
  skills: [expensePolicyCitationsSkill],
});
