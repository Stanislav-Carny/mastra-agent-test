import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { dbUrls } from './paths';
import { employees, expenses } from './schema';

export const employeeClient = createClient({ url: dbUrls.employees });
export const employeeDb = drizzle(employeeClient, { schema: { employees } });

export const expenseClient = createClient({ url: dbUrls.expenses });
export const expenseDb = drizzle(expenseClient, { schema: { expenses } });
