const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const xlsx = require('xlsx');
const path = require('path');

function excelDateToJSDate(serial) {
  const utc_days = Math.round(serial - 25569);
  const d = new Date(Date.UTC(1970, 0, 1 + utc_days));
  return d.toISOString().split('T')[0];
}

(async () => {
  const db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  console.log('Opened database connection.');

  // Delete old Sayan activities (except the manually restored one: ID 191)
  await db.run("DELETE FROM activities WHERE person = 'Sayan' AND id != 191");
  console.log('Cleared old Sayan activities');

  const wb = xlsx.readFile(path.join(process.cwd(), 'Daily Log Sheet.xlsx'));
  const sayanData = xlsx.utils.sheet_to_json(wb.Sheets['Sayan']);
  
  let count = 0;
  for (const row of sayanData) {
    if (!row.Date) continue;
    
    let dateStr;
    if (typeof row.Date === 'number') {
      dateStr = excelDateToJSDate(row.Date);
    } else {
      dateStr = row.Date; // e.g. '08-08-2026(Sat)'
      // Clean it up if possible
      if (dateStr.includes('08-08-2026')) dateStr = '2026-08-08';
    }
    
    for (const key of Object.keys(row)) {
      if (key !== 'Date') {
        const desc = row[key];
        if (typeof desc === 'string' && desc.trim().length > 0) {
          // Replace Kalrav with Kalarav since we merged them
          let finalDesc = desc.trim().replace(/Kalrav/g, 'Kalarav').replace(/kalrav/g, 'Kalarav');
          await db.run('INSERT INTO activities (date, description, person) VALUES (?, ?, ?)', [dateStr, finalDesc, 'Sayan']);
          count++;
        }
      }
    }
  }
  
  console.log(`Re-imported ${count} Sayan activities with correct dates.`);
})()
