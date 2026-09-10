# test8 — A question, not a claim

The only case with no receipt. It checks the thing that is easy to break and hard to
notice: that the assistant knows when *not* to start the submission process.

**Employee:** none needed
**Receipt:** none — this is a question

## Do this

In the Expense Assistant chat, with nothing attached, send:

```
What can I claim for a hotel in Chicago, and do I need approval?
```

## What a good run looks like

The assistant searches policy, answers, and **does not run the workflow**. Check the tool
calls: you should see the policy search, and no `workflow-expenseWorkflow`. Nothing should
appear in **Workflows → Recent runs**.

The answer should cover the $250/night major-city limit and note that Chicago counts as a
major city, and it should state the approval bands. Every policy claim should carry a
citation in square brackets — `[Business Travel Policy]`, `[Expense Submission & Approval
Policy]` — which is the citations skill doing its job rather than the instructions.

An answer with no citations means the skill did not fire. An answer that cites a document
that does not exist is worse, and worth looking for.

## What it teaches

The same agent, the same tools, and a completely different path — chosen by the model from
the wording of the request. That is the whole distinction between an agent and a workflow,
visible in one exchange: this question and [test1](../test1/) go to the same place and come
out differently, and nobody wrote an `if`.

It is also the case that catches over-correction. Telling an agent "always use the workflow
to submit" is easy to write in a way that makes it run the workflow for everything,
including questions. If a claim shows up in Recent runs after this prompt, that is what
happened, and the fix is in the instructions rather than the code.
