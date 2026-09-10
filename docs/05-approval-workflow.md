# 05 — Approval workflow

**Time: 15 minutes. Concept: Workflow.**

## Goal

Build a fixed four-step process that submits a claim and then pauses, possibly for days,
until a human approves it.

## Why not just use the agent?

Your agent can already submit a claim. So why write a workflow?

Because "submit an expense" is a business process, and business processes have
requirements an agent cannot meet:

- **The order is not negotiable.** Route for approval *before* submitting, every time.
- **It has to survive a restart.** A claim waiting on a manager cannot depend on a chat
  session staying open.
- **It has to be auditable.** You need to show which steps ran, with which data.

A workflow gives you all three. Each step has a typed input and output, the sequence is
written down, and `suspend()` saves the whole run to storage so it can resume later.

**The design worth noticing:** step 1 calls the agent, because turning "team dinner with
4 people in Chicago, $180 total" into structured fields needs judgment. Steps 2 to 4 are
plain code. Use the model for the part that needs a model, and nothing else.

## The four steps

| # | Step | What it does |
| - | ---- | ------------ |
| 1 | `draft-claim` | Agent turns free text into a structured claim |
| 2 | `route-for-approval` | Calls your approval function directly |
| 3 | `submit-claim` | Creates the claim via the expense MCP service |
| 4 | `human-approval` | Suspends; on resume, records the decision via MCP |

Build these four. If you look at `after/` you will find a fifth, `review-claim`, sitting
between submit and approval — that comes from a [stage 06
extension](06-validate-and-extend.md#extensions) and is not part of this stage, so expect
it to show up when you diff the two projects later.

## Prompt

```
Submitting an expense needs to be a fixed process, not something the assistant
improvises differently each time. Build one called expense-workflow. It starts from an
employee id and whatever the employee typed — something like "team dinner with 4 people
in Chicago, $180 total" — and always runs the same four steps, named draft-claim,
route-for-approval, submit-claim and human-approval:

1. Turn what they typed into a proper claim: amount, currency, category, description,
   and a note of any policy limits or receipt requirements that apply. This is the one
   step that genuinely needs judgement, so have the assistant do it.

2. Work out who has to approve it, using the approval calculation directly. Don't route
   this through the assistant — it's arithmetic, and it has to come out the same every
   time.

3. Create the claim. Anything auto-approved goes in as approved; everything else as
   pending approval. The expense submission service is the system of record for claims,
   so it does the writing, not us.

4. Stop and wait for a human. An approver accepts or rejects it and can leave a note,
   and whatever they decide gets recorded against the claim through that same service.

Step 4 might be waiting for days, so a run in progress has to survive the server being
restarted.
```

That prompt insists the expense service does the writing for a reason. Going straight to
the database is the shortest path from A to B, and it is exactly the shortcut you do not
want.

## What should change

- new: a workflow file under `before/src/mastra/workflows/`
- edited: `before/src/mastra/index.ts` — a `workflows:` entry

## Read the diff

1. **No direct database access.** Search the file for `drizzle`, `expenseDb`, and
   `createClient`. All three should be absent: steps 3 and 4 should go through the
   expense service helper you got in stage 03. If they don't, say: "step 3 writes to the
   database directly, but the expense submission service owns that data — go through the
   service instead."
2. **Step 2 does not call the agent.** It should import the plain function. Routing a
   deterministic calculation through an LLM is slower, costs money, and can vary.
3. **The suspend is conditional.** The pattern is: if there is no `resumeData`, call
   `suspend(...)`; otherwise carry on and record the decision. A step that always
   suspends never finishes.
4. **Each step's `inputSchema` matches the previous step's `outputSchema`.** This is what
   makes the chain typecheck. If Cursor duplicated field lists, ask it to build each
   schema by extending the previous one.

Run `npm run typecheck` before touching Studio. Schema mismatches surface there far more
clearly than in a stack trace.

## Check in Studio

Restart the dev server, open **Workflows → expense-workflow**, and run it with
([screenshots](studio-walkthrough.md#stage-05--the-workflow-pauses)):

```
employeeId:  emp-002
requestText: Team dinner with 4 people in Chicago, $180 total
```

Watch it go through the first three steps and then stop. The run status is **suspended**,
and `human-approval` is waiting for input. Notice:

- The drafted claim came out as category `meals`, with no category list in your prompt.
- `policyNotes` flags the $30/person cap on internal team meals. The agent found that on
  its own. Some runs go further and draft the amount as the reimbursable `150` rather
  than the `180` charged; either is fine, and the difference is worth discussing.
- `approvers` comes from your tool, not from the model: `["manager"]` for amounts between
  $50 and $500.

Now the part that makes this a workflow rather than a script: **stop the dev server and
start it again.** Go back to the run. It is still suspended, exactly where it was. The
snapshot is in storage.

Resume it with `approved: true` and a note. The run completes, and the claim's status
changes. Confirm through
**MCP Servers → expenseTool → `getExpenseStatus`** with the `expenseId` from the
result.

Then try a fresh run and reject it, to see the other branch.

## If it went wrong

**The run never suspends.** Step 4 returns instead of calling `suspend()`, or `resumeData`
is being treated as always present. The check is "if I have no `resumeData`, suspend".

**It suspends but will not resume.** The step id you resume with must match the step's
`id`. Studio's resume form handles this for you; hand-written resume calls often don't.

**Typecheck errors between steps.** Almost always a field that step N returns but step
N+1's `inputSchema` does not declare. Paste the error to Cursor; these are mechanical.

**The claim exists twice.** The workflow submitted it *and* the agent submitted it during
drafting. Step 1's prompt must ask the agent to *fill in the claim*, not to submit it.

## Two registries, not one

Worth pausing on, because it catches people out. Your workflow is registered in
`src/mastra/index.ts`, so Studio lists it under **Workflows** and you can run it there.
That is not the same as your agent being able to use it. Ask the assistant in chat to run
the workflow and it cannot: an agent only sees what is in its own `tools`, `skills`, and
`workflows` config.

So there are two separate questions, and it is easy to assume the first answers the second:

| Question | Answered by |
| -------- | ----------- |
| Can I see and run it in Studio? | Registered in `src/mastra/index.ts` |
| Can the agent use it? | Listed in that agent's own config |

Stage 06 has an extension that closes the gap, and it is more interesting than it sounds.

## Checkpoint

You have now built all five concepts and seen the division of labour: the agent decides,
the workflow enforces, tools compute, MCP connects, and the skill constrains.

Next: [06 — Validate and extend](06-validate-and-extend.md)
