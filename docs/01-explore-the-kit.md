# 01 — Explore the kit

**Time: 15 minutes. You write no code in this stage.**

## Goal

Understand what already exists, so that when you start prompting you know what you are
connecting to. Skipping this is the most common reason people get lost in stage 03.

## The mental model

You have been dropped into a company that already has three systems. Another team owns
them. You cannot change them. Your job is to build an assistant on top.

Each system runs as its **own process** and speaks **MCP** over stdin/stdout. That is the
whole point of MCP: the capability lives somewhere else, and your agent reaches it over a
protocol rather than by importing a function.

```
your Mastra app
      │
      │  MCP (stdio)
      ├──────────────►  employee-server.ts     ──►  employees.db
      ├──────────────►  expense-policy-server.ts ─►  expense-policy.db  (vector index)
      └──────────────►  expense-tool-server.ts  ──►  expenses.db
```

## Look around in Studio

Start it if it is not running:

```bash
cd before
npm run dev
```

Open <http://localhost:4111>. The first thing to notice is how **empty** it is: one agent
called **Setup Check**, and nothing under Tools, Workflows, or MCP Servers.
([Screenshot](studio-walkthrough.md#stage-01--the-empty-starting-point).)

That is not a bug, and it is the most useful thing Studio will teach you today. Studio
shows exactly what is registered in `src/mastra/index.ts` and nothing else. The three
services exist on disk, in `src/mcp-servers/`, but no code has connected to them yet, so
Studio has no idea they are there. Your job over the next hour is to fill this sidebar.

If you skipped it during setup, say hello to **Setup Check** now. It has no tools and
knows nothing about expenses; it exists only to prove your model credentials work.

## Confirm the three services are alive

You cannot click on them yet, so check them from the terminal instead:

```bash
npm run verify
```

The line that matters:

```
PASS  MCP services respond  7 tools across 3 services
```

That started all three services as subprocesses, asked each one for its tool list, and
counted: 2 from the employee directory, 1 from the policy knowledge base, and 4 from the
expense submission service. They work. You just have no way to reach them from your app,
which is stage 03's job — and that is where you will call one by hand in Studio.

## Look around in the code

Ask Cursor rather than reading everything yourself:

```
Give me a tour of the before/ project. What is already built, what is missing,
and which files am I expected to create? Do not write any code yet.
```

The parts worth knowing:

| Path | What it is |
| ---- | ---------- |
| `src/mcp-servers/` | The three services. Each one creates tools and calls `startStdio()` |
| `src/mock-data/` | Seed fixtures and the policy documents, as plain data |
| `src/db/` | Schema, seeding, and the policy vector index |
| `src/scripts/` | The `db:setup`, `db:reset`, and `verify` commands |
| `src/mastra/index.ts` | **The registry.** Nothing shows up in Studio unless it is listed here |

Open [`src/mastra/index.ts`](../before/src/mastra/index.ts) and read the comment block.
It lists the four things you are about to add. That file is your checklist.

Also open [`src/mock-data/expense-policy-docs.ts`](../before/src/mock-data/expense-policy-docs.ts)
and skim the policies. Knowing that meals are capped and that equipment needs extra
approval will help you tell a good agent answer from a plausible-sounding wrong one.

## The one rule to remember

**The expense MCP service is the only thing that writes to `expenses.db`.**

When you get to the workflow in stage 05, it will be tempting to let it open the database
directly, and Cursor may well suggest that. Do not. Two write paths to the same data is
how real systems rot. Everything goes through the service that owns it.

## Check yourself

Answer these before moving on:

1. If you wanted the agent to look up an employee, would you write a tool or use MCP?
   *(MCP: the directory already exists as a service.)*
2. Where does an approval threshold like "over $500 needs finance" belong: policy search
   or code? *(Code. It is arithmetic; it must be deterministic and always the same.)*
3. You add a new agent but it does not appear in Studio. What did you forget?
   *(To register it in `src/mastra/index.ts`.)*

Next: [02 — Build the tool](02-build-the-tool.md)
