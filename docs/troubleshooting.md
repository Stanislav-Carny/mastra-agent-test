# Troubleshooting

Start here:

```bash
npm run verify
```

Every failing check names the thing that is broken. Below are the fixes, grouped by
symptom.

## Setup and credentials

**`Node 22.13+ FAIL`**

Install a newer Node. With nvm: `nvm install 22 && nvm use 22`, then re-run `npm run setup`.

**`ANTHROPIC_API_KEY set FAIL` or `OPENAI_API_KEY set FAIL`**

The key is missing from that project's `.env`. Note there are two: `before/.env` and
`after/.env`, and they need the same values. `npm run setup` creates both from
`.env.example` but cannot fill them in.

**`403 Forbidden` from Anthropic, or `endpoint not allowed`**

Two likely causes:

1. `ANTHROPIC_BASE_URL` does not end in `/v1`. Gateways almost always need it.
   `npm run verify` checks this.
2. The model is not allow-listed on your gateway. Gateways often permit only specific
   model ids, sometimes only dated ones. Try `anthropic/claude-sonnet-4-6` or
   `anthropic/claude-haiku-4-5-20251001`.

**`Items are not persisted for Zero Data Retention organizations`**

You switched the agent to an `openai/*` model. Mastra's OpenAI path uses the Responses
API, which stores messages server-side; Zero-Data-Retention accounts disable that, so
multi-step tool calls break. Switch back to `anthropic/claude-sonnet-4-6`.

OpenAI *embeddings* are unaffected, which is why policy search still works.

**`Could not find API key process.env.ANTHROPIC_API_KEY`**

The `.env` exists but was not loaded. Run commands from inside `before/` or `after/`, or
through the root scripts. MCP servers load `.env` explicitly via
`src/mcp-servers/_load-env.ts`; if you created a new entry point, import that first.

## Databases

**`employees.db seeded FAIL` or `expenses.db seeded FAIL`**

```bash
npm run db:setup
```

**`policy index built FAIL`**

Needs `OPENAI_API_KEY`, because it embeds the policy documents. Set it, then:

```bash
npm run db:reset && npm run db:setup
```

**Data is in a confusing state after experimenting**

```bash
npm run db:reset       # before/
npm run db:reset:after # after/
```

That deletes the mock databases and rebuilds them from the fixtures in `src/mock-data/`.
Nothing is lost that is not regenerated: the `.db` files are gitignored on purpose.

## MCP

**`MCP services respond FAIL`, or "Connection closed" on startup**

Usually a path problem. Server script paths must be absolute and built from the
`projectRoot` export in `src/db/paths.ts`. Anything relative, or anything based on
`process.cwd()`, breaks because MCP subprocesses run from a different directory.

Test a server on its own:

```bash
cd before
npx tsx src/mcp-servers/employee-server.ts
```

It should start and wait. `Ctrl-C` to stop. If it errors, the problem is the server or
the database, not your client.

**The policy server times out on first connection**

It builds the vector index on first start, which takes several seconds. Build it up front
with `npm run db:setup`, and keep the client timeout at 120 seconds.

**`MCPClient with identical configuration already exists`**

You are constructing the client more than once. It must be a single module-level
`export const`, not created inside a function or per request.

**`Invalid tools/call result: expected record, received array`**

An MCP tool returned a bare array. MCP requires structured results to be an object. Wrap
it: `return { expenses: rows }` instead of `return rows`.

**Scary "Connection closed" errors when a script finishes**

Expected. Shutting down stdio subprocesses always logs that, even on success. `npm run
verify` isolates the check in a child process specifically so this noise stays out of the
report.

## Studio

**My agent, tool, or workflow is not in Studio**

It is not registered. Open `src/mastra/index.ts` and confirm it is in `agents:`, `tools:`,
`workflows:`, or `mcpServers:`. This is by far the most common problem in the workshop.

**I registered it and it still is not there**

Restart the dev server. Adding a new top-level key does not always hot-reload.

**Studio is not on the port I expected**

If 4111 is taken, `mastra dev` quietly falls back to the next free port and prints the real
one in its startup banner:

```
│ Studio: http://localhost:4112
```

Read the banner rather than assuming 4111. This is what happens when you run `before/` and
`after/` at the same time, which is fine to do.

**`Another development server instance is already running in this directory`**

Two dev servers for the *same* project. Mastra refuses, and names the process to stop:

```
│ PID 54707 is still active.
```

`kill <pid>`, then start it again. Note that stopping `npm run dev` with `Ctrl+C` sometimes
leaves that process behind holding the port, which is the usual cause.

**Studio loads but every agent message errors**

Credentials. Check the terminal running `npm run dev` for the real error, then work
through the credentials section above.

## Agent behaviour

**No citations in policy answers**

The skill is not loading. Either it is missing from the agent's `skills` array, or its
description does not sound relevant to the question. Descriptions should read as trigger
conditions and mention policy, limits, and approval rules explicitly.

**The agent does approval arithmetic itself instead of calling the tool**

Make the instruction a prohibition rather than a suggestion: "Never do approval-threshold
arithmetic in your head; always call calculateApprovalRoute."

**The agent invents an employee id**

Add: "Ask for the employee id if you were not given one, rather than guessing."

**The agent ignores a tool completely**

Check the tool's `description`. That, plus the field `.describe()` text, is all the model
has to go on when deciding what to call.

## Workflow

**The run never suspends**

The step returns instead of calling `suspend()`. The pattern is: no `resumeData` means
suspend; otherwise continue.

**The run suspends and never resumes**

The step id passed to `resume()` must match the step's `id`. Studio's resume form handles
this; hand-written calls often get it wrong.

**Typecheck errors between steps**

A field one step returns is not declared in the next step's `inputSchema`. Build each
schema by extending the previous one rather than retyping the fields.

**The claim gets created twice**

Both the drafting step's agent call and the submit step created one. The drafting prompt
must ask the agent to fill in the claim, not to submit it.

## Nuclear option

```bash
cd <repo root>
rm -rf before/node_modules after/node_modules
npm run setup
npm run verify
```

Your `.env` files are preserved. If that still fails, compare against
[`after/`](../after/README.md), which is known to work.
