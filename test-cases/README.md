# Test cases

Nine scenarios for driving the finished assistant by hand, each with a receipt built to
land on a specific side of a policy rule. Use them to check a build after stage 06, to
rehearse before facilitating, or to see what the agent does when a claim is not
straightforward.

Every folder has a `README.md` and, where the scenario needs one, a `receipt.png`. The
receipts are generated, not photographed, so the numbers are deliberate — `npm run
test:receipts` rebuilds them from
[`scripts/build-test-case-receipts.mjs`](../scripts/build-test-case-receipts.mjs).

## The cases

| Case | Scenario | The rule it tests |
| ---- | -------- | ----------------- |
| [test1](test1/) | $180 team dinner for 4 | Internal team meals capped at $30/person |
| [test2](test2/) | $96 client dinner, fully documented | Client entertainment needs attendees and a business purpose |
| [test3](test3/) | $50 in gift cards | Some things are never reimbursable, at any amount |
| [test4](test4/) | $210 hotel folio from April | Claims must be submitted within 30 days |
| [test5](test5/) | $860 laptop and dock | Over $500 needs finance too, and equipment has its own rules |
| [test6](test6/) | €82.50 dinner, receipt in German | Claim in the currency paid; dollar caps convert |
| [test7](test7/) | The same dinner as test1, again | Nothing catches duplicates except looking at history |
| [test8](test8/) | A question about hotels | Not everything is a submission |
| [test9](test9/) | A receipt with no employee id | Ask rather than guess |

## Running them

Start the reference project and open Studio:

```bash
cd after && npm run dev          # http://localhost:4111
```

Then for each case, go to **Agents → Expense Assistant**, attach the receipt with
**Add attachment → Add a local file**, and send the words in that case's README. The claim
will stop at `human-approval`; finish it from **Workflows → expense-workflow → Recent
runs** if you want to see the whole path.

You can also skip the receipt and run **Workflows → expense-workflow** directly with an
employee id and a description. That tests the workflow and the reviewer but not the reading
of the image, which is usually the part people want to see.

## Three things to know before you trust a result

**Reset between full passes.** Every submission writes a real claim, so a second pass
starts with the first pass already in history — and the reviewer will correctly flag
everything as a duplicate. That is the right behaviour and it will drown out everything
else. Between passes:

```bash
# stop the dev server first: the services hold the database open
npm run db:reset:after && npm run dev --prefix after
```

**Order matters for test7.** It is the same dinner as test1 on purpose, so run test1 first
or there is nothing to duplicate.

**Expect the wording to move, and sometimes the verdict.** These run on a live model. The
finding each case is built around is stable — the cap, the prohibition, the stale date —
but the reviewer's choice between `reject` and `needs_more_information` genuinely varies
between runs on the borderline cases, and each README says where that is likely. Judge
whether it found the right issue, not whether it picked the word you expected.

## What "passing" means

Each README describes what a good run looks like. Broadly, across the nine you should see:

- The receipt read without anyone typing the numbers, including in German.
- The assistant flagging a breach and submitting anyway, because the approver decides.
- The reviewer refusing to wave through test1, test3, test4 and test5, and approving
  test2 and test9.
- Two agents disagreeing about test1, which is the point of having two.
- The workflow untouched by test8 and test9, because neither is a submission yet.
