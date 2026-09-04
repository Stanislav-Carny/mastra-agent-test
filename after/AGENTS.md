# AGENTS.md

Completed workshop solution: the expense assistant with its local tool, three MCP
services, agent skill, and human-approval workflow already in place.

## CRITICAL: Load the `mastra` skill first

Load the `mastra` skill BEFORE writing any Mastra code, and verify APIs against the
embedded docs in `node_modules/@mastra/*/dist/docs/`. Never rely on cached knowledge, as
these APIs change between versions.

## Rules

- Register every agent, tool, workflow, and MCP server in `src/mastra/index.ts`.
- Use the `dev`, `build`, `db:setup`, `db:reset`, and `verify` scripts from
  `package.json` instead of calling `mastra`, `tsx`, or `sqlite3` directly.
- Keep this project in sync with `../before/` for every shared file: `src/db/`,
  `src/mcp-servers/`, `src/mock-data/`, `src/scripts/`, `tsconfig.json`, and the
  dependency list in `package.json`. The two projects must stay byte-identical there so
  participants can diff them.
- The expense MCP service is the only writer of `expenses.db`. The workflow goes through
  `callExpenseTool()` in `src/mastra/mcp/expense-service.ts` rather than opening the
  database, so there is exactly one write path.
- Chat models use Anthropic (`anthropic/claude-sonnet-4-6`); the policy index uses OpenAI
  embeddings. Model strings always use Mastra's `provider/model-name` format.
- MCP tools must return an object, never a bare array, because MCP requires structured
  results to be a record.

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- Workshop instructions: `../docs/README.md`
