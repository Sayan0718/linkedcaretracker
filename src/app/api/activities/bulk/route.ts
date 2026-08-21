import { NextResponse } from 'next/server';
import { openDb } from '../../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { date, person, text } = await request.json();
    if (!date || !person || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await openDb();
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    const { logAudit } = await import('../../../../../lib/audit');

    // Parse the text to split into multiple activities
    // Look for patterns like "1. ", "2. ", or "\n1. "
    const regex = /(?:^|\n)\s*\d+\.\s+/;
    const parts = text.split(regex).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    
    const validActivities: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i === 0 && parts.length > 1) {
        continue; // Skip the header (everything before the first "1. ")
      }
      if (parts[i].length > 5) {
        validActivities.push(parts[i]);
      }
    }

    if (validActivities.length === 0) {
      // If it failed to parse with numbers, just treat the whole block as one activity, or split by double newline
      const fallbackParts = text.split(/\n\s*\n/).map((p: string) => p.trim()).filter((p: string) => p.length > 5);
      validActivities.push(...fallbackParts);
    }

    const hospitals = await db.all('SELECT id, name FROM hospitals');
    const insertedIds = [];

    for (const description of validActivities) {
      const result = await db.run(
        'INSERT INTO activities (date, description, person) VALUES (?, ?, ?)',
        [date, description, person]
      );
      insertedIds.push(result.lastID);

      // Auto-map discussion if a hospital name is found in the description
      for (const h of hospitals) {
        let key = h.name.toLowerCase().replace(/[.,&]/g, '');
        const words = key.split(/\s+/).filter((w: string) => !['hospital', 'multispeciality', 'children', 'nursing', 'orthopaedic', 'maternity', 'healthcare', 'research', 'centre', 'trust', 'memorial', 'surgical', 'and', 'llp', 'care', 'home', 'laparoscopy', 'trauma', 'global', 'amreli', 'women'].includes(w));
        
        let matchKey = '';
        if (words.length > 0) {
          if (['shree', 'shreeji', 'sai', 'dp', 'shiv', 'holy', 'sita'].includes(words[0])) {
            matchKey = words.slice(0, 2).join(' ');
          } else {
            matchKey = words[0];
          }
        }

        if (!matchKey) continue;

        const normalizedDesc = description.toLowerCase().replace(/aa/g, 'a');
        const normalizedMatchKey = matchKey.replace(/aa/g, 'a');

        const escapedKey = normalizedMatchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
        
        if (regex.test(normalizedDesc)) {
          const existing = await db.get(
            'SELECT 1 FROM discussions WHERE hospital_id = ? AND date = ? AND summary = ?',
            [h.id, date, description]
          );
          
          if (!existing) {
            await db.run(
              'INSERT INTO discussions (hospital_id, date, summary) VALUES (?, ?, ?)',
              [h.id, date, description]
            );
          }
          break; 
        }
      }
      
      await logAudit(userEmail, 'ADD_ACTIVITY', { date, person, description, source: 'bulk' });
    }
    
    return NextResponse.json({ success: true, count: validActivities.length, ids: insertedIds }, { status: 201 });
  } catch (error) {
    console.error('Error saving bulk activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
