# test3 — Gift cards, which are never reimbursable

Every other case in this folder is about a limit. This one is about a prohibition, and the
difference matters.

**Employee:** `emp-004` (Katherine Johnson, Sales, USD)
**Receipt:** [`receipt.png`](receipt.png) — Northgate Mall gift card desk, 04 Sep 2026, 2 × $25 gift cards, $50.00

## Do this

Attach the receipt and send:

```
Please submit this for emp-004 — I bought a couple of gift cards as a thank-you for a
client contact.
```

## What a good run looks like

The claim goes in around $50.00 USD, categorised as a client gift, and routes to
**manager** because $50 is exactly where auto-approval stops.

The reviewer should **reject** it, and this is the most stable verdict in the whole folder.
The Client Gifts & Promotional Items Policy says cash and cash equivalents, including gift
cards, are never reimbursable. Look for the reviewer saying so *categorically* — that no
amount of approval or business justification makes it payable — rather than treating it as
a cap that a manager could sign off.

## What it teaches

Policy has two shapes, and an agent that flattens them is dangerous in a specific way.

Most rules here are thresholds: $30/person, $75/day, $500/year. Go over one and the answer
is "someone more senior decides." A prohibition does not work like that — there is nobody
to escalate to, because the answer is no. An assistant that reports "gift cards are over
the limit, routing to your manager" has technically found a rule and still given advice
that would get the claim paid.

Notice too that the deterministic tool is no help here. `calculateApprovalRoute` sees
`$50` and correctly says "manager approval, receipt required." It knows nothing about what
was bought, because it only takes an amount. Whether something is reimbursable *at all*
lives in the policy text, which is why the retrieval half of this system exists.
