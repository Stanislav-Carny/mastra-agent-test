/**
 * The company policy library. `npm run db:setup` chunks and embeds these into
 * `src/mock-data/expense-policy.db`, which is what `searchExpensePolicy` searches.
 *
 * Every rule here is meant to be internally consistent, because the agent is expected to
 * combine several documents in one answer. If you add a document, do not contradict the
 * thresholds in "Expense Submission & Approval Policy" — extend them instead.
 */
export const expensePolicyDocs = [
  {
    id: 'travel',
    title: 'Business Travel Policy',
    text: `Employees must book flights in economy class for trips under 6 hours; business class is
permitted for flights over 6 hours with manager approval. Hotel bookings should not exceed
$250/night in major cities ($180/night elsewhere) without prior approval. Rental cars require
manager sign-off and must be mid-size or smaller. All travel must be booked at least 7 days in
advance except for emergency travel, which requires VP approval.`,
  },
  {
    id: 'meals',
    title: 'Meals & Entertainment Policy',
    text: `Daily meal reimbursement is capped at $75/day while traveling ($25 breakfast, $25 lunch,
$25 dinner). Alcohol is not reimbursable except for client entertainment, capped at $100/event
with manager approval. Client entertainment expenses must list attendees and business purpose.
Meals for internal team events are capped at $30/person.`,
  },
  {
    id: 'submission',
    title: 'Expense Submission & Approval Policy',
    text: `Expenses must be submitted within 30 days of the transaction date. Every claim requires
an itemized receipt for amounts over $25. Claims are auto-approved under $50; claims between
$50 and $500 require manager approval; claims over $500 require both manager and finance
approval. Reimbursement is processed within 10 business days of final approval.`,
  },
  {
    id: 'software',
    title: 'Software & Equipment Policy',
    text: `Software subscriptions under $100/month can be expensed directly with manager approval
and must be reported to IT for license tracking. Equipment purchases (laptops, monitors,
peripherals) over $200 require both manager and IT approval and must be ordered through the
approved vendor list. Personal reimbursement for equipment is capped at $500/year.`,
  },
  {
    id: 'mileage',
    title: 'Mileage & Local Transport Policy',
    text: `Personal vehicle use for business travel is reimbursed at the standard IRS mileage rate.
Rideshare and taxi expenses are reimbursable for business purposes but require a noted business
justification for trips over $50. Public transit is reimbursable with receipt. Commuting between
home and the primary office is never reimbursable.`,
  },
  {
    id: 'conferences',
    title: 'Conferences & Professional Development Policy',
    text: `Each employee has an annual professional development budget of $2,000, covering conference
passes, training courses, and certifications. Registration must be booked at least 14 days in
advance to qualify for early-bird pricing. Conference registrations above $1,000 require
department head approval in addition to the standard approval path. Travel and lodging for a
conference are claimed separately and follow the Business Travel Policy. Certification exam fees
are reimbursed only on a pass; retakes are at the employee's expense. Employees who leave within
6 months of a course over $1,000 may be asked to repay a pro-rated share.`,
  },
  {
    id: 'gifts',
    title: 'Client Gifts & Promotional Items Policy',
    text: `Client gifts are capped at $75 per recipient per calendar year and must record the
recipient's name and company. Cash and cash equivalents, including gift cards, are never
reimbursable. Gifts to government officials or public employees are prohibited regardless of
value. Promotional items carrying the company logo are exempt from the per-recipient cap when
distributed at an event, but the total event spend must be pre-approved. Any gift over $75
requires both manager and finance approval and a written business justification.`,
  },
  {
    id: 'home-office',
    title: 'Home Office & Remote Work Policy',
    text: `Remote employees may claim a one-time home-office setup allowance of $400, tracked
separately from the $500/year personal equipment cap in the Software & Equipment Policy.
Eligible items include a desk, chair, monitor arm, and lighting. Furniture over $250 requires
manager approval and remains company property. Consumables such as paper, pens, and printer ink
are reimbursable up to $30/month. Rent, utilities, and home insurance are never reimbursable.`,
  },
  {
    id: 'connectivity',
    title: 'Mobile & Connectivity Policy',
    text: `Employees whose role requires mobile availability may claim up to $45/month for a mobile
plan. Home broadband is reimbursed at 50% of the monthly bill, capped at $40/month, for employees
working remotely three or more days a week. International roaming must be pre-approved by a
manager for trips longer than 5 days; otherwise, roaming charges are capped at $60 per trip.
In-flight wifi is reimbursable on flights over 3 hours. Personal handset purchases are not
reimbursable and fall outside the equipment allowance.`,
  },
  {
    id: 'card',
    title: 'Corporate Card & Cash Advance Policy',
    text: `Corporate cards are issued for travel and client entertainment only. Personal use is
prohibited, even when repaid. Card transactions must be reconciled with an itemized receipt within
30 days of the transaction date, matching the deadline in the Expense Submission & Approval Policy.
Cash advances are available for travel to countries where card acceptance is limited; advances over
$200 require finance pre-approval and must be settled within 10 business days of return. A lost or
compromised card must be reported to finance within 24 hours.`,
  },
  {
    id: 'currency',
    title: 'Foreign Currency & International Claims Policy',
    text: `Claims must be submitted in the currency actually paid, and are converted at the published
rate for the transaction date rather than the submission date. Card foreign transaction fees and ATM
withdrawal fees for business travel are reimbursable with the corresponding statement line. Receipts
not in English require a one-line description of what was purchased. Where a per-diem or cap is
stated in dollars, the equivalent in the employee's home currency at the transaction-date rate
applies. VAT refunds on international travel are handled by finance and must not be claimed by the
employee.`,
  },
];
