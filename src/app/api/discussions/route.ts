import { NextResponse } from 'next/server';
import { openDb } from '../../../../lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hospital_id = searchParams.get('hospital_id');
    const date = searchParams.get('date');

    const db = await openDb();
    let query = 'SELECT * FROM discussions';
    const params: any[] = [];

    if (hospital_id && date) {
      query += ' WHERE hospital_id = ? AND date = ? ORDER BY id DESC LIMIT 1';
      params.push(hospital_id, date);
    } else if (hospital_id) {
      query += ' WHERE hospital_id = ? ORDER BY date DESC, id DESC';
      params.push(hospital_id);
    } else {
      query += ' ORDER BY date DESC, id DESC';
    }

    const discussions = await db.all(query, params);
    return NextResponse.json(discussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { hospital_id, date, summary } = await request.json();
    if (!hospital_id || !date || !summary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO discussions (hospital_id, date, summary) VALUES (?, ?, ?)',
      [hospital_id, date, summary]
    );
    
    return NextResponse.json({ id: result.lastID, hospital_id, date, summary }, { status: 201 });
  } catch (error) {
    console.error('Error saving discussion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
