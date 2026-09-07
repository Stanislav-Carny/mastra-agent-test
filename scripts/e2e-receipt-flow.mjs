#!/usr/bin/env node
/**
 * End-to-end check of the reference solution, driven through Studio the way a person
 * would: attach a receipt in chat, let the agent read it and start the workflow, then
 * approve the claim and watch the run finish.
 *
 * Everything it captures goes to `reports/<timestamp>/`, which is gitignored. Each step
 * writes a screenshot and a PASS/FAIL line, so a failed run leaves you a picture of the
 * screen at the moment it broke rather than a stack trace.
 *
 *   cd after && npm run dev        # in one terminal
 *   npm run e2e                    # in another
 *
 * Note: this submits a claim for emp-002, so the run leaves the database one row heavier
 * than the fixture. `npm run db:reset:after` puts it back.
 *
 * The agent's tool choices come from a model, so a step can legitimately fail on one run
 * and pass on the next. Read a failure as "look at this", not "the build is broken".
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const baseUrl = flag('url', 'http://localhost:4111');
const receipt = join(repoRoot, 'docs', 'assets', 'sample-receipt.png');

const startedAt = new Date();
const stamp = startedAt.toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = join(repoRoot, 'reports', stamp);
mkdirSync(outDir, { recursive: true });

const steps = [];
let shotIndex = 0;

async function shot(page, name) {
  const file = `${String(++shotIndex).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: join(outDir, file) });
  return file;
}

/** Runs one step, screenshots it either way, and records the outcome. */
async function step(page, name, fn) {
  const startedStep = Date.now();
  let status = 'PASS';
  let detail = '';

  try {
    detail = (await fn()) ?? '';
  } catch (error) {
    status = 'FAIL';
    detail = error.message.split('\n')[0];
  }

  const screenshot = await shot(page, name);
  const seconds = ((Date.now() - startedStep) / 1000).toFixed(1);
  steps.push({ name, status, detail, screenshot, seconds });
  console.log(`  ${status}  ${name}  (${seconds}s)${detail ? ` — ${detail}` : ''}`);
  return status === 'PASS';
}

console.log(`\nEnd-to-end check against ${baseUrl}`);
console.log(`Report: reports/${stamp}\n`);

// Fail early and clearly if nobody started the dev server.
try {
  const res = await fetch(`${baseUrl}/api/agents`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (error) {
  console.error(`Cannot reach Studio at ${baseUrl}: ${error.message}`);
  console.error('Start it with `npm run dev:after`, then run this again.');
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1500, height: 940 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
});
const page = await context.newPage();

let draftedClaim = null;
let reviewerVerdict = null;
let suspendedRun = null;

/**
 * The workflow graph renders in chat as soon as the run starts, so the presence of a
 * `human-approval` node proves nothing about whether the run has actually got there.
 * Ask storage instead, and wait for a run that really is suspended at that step.
 */
async function waitForSuspendedRun(timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl}/api/workflows/expenseWorkflow/runs?limit=5`, {
      signal: AbortSignal.timeout(15_000),
    });
    const body = await res.json();
    const runs = (Array.isArray(body) ? body : body.runs) ?? [];

    const suspended = runs
      .filter(r => r.snapshot?.status === 'suspended' && r.snapshot?.suspendedPaths?.['human-approval'])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (suspended) return suspended;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  throw new Error(`no run suspended at human-approval within ${timeoutMs / 1000}s`);
}

await step(page, 'studio-reachable', async () => {
  await page.goto(`${baseUrl}/agents`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.getByText('Expense Assistant').first().waitFor({ timeout: 15000 });
  return 'Expense Assistant is registered';
});

await step(page, 'workflow-registered', async () => {
  await page.goto(`${baseUrl}/workflows`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.getByText('expense-workflow').first().waitFor({ timeout: 15000 });
  return 'expense-workflow is listed in Studio';
});

await step(page, 'receipt-attached', async () => {
  await page.goto(`${baseUrl}/agents/expense-agent/chat/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Add attachment' }).click();
  await page.waitForTimeout(1200);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 15000 }),
    page.getByText('Add a local file', { exact: false }).click(),
  ]);
  await chooser.setFiles(receipt);
  await page.waitForTimeout(3000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  return 'sample-receipt.png staged in the composer';
});

await step(page, 'agent-reads-receipt-and-starts-workflow', async () => {
  await page
    .getByPlaceholder('Enter your message...')
    .fill("Here's my receipt for a team dinner. Please submit it for emp-002.");
  await page.keyboard.press('Enter');

  // The agent looks up the employee, searches policy and routes before it calls the
  // workflow, so this is several model round trips.
  await page.getByText('expense-workflow').first().waitFor({ timeout: 120_000 });
  return 'agent called the workflow from chat';
});

await step(page, 'workflow-suspended-in-chat', async () => {
  await page.getByText('human-approval').first().waitFor({ timeout: 120_000 });

  // Two model steps run before the pause, so this is the slowest part of the flow.
  suspendedRun = await waitForSuspendedRun(180_000);
  await page.waitForTimeout(4000);

  const steps = Object.keys(suspendedRun.snapshot.context).filter(k => k !== 'input');
  return `run suspended at human-approval after ${steps.length} steps`;
});

// The point of the reviewer is that its recommendation reaches the human approver, which
// means it has to be in the suspended run's snapshot rather than only in the chat.
await step(page, 'reviewer-recommendation-reaches-approver', async () => {
  const review = suspendedRun?.snapshot?.context?.['review-claim']?.output?.review;
  if (!review) throw new Error('the suspended run carries no reviewer output');

  const allowed = ['approve', 'reject', 'needs_more_information'];
  if (!allowed.includes(review.recommendation)) {
    throw new Error(`unexpected recommendation: ${review.recommendation}`);
  }
  if (!review.policyFindings?.trim()) throw new Error('reviewer gave no policy findings');

  reviewerVerdict = review.recommendation;
  return `reviewer recommended "${review.recommendation}" with findings attached`;
});

// Whether the model actually read the image is easier to assert over the API than by
// reading the rendered graph, so this step sends the same receipt and checks the total.
await step(page, 'model-reads-the-receipt-total', async () => {
  const image = `data:image/png;base64,${readFileSync(receipt).toString('base64')}`;
  const res = await fetch(`${baseUrl}/api/agents/expense-agent/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image, mimeType: 'image/png' },
            {
              type: 'text',
              text: 'Read this receipt. Reply with only the total and the currency, nothing else.',
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });

  const body = await res.json();
  draftedClaim = (body.text || '').replace(/\s+/g, ' ').slice(0, 120);
  if (!draftedClaim) throw new Error('agent returned no text');
  if (!draftedClaim.includes('180')) {
    throw new Error(`expected the $180.00 total, got: ${draftedClaim}`);
  }
  return 'model read $180.00 USD off the image';
});

await step(page, 'run-resumable-from-workflows-tab', async () => {
  // Opening the workflow shows the new-run form; the run we just started from chat has to
  // be picked out of "Recent runs", where it sits at the top.
  await page.goto(`${baseUrl}/workflows/expenseWorkflow`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const recentRuns = page.locator('a, [role="button"], li').filter({ hasText: /^[0-9a-f]{8}-/ });
  await recentRuns.first().waitFor({ timeout: 30_000 });
  await recentRuns.first().click();

  // Wait for the control the next step needs, not for label text: the panel renders in
  // stages and "Step suspended" can appear before the form is usable.
  await page.getByRole('button', { name: 'Resume' }).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  return 'the run started from chat is waiting in the Workflows tab, resumable';
});

await step(page, 'approved-and-completed', async () => {
  // The approve control is a styled checkbox whose real input is visually hidden.
  await page.getByRole('checkbox').first().click();
  await page.locator('#approverNote').fill('Approved at the $120 policy cap by the approver.');
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.getByText('Success').first().waitFor({ timeout: 90_000 });
  await page.waitForTimeout(3000);
  return 'run finished after the human decision';
});

await browser.close();

const passed = steps.filter(s => s.status === 'PASS').length;
const failed = steps.length - passed;
const elapsed = ((Date.now() - startedAt.getTime()) / 1000).toFixed(0);

const report = `# End-to-end check

- **When:** ${startedAt.toISOString()}
- **Target:** ${baseUrl}
- **Result:** ${failed === 0 ? 'all steps passed' : `${failed} of ${steps.length} steps failed`}
- **Duration:** ${elapsed}s

The flow: attach \`docs/assets/sample-receipt.png\` in the Expense Assistant chat, let the
agent read it and start the expense workflow, check that the independent reviewer's
recommendation reaches the approver, then approve the claim and confirm the run completes.

| # | Step | Result | Took | Notes |
| - | ---- | ------ | ---- | ----- |
${steps
  .map((s, i) => `| ${i + 1} | ${s.name} | ${s.status} | ${s.seconds}s | ${s.detail} |`)
  .join('\n')}

${draftedClaim ? `What the model read off the receipt image: ${draftedClaim}\n` : ''}
${reviewerVerdict ? `The reviewer's recommendation to the approver: **${reviewerVerdict}**\n` : ''}
## Screenshots

${steps.map(s => `### ${s.name}\n\n![${s.name}](${s.screenshot})\n`).join('\n')}
---

This run submitted a claim for \`emp-002\`. Run \`npm run db:reset:after\` to put the
database back to the seeded fixture.
`;

writeFileSync(join(outDir, 'report.md'), report);
writeFileSync(
  join(outDir, 'result.json'),
  `${JSON.stringify({ startedAt, baseUrl, passed, failed, steps }, null, 2)}\n`,
);

console.log(`\n${failed === 0 ? 'All steps passed' : `${failed} step(s) failed`} in ${elapsed}s`);
console.log(`Report written to reports/${stamp}/report.md`);
process.exit(failed === 0 ? 0 : 1);
