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

**Let the agent start the workflow (10 min).** So far the agent and the workflow live in
separate Studio tabs. Ask Cursor to give the assistant the expense workflow as well, so an
employee can kick off the whole approval process from chat.

**Expect `npm run typecheck` to fail the first time.** Your workflow imports the agent for
its `draft-claim` step, and now the agent imports the workflow, so TypeScript gives up on
inferring either of them: *"implicitly has type 'any' because it does not have a type
annotation and is referenced directly or indirectly in its own initializer."* It runs fine
— the cycle only defeats inference — but the fix is worth making. Have the step ask the
registry for the agent instead of importing it, which is how the reference does it:

```ts
execute: async ({ inputData, mastra }) => {
  const expenseAgent = mastra.getAgent('expenseAgent');
```

The interesting part is what happens next. Studio draws the workflow inline in the
conversation, steps turning green as they run, and when it reaches `human-approval` the
chat itself stops and waits — the pause travels all the way out to the caller.

Then try asking in plain language: *"submit a team dinner for 4 people in Chicago, $180,
for emp-002."* The agent will most likely ignore the workflow and do it with its own
tools, because nothing in its instructions says otherwise. Handing an agent a fixed
process does not make it follow one. If you want the process every time, say so in the
instructions — or don't expose the shortcut tools at all.

There is a second-order version of the same problem. Once you have told it to use the
workflow, a claim that breaches a policy limit will often stop it anyway: it flags the
breach and asks you what to do. That sounds responsible, but it puts the agent in charge
of a decision the `human-approval` step exists to make. The reference agent is told to
submit it regardless and record the breach in the request text, because the approver
decides. Compare your instructions with
[`after/src/mastra/agents/expense-agent.ts`](../after/src/mastra/agents/expense-agent.ts).

**Now submit a receipt instead of typing (5 min).** With the workflow wired up, use
**Add attachment → Add a local file** in the chat composer, attach
[`assets/sample-receipt.png`](assets/sample-receipt.png), and say *"here's my receipt,
submit this expense for emp-002 using the expense workflow."*

No code changes. The chat model already handles images, so the agent reads the receipt,
pulls out the vendor, date, `$180.00 USD` and the guest count, notes that the receipt is
itemised, and feeds all of it into the workflow's free-form `requestText`. The workflow
never knows an image was involved. A good run also flags that $180 across 4 guests is
$45/person against the $30/person internal-meal cap.

This is the demo worth showing someone who is sceptical about all of this: a photo of a
receipt goes in, a routed and policy-checked claim comes out, and it still stops for a
human before anything is approved.

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
