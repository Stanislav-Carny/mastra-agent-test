# ABSL Agent Example

Mastra example project: an expense-assistant agent (`expenseAgent`) backed by three mock MCP servers (employee directory, expense-policy knowledge base, expense-submission tool) and an `expenseWorkflow`.

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | `expenseAgent` uses `openai/gpt-5-mini` via Mastra's model router. |
| `TURSO_DATABASE_URL` | No | Hosted LibSQL/Turso DB. Omit to use local `file:./mastra.db`. |
| `TURSO_AUTH_TOKEN` | No | Auth token for `TURSO_DATABASE_URL`. |
| `MASTRA_PLATFORM_ACCESS_TOKEN` | No | Enables sending observability events to Mastra Platform. |

## Run

```bash
npm run dev
```

Starts `mastra dev` and Mastra Studio at [http://localhost:4111](http://localhost:4111).

- **Agents** tab → chat with `expenseAgent`.
- **Workflows** tab → run `expenseWorkflow`.
- **MCP Server** tab → inspect the `employee`, `policy`, and `expense-tool` mock servers the agent's tools come from.

On first run, local SQLite/DuckDB files (`mastra.db`, DuckDB observability store) are created automatically — no manual DB init needed.

## Build

```bash
npm run build
```

Produces a deployable build via `mastra build` (output in `.mastra/output`, gitignored).
