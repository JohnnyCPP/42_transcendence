import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';

export async function runMigrations(prisma: PrismaClient): Promise<void> 
{
  const migrationsDir = join(process.cwd(), 'db', 'migrations');
  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();
    //ejecuta las migraciones en orden alfabetico 

  for (const file of migrationFiles) 
  {
    const migration = await readFile(join(migrationsDir, file), 'utf8');
    const statements = migration
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of statements) 
    {
      await prisma.$executeRawUnsafe(statement);
    }
  }
}
