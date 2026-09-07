# test2 — A compliant client dinner

The happy path, and the control for every other case. If the reviewer cannot approve this
one, it is too strict to be useful.

**Employee:** `emp-004` (Katherine Johnson, Sales, USD)
**Receipt:** [`receipt.png`](receipt.png) — Bistro Nord, Boston, 02 Sep 2026, 3 covers, $96.00, marked no alcohol

## Do this

Attach the receipt and send:

```
Please submit this client dinner for emp-004. Attendees were me, Dana Silva and Tomas
Reyes from Meridian Logistics, and the purpose was a contract renewal discussion. There
was no alcohol.
```

## What a good run looks like

The claim goes in at $96.00 USD as client entertainment, routed to **manager** only.

The reviewer should **approve** it, and its reasoning should touch the things that make
this claim clean: the attendees and business purpose are on the record, which client
entertainment requires; there is no alcohol, so the $100/event alcohol limit is not in
play; the $75/day travel meal cap does not apply because this is entertainment rather than
a solo travel meal; and five days from dinner to submission is well inside the 30-day
window.

Expect it to note that the approver should still eyeball the itemised receipt. That is a
note, not a blocker — it should not withhold a recommendation over something the person
reading it is holding.

## What it teaches

Two things. The documentation requirement for client entertainment is not about money — the
same $96 with no attendees named would land differently, which is roughly what
[test9](../test9/) and the thinner cases show.

And a reviewer that only ever objects is noise. The value of the second agent depends on it
being able to say "this is fine" plainly, so that when it does object you have a reason to
read carefully.
