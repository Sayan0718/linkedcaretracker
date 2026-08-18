import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function check() {
  const db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.run("UPDATE hospitals SET name = 'Kalrav Children Hospital' WHERE id = 34");
  await db.run("UPDATE hospitals SET name = 'Kalarav Hospital' WHERE id = 36");

  const row = await db.all("SELECT id, name FROM hospitals WHERE name LIKE '%kala%' OR name LIKE '%kalr%'");
  console.log(row);
}
check().catch(console.error);
