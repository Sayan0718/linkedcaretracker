const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  const h = await db.all("SELECT id, name FROM hospitals WHERE name LIKE '%kal%'");
  console.log('Hospitals:', h);
})()
