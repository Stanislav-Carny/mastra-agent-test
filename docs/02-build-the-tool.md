# 02 — Build the tool

**Time: 15 minutes. Concept: Tool.**

## Goal

Write one deterministic function the agent can call, and register it. This is the
smallest possible unit of agent capability, and the easiest to get right, so we start here.

## Why this belongs in code

The submission policy says:

> Claims are auto-approved under $50; claims between $50 and $500 require manager
> approval; claims over $500 require both manager and finance approval. Every claim
> requires an itemized receipt for amounts over $25.

You could let the model read that passage and work out the answer. Don't. Models are
inconsistent at boundary arithmetic, and "is $500 over $500?" is exactly the kind of
question where a plausible wrong answer costs someone money.

The rule of thumb: **if the answer must be identical every time, it belongs in a tool.**
Retrieval for the prose, code for the arithmetic.

## Prompt

Paste this into Cursor, with `before/` open:

```
I need the expense assistant to work out who has to approve a claim. It has to give
the same answer every single time, so this should be real code, not something the
model reasons about in the moment. Call it calculateApprovalRoute.

The rules, from our Expense Submission & Approval Policy:
- under $50 is auto-approved and needs nobody's sign-off
- $50 up to $500 needs the employee's manager
- over $500 needs the manager and finance
- an itemised receipt is required for anything over $25

Give it an amount and a currency, defaulting to US dollars. It should come back with
who needs to approve, whether it was auto-approved, whether a receipt is required, and
a one-line summary I could show to an employee as-is.

Finance revisits these thresholds every year, so keep the numbers somewhere obvious
rather than scattered through the logic. I want to try this out in Mastra Studio on its
own, and later a fixed approval process will need to reuse the same calculation without
going through the assistant.
```

Notice what that prompt does *not* say: no file paths, no function signatures, no
mention of Mastra's API. [`before/AGENTS.md`](../before/AGENTS.md) already tells Cursor
where things live and to load the `mastra` skill before writing any Mastra code. Describe
the outcome and the rules; let the tooling handle the conventions.

## What should change

Cursor chooses the file names, so yours may read slightly differently. The shape is what
matters:

- new: a tool file under `before/src/mastra/tools/`
- edited: `before/src/mastra/index.ts` — a `tools:` entry, which is what makes it show up
  in Studio

If Cursor edited anything in `src/db/`, `src/mcp-servers/`, or `src/mock-data/`, tell it
to revert that. Those are off limits.

## Read the diff

Four things to check, in order of how often they go wrong:

1. **The boundaries.** $50 exactly should require a manager, not auto-approve. $500
   exactly should be manager-only, not finance. `>=` versus `>` is the whole game here.
2. **`description`.** The agent chooses tools by reading descriptions. A vague one means
   the tool never gets called. It should say what the tool does *and* hint when to use it.
3. **`inputSchema` field descriptions.** `.describe(...)` on each field is what the model
   sees when filling in arguments.
4. **The plain function is exported.** You need it in stage 05.

## Check in Studio

Restart `npm run dev` if it is running, then go to **Tools** in the sidebar. Your tool
should be listed as `calculateApprovalRoute`
([screenshot](studio-walkthrough.md#stage-02--your-first-tool)). Run it three times:

| Amount | Expect |
| ------ | ------ |
| `20` | `autoApproved: true`, `receiptRequired: false`, no approvers |
| `50` | `approvers: ["manager"]`, `receiptRequired: true` |
| `640` | `approvers: ["manager", "finance"]`, `receiptRequired: true` |

The middle row is the one that catches off-by-one errors.

## If it went wrong

**The tool is not in Studio.** It is not registered. Open `src/mastra/index.ts` and check
for a `tools:` entry. Restart the dev server; adding a new top-level key does not always
hot-reload.

**$50 auto-approves.** The comparison is `> 50` where it should be `>= 50`. Tell Cursor:
"a claim of exactly $50 must require manager approval, fix the boundary".

**Cursor wrote the thresholds inline instead of as constants.** Minor, but ask it to
extract them. You want the numbers in one obvious place when someone asks "where does
$500 come from?".

## Checkpoint

You have a working tool that gives the same answer every time, and you have seen it run
in Studio without any agent involved. That separation matters: tools are testable on
their own.

Next: [03 — Connect MCP](03-connect-mcp.md)
