import { openDb } from './db';

export async function matchAndCreateDiscussion(date: string, description: string) {
  const db = await openDb();
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
      return h.id; // Return the matched hospital ID!
    }
  }
  return null;
}
