import { NextResponse } from 'next/server';
import { openDb } from '../../../../../lib/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const db = await openDb();
    
    // Prevent deleting the main admin
    const user = await db.get('SELECT email FROM users WHERE id = ?', [id]);
    if (user && user.email === 'sam@linkedcare.com') {
      return NextResponse.json({ error: 'Cannot delete the primary admin account' }, { status: 403 });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    const { logAudit } = await import('../../../../../lib/audit');
    await logAudit(userEmail, 'DELETE_USER', { target_email: user?.email });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
