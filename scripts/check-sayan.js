const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  
  // Check for duplicates
  const sayan = await db.all("SELECT id, date, description FROM activities WHERE person = 'Sayan' ORDER BY date DESC, id DESC");
  console.log('Sayan activities:');
  console.log(sayan);

  // See hospital names
  const h = await db.all('SELECT id, name FROM hospitals WHERE name LIKE "%Charitable%"');
  console.log('Charitable hospitals:');
  console.log(h);
})()
