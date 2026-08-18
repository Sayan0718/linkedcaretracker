import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import xlsx from 'xlsx';
import path from 'path';

async function seed() {
  const db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  console.log('Opened database connection.');

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      person TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subscribed_till TEXT,
      handled_by TEXT,
      software_linkage TEXT,
      backend_setup TEXT,
      frontend_setup TEXT,
      training TEXT,
      certificate_of_compliance TEXT,
      renewal_quotation_sent TEXT,
      renewal_quotation_sent_date TEXT,
      renewed TEXT,
      renewal_date TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
    );
  `);

  console.log('Tables created or verified.');

  // Read Excel file
  const excelFilePath = path.join(process.cwd(), 'Hospital Details.xlsx');
  console.log(`Reading Excel file from: ${excelFilePath}`);
  
  try {
    const workbook = xlsx.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse sheet to JSON
    // Options: raw=false formats dates as strings instead of returning numbers
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: '' });
    
    console.log(`Found ${rows.length} rows in the Excel file.`);

    // Check if hospitals already exist
    const count = await db.get('SELECT COUNT(*) as count FROM hospitals');
    if (count.count > 0) {
      console.log('Hospitals table already seeded. Skipping Excel import.');
      return;
    }

    // Insert data
    const insertStmt = await db.prepare(`
      INSERT INTO hospitals (
        name, subscribed_till, handled_by, software_linkage, backend_setup, 
        frontend_setup, training, certificate_of_compliance, renewal_quotation_sent, 
        renewal_quotation_sent_date, renewed, renewal_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const row of rows) {
      const name = row['Hospital Name'] || '';
      if (!name) continue; // Skip empty rows

      await insertStmt.run([
        name,
        row['Subscribed Till'] || '',
        row['Handled By'] || '',
        row['Software Linkage'] || 'To do',
        row['Backend Setup'] || 'To do',
        row['Frontend Setup'] || 'To do',
        row['Training'] || 'To do',
        row['Certificate of Compliance'] || 'To do',
        row['Renewal Quotation Sent'] || '',
        row['Renewal Quotation Sent Date'] || '',
        row['Renewed?'] || '',
        row['Renewal Date'] || '',
        row['Status'] || ''
      ]);
    }

    await insertStmt.finalize();
    console.log('Successfully seeded database with Excel data.');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seed().catch(console.error);
