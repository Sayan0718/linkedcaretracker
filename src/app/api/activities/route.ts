import { NextResponse } from 'next/server';
import { openDb } from '../../../../lib/db';

export async function GET() {
  try {
    const db = await openDb();
    const activities = await db.all('SELECT * FROM activities ORDER BY date DESC, id DESC');
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, description, person } = await request.json();
    if (!date || !description || !person) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO activities (date, description, person) VALUES (?, ?, ?)',
      [date, description, person]
    );
    
    const { matchAndCreateDiscussion } = await import('../../../../lib/hospital-matcher');
    await matchAndCreateDiscussion(date, description);
    
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    const { logAudit } = await import('../../../../lib/audit');
    await logAudit(userEmail, 'ADD_ACTIVITY', { date, person, description });
    
    return NextResponse.json({ id: result.lastID, date, description, person }, { status: 201 });
  } catch (error) {
    console.error('Error saving activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
