# test7 — The same dinner, submitted twice

**Run [test1](../test1/) first.** This case is that claim again, and without the first one
in history there is nothing here to find.

**Employee:** `emp-002` (Grace Hopper, Engineering, USD)
**Receipt:** [`receipt.png`](receipt.png) — identical to test1's, deliberately

## Do this

With test1 already submitted, attach this receipt and send exactly the same words again:

```
Here's my receipt for a team dinner. Please submit it for emp-002.
```

## What a good run looks like

The assistant behaves the same way it did the first time. It reads the receipt, checks
policy, flags the $30/person cap, and submits — because as far as it is concerned this is a
new request, and nothing in its instructions tells it to go looking through history.

The reviewer catches it. Expect it to name the earlier claim by its expense id, note it was
submitted minutes earlier and is also pending, and say the approver must establish which of
the two is real before either is paid. It should also treat the duplicate as the *primary*
issue and the cap breach as secondary, which is the right ordering: there is no point
arguing about $60 over the cap on a claim that may not exist.

## What it teaches

This is the clearest case for the second agent existing at all, because it is a capability
rather than an opinion. The assistant never calls `listExpenses`; the reviewer always does.
One of them can see history and the other cannot, and no amount of prompt tuning changes
that.

It is also the cheapest fraud control in the system, and it came almost free — the tool
already existed for answering "show me my claims," and the reviewer just uses it for a
different purpose.

## Worth trying next

The duplicate check is currently prose judgment by a model. Ask yourself whether it should
be: "same employee, same amount, same date, still pending" is a database query with a
definite answer. Turning it into a tool the reviewer calls would make it deterministic and
auditable, and would stop it depending on how much history fits in the context window. That
is the fourth candidate in the [stage 06
list](../../docs/06-validate-and-extend.md#extensions) — rejected as an agent, and useful
as a tool.
