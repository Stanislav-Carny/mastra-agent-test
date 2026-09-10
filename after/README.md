# before — your workspace

This is where you build during the workshop. Follow the guides in
[`../docs/`](../docs/README.md); this file is only a quick reference.

## What you already have

Three mock services, each a separate process speaking MCP over stdio, each backed by its
own local SQLite database:

| Service                | Tools                                                             | Data |
| ---------------------- | ----------------------------------------------------------------- | ---- |
| Employee Directory     | `getEmployee`, `listEmployees`                                     | 100 employees across 8 departments |
| Policy Knowledge Base  | `searchExpensePolicy`                                              | 11 policy documents, vector-indexed |
| Expense Submission     | `submitExpense`, `getExpenseStatus`, `listExpenses`, `updateExpenseStatus` | 150 historical claims |

Also provided: the seed fixtures in `src/mock-data/`, the database helpers in `src/db/`,
and the setup/verify scripts in `src/scripts/`. Treat all of that as an existing system
you are integrating with, not code to change.

## What you build

| Guide | You create | Concept |
| ----- | ---------- | ------- |
| [02](../docs/02-build-the-tool.md) | `src/mastra/tools/approval-route-tool.ts` | Tool |
| [03](../docs/03-connect-mcp.md) | `src/mastra/mcp/` | MCP client |
| [04](../docs/04-agent-and-skill.md) | `src/mastra/skills/`, `src/mastra/agents/expense-agent.ts` | Skill, Agent |
| [05](../docs/05-approval-workflow.md) | `src/mastra/workflows/expense-workflow.ts` | Workflow |

Everything must be registered in `src/mastra/index.ts` to appear in Studio.

## Commands

```bash
npm run verify     # is my setup working?
npm run dev        # start Mastra Studio at http://localhost:4111
npm run db:reset   # wipe the mock databases
npm run db:setup   # rebuild them from the seed fixtures
npm run typecheck  # check types without running anything
```

`setupCheckAgent` is a throwaway agent that only proves your API key works. Delete it
once your expense assistant runs.

## Stuck?

Read [`../docs/troubleshooting.md`](../docs/troubleshooting.md), or compare against the
finished solution in [`../after/`](../after/README.md).
