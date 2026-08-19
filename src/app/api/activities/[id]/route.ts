import { NextResponse } from 'next/server';
import { openDb } from '../../../../../lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Sayan@2026';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('x-admin-password');
    if (authHeader !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { date, description, person } = await request.json();

    if (!date || !description || !person) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await openDb();
    await db.run(
      'UPDATE activities SET date = ?, description = ?, person = ? WHERE id = ?',
      [date, description, person, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('x-admin-password');
    if (authHeader !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await openDb();
    await db.run('DELETE FROM activities WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
