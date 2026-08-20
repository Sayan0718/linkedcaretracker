import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '../../../../../lib/auth';
import { logAudit } from '../../../../../lib/audit';

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  
  if (sessionToken) {
    const sessionPayload = await verifySession(sessionToken);
    if (sessionPayload && sessionPayload.email) {
      await logAudit(sessionPayload.email as string, 'LOGOUT');
    }
  }

  cookieStore.delete('session');
  return NextResponse.json({ success: true });
}
