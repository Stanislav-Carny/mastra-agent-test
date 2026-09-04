# 03 — Connect MCP

**Time: 15 minutes. Concept: MCP.**

## Goal

Connect to the three mock services so their tools become available to your code, and
surface them in Studio.

## What MCP actually gives you

In stage 02 you wrote a tool and imported it. That works because the tool lives in your
codebase. But the employee directory does not, and in a real company it never would: it
belongs to another team, in another repo, probably in another language.

MCP is the answer to "how does my agent call a tool that lives somewhere else?" A client
starts (or connects to) a server, asks it `tools/list`, and gets back tool names, input
schemas, and descriptions. From then on the agent treats them like any other tool.

The useful consequence: **swapping a local tool for a remote one changes nothing about
how the agent reasons.** Capability and delivery are separate concerns.

Here, each service is started as a subprocess and talks over stdin/stdout. That is the
`stdio` transport. The alternative is HTTP, for services that are already running
somewhere.

## Prompt

```
This project already comes with three services we depend on: an employee directory, a
policy knowledge base, and the expense submission system. Connect to all three, so the
tools they offer are available to whatever I build next and I can see them and try them
out by hand in Mastra Studio.

List them as employee, policy and expenseTool, because the rest of my notes refer to
them by those names.

The policy service builds its search index the first time it starts, which takes a
while, so be generous with the startup timeout.

I'll also want a simple way for my own code to call the expense submission service
later, without every caller needing to know how the connection is set up.
```

The awkward details this leaves out — that the services are subprocesses talking over
stdin/stdout, and that paths must not be built from the working directory — are covered
by [`before/AGENTS.md`](../before/AGENTS.md) and the `mastra` skill. You describe which
systems to connect and what you want to call them; Cursor handles the transport.

## What should change

- new: one or two files under `before/src/mastra/mcp/` — the client that connects to the
  three services, and the helper your later code will call the expense service through
- edited: `before/src/mastra/index.ts` — an `mcpServers:` entry

## Read the diff

1. **Server keys.** They must be `employee`, `policy`, and `expenseTool`. Tool names get
   namespaced as `<serverKey>_<toolName>`, so the agent will see `employee_getEmployee`.
   Later stages assume those exact names.
2. **Paths come from `projectRoot`.** If you see `process.cwd()` or a relative path like
   `./src/mcp-servers/...`, it will break the moment Studio runs from a different
   directory. This is the single most common failure in this stage.
3. **The client is created once, at module level.** Creating a second `MCPClient` with an
   identical config throws, on purpose, to catch a leak. If Cursor created one per call,
   ask it to hoist it.
4. **The proxies are created once too.** `toMCPServerProxies()` should be called in one
   place and shared, not called separately by `index.ts` and the workflow.

## Check in Studio

Restart the dev server. **MCP Servers** in the sidebar is no longer empty: the three
services are listed as **employee**, **policy**, and **expenseTool**, the same keys you
gave them in the client. Confirm the count: **7 tools** total (2 employee, 1 policy,
4 expense). ([Screenshots](studio-walkthrough.md#stage-03--the-three-services).)

Now call some by hand. There is still no agent involved — you are the one choosing the
tool and filling in the arguments.

**expenseTool** → `listExpenses` with `employeeId: emp-002`. Two historical claims come
back, read out of `expenses.db` by a different process.

**policy** → `searchExpensePolicy` with `query: meal limits when travelling`. You get
policy passages ranked by relevance, each tagged with the document it came from. Note the
`title` field; you will use it in stage 04 to make the agent cite its sources.

**employee** → `getEmployee` with `idOrEmail: emp-002`. Grace Hopper's currency is `USD`
and her manager is `emp-001`.

You can also check the wiring from the terminal:

```bash
npm run verify
```

`MCP services respond  7 tools across 3 services` means it is good.

## If it went wrong

**"Connection closed" or a timeout on startup.** Almost always a bad path. Check that
the script paths are absolute and built from `projectRoot`. Run
`npx tsx src/mcp-servers/employee-server.ts` directly: if it exits with an error, the
server itself is broken, not your client.

**The policy server times out on first run.** It embeds the policy documents on first
start, which takes a few seconds and needs `OPENAI_API_KEY`. Run `npm run db:setup` to
build the index up front, then retry.

**Duplicate MCPClient error.** The client is being constructed more than once. It must be
a module-level `export const`, not created inside a function.

## Checkpoint

You now have local tools *and* remote tools available to the same codebase, in the same
shape. The next stage gives an LLM the ability to choose between them.

Next: [04 — Agent and skill](04-agent-and-skill.md)
