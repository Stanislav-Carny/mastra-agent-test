# test1 — A team dinner over the per-person cap

The flagship case. It is the one to show someone who is sceptical, and the one the stage 06
extension is built around.

**Employee:** `emp-002` (Grace Hopper, Engineering, USD)
**Receipt:** [`receipt.png`](receipt.png) — The Gage, Chicago, 14 Aug 2026, 4 guests, $180.00

## Do this

Attach the receipt in the Expense Assistant chat and send:

```
Here's my receipt for a team dinner. Please submit it for emp-002.
```

## What a good run looks like

The assistant reads the receipt without you typing anything — vendor, date, $180.00, four
guests — then looks up the employee, searches policy, and calls `calculateApprovalRoute`.

It should work out that internal team meals are capped at $30/person, so four guests means
a $120 ceiling and this claim is $60 over. **Then it should submit it anyway**, saying
clearly what the claim breaches.

That last part is deliberate and it is worth pausing on. An assistant that refuses to
submit an over-cap claim feels responsible, but it has quietly taken over the decision the
`human-approval` step exists to make. If yours stops and asks you what to do, compare your
instructions with
[`after/src/mastra/agents/expense-agent.ts`](../../after/src/mastra/agents/expense-agent.ts).

The claim routes to **manager** only, because $180 sits in the $50–$500 band.

Then the reviewer, which did not draft this claim, reaches its own conclusion and does
**not** approve it. Which of the two it picks moves between runs: `reject` when it weighs
the overage as decisive, `needs_more_information` when it wants a business justification
for the higher spend on record first. Either is a pass. A clean `approve` is not.

## What it teaches

The two agents disagree about the same claim, and both are behaving correctly. The
assistant works for the claimant and its job is a well-formed submission; the reviewer works
for finance and asks whether the company should pay. Neither of them decides — the human
does, now holding a recommendation instead of raw fields.

## Note

This is also the claim [test7](../test7/) submits a second time, so run this one first if
you want to see duplicate detection.
