import { NextResponse } from 'next/server';
import { openDb } from '../../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { date, person, text } = await request.json();
    if (!date || !person || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await openDb();
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    const { logAudit } = await import('../../../../../lib/audit');

    // Parse the text to split into multiple activities
    // Look for patterns like "1. ", "2. ", or "\n1. "
    const regex = /(?:^|\n)\s*\d+\.\s+/;
    const parts = text.split(regex).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    
    const validActivities: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i === 0 && parts.length > 1) {
        continue; // Skip the header (everything before the first "1. ")
      }
      if (parts[i].length > 5) {
        validActivities.push(parts[i]);
      }
    }

    if (validActivities.length === 0) {
      // If it failed to parse with numbers, just treat the whole block as one activity, or split by double newline
      const fallbackParts = text.split(/\n\s*\n/).map((p: string) => p.trim()).filter((p: string) => p.length > 5);
      validActivities.push(...fallbackParts);
    }

    const hospitals = await db.all('SELECT id, name FROM hospitals');
    const insertedIds = [];

    for (const description of validActivities) {
      const result = await db.run(
        'INSERT INTO activities (date, description, person) VALUES (?, ?, ?)',
        [date, description, person]
      );
      insertedIds.push(result.lastID);

      const { matchAndCreateDiscussion } = await import('../../../../../lib/hospital-matcher');
      await matchAndCreateDiscussion(date, description);
      
      await logAudit(userEmail, 'ADD_ACTIVITY', { date, person, description, source: 'bulk' });
    }
    
    return NextResponse.json({ success: true, count: validActivities.length, ids: insertedIds }, { status: 201 });
  } catch (error) {
    console.error('Error saving bulk activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
