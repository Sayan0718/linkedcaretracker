import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import xlsx from 'xlsx';
import path from 'path';

function extractDateAndDesc(str) {
  let dateStr = null;
  let remainingDesc = str.trim();
  
  // Try dd-mm-yyyy at the start
  const dmyMatch = remainingDesc.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s*(.*)/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1]).toString().padStart(2, '0');
    const month = parseInt(dmyMatch[2]).toString().padStart(2, '0');
    const year = dmyMatch[3];
    dateStr = `${year}-${month}-${day}`;
    remainingDesc = dmyMatch[4].trim();
  } else {
    // Try dd month at the start
    const monthMatch = remainingDesc.toLowerCase().match(/^(\d{1,2})(?:st|nd|rd|th)?(?:-|\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(.*)/);
    
    if (monthMatch) {
      const day = parseInt(monthMatch[1]).toString().padStart(2, '0');
      const monthStr = monthMatch[2];
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIndex = months.findIndex(m => monthStr.startsWith(m));
      if (monthIndex !== -1) {
        const month = (monthIndex + 1).toString().padStart(2, '0');
        dateStr = `2026-${month}-${day}`;
        const prefixLength = monthMatch[0].length - monthMatch[3].length;
        remainingDesc = str.trim().substring(prefixLength).trim();
        remainingDesc = remainingDesc.replace(/^[:-]\s*/, '').trim();
      }
    }
  }

  // If no date found at the beginning, check if it's embedded (e.g. "billing new update walkthrough 20-07-2026")
  if (!dateStr) {
     const embeddedDmy = remainingDesc.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
     if (embeddedDmy) {
        const day = parseInt(embeddedDmy[1]).toString().padStart(2, '0');
        const month = parseInt(embeddedDmy[2]).toString().padStart(2, '0');
        const year = embeddedDmy[3];
        dateStr = `${year}-${month}-${day}`;
     }
  }

  if (!dateStr) {
    dateStr = new Date().toISOString().split('T')[0];
  }

  return { dateStr, remainingDesc };
}

async function migrateAvnish() {
  const db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  console.log('Opened database connection.');

  // Clean existing Avnish activities
  await db.run("DELETE FROM activities WHERE person = 'Avnish'");
  console.log('Cleared existing Avnish activities');

  // We won't strictly delete discussions because they might have come from Last Status or other sheets.
  // We will just rely on duplicate prevention and maybe delete those specific to these text strings if we want.
  // Actually, let's delete the poorly parsed Avnish discussions.
  // We can delete discussions that have today's date if they shouldn't, but that's risky.
  // Since we use INSERT ... WHERE NOT EXISTS, they will just be added correctly now. We might have duplicates from before if the date changed.
  // Let's delete any discussion whose summary matches Avnish's descriptions exactly.
  
  const wb = xlsx.readFile(path.join(process.cwd(), 'Daily Log Sheet.xlsx'));
  const avnishData = xlsx.utils.sheet_to_json(wb.Sheets['Avnish']);
  
  for (const row of avnishData) {
    const hospitalName = row['Hospital name'];
    if (!hospitalName) continue;
    
    let hospitalId = null;
    const hospital = await db.get('SELECT id FROM hospitals WHERE name LIKE ?', `%${hospitalName.trim().split(' ')[0]}%`);
    if (hospital) {
      hospitalId = hospital.id;
    }

    for (const key of Object.keys(row)) {
      if (key !== 'Hospital name') {
        const desc = row[key];
        if (typeof desc === 'string' && desc.trim().length > 0) {
          
          // First, delete old discussion matching this raw string or the parsed description
          const { dateStr, remainingDesc } = extractDateAndDesc(desc);
          
          if (hospitalId) {
            // Delete old buggy imports
            await db.run('DELETE FROM discussions WHERE hospital_id = ? AND summary = ?', [hospitalId, desc.trim()]);
            await db.run('DELETE FROM discussions WHERE hospital_id = ? AND summary = ?', [hospitalId, remainingDesc]);
          }

          const fullDesc = `[${hospitalName}] ${remainingDesc}`;
          
          // Insert into activities
          await db.run('INSERT INTO activities (date, description, person) VALUES (?, ?, ?)', [dateStr, fullDesc, 'Avnish']);
          
          // Insert into discussions if hospital found
          if (hospitalId) {
            await db.run('INSERT INTO discussions (hospital_id, date, summary) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM discussions WHERE hospital_id = ? AND date = ? AND summary = ?)', 
              [hospitalId, dateStr, remainingDesc, hospitalId, dateStr, remainingDesc]);
          }
        }
      }
    }
  }
  
  console.log('Successfully re-processed Avnish sheet with corrected dates.');
}

migrateAvnish().catch(console.error);
