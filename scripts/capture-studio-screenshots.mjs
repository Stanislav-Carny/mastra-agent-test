#!/usr/bin/env node
/**
 * Captures the Mastra Studio screenshots used by `docs/studio-walkthrough.md`.
 *
 * Studio is a live app, so these images go stale whenever the UI or the reference
 * solution changes. Re-run this instead of editing the images by hand.
 *
 * Prerequisites: both dev servers running, and `npx playwright install chromium` done once.
 *
 *   cd before && npm run dev     # first one started claims 4111
 *   cd after  && npm run dev     # second one falls back to 4112
 *   node scripts/capture-studio-screenshots.mjs --before <url> --after <url>
 *
 * Pass step names to capture a subset, for example:
 *   node scripts/capture-studio-screenshots.mjs 05-workflow-suspended
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, 'docs', 'images');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const beforeUrl = flag('before', 'http://localhost:4111');
const afterUrl = flag('after', 'http://localhost:4112');
const only = args.filter(a => !a.startsWith('--') && !a.startsWith('http'));

const VIEWPORT = { width: 1500, height: 940 };

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2, // retina, so the images stay sharp when scaled down in the docs
  colorScheme: 'light',
});

/** Studio holds streaming connections open, so `networkidle` never settles. */
async function open(url) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  return page;
}

async function shot(page, name) {
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path });
  console.log(`  saved docs/images/${name}.png`);
}

const steps = {
  /* ---------------------------------------------------------------- stage 01 */

  '01-empty-studio': async () => {
    const page = await open(`${beforeUrl}/agents`);
    await shot(page, '01-empty-studio');
    await page.close();
  },

  '01-mcp-servers-empty': async () => {
    const page = await open(`${beforeUrl}/mcps`);
    await shot(page, '01-mcp-servers-empty');
    await page.close();
  },

  '01-setup-check-reply': async () => {
    const page = await open(`${beforeUrl}/agents/setup-check-agent/chat/new`);
    await page.getByPlaceholder('Enter your message...').fill('Say hello and confirm my setup works.');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(9000);
    await shot(page, '01-setup-check-reply');
    await page.close();
  },

  /* ---------------------------------------------------------------- stage 02 */

  '02-tools-list': async () => {
    const page = await open(`${afterUrl}/tools`);
    await shot(page, '02-tools-list');
    await page.close();
  },

  '02-tool-result': async () => {
    const page = await open(`${afterUrl}/tools/calculateApprovalRoute`);
    await page.locator('input[name="amount"]').fill('50');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(4000);
    await shot(page, '02-tool-result');
    await page.close();
  },

  /* ---------------------------------------------------------------- stage 03 */

  '03-mcp-servers': async () => {
    const page = await open(`${afterUrl}/mcps`);
    await shot(page, '03-mcp-servers');
    await page.close();
  },

  '03-mcp-tool-result': async () => {
    const page = await open(`${afterUrl}/mcps/expense-tool/tools/listExpenses`);
    await page.locator('textarea[name="employeeId"], input[name="employeeId"]').first().fill('emp-002');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(6000);
    await shot(page, '03-mcp-tool-result');
    await page.close();
  },

  /* ---------------------------------------------------------------- stage 04 */

  '04-agent-citation': async () => {
    const page = await open(`${afterUrl}/agents/expense-agent/chat/new`);
    await page.getByPlaceholder('Enter your message...').fill('What is the daily meal limit while travelling?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(25000);
    await shot(page, '04-agent-citation');
    await page.close();
  },

  '04-agent-tool-calls': async () => {
    const page = await open(`${afterUrl}/agents/expense-agent/chat/new`);
    await page.getByPlaceholder('Enter your message...').fill('Who has to approve a $640 equipment claim for emp-002?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(45000);
    await shot(page, '04-agent-tool-calls');
    await page.close();
  },

  /* ---------------------------------------------------------------- stage 05 */

  /**
   * One run produces both stage 05 images, so the suspended and resumed screenshots
   * always show the same claim.
   */
  '05-workflow': async () => {
    const page = await open(`${afterUrl}/workflows/expenseWorkflow`);
    await page.locator('textarea[name="employeeId"]').fill('emp-002');
    await page
      .locator('textarea[name="requestText"]')
      .fill('Team dinner with 4 people in Chicago, $180 total');
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    // The first step calls the agent, so suspension takes as long as a model round trip.
    await page.getByText('Step suspended').waitFor({ timeout: 90_000 });
    await page.waitForTimeout(2000);
    await shot(page, '05-workflow-suspended');

    // The approve control is a styled checkbox whose real input is visually hidden.
    await page.getByRole('checkbox').first().click();
    await page.locator('#approverNote').fill('Approved at the $150 policy cap.');
    await page.getByRole('button', { name: 'Resume' }).click();
    await page.waitForTimeout(12000);
    await shot(page, '05-workflow-resumed');
    await page.close();
  },
};

const selected = only.length > 0 ? only : Object.keys(steps);

for (const name of selected) {
  if (!steps[name]) {
    console.error(`Unknown step: ${name}`);
    process.exitCode = 1;
    continue;
  }
  console.log(`\n${name}`);
  try {
    await steps[name]();
  } catch (error) {
    console.error(`  FAILED: ${error.message.split('\n')[0]}`);
    process.exitCode = 1;
  }
}

await browser.close();
console.log('\nDone.');
