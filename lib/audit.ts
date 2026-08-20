import { openDb } from './db';

export async function logAudit(userEmail: string, action: string, details?: any) {
  try {
    const db = await openDb();
    const timestamp = new Date().toISOString();
    const detailsString = details ? JSON.stringify(details) : null;
    
    await db.run(
      'INSERT INTO audit_logs (user_email, action, details, timestamp) VALUES (?, ?, ?, ?)',
      [userEmail, action, detailsString, timestamp]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
