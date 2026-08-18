const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  
  try {
    await db.run("INSERT INTO hospitals (id, name) VALUES (34, 'Kalrav Children Hospital')");
    console.log('Restored Kalrav Children Hospital (ID 34)');
  } catch(e) {
    console.log('Already exists or error:', e.message);
  }
})()
