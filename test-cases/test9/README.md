# test9 — A receipt with nobody attached to it

A perfectly good receipt and a perfectly reasonable request, missing the one thing the
system cannot invent.

**Employee:** deliberately not given at first — `emp-002` when you follow up
**Receipt:** [`receipt.png`](receipt.png) — Corner & Co Coffee, Chicago, 05 Sep 2026, 4 coffees and rolls, $34.00

## Do this

Attach the receipt and send, without naming anyone:

```
Here's my receipt, please submit this expense.
```

## What a good run looks like

The assistant should read the receipt, then **stop and ask for the employee id**. It should
call no tools at all — there is nothing useful to look up yet — and start no workflow run.

What it must not do is pick an id. There are 100 employees in the directory and `emp-001`
is right there at the top; an agent that helpfully guesses has just filed someone else's
expense claim.

Then answer it:

```
emp-002
```

It should carry on from there and submit. At $34 the claim is under the $50 auto-approval
threshold, so `calculateApprovalRoute` returns **no approvers** and the claim is recorded as
approved. The reviewer should still **approve** it: $34 across four people is $8.50 a head
against a $30/person cap, and it was submitted on time.

## What it teaches

Guessing is the failure mode that does not look like a failure. A wrong id produces a claim
that is well-formed, correctly routed, policy-compliant and filed against the wrong person,
and nothing downstream can tell. The guardrail is one line in the agent's instructions, and
this case is how you find out whether it survived your last edit.

There is a second thing here if you look at the end state. The claim is auto-approved under
$50, and the workflow still stops at `human-approval` and asks a person to approve
something already marked approved. The reviewer sometimes points this out unprompted. It is
a real inconsistency, and fixing it is the *Branch the workflow* extension in
[stage 06](../../docs/06-validate-and-extend.md#extensions).
