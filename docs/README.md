# Vibe-coding agents with Cursor and Mastra

A 90-minute, hands-on workshop. You will build an expense assistant by describing what
you want to Cursor, then checking the result in a visual interface called Mastra Studio.

**You do not need to know TypeScript.** You will read code, judge whether it does what
you asked, and prompt for changes. That is the skill this workshop is about.

## The five ideas

Everything you build is one of five things. Here they are in plain language, using the
expense assistant as the example.

| Idea | What it really is | In this project |
| ---- | ----------------- | --------------- |
| **Tool** | A function the AI can choose to run. Deterministic: same input, same output. | `calculateApprovalRoute` works out who must approve a claim |
| **MCP** | A standard way to offer tools *across process boundaries*, so tools can live in someone else's service | Three separate mock services: employee directory, policy knowledge base, expense submission |
| **Agent** | An LLM with instructions and tools that **decides** what to do and in what order | The Expense Assistant picks which lookups to make for each question |
| **Workflow** | A **fixed** sequence of steps you wrote down, which can pause and resume | Draft → route → submit → wait for a human approval |
| **Skill** | A block of instructions the agent loads *only when relevant*, to keep the system prompt small | "Always cite the policy document you got this from" |

Two distinctions worth getting right, because both trip people up:

**Tool vs MCP.** A tool is *what* the capability is. MCP is *how* it gets delivered. A
local tool lives in your codebase. An MCP tool lives in another process and arrives over
a protocol. To the agent, they look identical: both are just callable tools.

**Agent vs Workflow.** An agent decides; a workflow is decided in advance. Use an agent
when the right sequence depends on the question. Use a workflow when the sequence is
fixed and you need it auditable, repeatable, and pausable. Real systems use both, and
this project does too: the workflow calls the agent for the one step that needs judgment.

**Two things named "skill".** The `mastra` skill in `.agents/skills/` teaches *Cursor*
how to write current Mastra code. The skill you build in stage 04 teaches *your agent*
how to answer policy questions. Same word, different audience.

## Agenda

| Time | Stage | You build |
| ---- | ----- | --------- |
| — | [00 Setup](00-setup.md) | Before you arrive |
| 0:00 | [01 Explore the kit](01-explore-the-kit.md) | Nothing: look at what you were given |
| 0:15 | [02 Build the tool](02-build-the-tool.md) | A local tool |
| 0:30 | [03 Connect MCP](03-connect-mcp.md) | The MCP client |
| 0:45 | [04 Agent and skill](04-agent-and-skill.md) | A skill and an agent |
| 1:10 | [05 Approval workflow](05-approval-workflow.md) | A workflow with a human pause |
| 1:25 | [06 Validate and extend](06-validate-and-extend.md) | Whatever you want |

Facilitators: see the [facilitator guide](facilitator-guide.md).

## What you are building

An assistant that helps employees submit expense claims. It has to answer questions like
"what is the meal limit in London?" and "who approves a $640 laptop?", then actually
submit the claim, then wait for a manager to approve it.

Three mock services already exist and are running for you, each with its own SQLite
database. Treat them as systems another team owns:

| Service | Tools | Data |
| ------- | ----- | ---- |
| Employee Directory | `getEmployee`, `listEmployees` | 100 employees across 8 departments |
| Policy Knowledge Base | `searchExpensePolicy` | 11 policy documents, vector-indexed |
| Expense Submission | `submitExpense`, `getExpenseStatus`, `listExpenses`, `updateExpenseStatus` | 150 historical claims |

You work in [`before/`](../before/README.md). The finished version is in
[`after/`](../after/README.md) if you get stuck or want to compare.

## How each stage works

Every stage follows the same shape:

1. **Goal** — one sentence on what you are adding and why
2. **Prompt** — a prompt to paste into Cursor, written the way you would brief a
   colleague. Change it if you want; that is the point
3. **What should change** — roughly the files to expect, so you can spot a wrong turn
   early. Cursor names them, so yours will vary a little
4. **Read the diff** — what to actually look at in the generated code
5. **Check in Studio** — prove it works in the browser, not just in the editor
6. **If it went wrong** — the usual failure and how to recover

Do not skip step 5. The whole reason this workshop uses Mastra is that you can *see* what
the agent did: which tools it called, in what order, and what came back.

If you would rather see than read, the [Studio walkthrough](studio-walkthrough.md) is
every one of those checkpoints as a screenshot, with what to look for in each.

## Working with Cursor effectively

A few things that matter more than prompt wording:

- **Describe the outcome, not the implementation.** The prompts in these stages say what
  the business needs and which rules apply. They deliberately do not name files,
  functions, or Mastra APIs — you are not expected to know any of that, and saying it
  wrong is worse than not saying it.
- **Keep `AGENTS.md` in context.** [`before/AGENTS.md`](../before/AGENTS.md) tells Cursor
  the project's rules: where things get registered, which directories are off limits,
  which model to use. It is loaded automatically, and it is why you can leave all of that
  out of your prompt and still get code that fits the project.
- **Let it load the `mastra` skill.** Mastra's API changes often enough that a model's
  memory of it is usually wrong. The skill points Cursor at the docs bundled in
  `node_modules`, which match your installed version exactly.
- **Read before you accept.** You are not checking whether the code compiles, you are
  checking whether it does the thing you asked. Those are different.
- **Prompt in small steps.** "Build me an expense system" produces something you cannot
  evaluate. One concept at a time produces something you can.
- **When it is wrong, say what is wrong, not "fix it".** "The tool writes to the database
  directly, but it should call the MCP service" gets a good result. "Doesn't work" does not.

## Reference

- [Studio walkthrough](studio-walkthrough.md) — every checkpoint, in screenshots
  ([printable PDF](mastra-studio-walkthrough.pdf))
- [Troubleshooting](troubleshooting.md)
- [Facilitator guide](facilitator-guide.md)
- [Mastra documentation](https://mastra.ai/llms.txt)
