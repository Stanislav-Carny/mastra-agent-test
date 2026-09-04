import type { Employee } from '../db/schema';

/**
 * Seed fixture for the employee directory. `npm run db:setup` writes these rows into
 * `src/mock-data/employees.db`, so the database can always be rebuilt from source.
 *
 * The roster is 100 people: nine written out by hand, then ninety-one generated from
 * fixed name lists. Nothing here is random, so the same rows come out on every machine
 * and the documented examples keep working.
 */

/** Department leads and the people the workshop docs refer to by id. */
const namedEmployees: Employee[] = [
  {
    id: 'emp-001',
    name: 'Ada Lovelace',
    email: 'ada.lovelace@acme.com',
    department: 'Engineering',
    managerId: null,
    costCenter: 'CC-ENG-01',
    currency: 'USD',
  },
  {
    id: 'emp-002',
    name: 'Grace Hopper',
    email: 'grace.hopper@acme.com',
    department: 'Engineering',
    managerId: 'emp-001',
    costCenter: 'CC-ENG-01',
    currency: 'USD',
  },
  {
    id: 'emp-003',
    name: 'Alan Turing',
    email: 'alan.turing@acme.com',
    department: 'Finance',
    managerId: null,
    costCenter: 'CC-FIN-01',
    currency: 'GBP',
  },
  {
    id: 'emp-004',
    name: 'Katherine Johnson',
    email: 'katherine.johnson@acme.com',
    department: 'Sales',
    managerId: 'emp-003',
    costCenter: 'CC-SAL-01',
    currency: 'USD',
  },
  {
    id: 'emp-005',
    name: 'Jean Bartik',
    email: 'jean.bartik@acme.com',
    department: 'Marketing',
    managerId: 'emp-004',
    costCenter: 'CC-MKT-01',
    currency: 'EUR',
  },
  {
    id: 'emp-006',
    name: 'Radia Perlman',
    email: 'radia.perlman@acme.com',
    department: 'Operations',
    managerId: null,
    costCenter: 'CC-OPS-01',
    currency: 'USD',
  },
  {
    id: 'emp-007',
    name: 'Barbara Liskov',
    email: 'barbara.liskov@acme.com',
    department: 'Support',
    managerId: null,
    costCenter: 'CC-SUP-01',
    currency: 'USD',
  },
  {
    id: 'emp-008',
    name: 'Shafi Goldwasser',
    email: 'shafi.goldwasser@acme.com',
    department: 'Legal',
    managerId: null,
    costCenter: 'CC-LEG-01',
    currency: 'USD',
  },
  {
    id: 'emp-009',
    name: 'Frances Allen',
    email: 'frances.allen@acme.com',
    department: 'People',
    managerId: null,
    costCenter: 'CC-PPL-01',
    currency: 'USD',
  },
];

/** Every generated employee reports to the lead of their department. */
const departments = [
  { name: 'Engineering', leadId: 'emp-001', costCenter: 'CC-ENG-01', currency: 'USD' },
  { name: 'Finance', leadId: 'emp-003', costCenter: 'CC-FIN-01', currency: 'GBP' },
  { name: 'Sales', leadId: 'emp-004', costCenter: 'CC-SAL-01', currency: 'USD' },
  { name: 'Marketing', leadId: 'emp-005', costCenter: 'CC-MKT-01', currency: 'EUR' },
  { name: 'Operations', leadId: 'emp-006', costCenter: 'CC-OPS-01', currency: 'USD' },
  { name: 'Support', leadId: 'emp-007', costCenter: 'CC-SUP-01', currency: 'USD' },
  { name: 'Legal', leadId: 'emp-008', costCenter: 'CC-LEG-01', currency: 'USD' },
  { name: 'People', leadId: 'emp-009', costCenter: 'CC-PPL-01', currency: 'USD' },
];

// 13 x 7 gives exactly 91 distinct names, so no two people share an email address.
const firstNames = [
  'Nadia', 'Omar', 'Priya', 'Ravi', 'Sofia', 'Tomas', 'Yuki',
  'Zara', 'Bruno', 'Chiara', 'Diego', 'Elena', 'Farid',
];

const lastNames = [
  'Almeida', 'Bergman', 'Castellanos', 'Dahl', 'Eriksen', 'Fontaine', 'Gallagher',
];

const generatedEmployees: Employee[] = Array.from(
  { length: firstNames.length * lastNames.length },
  (_, index) => {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length)];
    const department = departments[index % departments.length];

    return {
      id: `emp-${String(namedEmployees.length + index + 1).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`,
      department: department.name,
      managerId: department.leadId,
      costCenter: department.costCenter,
      currency: department.currency,
    };
  },
);

export const mockEmployees: Employee[] = [...namedEmployees, ...generatedEmployees];
