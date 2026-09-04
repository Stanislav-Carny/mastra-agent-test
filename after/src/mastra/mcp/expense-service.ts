import { expenseMcpClient } from './expense-mcp-client';

/**
 * Wraps the connected MCP servers so both Studio and the workflow use one set of
 * connections. `toMCPServerProxies()` turns each remote server into an object that
 * Mastra can register, and that exposes `executeTool()` for calling a tool from code.
 */
export const expenseServerProxies = await expenseMcpClient.toMCPServerProxies();

export type ExpenseClaim = {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  status: string;
  submittedAt: string;
};

/**
 * The service also exposes `listExpenses`, which returns `{ expenses: [...] }`. Only the
 * tools that return a single claim are listed here, so the return type stays accurate.
 */
type ExpenseToolName = 'submitExpense' | 'getExpenseStatus' | 'updateExpenseStatus';

/**
 * Calls a tool on the expense submission service. The workflow uses this so that every
 * expense write still goes through the service that owns the database, exactly like the
 * agent's tool calls do.
 */
export async function callExpenseTool(
  toolName: ExpenseToolName,
  input: Record<string, unknown>,
): Promise<ExpenseClaim> {
  const service = expenseServerProxies.expenseTool;

  if (!service) {
    throw new Error(
      `Expense MCP service not connected. Connected services: ${Object.keys(expenseServerProxies).join(', ')}`,
    );
  }

  return (await service.executeTool(toolName, input)) as ExpenseClaim;
}
