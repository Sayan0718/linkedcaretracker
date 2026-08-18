const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  
  const sayan = await db.all("SELECT id, date, description FROM activities WHERE person = 'Sayan' ORDER BY date DESC LIMIT 15");
  console.log('Sayan Recent Activities:');
  console.log(sayan);
})()
