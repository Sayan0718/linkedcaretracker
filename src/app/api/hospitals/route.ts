import { NextResponse } from 'next/server';
import { openDb } from '../../../../lib/db';

export async function GET() {
  try {
    const db = await openDb();
    const hospitals = await db.all('SELECT * FROM hospitals ORDER BY name ASC');
    return NextResponse.json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, subscribed_till, handled_by } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Hospital name is required' }, { status: 400 });
    }

    const db = await openDb();
    const result = await db.run(
      `INSERT INTO hospitals (
        name, subscribed_till, handled_by, software_linkage, backend_setup, 
        frontend_setup, training, certificate_of_compliance, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, subscribed_till || '', handled_by || '', 'To do', 'To do', 'To do', 'To do', 'To do', 'Onboarded']
    );
    
    return NextResponse.json({ id: result.lastID, name }, { status: 201 });
  } catch (error) {
    console.error('Error adding hospital:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
