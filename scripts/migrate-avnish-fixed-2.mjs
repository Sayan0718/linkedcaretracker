import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import xlsx from 'xlsx';
import path from 'path';

function extractDateAndDesc(str) {
  let dateStr = null;
  let remainingDesc = str.trim();
  let matchIndex = -1;
  let matchLength = 0;

  const dmyRegex = /(\d{1,2})-(\d{1,2})-(\d{4})/;
  const monthRegex = /(\d{1,2})(?:st|nd|rd|th)?(?:-|\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

  const dmyMatch = remainingDesc.match(dmyRegex);
  const monthMatch = remainingDesc.match(monthRegex);

  if (dmyMatch && (!monthMatch || dmyMatch.index < monthMatch.index)) {
    const day = parseInt(dmyMatch[1]).toString().padStart(2, '0');
    const month = parseInt(dmyMatch[2]).toString().padStart(2, '0');
    const year = dmyMatch[3];
    dateStr = `${year}-${month}-${day}`;
    matchIndex = dmyMatch.index;
    matchLength = dmyMatch[0].length;
  } else if (monthMatch) {
    const day = parseInt(monthMatch[1]).toString().padStart(2, '0');
    const monthStr = monthMatch[2].toLowerCase();
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.findIndex(m => monthStr.startsWith(m));
    if (monthIndex !== -1) {
      const month = (monthIndex + 1).toString().padStart(2, '0');
      // Assume year 2026 for relative months
      dateStr = `2026-${month}-${day}`;
      matchIndex = monthMatch.index;
      matchLength = monthMatch[0].length;
    }
  }

  // If we found a date, check if it's at the start. 
  if (dateStr && matchIndex <= 3) {
    remainingDesc = remainingDesc.substring(matchIndex + matchLength).trim();
    remainingDesc = remainingDesc.replace(/^[:-]+\s*/, '').trim();
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
          
          // Delete old buggy discussions that match this raw string
          if (hospitalId) {
            await db.run('DELETE FROM discussions WHERE hospital_id = ? AND summary = ?', [hospitalId, desc.trim()]);
            // Also try to delete if it was partially extracted by previous scripts
            await db.run('DELETE FROM discussions WHERE hospital_id = ? AND summary LIKE ?', [hospitalId, `%${desc.substring(0, 15)}%`]);
          }

          const { dateStr, remainingDesc } = extractDateAndDesc(desc);
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
  
  console.log('Successfully re-processed Avnish sheet with advanced date detection.');
}

migrateAvnish().catch(console.error);
