import { NextResponse } from 'next/server';
import { openDb } from '../../../../../lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Sayan@2026';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { date, description, person } = await request.json();

    if (!date || !description || !person) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await openDb();
    
    // Fetch old activity to update the linked discussion
    const oldActivity = await db.get('SELECT date, description, person FROM activities WHERE id = ?', [id]);

    await db.run(
      'UPDATE activities SET date = ?, description = ?, person = ? WHERE id = ?',
      [date, description, person, id]
    );

    // If there was a mapped discussion, delete it
    if (oldActivity && oldActivity.description) {
      await db.run(
        'DELETE FROM discussions WHERE summary = ? AND date = ?',
        [oldActivity.description, oldActivity.date]
      );
    }
    
    // Auto-map the new description
    const { matchAndCreateDiscussion } = await import('../../../../../lib/hospital-matcher');
    await matchAndCreateDiscussion(date, description);
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    const { logAudit } = await import('../../../../../lib/audit');
    await logAudit(userEmail, 'UPDATE_ACTIVITY', { id, oldActivity, newActivity: { date, description, person } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await openDb();
    
    const oldActivity = await db.get('SELECT date, description, person FROM activities WHERE id = ?', [id]);
    
    await db.run('DELETE FROM activities WHERE id = ?', [id]);
    
    if (oldActivity && oldActivity.description) {
      await db.run('DELETE FROM discussions WHERE summary = ? AND date = ?', [oldActivity.description, oldActivity.date]);
    }
    
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    const { logAudit } = await import('../../../../../lib/audit');
    await logAudit(userEmail, 'DELETE_ACTIVITY', { id, oldActivity });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
