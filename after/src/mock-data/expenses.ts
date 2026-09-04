import type { Expense } from '../db/schema';
import { mockEmployees } from './employees';

/**
 * Historical expense claims, so `listExpenses` and `getExpenseStatus` return something
 * useful before anyone has submitted a new claim. Dates are fixed rather than relative,
 * which keeps demos and screenshots reproducible.
 *
 * The five claims below are written by hand because the workshop docs quote them.
 * `emp-002` in particular is the employee every example uses, and she has exactly two,
 * so `listExpenses` with `emp-002` stays small enough to read at a glance.
 */
const namedExpenses: Expense[] = [
  {
    id: 'exp-1001',
    employeeId: 'emp-002',
    amount: 42.5,
    currency: 'USD',
    category: 'meals',
    description: 'Client lunch with Northwind team',
    status: 'approved',
    submittedAt: '2026-07-14T12:30:00.000Z',
  },
  {
    id: 'exp-1002',
    employeeId: 'emp-002',
    amount: 289,
    currency: 'USD',
    category: 'lodging',
    description: 'Hotel, 1 night in San Francisco',
    status: 'pending_approval',
    submittedAt: '2026-07-22T08:05:00.000Z',
  },
  {
    id: 'exp-1003',
    employeeId: 'emp-001',
    amount: 18.75,
    currency: 'USD',
    category: 'transport',
    description: 'Rideshare to airport',
    status: 'approved',
    submittedAt: '2026-08-02T17:45:00.000Z',
  },
  {
    id: 'exp-1004',
    employeeId: 'emp-003',
    amount: 1249.99,
    currency: 'GBP',
    category: 'equipment',
    description: 'Replacement laptop',
    status: 'pending_approval',
    submittedAt: '2026-08-11T09:15:00.000Z',
  },
  {
    id: 'exp-1005',
    employeeId: 'emp-004',
    amount: 96,
    currency: 'USD',
    category: 'software',
    description: 'Annual design tool subscription',
    status: 'rejected',
    submittedAt: '2026-08-19T14:20:00.000Z',
  },
];

/**
 * Claim shapes to cycle through. The amounts are chosen to straddle the approval
 * thresholds on purpose: some fall under the $50 auto-approval line, some in the
 * manager band, and some over $500 where finance gets involved too.
 */
const claimTemplates = [
  { category: 'meals', amount: 12.4, description: 'Breakfast on the road' },
  { category: 'transport', amount: 9.5, description: 'Airport train ticket' },
  { category: 'meals', amount: 28.75, description: 'Lunch during client visit' },
  { category: 'software', amount: 42, description: 'Monthly project tracker seat' },
  { category: 'transport', amount: 34.2, description: 'Taxi to supplier meeting' },
  { category: 'meals', amount: 62, description: 'Team dinner, 2 attendees' },
  { category: 'home-office', amount: 65, description: 'Desk lamp and cable tidy' },
  { category: 'entertainment', amount: 75, description: 'Client coffee and pastries' },
  { category: 'meals', amount: 88.5, description: 'Working dinner with 3 attendees' },
  { category: 'home-office', amount: 120, description: 'Ergonomic keyboard and mouse' },
  { category: 'software', amount: 128, description: 'Design tool annual seat' },
  { category: 'entertainment', amount: 140, description: 'Client dinner, 2 attendees' },
  { category: 'lodging', amount: 165, description: 'Hotel, 1 night in Manchester' },
  { category: 'equipment', amount: 189, description: 'Second monitor' },
  { category: 'home-office', amount: 199, description: 'Office chair contribution' },
  { category: 'lodging', amount: 240, description: 'Hotel, 1 night in Berlin' },
  { category: 'entertainment', amount: 260, description: 'Client entertainment, 4 attendees' },
  { category: 'equipment', amount: 320, description: 'Docking station and adapters' },
  { category: 'conference', amount: 350, description: 'Workshop registration fee' },
  { category: 'lodging', amount: 410, description: 'Hotel, 2 nights in Amsterdam' },
  { category: 'travel', amount: 480, description: 'Return flight, short haul' },
  { category: 'lodging', amount: 520, description: 'Hotel, 2 nights in New York' },
  { category: 'equipment', amount: 640, description: 'Laptop upgrade' },
  { category: 'conference', amount: 850, description: 'Industry conference pass' },
  { category: 'travel', amount: 1180, description: 'Return flight, long haul' },
  { category: 'conference', amount: 1450, description: 'Conference pass and travel bundle' },
];

/** Weighted toward approved, because most historical claims are settled. */
const statuses = ['approved', 'approved', 'approved', 'pending_approval', 'rejected', 'submitted'];

/** Claims run from early March to late August 2026, one working day apart. */
const firstClaimDate = Date.UTC(2026, 2, 2, 9, 0, 0);
const claimSpreadDays = 178;

/** Everyone except emp-002, whose two hand-written claims are quoted in the docs. */
const claimants = mockEmployees.filter(employee => employee.id !== 'emp-002');

const generatedExpenses: Expense[] = Array.from({ length: 145 }, (_, index) => {
  const employee = claimants[(index * 7) % claimants.length];
  const template = claimTemplates[index % claimTemplates.length];
  const dayOffset = (index * 31) % claimSpreadDays;

  return {
    id: `exp-${2001 + index}`,
    employeeId: employee.id,
    amount: template.amount,
    currency: employee.currency,
    category: template.category,
    description: template.description,
    status: statuses[index % statuses.length],
    submittedAt: new Date(
      firstClaimDate + dayOffset * 86_400_000 + (index % 8) * 3_600_000,
    ).toISOString(),
  };
});

export const mockExpenses: Expense[] = [...namedExpenses, ...generatedExpenses];
