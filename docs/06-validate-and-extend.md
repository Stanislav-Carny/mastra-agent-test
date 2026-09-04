# 06 — Validate and extend

**Time: 10 minutes. Concept: knowing whether it actually works.**

## Goal

Confirm your build is complete, compare it against the reference, and pick one extension
to try.

## Validate

```bash
cd before
npm run typecheck
npm run verify
```

Then in Studio, one pass over everything:

| Where | Check |
| ----- | ----- |
| Tools | `calculateApprovalRoute` is listed and returns manager-only for exactly `500` |
| MCP Servers | Three services, 7 tools |
| Agents | Expense Assistant answers a policy question **with a citation** |
| Agents | A `$640` claim triggers directory + policy + `calculateApprovalRoute` |
| Workflows | `expense-workflow` suspends at `human-approval` and completes on resume |

If all five hold, you have built the whole thing.

## Compare with the reference

```bash
diff -ru before/src/mastra after/src/mastra
```

Differences are expected and usually fine. Worth a closer look at:

- **Where the write path goes.** The reference funnels every expense write through the
  expense submission service. If yours writes to `expenses.db` from a step, that is the
  one difference worth fixing.
- **Whether the approval thresholds live in one place.** Constants at the top of the tool,
  used by both the tool and the workflow.
- **How much sits in the agent's instructions.** Rules that only apply sometimes belong in
  a skill.

A useful prompt:

```
Compare my before/src/mastra with after/src/mastra. Ignore differences in wording and
formatting. Tell me only about differences that would change behaviour, and which
version you would keep and why.
```

## Extensions

Pick one. They are ordered by effort.

**Swap the model provider (5 min).** Change the `model` string in your agent to
`openai/gpt-4.1-mini` and re-run the policy question. This is the payoff of the model
router: one string, no other code changes.

> On this workshop's gateway the OpenAI path uses the Responses API, which needs
> server-side message storage. If the account is Zero-Data-Retention, multi-step tool
> calls fail with *"Items are not persisted"*. Single-turn requests still work. If you
> hit that, switch back to `anthropic/claude-sonnet-4-6`. It is a good illustration that
> "swap the provider" is one line of code but not zero risk.

**Add a policy document (10 min).** Add an entry to
`src/mock-data/expense-policy-docs.ts`, then `npm run db:reset && npm run db:setup` to
re-embed. Ask the agent something only the new document answers, and check that it cites
the new title. You have just updated an agent's knowledge without touching the agent.

**Add a tool to an MCP service (15 min).** Add something like `getTeamSpend(department)`
to the employee or expense service. The seed data has 100 employees and 150 claims, so an
aggregate like this returns something worth looking at. Notice you do **not** have to
change the agent: it picks up the new tool from `tools/list` on the next start. That is
the MCP payoff. Remember to return an object, not a bare array.

**Branch the workflow (20 min).** Skip the `human-approval` step entirely when
`autoApproved` is true, so small claims complete without a pause. Ask Cursor about
Mastra's conditional branching.

**Add memory (20 min).** Give the agent memory so it remembers an employee id across a
conversation, instead of asking for it each time.

## What to take away

- **Agent or workflow?** Does the right sequence depend on the input? Agent. Is the
  sequence fixed and does it need to be auditable or pausable? Workflow. Most real
  systems are a workflow that calls an agent for the judgment steps, like this one.
- **Tool or retrieval?** Must the answer be identical every time? Tool. Is it prose that
  changes without a deploy? Retrieval.
- **Local tool or MCP?** Does the capability belong to you? Local. Does it belong to
  another team or service? MCP.
- **Instructions or skill?** Does the rule apply always? Instructions. Only sometimes?
  Skill.
- **The registry is real.** Most "my agent disappeared" moments are a missing entry in
  `src/mastra/index.ts`.

And the thing that generalises beyond Mastra: with Cursor, the bottleneck stopped being
how fast you can write the code and became how fast you can tell whether the code is
right. That is why every stage ended in Studio rather than in the editor.

## Keep going

- [Mastra documentation](https://mastra.ai/llms.txt)
- [`after/README.md`](../after/README.md) — the reference, with things to try
- [Troubleshooting](troubleshooting.md)
