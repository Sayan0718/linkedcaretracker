import { NextResponse } from 'next/server';
import { openDb } from '../../../../lib/db';
import { hashPassword } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await openDb();
    const users = await db.all('SELECT id, email, role FROM users ORDER BY email ASC');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const db = await openDb();
    
    try {
      const result = await db.run(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, role]
      );
      return NextResponse.json({ id: result.lastID, email, role }, { status: 201 });
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
