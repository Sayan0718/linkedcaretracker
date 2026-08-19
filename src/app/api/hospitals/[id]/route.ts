import { NextResponse } from 'next/server';
import { openDb } from '../../../../../lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    
    // We only update fields that are provided
    const allowedFields = [
      'name', 'subscribed_till', 'handled_by', 'software_linkage',
      'backend_setup', 'frontend_setup', 'training', 'certificate_of_compliance',
      'renewal_quotation_sent', 'renewal_quotation_sent_date', 'renewed',
      'renewal_date', 'status', 'deboarded', 'deboard_reason', 'deboard_date'
    ];

    const updates: string[] = [];
    const values: any[] = [];

    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(id);

    const db = await openDb();
    await db.run(
      `UPDATE hospitals SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Automatically sync to renewal_history table!
    if (body.subscribed_till || body.renewal_date || body.renewal_quotation_sent_date) {
      // Get the current row to ensure we have all 3 fields even if only 1 was updated
      const current = await db.get('SELECT subscribed_till, renewal_date, renewal_quotation_sent_date FROM hospitals WHERE id = ?', [id]);
      
      if (current && current.subscribed_till) {
        const existing = await db.get('SELECT id FROM renewal_history WHERE hospital_id = ? AND sub_till = ?', [id, current.subscribed_till]);
        
        if (existing) {
          await db.run(
            'UPDATE renewal_history SET quote_date = ?, payment_date = ? WHERE id = ?',
            [current.renewal_quotation_sent_date || null, current.renewal_date || null, existing.id]
          );
        } else {
          await db.run(
            'INSERT INTO renewal_history (hospital_id, quote_date, payment_date, sub_till) VALUES (?, ?, ?, ?)',
            [id, current.renewal_quotation_sent_date || null, current.renewal_date || null, current.subscribed_till]
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating hospital:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
