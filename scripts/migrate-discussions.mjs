import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import xlsx from 'xlsx';
import path from 'path';

function convertDateToISO(ddmmyyyy) {
  // If it's empty or invalid, return null
  if (!ddmmyyyy || typeof ddmmyyyy !== 'string') return null;
  const parts = ddmmyyyy.split('-');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
}

async function migrate() {
  const db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  console.log('Opened database connection.');

  const excelFilePath = path.join(process.cwd(), 'Daily Log Sheet.xlsx');
  console.log(`Reading Excel file from: ${excelFilePath}`);
  
  try {
    const workbook = xlsx.readFile(excelFilePath);
    const sheet = workbook.Sheets['Last Status'];
    if (!sheet) {
      console.error('Could not find "Last Status" sheet');
      return;
    }
    
    // Parse sheet to JSON array of arrays to get headers accurately
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, header: 1, defval: '' });
    
    if (rows.length < 2) {
      console.log('No data found in sheet.');
      return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    let insertedCount = 0;

    for (const row of dataRows) {
      const hospitalName = row[1]; // Index 1 is Hospital Name
      if (!hospitalName || typeof hospitalName !== 'string') continue;

      // Find hospital_id using LIKE to handle partial matches (e.g. "Shiv Shakti Hospital" vs "Shiv Shakti Hospital & Research Centre")
      const hospital = await db.get('SELECT id FROM hospitals WHERE name LIKE ?', `%${hospitalName.trim()}%`);
      
      if (!hospital) {
        console.log(`Skipping hospital not found in DB: ${hospitalName}`);
        continue;
      }

      const hospitalId = hospital.id;

      // Loop over date columns (starting from index 3)
      for (let i = 3; i < headers.length; i++) {
        const headerStr = headers[i];
        const summary = row[i];

        if (summary && typeof summary === 'string' && summary.trim() !== '') {
          const isoDate = convertDateToISO(headerStr);
          if (isoDate) {
            // Check if discussion already exists for this hospital and date to prevent duplicates
            const existing = await db.get(
              'SELECT id FROM discussions WHERE hospital_id = ? AND date = ? AND summary = ?',
              [hospitalId, isoDate, summary.trim()]
            );

            if (!existing) {
              await db.run(
                'INSERT INTO discussions (hospital_id, date, summary) VALUES (?, ?, ?)',
                [hospitalId, isoDate, summary.trim()]
              );
              insertedCount++;
            }
          }
        }
      }
    }

    console.log(`Successfully migrated ${insertedCount} discussion records from Excel data.`);

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

migrate().catch(console.error);
