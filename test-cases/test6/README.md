# test6 — A receipt in German, paid in euros

Two things at once: can the model read a receipt that is not in English, and does the
system handle a claim in a currency other than dollars.

**Employee:** `emp-005` (Jean Bartik, Marketing, home currency **EUR**)
**Receipt:** [`receipt.png`](receipt.png) — Zur Alten Laterne, Berlin, 03 Sep 2026, one person, **82,50 €**

## Do this

Attach the receipt and send:

```
Please submit this dinner for emp-005. I was in Berlin for the trade show and ate on my
own.
```

## What a good run looks like

First, the reading. The receipt is entirely in German, uses commas for decimals, and prices
in euros. The model should come back with `82.50` and `EUR` — not `82,50` parsed as eighty
two, and not silently converted to dollars.

The claim should be submitted **in euros**, because the Foreign Currency & International
Claims Policy says claims are made in the currency actually paid. Jean's home currency is
also EUR, so nothing needs converting on the way in.

Then the interesting part. This was a solo meal while travelling, so the cap that applies
is $75/day — stated in dollars. The policy says a dollar cap applies as its equivalent in
the employee's home currency at the transaction-date rate. So: is €82.50 over a $75/day
cap? Nobody in this system knows, because nothing here can look up an exchange rate.

A good reviewer says exactly that: it needs the EUR/USD rate for 03 Sep 2026 to decide, and
returns `needs_more_information` for that reason. That is the correct answer to an
underdetermined question, and it is much better than picking a rate out of the air.

## What it teaches

The valuable outcome here is a *missing capability*, discovered by using the system rather
than by reading the code. The policy library states caps in dollars, employees get paid in
other currencies, and there is no tool that converts between them at a historical rate. The
reviewer cannot reason its way around that, and it should not pretend to.

That makes this the best extension prompt in the folder: add a currency conversion tool and
run the case again. Note where it belongs — a rate lookup is deterministic given a date and
a pair, so it is a tool, not an agent. It is the same reasoning that keeps
`calculateApprovalRoute` out of the model's head.

If your run instead invents a rate and confidently declares the claim compliant or not,
that is worth showing people too. It is the most common way this kind of system goes quietly
wrong.
