# AGENTS.md

Workshop project: an expense assistant built with Mastra. The mock services and databases
are already provided; the agent, tools, skill, and workflow are what we are building.

## CRITICAL: Load the `mastra` skill first

Load the `mastra` skill BEFORE writing any Mastra code, and verify APIs against the
embedded docs in `node_modules/@mastra/*/dist/docs/`. Never rely on cached knowledge, as
these APIs change between versions.

## Rules

- Register every agent, tool, workflow, and MCP server in `src/mastra/index.ts`. Nothing
  appears in Mastra Studio until it is registered there.
- Use the `dev`, `build`, `db:setup`, `db:reset`, and `verify` scripts from
  `package.json` instead of calling `mastra`, `tsx`, or `sqlite3` directly.
- Do not edit anything in `src/db/`, `src/mcp-servers/`, `src/mock-data/`, or
  `src/scripts/`. Those are the provided "existing systems" for this exercise.
- The expense MCP service is the only writer of `expenses.db`. Never open that database
  directly from an agent, tool, or workflow: call its MCP tools instead.
- Chat models use Anthropic (`anthropic/claude-sonnet-4-6`); the policy index uses OpenAI
  embeddings. Model strings always use Mastra's `provider/model-name` format.
- Anything that needs a database path must import it from `src/db/paths.ts`. Never build
  paths from `process.cwd()`, because MCP servers run with a different working directory.
- MCP tools must return an object, never a bare array, because MCP requires structured
  results to be a record.

## Project layout

| Path                 | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `src/mastra/`        | What we build: agents, tools, skills, workflows, registry |
| `src/mcp-servers/`   | Provided mock services, each speaking MCP over stdio      |
| `src/db/`            | Provided schema, seeding, and the policy vector index     |
| `src/mock-data/`     | Provided seed fixtures and policy documents               |
| `src/scripts/`       | Provided setup, reset, and verification CLIs              |

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Skills Discovery](https://mastra.ai/.well-known/skills/index.json)
- Workshop instructions: `../docs/README.md`
