import './_chdir-to-project-root';
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { createTool } from '@mastra/core/tools';
import { MCPServer } from '@mastra/mcp';
import { eq, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { z } from 'zod';
import { employees } from './schema/employee-schema';

const client = createClient({ url: 'file:./src/mock-data/employee.db' });
const db = drizzle(client, { schema: { employees } });

await client.execute(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    manager_id TEXT,
    cost_center TEXT NOT NULL,
    currency TEXT NOT NULL
  )
`);

const seeded = await db.select().from(employees).limit(1);
if (seeded.length === 0) {
  await db.insert(employees).values([
    { id: 'emp-001', name: 'Ada Lovelace', email: 'ada.lovelace@acme.com', department: 'Engineering', managerId: null, costCenter: 'CC-ENG-01', currency: 'USD' },
    { id: 'emp-002', name: 'Grace Hopper', email: 'grace.hopper@acme.com', department: 'Engineering', managerId: 'emp-001', costCenter: 'CC-ENG-01', currency: 'USD' },
    { id: 'emp-003', name: 'Alan Turing', email: 'alan.turing@acme.com', department: 'Finance', managerId: null, costCenter: 'CC-FIN-01', currency: 'GBP' },
    { id: 'emp-004', name: 'Katherine Johnson', email: 'katherine.johnson@acme.com', department: 'Sales', managerId: 'emp-003', costCenter: 'CC-SAL-01', currency: 'USD' },
  ]);
}

const getEmployeeTool = createTool({
  id: 'get_employee',
  description: 'Look up a single employee by id or email',
  inputSchema: z.object({
    idOrEmail: z.string().describe('Employee id (e.g. emp-001) or email address'),
  }),
  execute: async ({ idOrEmail }) => {
    const [employee] = await db
      .select()
      .from(employees)
      .where(or(eq(employees.id, idOrEmail), eq(employees.email, idOrEmail)));
    if (!employee) {
      throw new Error(`Employee not found: ${idOrEmail}`);
    }
    return employee;
  },
});

const listEmployeesTool = createTool({
  id: 'list_employees',
  description: 'List employees, optionally filtered by department',
  inputSchema: z.object({
    department: z.string().optional().describe('Filter by department name'),
  }),
  execute: async ({ department }) => {
    return department
      ? await db.select().from(employees).where(eq(employees.department, department))
      : await db.select().from(employees);
  },
});


const server = new MCPServer({
  id: 'employee-directory',
  name: 'Employee Directory',
  version: '1.0.0',
  description: 'Mock employee directory service',
  tools: { getEmployeeTool, listEmployeesTool },
});

await server.startStdio();
