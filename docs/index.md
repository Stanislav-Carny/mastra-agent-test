---
title: Quickstart
---

# Quickstart: from before to after

A self-service path through the workshop. No git required. If you want the full
guided, stage-by-stage version instead, go straight to the
[workshop start page](README.md).

## 1. Download and unzip the repo

Go to [github.com/Stanislav-Carny/mastra-agent-test](https://github.com/Stanislav-Carny/mastra-agent-test),
click **Code → Download ZIP**, then unzip it to your desktop.

## 2. Open the repo in Cursor, in the `before` folder

Open Cursor, then **File → Open Folder** and pick the `before/` folder inside the
unzipped repo. That folder is your workspace — see
[`before/README.md`](https://github.com/Stanislav-Carny/mastra-agent-test/blob/main/before/README.md)
for what is already in it.

## 3. Create your `.env` file

Copy `.env.example` to `.env` inside `before/` (and do the same inside `after/` if you
want to compare against the finished solution later). Fill in your Anthropic API key
(chat model) and OpenAI API key (embeddings) — see
[00 Setup](00-setup.md) for exactly which variables are required.

## 4. Check the chatbot works with your Anthropic credentials

```bash
npm run setup     # from the repo root: installs deps, builds mock databases
npm run verify     # from before/: should be all PASS
npm run dev        # from before/: starts Mastra Studio at http://localhost:4111
```

In Studio, open `setupCheckAgent` and send it a message. A reply means your Anthropic
key works. Delete that agent once you have your own working — it is a throwaway.

## 5. Review the MCP servers, tools, and skills you were given

Before building anything, look at what already exists in `before/`:

| Already there | Where |
| -------------- | ----- |
| Employee Directory MCP server (`getEmployee`, `listEmployees`) | `src/mcp-servers/` |
| Policy Knowledge Base MCP server (`searchExpensePolicy`) | `src/mcp-servers/` |
| Expense Submission MCP server (`submitExpense`, `getExpenseStatus`, `listExpenses`, `updateExpenseStatus`) | `src/mcp-servers/` |
| Mock data and DB helpers | `src/mock-data/`, `src/db/` |

Treat all of it as an existing system you are integrating with, not code to change. Open
Studio's **MCP Servers** tab and confirm you can see all three and call at least one tool
from each.

## 6. Start building the workflow

Once the pieces above are wired up (tool, MCP client, skill, agent — stages
[02](02-build-the-tool.md)–[04](04-agent-and-skill.md) if you want the guided prompts),
pick a workflow to build. In order of recommendation:

1. **Expense approval workflow** (start here) — draft the claim, call
   `calculateApprovalRoute` to work out who signs off, `submitExpense`, then **suspend**
   the workflow and wait for a human approval before resuming. This is the workflow this
   workshop is built around; the full walkthrough is
   [05 Approval workflow](05-approval-workflow.md).
2. **Escalation workflow** (stretch) — same shape, but branch on claim amount: above a
   threshold, route through the manager *and then* finance, as two separate
   suspend/resume steps instead of one.
3. **Compliance audit workflow** (different shape, no agent involved) — pull
   `listExpenses`, check each one against `searchExpensePolicy`, collect anomalies into a
   report, then suspend once for a human to sign off before closing the batch. Good for
   seeing what a workflow looks like *without* an LLM step in it.

Whichever you pick, the pattern to hold onto is: a workflow is a **fixed** sequence you
write down, and the interesting part is almost always the pause-and-resume for a human
decision — not the happy path.

Stuck at any step? [Troubleshooting](troubleshooting.md) · compare against
[`after/`](https://github.com/Stanislav-Carny/mastra-agent-test/blob/main/after/README.md).
