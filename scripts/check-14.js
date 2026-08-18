const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  
  const sayan = await db.all("SELECT id, date, description FROM activities WHERE person = 'Sayan' AND date = '2026-08-14'");
  console.log('Sayan 14th Aug:', sayan);

  const sayan17 = await db.all("SELECT id, date, description FROM activities WHERE person = 'Sayan' AND date = '2026-08-17'");
  console.log('Sayan 17th Aug:', sayan17);
})()
