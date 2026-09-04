import './_load-env';
import { createTool } from '@mastra/core/tools';
import { MCPServer } from '@mastra/mcp';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { employeeDb } from '../db/client';
import { ensureEmployeeData } from '../db/migrate';
import { employees } from '../db/schema';

// This service owns employees.db, so it sets that up and leaves the others alone.
await ensureEmployeeData();

const getEmployee = createTool({
  id: 'getEmployee',
  description: "Look up a single employee by id or email, including their cost center and home currency",
  inputSchema: z.object({
    idOrEmail: z.string().describe('Employee id (e.g. emp-001) or email address'),
  }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    department: z.string(),
    managerId: z.string().nullable(),
    costCenter: z.string(),
    currency: z.string(),
  }),
  mcp: {
    annotations: { title: 'Get employee', readOnlyHint: true, destructiveHint: false },
  },
  execute: async ({ idOrEmail }) => {
    const [employee] = await employeeDb
      .select()
      .from(employees)
      .where(or(eq(employees.id, idOrEmail), eq(employees.email, idOrEmail)));

    if (!employee) {
      throw new Error(`Employee not found: ${idOrEmail}`);
    }
    return employee;
  },
});

const listEmployees = createTool({
  id: 'listEmployees',
  description: 'List employees, optionally filtered by department',
  inputSchema: z.object({
    department: z.string().optional().describe('Filter by department name, e.g. Engineering'),
  }),
  // MCP requires a tool's structured result to be an object, not a bare array.
  outputSchema: z.object({
    employees: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        department: z.string(),
        managerId: z.string().nullable(),
        costCenter: z.string(),
        currency: z.string(),
      }),
    ),
  }),
  mcp: {
    annotations: { title: 'List employees', readOnlyHint: true, destructiveHint: false },
  },
  execute: async ({ department }) => {
    const rows = department
      ? await employeeDb.select().from(employees).where(eq(employees.department, department))
      : await employeeDb.select().from(employees);

    return { employees: rows };
  },
});

const server = new MCPServer({
  id: 'employee-directory',
  name: 'Employee Directory',
  version: '1.0.0',
  description: 'Mock employee directory service, backed by a local SQLite database',
  tools: { getEmployee, listEmployees },
});

await server.startStdio();
