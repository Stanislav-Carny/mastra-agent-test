# 00 — Setup

**Do this before the workshop starts.** It takes about 10 minutes, most of it waiting for
`npm install`. Doing it live will cost you a third of the session.

## What you need

- **Node 22.13 or newer.** Check with `node --version`. If it is older, install a newer
  one (`nvm install 22` if you use nvm; the repo has a `.nvmrc`).
- **Cursor**, signed in and able to run the agent.
- **API keys**, provided by the facilitator: an Anthropic key for the chat model and an
  OpenAI key for the policy search index. If your company routes AI traffic through a
  gateway, you also need the two base URLs.

## Steps

**1. Clone and run setup**

```bash
git clone <repo-url>
cd ABSL-AGENT-EXAMPLE
npm run setup
```

That checks your Node version, creates a `.env` in each project, installs dependencies
for both projects, and builds the mock SQLite databases. It is safe to re-run at any time.

It will finish by telling you that your API keys are missing. That is expected.

**2. Add your keys**

Open `before/.env` and fill in the values the facilitator gave you:

```bash
ANTHROPIC_API_KEY=...
ANTHROPIC_BASE_URL=      # only if you use a gateway
OPENAI_API_KEY=...
OPENAI_BASE_URL=         # only if you use a gateway
```

Copy the same values into `after/.env`.

> **Gateway users:** `ANTHROPIC_BASE_URL` almost always has to end in `/v1`. A URL without
> it produces a confusing `403 Forbidden` or `404 not allowed`. `npm run verify` checks this.

**3. Re-run setup, then verify**

```bash
npm run setup    # now builds the policy search index
npm run verify
```

You want nine `PASS` lines:

```
PASS  Node 22.13+                     found v22.13.0
PASS  .env present                    .../before/.env
PASS  ANTHROPIC_API_KEY set           set (chat model)
PASS  OPENAI_API_KEY set              set (policy embeddings)
PASS  ANTHROPIC_BASE_URL ends in /v1  ok
PASS  employees.db seeded             100 employees
PASS  expenses.db seeded              150 claims
PASS  policy index built              23 embedded chunks
PASS  MCP services respond            7 tools across 3 services

All checks passed.
```

Any `FAIL` line names the problem. [Troubleshooting](troubleshooting.md) covers the
common ones.

**4. Open Studio and confirm the model works**

```bash
npm run dev
```

Open <http://localhost:4111>. Go to **Agents → Setup Check** and send it a message. A
reply means your key, your base URL, and your model all work.

`Setup Check` is a throwaway agent with no tools. You will delete it later.

**5. Open the repo in Cursor**

Open the repo root (not `before/` on its own) so Cursor can see the docs, both projects,
and the `mastra` skill.

## You are ready when

- `npm run verify` is all green
- Studio loads at <http://localhost:4111> and Setup Check replies
- Cursor is open on the repo root

Next: [01 — Explore the kit](01-explore-the-kit.md)
