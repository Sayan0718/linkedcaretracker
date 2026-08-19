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
      "ALTER TABLE hospitals ADD COLUMN deboard_date TEXT"
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
