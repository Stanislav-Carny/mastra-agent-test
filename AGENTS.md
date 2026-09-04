# AGENTS.md

A workshop repository teaching Mastra concepts through Cursor. Two standalone Mastra
projects plus the curriculum:

| Path | Role |
| ---- | ---- |
| `before/` | Participant starting point: mock services and data, no agent yet |
| `after/` | The completed reference solution |
| `docs/` | Participant stages, troubleshooting, and the facilitator guide |
| `scripts/setup.mjs` | Clone-to-ready setup for both projects |
| `scripts/capture-studio-screenshots.mjs` | Regenerates `docs/images/` with Playwright |
| `scripts/build-walkthrough-pdf.mjs` | Renders the walkthrough into the printable handout |

## CRITICAL: Load the `mastra` skill first

Load the `mastra` skill BEFORE any Mastra work, and verify APIs against the embedded docs
in `<project>/node_modules/@mastra/*/dist/docs/`. Never rely on cached knowledge — these
APIs change between versions.

## Rules

- Work inside `before/` or `after/`, never at the root. Each has its own `AGENTS.md` with
  project-specific rules; read it first.
- Register all agents, tools, workflows, and MCP servers in `<project>/src/mastra/index.ts`.
- Use the npm scripts (`setup`, `verify`, `dev`, `db:setup`, `db:reset`, `typecheck`)
  rather than invoking `mastra`, `tsx`, or `sqlite3` directly.
- Keep `before/` and `after/` identical for shared files: `src/db/`, `src/mcp-servers/`,
  `src/mock-data/`, `src/scripts/`, `tsconfig.json`, and the `package.json` dependency
  list. Participants diff the two projects, so drift is a bug.
- Never commit secrets or generated databases. `.env` and `src/mock-data/*.db` are
  gitignored; `.env.example` holds placeholders only.
- Chat models use Anthropic (`anthropic/claude-sonnet-4-6`), embeddings use OpenAI.
  Behind a gateway, `ANTHROPIC_BASE_URL` must end in `/v1`.

## When changing the curriculum

The docs quote real behaviour: tool names, thresholds, expected Studio output, and error
messages. If you change the code, re-check the affected stage in `docs/` and the tables in
the READMEs. If the change is visible in Studio, regenerate the screenshots with
`npm run docs:screenshots` rather than editing `docs/images/` by hand.

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Skills Discovery](https://mastra.ai/.well-known/skills/index.json)
