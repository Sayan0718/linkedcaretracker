import { NextResponse } from 'next/server';
import { openDb } from '@/../lib/db';

export async function GET() {
  try {
    const db = await openDb();
    const activities = await db.all('SELECT * FROM activities ORDER BY date DESC, id DESC');
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, description, person } = await request.json();
    if (!date || !description || !person) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO activities (date, description, person) VALUES (?, ?, ?)',
      [date, description, person]
    );
    
    // Auto-map discussion if a hospital name is found in the description
    const hospitals = await db.all('SELECT id, name FROM hospitals');
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

      // Escape key for regex
      const escapedKey = matchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
      
      if (regex.test(description)) {
        await db.run(
          'INSERT INTO discussions (hospital_id, date, summary) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM discussions WHERE hospital_id = ? AND date = ? AND summary = ?)',
          [h.id, date, description, h.id, date, description]
        );
        break; // Only map to the first matched hospital
      }
    }
    
    return NextResponse.json({ id: result.lastID, date, description, person }, { status: 201 });
  } catch (error) {
    console.error('Error saving activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
