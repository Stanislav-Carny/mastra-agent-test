# Facilitator guide

## The one-line version

Participants use Cursor to build an expense assistant, checking each piece in Mastra
Studio as they go. Five concepts, five stages, 90 minutes.

## What actually makes this work

**Studio is the point.** Anyone can generate plausible agent code. The skill being taught
is telling whether it does what you asked. Every stage ends with "open Studio and look at
the tool calls" for that reason. Push people back to the browser whenever they start
reading generated code line by line.

**The concepts are the deliverable, not the app.** Nobody needs an expense assistant.
They need to know when to reach for a workflow instead of an agent. Protect the
discussion time in stages 04 and 05.

**Ambiguity is a feature.** People will prompt differently and get different code. That is
worth calling out explicitly at the start, otherwise the first person whose file looks
different from their neighbour's assumes they broke something.

## Before the day

- [ ] Send the [setup guide](00-setup.md) at least 48 hours ahead. Say clearly that setup
      during the session means missing a third of it.
- [ ] Get the API keys ready. Anthropic for chat, OpenAI for embeddings. If you are behind
      a gateway, hand out both base URLs and warn that the Anthropic one needs `/v1`.
- [ ] Confirm the model id is allow-listed on your gateway. Default is
      `anthropic/claude-sonnet-4-6`; change it in `after/` and in the stage 04 prompt if
      yours differs.
- [ ] Run the whole workshop yourself once on a clean clone.
- [ ] Have `after/` running on your machine, ready to demo. If the live demo fails, the
      [Studio walkthrough](studio-walkthrough.md) is the same sequence of screens as
      screenshots, in stage order.
- [ ] Consider printing the
      [walkthrough handout](mastra-studio-walkthrough.pdf) (13 pages) for the room. People
      debug faster when they can compare their screen against paper instead of tabbing away
      from the thing they are debugging.

**Testing on a clean clone:**

```bash
git clone <repo-url> /tmp/workshop-test && cd /tmp/workshop-test
npm run setup          # will report missing keys
# add keys to before/.env and after/.env
npm run setup && npm run verify && npm run verify:after
npm run typecheck
```

**Proving the demo works, not just the setup.** `verify` checks credentials, databases and
MCP; it does not exercise the agent. To check the thing you are actually going to demo, run
the end-to-end script against a running `after/`:

```bash
npm run dev:after      # in one terminal
npm run e2e            # in another, takes about a minute
```

It attaches the sample receipt in chat, waits for the agent to read it and start the
workflow, then approves the claim and confirms the run completes. Every step is
screenshotted into `reports/<timestamp>/`, which is gitignored, with a `report.md`
summarising what passed. A failed step leaves you a picture of the screen at the moment it
broke, which is usually enough to see what changed.

Two caveats. The run submits a claim for `emp-002`, so follow it with `npm run db:reset:after`
to restore the seeded fixture. And the agent's choices come from a model, so an occasional
step can fail on one run and pass on the next — read a failure as "look at this", not
"the workshop is broken".

## Run of show

| Time | Minutes | What |
| ---- | ------- | ---- |
| 0:00 | 10 | **Framing + demo.** Five concepts, then demo `after/` live |
| 0:10 | 10 | **Stage 01.** Explore the kit. Everyone gets Studio running on `before/` |
| 0:20 | 15 | **Stage 02.** Build the tool |
| 0:35 | 15 | **Stage 03.** Connect MCP |
| 0:50 | 20 | **Stage 04.** Agent and skill |
| 1:10 | 15 | **Stage 05.** Approval workflow |
| 1:25 | 5 | **Wrap-up.** The decision rules, and where to go next |

Stage 06 is take-home unless you are running long on time to spare.

### 0:00 Framing and demo (10 min)

Do not lecture the five concepts. Demo them.

Open `after/` in Studio and ask the agent:
`Who has to approve a $640 equipment claim for emp-002?`

Expand the trace and narrate: "It looked up the employee — that is **MCP**, another
service. It searched policy — also MCP, but a vector index. It called
`calculateApprovalRoute` — that is a local **tool**, deterministic. It cited the policy
document — that is a **skill** telling it to. And it chose that order itself, because it
is an **agent**."

Then run the workflow, let it suspend, and say: "Same capabilities, fixed order, and it
stops for a human. That is a **workflow**."

Two minutes of demo lands better than ten minutes of slides.

### 0:10 Stage 01 (10 min)

The goal is that everyone sees how **empty** `before/` Studio is, right after your demo of
the finished thing. One agent, nothing else. Make the point explicitly: the three services
exist on disk and `npm run verify` proves they answer, but Studio cannot see them because
nothing has registered them. That is the sidebar they are about to fill.

Say the write-path rule out loud: the expense MCP service is the only writer of
`expenses.db`. It pays off in stage 05.

### 0:20 Stage 02 (15 min)

Should be quick. The teaching moment is the boundary at exactly $50 — ask the room what
their tool returns for it before they test. Some will be wrong, which makes the point
about determinism better than any explanation.

### 0:35 Stage 03 (15 min)

This is where the MCP Servers tab finally fills up, and where everyone should call a tool
by hand before any agent exists. Circulate and make sure people actually do it rather than
just seeing the three services appear.

It is also the hardest stage to debug, and the failures are boring path problems. Watch
for:

- relative paths or `process.cwd()` instead of `projectRoot`
- server keys that are not `employee` / `policy` / `expenseTool`, which breaks later stages
- the policy server timing out on first connect

If someone is stuck past 10 minutes, have them copy `after/src/mastra/mcp/` and move on.
Losing stage 04 to a path bug is a bad trade.

### 0:50 Stage 04 (20 min)

The heart of it. Budget the full 20.

Two things to draw out with the room:

1. **Order.** Ask two people to read out the tool sequence from their $640 trace. They
   will differ. "You both specified capabilities, not procedure. That is what an agent is."
2. **Citations.** Have someone remove the skill and re-ask the policy question. The answer
   is still fluent and still roughly right, but unverifiable. That contrast is the
   argument for skills.

### 1:10 Stage 05 (15 min)

The demo that lands: after the run suspends, tell everyone to **kill the dev server and
restart it**. The run is still there, still suspended. Durability is the reason workflows
exist, and it is much more convincing seen than described.

Watch for Cursor writing to `expenses.db` directly in step 3. If it happens to someone,
show it to the room — a generated shortcut that compiles, runs, passes a smoke test, and
is still wrong is exactly the kind of thing they need to learn to catch.

### 1:25 Wrap-up (5 min)

Run through the decision rules in
[06 — Validate and extend](06-validate-and-extend.md#what-to-take-away). Point at
stage 06 for extensions and send people home.

## Known failure modes

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `403 Forbidden` from Anthropic | Base URL missing `/v1`, or model not allow-listed | Add `/v1`; try another model id |
| "Items are not persisted" | Someone switched to an `openai/*` chat model on a ZDR account | Switch back to Anthropic |
| MCP "Connection closed" | Relative script paths | Use `projectRoot` from `src/db/paths.ts` |
| Policy server timeout | Vector index building on first start | `npm run db:setup` up front |
| Agent missing from Studio | Not registered | `src/mastra/index.ts`, then restart |
| Port 4111 in use | Two dev servers | Run one project at a time |
| Slow or failing model calls | Rate limits with a room on one key | Have a second key ready |

Full list: [troubleshooting.md](troubleshooting.md).

## Recovery

Anyone who falls behind can copy the relevant piece from `after/src/mastra/` and continue.
Say this at the start so nobody suffers in silence. Understanding stage 05 matters more
than having personally typed stage 03.

Full reset for one participant:

```bash
cd <repo root>
rm -rf before/node_modules after/node_modules
npm run setup && npm run verify
```

`.env` files survive it.

## If you have more time

- **2 hours:** Run stage 06 live and have people demo their extensions.
- **Half day:** Add evals and scorers, then have pairs review each other's agent
  instructions. Reading someone else's prompt is the fastest way to learn prompt design.

## If the room is more junior

Cut stage 05 to a demo you run yourself. Spend the recovered 15 minutes on stage 04,
particularly on reading traces. Understanding what an agent actually did is the most
transferable thing in the session.
