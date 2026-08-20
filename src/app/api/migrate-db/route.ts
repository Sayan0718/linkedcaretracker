import { NextResponse } from 'next/server';
import { openDb } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await openDb();
    
    // Try to add the columns. If they already exist, this will throw an error that we can catch and ignore.
    const migrations = [
      "ALTER TABLE hospitals ADD COLUMN deboarded TEXT DEFAULT 'NO'",
      "ALTER TABLE hospitals ADD COLUMN deboard_reason TEXT",
      "ALTER TABLE hospitals ADD COLUMN deboard_date TEXT",
      "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT NOT NULL, action TEXT NOT NULL, details TEXT, timestamp TEXT NOT NULL)"
    ];

    const results = [];
    
    for (const sql of migrations) {
      try {
        await db.run(sql);
        results.push({ sql, status: 'success' });
      } catch (err: any) {
        // "duplicate column name" or "SQLITE_ERROR: duplicate column name"
        results.push({ sql, status: 'skipped/error', message: err.message });
      }
    }

    // Seed initial users if they don't exist
    // password for sam is sam@123 (hashed), operations is linked@123 (hashed)
    const { hashPassword } = await import('../../../../lib/auth');
    const samHash = await hashPassword('sam@123');
    const opsHash = await hashPassword('linked@123');

    try {
      await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', ['sam@linkedcare.com', samHash, 'admin']);
      results.push({ sql: 'Seed sam@linkedcare.com', status: 'success' });
    } catch (err: any) {
      results.push({ sql: 'Seed sam@linkedcare.com', status: 'skipped/error', message: err.message });
    }

    try {
      await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', ['operations@linkedcare.com', opsHash, 'editor']);
      results.push({ sql: 'Seed operations@linkedcare.com', status: 'success' });
    } catch (err: any) {
      results.push({ sql: 'Seed operations@linkedcare.com', status: 'skipped/error', message: err.message });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Migration script finished. Check results to see if columns were added.",
      results 
    });

  } catch (error: any) {
    console.error('Migration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
