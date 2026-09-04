# 04 — Agent and skill

**Time: 25 minutes. Concepts: Agent, Skill.**

This is the centre of the workshop. Take the time.

## Goal

Build an agent that decides for itself which of your eight tools to use, and give it a
skill that makes its policy answers trustworthy.

## What makes this an agent

Up to now you have written capabilities. Nothing has *decided* anything. An agent is the
piece that does: an LLM, a set of instructions, and a set of tools, in a loop. You give it
a question; it picks a tool, reads the result, picks another, and eventually answers.

You do not tell it the order. That is the trade: you gain flexibility and lose
predictability. Stage 05 is about getting predictability back where you need it.

## What a skill is for

Your agent needs a rule: *never state a policy limit without citing the document it came
from.* You could put that in the instructions. For one rule that is fine. But instructions
are sent on every single request, so as rules accumulate the prompt bloats and the
important parts get diluted.

A skill is a named block of instructions with a description. The agent reads the
description, and loads the full instructions **only when the task looks relevant**.
Policy-citation rules load for "what is the meal limit?" and stay out of the way for
"list my expenses".

> Not to be confused with the `mastra` skill in `.agents/skills/`, which teaches *Cursor*
> to write correct Mastra code. Same word, different audience: this one teaches your
> *agent* how to behave at runtime.

## Prompt (part 1: the skill)

```
When the assistant answers anything about expense policy — a limit, an approval rule, a
receipt requirement, a deadline — the answer has to be trustworthy enough that an
employee can act on it. So whenever a question is about policy, it must:

- look the answer up in the policy knowledge base instead of answering from memory
- name the policy document it got each answer from, in square brackets right after the
  claim, like "Hotels are capped at $250/night [Business Travel Policy]"
- cite all of them when an answer draws on more than one document
- never state a limit, rule or threshold without saying where it came from
- say plainly that it found nothing relevant, rather than guessing

Package that up as expense-policy-citations: a named behaviour the assistant picks up
only when a question is actually about policy, so it isn't carrying these rules around
for every unrelated request.
```

## Prompt (part 2: the agent)

```
Now build the assistant itself, so employees can chat with it in Mastra Studio. Call it
Expense Assistant, with expense-agent as its identifier, and describe it as helping
employees check expense policy and submit claims.

It should be able to look people up in the directory, search policy, work out approval
routes, and submit claims — so give it everything the three services offer plus the
approval calculation I built earlier, and the citation behaviour from a moment ago.

How I want it to behave:
- check policy before submitting a claim, not after
- when a request doesn't say which currency, take it from the employee's record rather
  than assuming dollars
- never work out approval thresholds in its head; always use the approval calculation
- when it doesn't know which employee a request is for, ask instead of guessing

Suggest a few example questions in Studio so people know what to type. The setup-check
assistant that came with the starter isn't needed any more.
```

## What should change

- new: a skill file under `before/src/mastra/skills/`
- new: an agent file under `before/src/mastra/agents/`
- deleted: `before/src/mastra/agents/setup-check-agent.ts`
- edited: `before/src/mastra/index.ts`

## Read the diff

1. **The tools are spread in, not listed by hand.** You want
   `...(await expenseMcpClient.listTools())`. If Cursor hard-coded seven tool names, the
   agent will silently miss any tool added to a service later.
2. **The agent has a `description`.** Not optional here: Mastra needs it to expose an
   agent through MCP, and it is what other agents would read to decide to delegate to it.
3. **The instructions say what to do, not what to be.** "Always call
   `calculateApprovalRoute` instead of doing the arithmetic yourself" changes behaviour.
   "You are a helpful expense assistant" does not.
4. **The skill's `description` reads as a trigger condition.** The agent uses it to decide
   whether to load the skill, so it should describe *when*, not *what*.

## Check in Studio

Restart the dev server, open **Agents → Expense Assistant**, and work through these. The
point is not the prose in the answer, it is the tool calls underneath. Expand the trace
for each one. ([Screenshots](studio-walkthrough.md#stage-04--the-agent-decides).)

**1. `What is the daily meal limit while travelling?`**

Expect a call to `policy_searchExpensePolicy`, and an answer of $75/day broken into
$25 per meal, **with `[Meals & Entertainment Policy]` cited**. No citation means the skill
is not loading; check its description.

**2. `Who has to approve a $640 equipment claim for emp-002?`**

This is the interesting one. Expect three or four calls: `employee_getEmployee`,
`policy_searchExpensePolicy`, and `calculateApprovalRoute`. You may also see a `skill`
call, which is the agent loading the citation skill.

Read the order it chose. You never specified one. That is the agent doing its job.

Good answers also flag that $640 exceeds the $500/year personal equipment cap. That comes
from the policy search, not the tool.

**3. `Submit a $40 client lunch for emp-002`**

Expect `calculateApprovalRoute` — which reports `autoApproved: true`, since $40 is under
the $50 threshold — and then `expenseTool_submitExpense`. Confirm it landed:
**MCP Servers → expenseTool → `listExpenses`** with `employeeId: emp-002`.

The new claim's status is `submitted`, not `approved`. Nothing has acted on the approval
route yet; the agent only reported it. Turning that route into a recorded decision is
what the workflow in stage 05 is for.

**4. `Show me every expense emp-002 has submitted.`**

Expect a single `expenseTool_listExpenses` call and no policy search. An agent that
searches policy here is over-thinking; tighten the instructions.

## If it went wrong

**No citations.** Either the skill is not in the agent's `skills` array, or its
description does not sound relevant to the question. Make the description explicitly
mention policy, limits, and approval rules.

**The agent does the arithmetic itself.** Its instructions are too soft. Make it an
explicit prohibition: "Never do approval-threshold arithmetic in your head."

**It invents an employee id.** Add "ask for the employee id if you were not given one,
rather than guessing" to the instructions. Worth doing — it is a good demonstration that
instructions are how you control an agent's failure modes.

**Tool calls fail with a schema error.** Check that MCP tools return an object rather than
a bare array. MCP requires structured results to be a record. This only bites if you
edited a server, which you were told not to do.

## Checkpoint

You have an agent that chooses its own path through four capabilities and cites its
sources. Now the opposite problem: what if you need the path to be fixed?

Next: [05 — Approval workflow](05-approval-workflow.md)
