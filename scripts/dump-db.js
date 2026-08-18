const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  
  let sql = `
CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, description TEXT NOT NULL, person TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS hospitals (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, subscribed_till TEXT, handled_by TEXT, software_linkage TEXT, backend_setup TEXT, frontend_setup TEXT, training TEXT, certificate_of_compliance TEXT, renewal_quotation_sent TEXT, renewal_quotation_sent_date TEXT, renewed TEXT, renewal_date TEXT, status TEXT);
CREATE TABLE IF NOT EXISTS discussions (id INTEGER PRIMARY KEY AUTOINCREMENT, hospital_id INTEGER NOT NULL, date TEXT NOT NULL, summary TEXT NOT NULL);
`;

  for (let t of tables) {
    const rows = await db.all('SELECT * FROM ' + t.name);
    if(rows.length === 0) continue;
    
    const cols = Object.keys(rows[0]);
    for (let r of rows) {
      const values = cols.map(c => {
        if (typeof r[c] === 'string') return "'" + r[c].replace(/'/g, "''") + "'";
        if (r[c] === null) return 'NULL';
        return r[c];
      });
      sql += 'INSERT INTO ' + t.name + ' (' + cols.join(',') + ') VALUES (' + values.join(',') + ');\n';
    }
  }
  
  fs.writeFileSync('dump.sql', sql);
  console.log('Dumped');
})();
