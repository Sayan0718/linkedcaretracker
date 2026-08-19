import xlsx from 'xlsx';
import fs from 'fs';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function run() {
  const db = await open({
    filename: 'database.sqlite',
    driver: sqlite3.Database
  });
  const hospitals = await db.all('SELECT * FROM hospitals');
  
  const workbook = xlsx.readFile('MM.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
  
  const activities = data.filter(r => r.length > 1 && (r[2] || r[4] || r[5]) && r[1] !== 'Date').map(r => {
    let d = r[1];
    if (typeof d === 'number') {
      const date = new Date((d - (25567 + 2)) * 86400 * 1000);
      d = date.toISOString().split('T')[0];
    } else if (typeof d === 'string' && d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
           d = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    
    let desc = r[5] || r[4] || r[2];
    if (typeof desc === 'string' && desc.trim().startsWith('Activity Log')) {
      // Remove the "Activity Log - Date" header part
      desc = desc.replace(/^Activity Log.*?\n+/i, '').trim();
    }
    
    return {date: d, desc: desc};
  });

  let sql = '';

  for (const act of activities) {
    const descStr = act.desc.replace(/'/g, "''").trim();
    if (!descStr || !act.date) continue;
    sql += `INSERT INTO activities (date, description, person) VALUES ('${act.date}', '${descStr}', 'Monishkka');\n`;
    
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

      const normalizedDesc = act.desc.toLowerCase().replace(/aa/g, 'a');
      const normalizedMatchKey = matchKey.replace(/aa/g, 'a');
      const escapedKey = normalizedMatchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
      
      if (regex.test(normalizedDesc)) {
        sql += `INSERT INTO discussions (hospital_id, date, summary) VALUES (${h.id}, '${act.date}', '${descStr}');\n`;
        break;
      }
    }
  }

  fs.writeFileSync('C:\\Users\\sayan\\.gemini\\antigravity\\brain\\bdc1f16b-6141-4086-8164-02ddd395791c\\mm_import.md', sql);
  console.log('Successfully generated mm_import.md with ' + activities.length + ' activities.');
}
run();
