import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import xlsx from 'xlsx';
import path from 'path';

// Excel Date to JS Date
function excelDateToJSDate(serial) {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  // Adjust for timezone offset to get local date
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;
  date_info.setHours(hours, minutes, seconds);
  return date_info.toISOString().split('T')[0];
}

function parseDateStr(str) {
  // Parses "10august", "05august", "12 august", etc.
  const match = str.toLowerCase().match(/^(\d{1,2})\s*([a-z]+)/);
  if (match) {
    const day = parseInt(match[1]);
    const monthStr = match[2];
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.findIndex(m => monthStr.startsWith(m));
    if (monthIndex !== -1) {
      // Assuming 2026 based on system time or 2024? We'll use 2024 since data seems older, wait, system is 2026.
      // Let's use 2024 because the files are old. Wait, no, we'll use 2024.
      const d = new Date(2024, monthIndex, day);
      return d.toISOString().split('T')[0];
    }
  }
  return new Date().toISOString().split('T')[0];
}

async function migrateLogs() {
  const db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  const wb = xlsx.readFile(path.join(process.cwd(), 'Daily Log Sheet.xlsx'));
  
  // 1. Process Sayan
  const sayanData = xlsx.utils.sheet_to_json(wb.Sheets['Sayan']);
  for (const row of sayanData) {
    if (!row.Date) continue;
    const dateStr = typeof row.Date === 'number' ? excelDateToJSDate(row.Date) : row.Date;
    
    // all other keys are tasks
    for (const key of Object.keys(row)) {
      if (key !== 'Date') {
        const desc = row[key];
        if (typeof desc === 'string' && desc.trim().length > 0) {
          // Insert into activities
          await db.run('INSERT INTO activities (date, description, person) VALUES (?, ?, ?)', [dateStr, desc.trim(), 'Sayan']);
        }
      }
    }
  }
  console.log('Processed Sayan sheet');

  // 2. Process Avnish
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
          const dateStr = parseDateStr(desc);
          const fullDesc = `[${hospitalName}] ${desc.trim()}`;
          
          // Insert into activities
          await db.run('INSERT INTO activities (date, description, person) VALUES (?, ?, ?)', [dateStr, fullDesc, 'Avnish']);
          
          // Insert into discussions if hospital found
          if (hospitalId) {
            await db.run('INSERT INTO discussions (hospital_id, date, summary) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM discussions WHERE hospital_id = ? AND date = ? AND summary = ?)', 
              [hospitalId, dateStr, desc.trim(), hospitalId, dateStr, desc.trim()]);
          }
        }
      }
    }
  }
  console.log('Processed Avnish sheet');

  // 3. Process Last Status to get handled by? 
  // The Last Status sheet has "Handled By" which maps to the person.
  const lastStatusData = xlsx.utils.sheet_to_json(wb.Sheets['Last Status']);
  for (const row of lastStatusData) {
    const hospitalName = row['Hospital Name'];
    const handledBy = row['Handled By'];
    if (hospitalName && handledBy) {
      const hospital = await db.get('SELECT id FROM hospitals WHERE name LIKE ?', `%${hospitalName.trim().split(' ')[0]}%`);
      if (hospital) {
        // We can update the handled_by field in hospitals
        let person = 'Sayan';
        if (handledBy.toLowerCase().includes('avnish')) person = 'Avnish';
        if (handledBy.toLowerCase().includes('monishkka')) person = 'Monishkka';
        
        await db.run('UPDATE hospitals SET handled_by = ? WHERE id = ?', [person, hospital.id]);
      }
    }
  }
  console.log('Processed Last Status sheet');

}

migrateLogs().catch(console.error);
