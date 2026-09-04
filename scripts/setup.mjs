#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Clone-to-ready setup for the workshop. Installs both projects, creates and seeds the
 * mock SQLite databases, and reports what still needs attention.
 *
 * Safe to run as many times as you like: installs use the lockfile, tables are only
 * created when missing, seed rows are only inserted when absent, and an existing `.env`
 * is never overwritten.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const projects = ['before', 'after'];

const REQUIRED_NODE_MAJOR = 22;
const REQUIRED_NODE_MINOR = 13;

function heading(text) {
  console.log(`\n${'='.repeat(60)}\n${text}\n${'='.repeat(60)}`);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`\nFailed: ${command} ${args.join(' ')} (in ${cwd})`);
    process.exit(result.status ?? 1);
  }
}

// 1. Toolchain
heading('1/4  Checking your toolchain');

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < REQUIRED_NODE_MAJOR || (major === REQUIRED_NODE_MAJOR && minor < REQUIRED_NODE_MINOR)) {
  console.error(
    `Node ${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MINOR}+ is required, but this is v${process.versions.node}.`,
  );
  console.error('Install a newer Node (for example with `nvm install 22`) and run setup again.');
  process.exit(1);
}
console.log(`Node v${process.versions.node}`);

const npmVersion = spawnSync('npm', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
if (npmVersion.status !== 0) {
  console.error('npm was not found on your PATH.');
  process.exit(1);
}
console.log(`npm v${npmVersion.stdout.trim()}`);

// 2. Environment files
heading('2/4  Setting up environment files');

const missingKeys = [];
for (const project of projects) {
  const envPath = join(repoRoot, project, '.env');
  const examplePath = join(repoRoot, project, '.env.example');

  if (existsSync(envPath)) {
    console.log(`${project}/.env already exists, leaving it alone`);
  } else {
    copyFileSync(examplePath, envPath);
    console.log(`created ${project}/.env from .env.example`);
  }

  const contents = readFileSync(envPath, 'utf8');
  for (const key of ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY']) {
    if (!new RegExp(`^${key}=.+$`, 'm').test(contents)) {
      missingKeys.push(`${project}/.env ${key}`);
    }
  }
}

// 3. Dependencies
heading('3/4  Installing dependencies (this takes a minute)');

for (const project of projects) {
  console.log(`\n--- ${project} ---`);
  const cwd = join(repoRoot, project);
  const useCleanInstall = existsSync(join(cwd, 'package-lock.json'));
  run('npm', [useCleanInstall ? 'ci' : 'install'], cwd);
}

// 4. Databases
heading('4/4  Creating and seeding the mock databases');

if (missingKeys.length > 0) {
  console.log('Skipping the policy search index: no API keys are set yet.\n');
}

for (const project of projects) {
  console.log(`\n--- ${project} ---`);
  run('npm', ['run', 'db:setup'], join(repoRoot, project));
}

// Summary
heading('Setup complete');

if (missingKeys.length > 0) {
  console.log('One thing left to do: add your API keys.\n');
  for (const item of missingKeys) {
    console.log(`  missing  ${item}`);
  }
  console.log('\nThe facilitator will give you an API key and base URL. Then run:\n');
  console.log('  npm run setup     # re-run to build the policy search index');
  console.log('  npm run verify    # confirm everything works\n');
  process.exitCode = 1;
} else {
  console.log('Next steps:\n');
  console.log('  npm run verify          # confirm everything works');
  console.log('  npm run dev             # start Mastra Studio on the before/ project');
  console.log('\nThen open docs/README.md and start the workshop.\n');
}
