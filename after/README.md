# after — the finished solution

The completed expense assistant. Use it to compare against your own work in
[`../before/`](../before/README.md), or to demo the target state.

Peeking is allowed, but you will learn more by prompting your way there first.

## What is here

| Concept  | File | What it does |
| -------- | ---- | ------------ |
| Tool     | [`src/mastra/tools/approval-route-tool.ts`](src/mastra/tools/approval-route-tool.ts) | Deterministic approval-threshold arithmetic |
| MCP      | [`src/mastra/mcp/expense-mcp-client.ts`](src/mastra/mcp/expense-mcp-client.ts) | Connects the three mock services |
| MCP      | [`src/mastra/mcp/expense-service.ts`](src/mastra/mcp/expense-service.ts) | Lets workflow steps call expense tools |
| Skill    | [`src/mastra/skills/expense-policy-citations.ts`](src/mastra/skills/expense-policy-citations.ts) | Forces policy answers to cite their source |
| Agent    | [`src/mastra/agents/expense-agent.ts`](src/mastra/agents/expense-agent.ts) | Decides which tools to use, and when; starts the workflow to submit |
| Agent    | [`src/mastra/agents/claim-review-agent.ts`](src/mastra/agents/claim-review-agent.ts) | Reviews a submitted claim for finance; read-only, so it advises but cannot act |
| Workflow | [`src/mastra/workflows/expense-workflow.ts`](src/mastra/workflows/expense-workflow.ts) | Fixed 5-step path: draft, route, submit, review, then pause for a human |
| Registry | [`src/mastra/index.ts`](src/mastra/index.ts) | Registers all of the above |

## Run it

```bash
npm install
cp .env.example .env   # then fill in the keys
npm run db:setup
npm run verify
npm run dev            # http://localhost:4111
```

## Try these in Studio

**Agents → Expense Assistant**

- `What is the daily meal limit while travelling?` — searches policy and cites the document
- `Who has to approve a $640 equipment claim for emp-002?` — directory + policy + local tool
- `Submit a $40 client lunch for emp-002` — checks policy, then hands off to the workflow,
  which runs inline in the chat and pauses at `human-approval`
- Attach [`../docs/assets/sample-receipt.png`](../docs/assets/sample-receipt.png) with
  **Add attachment → Add a local file** and say `here's my receipt, submit it for emp-002`.
  The agent reads the receipt, flags that $180 across 4 guests breaches the $30/person cap,
  and submits it anyway — the approver makes that call, not the agent.

**Agents → Claim Reviewer**

The second agent, and the only one this project could justify — see the
[reasoning](../docs/06-validate-and-extend.md#extensions) for the five candidates that were
rejected. Count its tools: five, not seven. It cannot submit a claim or change a status, so
it advises the approver rather than acting.

- `Review expense exp-002 for emp-002 and recommend a decision.`
- `Has emp-002 claimed anything similar recently?` — the history check the assistant never does

**Workflows → expense-workflow**

Run with `employeeId: emp-002` and
`requestText: Team dinner with 4 people in Chicago, $180 total`. The run stops at
`human-approval` with the reviewer's recommendation attached; approve or reject it in Studio
to finish. On this claim the two agents disagree: the assistant flags the $30/person cap and
submits anyway, and the reviewer recommends rejecting it.

**MCP Servers**

Inspect the `employee`, `policy`, and `expenseTool` services and call their tools directly.

## Notes

- Chat runs on Anthropic; expense-policy embeddings run on OpenAI. Both keys are needed.
- The mock databases in `src/mock-data/` are generated and gitignored. `npm run db:setup`
  rebuilds them from the fixtures; `npm run db:reset` deletes them first.
