# test4 — A claim submitted months late

Everything about this claim is reasonable except when it arrived.

**Employee:** `emp-007` (Barbara Liskov, Support, USD)
**Receipt:** [`receipt.png`](receipt.png) — Harbor Suites, Portland ME, 16–18 Apr 2026, 2 nights, $210.00

## Do this

Attach the receipt and send:

```
Sorry, I forgot about this one. Please submit this hotel stay for emp-007.
```

## What a good run looks like

The claim goes in at $210.00 USD as lodging, routed to **manager**.

On the money, it is fine: $95/night is comfortably under the $250/night major-city limit,
and the amount sits in the manager-only band. So the only thing wrong with it is the date,
which is the point.

The reviewer should notice the gap between the April checkout and today's submission —
around 142 days — and flag it against the 30-day window in the Expense Submission &
Approval Policy. Expect either `reject` or `needs_more_information`; it varies on whether
the model treats a late claim as fatal or as something an approver can grant an exception
for. Both are a pass. Missing the date entirely is not.

## What it teaches

The claim's numbers are all compliant, so nothing in the arithmetic path can catch this.
`calculateApprovalRoute` takes an amount and a currency; it has no idea what day it is.
The rule that this claim breaks is a *date* rule, and it is only enforceable because
someone reads the receipt, compares it to the submission date, and knows the policy.

If you want to see how thin the ice is, note what the receipt does and does not say. It
shows a checkout date and a card payment date. Change either and the whole judgment
changes, and no schema validates it.
