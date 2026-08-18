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
      'renewal_date', 'status'
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating hospital:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
