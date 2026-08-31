# ABSL Agent Example

Two Mastra projects, side by side:

- **`before/`** — blank Mastra starter (fresh `npm create mastra@latest` scaffold). Start here.
- **`after/`** — the finished expense-assistant agent: `expenseAgent`, `expenseWorkflow`, and three mock MCP servers (employee directory, expense-policy knowledge base, expense-submission tool). This is the target state to work toward.

Each folder is its own standalone Mastra project (own `package.json`, `node_modules`, `.env`). `cd` into one and follow its `README.md`/`AGENTS.md` to run it — don't mix dependencies between the two.

```bash
cd before && npm install && npm run dev   # blank starter
# or
cd after && npm install && npm run dev    # finished example
```

See `after/README.md` for details on the finished agent (env vars, MCP servers, Studio tabs).
