import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function retroMap() {
  const db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  console.log('Opened database connection.');

  const hospitals = await db.all('SELECT id, name FROM hospitals');
  const activities = await db.all('SELECT * FROM activities');

  let insertedCount = 0;

  for (const act of activities) {
    const { date, description } = act;
    
    for (const h of hospitals) {
      let key = h.name.toLowerCase().replace(/[.,&]/g, '');
      const words = key.split(/\s+/).filter(w => !['hospital', 'multispeciality', 'children', 'nursing', 'orthopaedic', 'maternity', 'healthcare', 'research', 'centre', 'trust', 'memorial', 'surgical', 'and', 'llp', 'care', 'home', 'laparoscopy', 'trauma', 'global', 'amreli', 'women'].includes(w));
      
      let matchKey = '';
      if (words.length > 0) {
        if (['shree', 'shreeji', 'sai', 'dp', 'shiv', 'holy', 'sita'].includes(words[0])) {
          matchKey = words.slice(0, 2).join(' ');
        } else {
          matchKey = words[0];
        }
      }

      if (!matchKey) continue;

      const escapedKey = matchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
      
      if (regex.test(description)) {
        // Try to insert if not exists
        const result = await db.run(
          'INSERT INTO discussions (hospital_id, date, summary) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM discussions WHERE hospital_id = ? AND date = ? AND summary = ?)',
          [h.id, date, description, h.id, date, description]
        );
        
        if (result.changes && result.changes > 0) {
          insertedCount++;
        }
        break; // Map to the first matched hospital
      }
    }
  }

  console.log(`Retroactive mapping complete. Inserted ${insertedCount} new discussions from existing activities.`);
}

retroMap().catch(console.error);
