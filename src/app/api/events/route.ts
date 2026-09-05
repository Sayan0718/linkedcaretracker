import { NextResponse } from 'next/server';
import { openDb } from '../../../../lib/db';

export async function GET() {
  try {
    const db = await openDb();
    const events = await db.all('SELECT * FROM calendar_events ORDER BY event_date ASC');
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_date, title } = body;

    if (!event_date || !title) {
      return NextResponse.json({ error: 'event_date and title are required' }, { status: 400 });
    }

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO calendar_events (event_date, title, created_at) VALUES (?, ?, ?)',
      [event_date, title, new Date().toISOString()]
    );

    return NextResponse.json({ id: result.lastID, event_date, title }, { status: 201 });
  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json({ error: 'Failed to add event' }, { status: 500 });
  }
}
