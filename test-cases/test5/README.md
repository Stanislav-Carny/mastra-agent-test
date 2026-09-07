# test5 — Equipment over the yearly cap, from the wrong vendor

The only case that pulls in a second approver, and the one with the most rules stacked on
one claim.

**Employee:** `emp-001` (Ada Lovelace, Engineering, USD)
**Receipt:** [`receipt.png`](receipt.png) — Pixelworks Direct invoice, 01 Sep 2026, laptop and dock, $860.00, paid on a personal card

## Do this

Attach the receipt and send:

```
Please submit this laptop and dock for emp-001. I paid for it myself.
```

## What a good run looks like

The claim goes in at $860.00 USD as equipment, and this is the one case where the approval
route changes shape: over $500 it needs **manager and finance**, not just a manager. Check
that both appear — it is the clearest evidence that the routing tool is being called rather
than guessed at.

The reviewer should stack up several independent problems:

- The Software & Equipment Policy caps personal reimbursement for equipment at $500/year,
  so $860 is $360 over on its own.
- Equipment over $200 needs manager *and IT* approval, and IT is not part of the approval
  route this workflow knows about.
- It must be ordered through the approved vendor list, and "Pixelworks Direct" is an
  unknown online retailer, which the reviewer should call out as unverified rather than
  assume either way.

Expect `needs_more_information` more often than `reject` here, because whether the claim is
payable genuinely depends on facts nobody has: how much of the $500 annual allowance is
already used, and whether IT signed off. That is the honest answer, and it is the right use
of that verdict.

## What it teaches

Approval routing and policy compliance are different questions, and this claim passes one
while failing the other. `calculateApprovalRoute` says "manager and finance, receipt
required" and it is completely correct — and the claim still should not be paid as
submitted. A system that only computed the route would hand a compliant-looking $860 claim
to an approver with no mention of the $500 cap.

It also shows the workflow's edges. The policy wants IT approval; the workflow has no
concept of IT. The reviewer can only report that, not fix it. Worth asking what you would
change — a third approver in the route, or a policy the workflow cannot enforce.
