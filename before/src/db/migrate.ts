import { employeeClient, employeeDb, expenseClient, expenseDb } from './client';
import { employees, expenses } from './schema';
import { mockEmployees } from '../mock-data/employees';
import { mockExpenses } from '../mock-data/expenses';

/**
 * Each mock service sets up only the database it owns, and nothing else.
 *
 * That split matters more than it looks. The three MCP servers are spawned at the same
 * moment when the dev server boots, so if two of them tried to create the same SQLite
 * file, one would lose the race and die with `SQLITE_BUSY: database is locked`. Keeping
 * one writer per file also matches the rule the workshop teaches: the service that owns
 * the data is the only thing that touches it.
 *
 * Both functions are safe to call on every process start, which is what lets the servers
 * come up even if nobody ran `npm run db:setup` first.
 */
export async function ensureEmployeeData(): Promise<number> {
  await employeeClient.execute(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL,
      manager_id TEXT,
      cost_center TEXT NOT NULL,
      currency TEXT NOT NULL
    )
  `);

  // Existing rows are left untouched, so re-running never duplicates the fixtures.
  await employeeDb.insert(employees).values(mockEmployees).onConflictDoNothing();

  const rows = await employeeDb.select().from(employees);
  return rows.length;
}

export async function ensureExpenseData(): Promise<number> {
  await expenseClient.execute(`
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

  // Claims submitted during the workshop survive this, for the same reason.
  await expenseDb.insert(expenses).values(mockExpenses).onConflictDoNothing();

  const rows = await expenseDb.select().from(expenses);
  return rows.length;
}

/**
 * Sets up both databases in sequence. Used by `npm run db:setup` and `npm run verify`,
 * which run on their own and so cannot collide with anything.
 */
export async function ensureSchemaAndSeed(): Promise<{ employees: number; expenses: number }> {
  return {
    employees: await ensureEmployeeData(),
    expenses: await ensureExpenseData(),
  };
}
