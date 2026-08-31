import { NextResponse } from 'next/server';
import { openDb } from '../../../../../lib/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await openDb();
    
    const discussion = await db.get('SELECT * FROM discussions WHERE id = ?', [id]);
    
    if (discussion) {
      await db.run('DELETE FROM discussions WHERE id = ?', [id]);
      await db.run('DELETE FROM activities WHERE trim(description) = trim(?) AND date = ?', [discussion.summary, discussion.date]);
    }
    
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    const { logAudit } = await import('../../../../../lib/audit');
    await logAudit(userEmail, 'DELETE_DISCUSSION', { id, discussion });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
