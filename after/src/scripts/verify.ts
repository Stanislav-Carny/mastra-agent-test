import '../mcp-servers/_load-env';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { employeeClient, employeeDb, expenseClient, expenseDb } from '../db/client';
import { dbFiles, projectRoot } from '../db/paths';
import { POLICY_INDEX_NAME, policyVectorStore } from '../db/policy-index';
import { employees, expenses } from '../db/schema';

/**
 * Answers "is my setup working?" without needing Studio. Deliberately independent of
 * `src/mastra/`, so it gives the same answer before and after the workshop exercises.
 */

const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

function record(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
}

// 1. Node version
const major = Number(process.versions.node.split('.')[0]);
record('Node 22.13+', major >= 22, `found v${process.versions.node}`);

// 2. Credentials
const envPath = join(projectRoot, '.env');
record('.env present', existsSync(envPath), envPath);
record(
  'ANTHROPIC_API_KEY set',
  Boolean(process.env.ANTHROPIC_API_KEY),
  process.env.ANTHROPIC_API_KEY ? 'set (chat model)' : 'missing: copy .env.example to .env and fill it in',
);
record(
  'OPENAI_API_KEY set',
  Boolean(process.env.OPENAI_API_KEY),
  process.env.OPENAI_API_KEY ? 'set (policy embeddings)' : 'missing: copy .env.example to .env and fill it in',
);
// A gateway base URL that omits /v1 is the most common cause of 403/404 from Anthropic.
if (process.env.ANTHROPIC_BASE_URL) {
  record(
    'ANTHROPIC_BASE_URL ends in /v1',
    process.env.ANTHROPIC_BASE_URL.replace(/\/+$/, '').endsWith('/v1'),
    process.env.ANTHROPIC_BASE_URL.replace(/\/+$/, '').endsWith('/v1')
      ? 'ok'
      : 'gateway URLs usually need a /v1 suffix',
  );
}

// 3. Mock databases
try {
  const employeeRows = await employeeDb.select().from(employees);
  record('employees.db seeded', employeeRows.length > 0, `${employeeRows.length} employees`);
} catch (error) {
  record('employees.db seeded', false, error instanceof Error ? error.message : String(error));
}

try {
  const expenseRows = await expenseDb.select().from(expenses);
  record('expenses.db seeded', expenseRows.length > 0, `${expenseRows.length} claims`);
} catch (error) {
  record('expenses.db seeded', false, error instanceof Error ? error.message : String(error));
}

// 4. Policy vector index
if (existsSync(dbFiles.policy)) {
  try {
    const { count } = await policyVectorStore.describeIndex({ indexName: POLICY_INDEX_NAME });
    record('policy index built', count > 0, `${count} embedded chunks`);
  } catch (error) {
    record('policy index built', false, error instanceof Error ? error.message : String(error));
  }
} else {
  record('policy index built', false, 'expense-policy.db missing: run `npm run db:setup`');
}

// 5. MCP services answer a tools/list request.
// Run in a child process so its shutdown logging stays out of this report.
const mcpCheck = await new Promise<{ ok: boolean; detail: string }>(resolve => {
  const child = spawn(
    'npx',
    ['tsx', join(projectRoot, 'src', 'scripts', '_mcp-check.ts')],
    { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] },
  );

  let stdout = '';
  child.stdout.on('data', chunk => {
    stdout += String(chunk);
  });
  child.stderr.resume();

  child.on('error', error => resolve({ ok: false, detail: error.message }));

  child.on('close', () => {
    const line = stdout.split('\n').find(l => l.startsWith('__MCP_CHECK__'));
    if (!line) {
      resolve({ ok: false, detail: 'MCP check did not report a result' });
      return;
    }

    const parsed = JSON.parse(line.replace('__MCP_CHECK__', '')) as {
      ok: boolean;
      toolCount: number;
      errors: Record<string, string>;
    };

    resolve({
      ok: parsed.ok,
      detail: parsed.ok
        ? `${parsed.toolCount} tools across 3 services`
        : Object.entries(parsed.errors)
            .map(([server, message]) => `${server}: ${message.slice(0, 120)}`)
            .join('; '),
    });
  });
});

record('MCP services respond', mcpCheck.ok, mcpCheck.detail);

// Report
const width = Math.max(...checks.map(check => check.name.length));
console.log('');
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.name.padEnd(width)}  ${check.detail}`);
}

const failures = checks.filter(check => !check.ok);
console.log('');
if (failures.length === 0) {
  console.log('All checks passed. Run `npm run dev` and open http://localhost:4111');
} else {
  console.log(`${failures.length} check(s) failed. See ../docs/troubleshooting.md`);
}

employeeClient.close();
expenseClient.close();
process.exitCode = failures.length === 0 ? 0 : 1;
