import { NextResponse } from 'next/server';
import { openDb } from '../../../../../../../lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string, renewalId: string }> }) {
  try {
    const { id, renewalId } = await params;
    const { quote_date, payment_date, sub_till } = await request.json();
    
    const db = await openDb();
    await db.run(
      'UPDATE renewal_history SET quote_date = ?, payment_date = ?, sub_till = ? WHERE id = ? AND hospital_id = ?',
      [quote_date || null, payment_date || null, sub_till || null, renewalId, id]
    );

    // Sync the latest sub_till to hospitals table
    const maxSub = await db.get('SELECT MAX(sub_till) as max_sub FROM renewal_history WHERE hospital_id = ?', [id]);
    await db.run('UPDATE hospitals SET subscribed_till = ? WHERE id = ?', [maxSub?.max_sub || null, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating renewal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, renewalId: string }> }) {
  try {
    const { id, renewalId } = await params;
    const db = await openDb();
    
    await db.run('DELETE FROM renewal_history WHERE id = ? AND hospital_id = ?', [renewalId, id]);
    
    // Sync the latest sub_till to hospitals table
    const maxSub = await db.get('SELECT MAX(sub_till) as max_sub FROM renewal_history WHERE hospital_id = ?', [id]);
    await db.run('UPDATE hospitals SET subscribed_till = ? WHERE id = ?', [maxSub?.max_sub || null, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting renewal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
