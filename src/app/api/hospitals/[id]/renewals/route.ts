import { NextResponse } from 'next/server';
import { openDb } from '../../../../../../lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await openDb();
    const history = await db.all('SELECT * FROM renewal_history WHERE hospital_id = ? ORDER BY id DESC', [id]);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching renewals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { quote_date, payment_date, sub_till } = await request.json();
    
    const db = await openDb();
    await db.run(
      'INSERT INTO renewal_history (hospital_id, quote_date, payment_date, sub_till) VALUES (?, ?, ?, ?)',
      [id, quote_date || null, payment_date || null, sub_till || null]
    );

    // Sync the latest sub_till to hospitals table so the main dashboard shows it
    if (sub_till) {
      const maxSub = await db.get('SELECT MAX(sub_till) as max_sub FROM renewal_history WHERE hospital_id = ?', [id]);
      if (maxSub && maxSub.max_sub) {
        await db.run('UPDATE hospitals SET subscribed_till = ? WHERE id = ?', [maxSub.max_sub, id]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding renewal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
