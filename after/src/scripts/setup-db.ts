import '../mcp-servers/_load-env';
import { employeeClient, expenseClient } from '../db/client';
import { ensureSchemaAndSeed } from '../db/migrate';
import { dbFiles } from '../db/paths';
import { ensurePolicyIndex } from '../db/policy-index';

/**
 * Creates and seeds the mock SQLite databases. Safe to run repeatedly: tables are
 * created only if missing, seed rows are inserted only if absent, and the policy index
 * is embedded only when it is empty.
 */

const counts = await ensureSchemaAndSeed();
console.log(`employees.db  ${counts.employees} rows  (${dbFiles.employees})`);
console.log(`expenses.db   ${counts.expenses} rows  (${dbFiles.expenses})`);

if (process.env.OPENAI_API_KEY) {
  try {
    const index = await ensurePolicyIndex();
    const state = index.created ? 'embedded' : 'already present';
    console.log(`expense-policy.db  ${index.chunks} policy chunks ${state}`);
  } catch (error) {
    console.error(
      `expense-policy.db  failed to build: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      'Policy search will not work until this succeeds. Check OPENAI_API_KEY and OPENAI_BASE_URL.',
    );
    process.exitCode = 1;
  }
} else {
  console.log(
    'expense-policy.db  skipped: OPENAI_API_KEY is not set, so policy passages cannot be embedded.',
  );
  console.log('Add the key to .env and re-run `npm run db:setup` to enable policy search.');
}

employeeClient.close();
expenseClient.close();
