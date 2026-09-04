import { existsSync, rmSync } from 'node:fs';
import { dbFiles } from '../db/paths';

/**
 * Deletes the mock databases so the next `npm run db:setup` rebuilds them from the seed
 * fixtures. Use this when workshop experiments have left the data in a confusing state.
 */

for (const file of Object.values(dbFiles)) {
  // SQLite keeps -wal and -shm sidecar files alongside the database.
  for (const path of [file, `${file}-wal`, `${file}-shm`]) {
    if (existsSync(path)) {
      rmSync(path);
      console.log(`removed ${path}`);
    }
  }
}

console.log('\nDatabases removed. Run `npm run db:setup` to rebuild them.');
