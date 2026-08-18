import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function fixName() {
  const db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  console.log('Opened database connection.');

  // Find the hospital
  const hospital = await db.get("SELECT id, name FROM hospitals WHERE name LIKE '%kal%'");
  console.log('Found:', hospital);

  if (hospital) {
    // Update the name
    await db.run("UPDATE hospitals SET name = 'Kalarav Hospital' WHERE id = ?", hospital.id);
    console.log('Updated name to Kalarav Hospital');
  } else {
    console.log('Hospital not found');
  }
}

fixName().catch(console.error);
