import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

// This function opens a connection to the database
export async function openDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      person TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subscribed_till TEXT,
      handled_by TEXT,
      software_linkage TEXT,
      backend_setup TEXT,
      frontend_setup TEXT,
      training TEXT,
      certificate_of_compliance TEXT,
      renewal_quotation_sent TEXT,
      renewal_quotation_sent_date TEXT,
      renewed TEXT,
      renewal_date TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
    );
  `);

  return dbInstance;
}
