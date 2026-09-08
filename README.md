# Vibe-coding agents with Cursor and Mastra

A 90-minute hands-on workshop. You build an expense assistant by describing what you want
to Cursor, and check each piece in a visual interface called Mastra Studio.

By the end you will know what a **tool**, an **agent**, a **workflow**, a **skill**, and
**MCP** actually are, and — more usefully — when to reach for each one.

**No TypeScript knowledge required.** You will read code and judge whether it does what
you asked. That is the skill being taught.

## Quick start

```bash
git clone <repo-url>
cd ABSL-AGENT-EXAMPLE
npm run setup
```

Then add the API keys your facilitator gave you to `before/.env` and `after/.env`, and:

```bash
npm run setup    # re-run to build the policy search index
npm run verify   # should be all PASS
npm run dev      # Mastra Studio at http://localhost:4111
```

Full instructions, including what to do when a check fails:
**[docs/00-setup.md](docs/00-setup.md)**.

No git? Download the zip from the repo's **Code → Download ZIP** button, unzip it, and
open **[docs/index.html](docs/index.html)** in a browser for the same steps.

## Start the workshop

**→ [docs/README.md](docs/README.md)**

| | |
| --- | --- |
| [00 Setup](docs/00-setup.md) | Do this before the session |
| [01 Explore the kit](docs/01-explore-the-kit.md) | What you were given |
| [02 Build the tool](docs/02-build-the-tool.md) | Tool |
| [03 Connect MCP](docs/03-connect-mcp.md) | MCP |
| [04 Agent and skill](docs/04-agent-and-skill.md) | Agent, Skill |
| [05 Approval workflow](docs/05-approval-workflow.md) | Workflow |
| [06 Validate and extend](docs/06-validate-and-extend.md) | Where to go next |

Also: [troubleshooting](docs/troubleshooting.md) ·
[facilitator guide](docs/facilitator-guide.md)

## Repository layout

| Path | What it is |
| ---- | ---------- |
| [`before/`](before/README.md) | **Your workspace.** Mock services and data, waiting for the agent |
| [`after/`](after/README.md) | The finished solution, for comparison |
| [`docs/`](docs/README.md) | The workshop itself |
| `scripts/setup.mjs` | Clone-to-ready setup, safe to re-run |
| `.agents/skills/mastra/` | The Mastra skill Cursor loads to write correct, current code |

Both projects are standalone Mastra apps with identical dependencies. `before/` has the
mock services; `after/` adds the tool, MCP client, skill, agent, and workflow on top.

## What you are building

An assistant that answers expense-policy questions and submits claims. Three mock
services already exist, each running as its own process and speaking MCP over stdio,
each backed by its own local SQLite database:

| Service | Tools | Data |
| ------- | ----- | ---- |
| Employee Directory | `getEmployee`, `listEmployees` | 100 employees across 8 departments |
| Policy Knowledge Base | `searchExpensePolicy` | 11 policy documents, vector-indexed |
| Expense Submission | `submitExpense`, `getExpenseStatus`, `listExpenses`, `updateExpenseStatus` | 150 historical claims |

You add: a local tool for approval-threshold arithmetic, the MCP client wiring, a
citation skill, the agent, and a workflow that pauses for human approval.

## Commands

Run from the repository root:

```bash
npm run setup         # install both projects and build the mock databases
npm run verify        # check the before/ setup
npm run verify:after  # check the after/ setup
npm run dev           # Studio for before/
npm run dev:after     # Studio for after/
npm run db:reset      # rebuild before/'s mock databases from the seed fixtures
npm run typecheck     # typecheck both projects
```

## Requirements

- Node 22.13 or newer (see `.nvmrc`)
- Cursor
- An Anthropic API key (chat) and an OpenAI API key (policy embeddings)

The mock SQLite databases are generated, not committed. `npm run setup` builds them from
the fixtures in `src/mock-data/`, so a reset is always one command away.
